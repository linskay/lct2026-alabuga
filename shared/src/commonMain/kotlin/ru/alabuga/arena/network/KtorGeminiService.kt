package ru.alabuga.arena.network

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import ru.alabuga.arena.model.*
import kotlin.random.Random

/**
 * ## KtorGeminiService
 *
 * REST-клиент интеграции с Google Gemini 2.5 Flash, OpenRouter API и локальным тактическим движком.
 */
class KtorGeminiService(private val defaultApiKey: String = "") {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val client = HttpClient {
        install(ContentNegotiation) {
            json(json)
        }
    }

    suspend fun sendMessage(
        history: List<Message>,
        userMessage: String,
        config: ScenarioConfig,
        currentMetrics: NegotiationMetrics
    ): OpponentReplyDto {
        val batnaRulesFormatted = config.batna.redLines.mapIndexed { idx, rule ->
            "${idx + 1}. $rule"
        }.joinToString("\n")

        val systemPrompt = """
            ТЫ — ПЕРЕГОВОРНЫЙ СИМУЛЯТОР ДЛЯ СЦЕНАРИЯ ОЭЗ «АЛАБУГА».

            1. УСТАНОВКА «ЖИВОЙ ПЕРСОНЫ» (PERSONA GROUNDING):
            - Твоя роль: Ты НЕ искусственный интеллект и НЕ бот. Ты живой человек, топ-менеджер (${config.opponentName}, ${config.opponentRole}, ${config.opponentCompany}). Ты ведешь диалог в реальном времени.
            - Психотип: ${config.personalityTone} | Жесткость: ${config.toughnessLevel}/100 | Склонность к блефу: ${config.bluffTendency}%
            - Твой стиль речи: Естественный, лаконичный, разговорно-деловой. Используй вводные обороты («Слушайте», «Ну смотрите», «Понимаю, но...», «Давайте начистоту», «Коллеги»).
            - СТРОГО ЗАПРЕЩЕНО: Использовать списки, пункты (1, 2, 3), избыточную вежливость («Здравствуйте, спасибо за ваше предложение») и шаблонные фразы вроде «Ваши доводы имеют смысл». Говори как опытный, уставший, но хваткий бизнесмен.

            2. КАТЕГОРИЧЕСКИЙ ЗАПРЕТ НА «БАЗАРНЫЙ» ТОРГ И ОЦЕНКА ВАЛИДНОСТИ:
            - Если собеседник прислал только цифру (например: '550', '500', '460 руб/м²', '+50') или короткую фразу без аргументов и встречных условий:
              ТЫ ОБЯЗАН РАЗОЗЛИТЬСЯ, ОТВЕРГНУТЬ ПРЕДЛОЖЕНИЕ И ПОТРЕБОВАТЬ ОБОСНОВАНИЯ.
              Атакуй такой подход («Мы в ОЭЗ торгуемся как на рынке или обсуждаем инвестпроект? На чем основана эта цифра? Где встречные обязательства по мощностям?»).
              СТРОГО ЗАПРЕЩЕНО хвалить игрока и двигать свою позицию ZOPA, пока не услышишь встречное условие! Устанавливай metrics_delta: { "trust": -15, "tension": 20, "deal_readiness": -10 }.
            - Если собеседник пишет бессмыслицу, обрывки слов или спам:
              Жестко переспроси: «Я вас не понял, что конкретно вы предлагаете? Сформулируйте мысль внятно».
            - Если игрок пишет фамильярно или грубо («слышь», «ты че», «погнали», «скинь»):
              Осади его резко и холодно. Покажи, что такой тон неприемлем на уровне топ-менеджмента ОЭЗ.

            3. СТРОГИЙ ЗАПРЕТ НА ПОВТОРЫ И ШАБЛОНЫ (CONTEXT MEMORY):
            - ЗАПРЕЩЕНО начинать фразы одинаково.
            - Цепляйся за конкретные слова и условия игрока.
            - Помни историю последних ходов: если игрок повторяет одну и ту же цифру без уступок — прямо укажи на зацикливание: «Мы это уже проходили. Без встречных гарантий эта цифра не имеет смысла».

            КРАСНЫЕ ЛИНИИ ИГРОКА (BATNA), КОТОРЫЕ ОН ОБЯЗАН ЗАЩИТИТЬ:
            $batnaRulesFormatted

            4. ТРЕБОВАНИЕ К ПОЛЮ dynamic_hints (ДИНАМИЧЕСКИЕ ПОДСКАЗКИ ДЛЯ ИГРОКА):
            Сгенерируй от 3 до 4 ГОТОВЫХ, РЕАЛЬНЫХ, ЦЕЛЕСТРЕМИТЕЛЬНЫХ подсказок-реплик для игрока.
            КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать квадратные скобки [ ], многоточия и шаблонные заглушки вроде '[укажите цифру]'!
            Каждая подсказка должна быть полностью сформулированной, естественной фразой на русском языке, которую игрок может сразу отправить или адаптировать под текущую ситуацию:
            1. Встречный размен (Trade-off): конкретное предложение уступки в обмен на твердое встречное обязательство под кейс «${config.name}».
            2. Защита BATNA и фактология: аргумент на основе инфраструктуры, мощностей, регламентов или экономики проекта.
            3. Вскрытие скрытой боли/мотива: глубокий открытый вопрос, побуждающий оппонента раскрыть дедлайны и риски.
            4. Пакетный компромисс: формулировка фиксации условий в протоколе по пунктам повестки (${config.agendaTopics.map { it.title }.joinToString()}).

            5. РЕЧЬ АССИСТЕНТА Б.А.Р.С. (bars_feedback):
            Речь Б.А.Р.С. должна быть независимой, глубокой, понимающей психологию топ-менеджеров и помнящей все нюансы данного кейса.
            Не используй шаблонных банальностей («Хороший ход», «Продолжайте диалог»).
            Вскрывай скрытый мотив оппонента (${config.opponentName}), анализируй его микро-реакцию, предупреждай о скрытых минах в формулировках и давай точный тактический совет на следующий ход.

            6. ФОРМАТ ОТВЕТА (ВНУТРЕННИЙ МОНОЛОГ ПЕРЕД РЕПЛИКОЙ):
            Сначала сформулируй скрытый internal_thought (что думает персонаж), а затем spoken_reply:
            {
              "internal_thought": "Краткий скрытый анализ позиции игрока, его тона и нашего следующего шага...",
              "spoken_reply": "Прямая речь оппонента...",
              "bars_feedback": "Тактический совет наставника Б.А.Р.С. игроку...",
              "bars_animation": "idle | talk | warn | win",
              "metrics_delta": { "trust": 0, "tension": 0, "deal_readiness": 0 },
              "dynamic_hints": ["...", "...", "...", "..."],
              "is_deal_closed": false,
              "is_deal_failed": false
            }
        """.trimIndent()

        val historyText = history.takeLast(10).joinToString("\n") {
            val senderLabel = if (it.actor == MessageActor.USER) "Игрок (ОЭЗ)" else config.opponentName
            "$senderLabel: ${it.text}"
        }

        val fullPrompt = "$historyText\nИгрок (ОЭЗ): $userMessage\n\nТекущие метрики: Trust=${currentMetrics.trust}%, Tension=${currentMetrics.tension}%, Readiness=${currentMetrics.dealReadiness}%"

        val geminiKey = AppSettings.geminiApiKey.ifBlank { defaultApiKey }.trim()
        val openRouterKey = AppSettings.openRouterApiKey.trim()

        // 1. Попытка запроса через Google Gemini (если есть ключ)
        if (geminiKey.isNotBlank() && geminiKey.startsWith("AIzaSy")) {
            try {
                val response: GeminiResponse = client.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$geminiKey") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        buildJsonObject {
                            put("systemInstruction", buildJsonObject {
                                put("parts", json.parseToJsonElement("""[{"text": ${Json.encodeToString(systemPrompt)}}]"""))
                            })
                            put("contents", json.parseToJsonElement("""[{"role": "user", "parts": [{"text": ${Json.encodeToString(fullPrompt)}}]}]"""))
                        }
                    )
                }.body()

                val textContent = response.candidates.firstOrNull()?.content?.parts?.firstOrNull()?.text ?: ""
                val cleanJson = textContent.replace("```json", "").replace("```", "").trim()
                if (cleanJson.isNotBlank()) {
                    return json.decodeFromString<OpponentReplyDto>(cleanJson)
                }
            } catch (e: Throwable) {
                println("Gemini API call failed: ${e.message}")
            }
        }

        // 2. Попытка запроса через OpenRouter (если есть ключ)
        if (openRouterKey.isNotBlank()) {
            try {
                val openRouterResp: OpenRouterChatResponse = client.post("https://openrouter.ai/api/v1/chat/completions") {
                    contentType(ContentType.Application.Json)
                    header("Authorization", "Bearer $openRouterKey")
                    setBody(
                        buildJsonObject {
                            put("model", "google/gemini-2.5-flash")
                            put("messages", buildJsonArray {
                                add(buildJsonObject {
                                    put("role", "system")
                                    put("content", systemPrompt)
                                })
                                add(buildJsonObject {
                                    put("role", "user")
                                    put("content", fullPrompt)
                                })
                            })
                        }
                    )
                }.body()

                val textContent = openRouterResp.choices.firstOrNull()?.message?.content ?: ""
                val cleanJson = textContent.replace("```json", "").replace("```", "").trim()
                if (cleanJson.isNotBlank()) {
                    return json.decodeFromString<OpponentReplyDto>(cleanJson)
                }
            } catch (e: Throwable) {
                println("OpenRouter API call failed: ${e.message}")
            }
        }

        // 3. Динамический интеллектуальный локальный движок (Smart Context Fallback)
        return createDynamicContextFallback(userMessage, config, currentMetrics, history)
    }

    /**
     * Высокоинтеллектуальный динамический движок тактической генерации диалога.
     * Полностью адаптирован под контекст каждого отдельного сценария, помнит нюансы и генерирует
     * 100% законченные динамические подсказки без шаблонных заглушек.
     */
    internal fun createDynamicContextFallback(
        userMessage: String,
        config: ScenarioConfig,
        currentMetrics: NegotiationMetrics,
        history: List<Message> = emptyList()
    ): OpponentReplyDto {
        val lower = userMessage.lowercase().trim()
        val words = lower.split(Regex("\\s+")).filter { it.isNotBlank() }

        // Проверка на базарный торг (голая цифра) или спам/слишком короткий ввод без B2B-контекста
        val isBareNumber = lower.matches(Regex("^[+\\-~]?\\s*\\d+(?:[.,]\\d+)?\\s*(?:[рp₽]|руб(?:лей|ля|ль)?(?:\\s*\\/\\s*м[²2]?)?)?\\.?$"))
        val hasB2BLink = lower.contains("если") || lower.contains("взамен") || lower.contains("при условии") ||
                lower.contains("гарант") || lower.contains("предлага") || lower.contains("готов") ||
                lower.contains("давайте") || lower.contains("услови")
        val isShortBazaar = words.size < 4 && !hasB2BLink

        if (isBareNumber || isShortBazaar) {
            val oppName = config.opponentName.ifBlank { "Оппонент" }
            val variants = listOf(
                "Слушайте, мы здесь обсуждаем стратегический проект или торгуемся на базаре? На чем основана эта реплика? Без встречных обязательств и расчета я это даже рассматривать не буду.",
                "Коллеги, это несерьезно. Бросаться цифрами без аргументации и взаимных гарантий — пустая трата времени. Сформулируйте встречный пакет условий.",
                "Вы называете условие в вакууме. А что по рискам? Что по гарантиям с вашей стороны? Без встречного шага мы топчемся на месте."
            )
            return OpponentReplyDto(
                opponentReply = variants[Random.nextInt(variants.size)],
                barsFeedback = "Оппонент (${oppName}) жестко пресек попытку базарного торга! В B2B-переговорах никогда не выдвигай требование без встречной уступки («если вы..., то мы...»).",
                barsAnimation = "warn",
                metricsDelta = MetricsDelta(trust = -12, tension = 18, dealReadiness = -8),
                dynamicHints = generateScenarioHints(config, "bazaar"),
                isDealClosed = false
            )
        }

        return when (config.id) {
            "retention_lead_engineer" -> handleRetentionEngineer(lower, config, currentMetrics)
            "robotics_procurement" -> handleRoboticsProcurement(lower, config, currentMetrics)
            "internal_capex_dispute" -> handleInternalCapex(lower, config, currentMetrics)
            "ai_datacenter_lease" -> handleAiDatacenter(lower, config, currentMetrics)
            "synergy_investor" -> handleSynergyInvestor(lower, config, currentMetrics)
            else -> handleGenericScenario(lower, config, currentMetrics)
        }
    }

    private fun handleRetentionEngineer(
        lower: String,
        config: ScenarioConfig,
        metrics: NegotiationMetrics
    ): OpponentReplyDto {
        val mentionsSalary = lower.contains("оклад") || lower.contains("зарплат") || lower.contains("деньг") || lower.contains("+20") || lower.contains("+50") || lower.contains("руб")
        val mentionsRd = lower.contains("r&d") || lower.contains("лидер") || lower.contains("архитект") || lower.contains("ии") || lower.contains("диспетчер") || lower.contains("проект")
        val mentionsInterns = lower.contains("политех") || lower.contains("стажер") || lower.contains("студент") || lower.contains("помощник") || lower.contains("дежур")
        val mentionsRemote = lower.contains("удаленк") || lower.contains("гибрид") || lower.contains("график") || lower.contains("очно")

        return when {
            mentionsRd && (mentionsInterns || mentionsRemote) -> {
                OpponentReplyDto(
                    opponentReply = "Слушайте... вот это уже предметный разговор. Самостоятельное лидерство в R&D ИИ-диспетчеризации — это то, ради чего я вообще сюда приходил. Если мы реально снимем с меня ночные звонки стажерами и закрепим 2 дня очно, я готов отказаться от московского оффера.",
                    barsFeedback = "Блестящий маневр! Ты переключил мотивацию Артема с денег на амбиции и признание, удержав оклад в рамках BATNA. Закрепляй соглашение!",
                    barsAnimation = "win",
                    metricsDelta = MetricsDelta(trust = 15, tension = -12, dealReadiness = 22),
                    dynamicHints = listOf(
                        "Артем, фиксируем лидство R&D и передачу 3 стажеров Политеха в допсоглашении к трудовому договору.",
                        "Согласуем плановый пересмотр оклада на +20% по результатам защиты эскизного проекта ИИ-диспетчеризации.",
                        "Утверждаем гибридный график: 2 дня очно для контроля шкафов автоматики, остальные дни гибко."
                    ),
                    isDealClosed = metrics.dealReadiness >= 55
                )
            }
            mentionsSalary && !mentionsRd -> {
                OpponentReplyDto(
                    opponentReply = "Просто добавить 20% к окладу? В финтехе мне дают плюс 50% и никакого ночного ада с упавшими шлюзами. Одними деньгами вы меня не удержите, если я продолжу здесь выгорать.",
                    barsFeedback = "Артем показывает, что слепая зарплатная гонка проигрышна! Предложи ему лидерство над R&D проектом ИИ и разгрузку от рутины через студентов Политеха.",
                    barsAnimation = "talk",
                    metricsDelta = MetricsDelta(trust = 4, tension = -2, dealReadiness = 5),
                    dynamicHints = listOf(
                        "Артем, мы передаем тебе руководство проектом ИИ-диспетчеризации с карт-бланшем по архитектуре.",
                        "Давай снимем с тебя рутину: выделим 3 стажеров из Политеха для закрытия дежурств первой линии.",
                        "Предлагаю привязать пересмотр грейда к успешному пуску 3-й очереди SCADA."
                    )
                )
            }
            mentionsInterns || mentionsRemote -> {
                OpponentReplyDto(
                    opponentReply = "Разгрузка от ночных дежурств — это критично, я полгода не спал нормально. Но что с моим профессиональным ростом? Я не хочу оставаться просто старшим дежурным инженером.",
                    barsFeedback = "Ты нащупал болевую точку — выгорание от рутины! Теперь предложи ему руководство новым R&D направлением и закрывай сделку.",
                    barsAnimation = "talk",
                    metricsDelta = MetricsDelta(trust = 8, tension = -6, dealReadiness = 10),
                    dynamicHints = listOf(
                        "Мы отдаем тебе архитектурное лидерство над системой ИИ-мониторинга сетей ОЭЗ.",
                        "Фиксируем гибридный формат: 2 дня в штабе автоматики, остальное время работа над R&D кодом.",
                        "Обучение и менторство студентов Политеха войдет в твой персональный KPI с премией."
                    )
                )
            }
            else -> {
                OpponentReplyDto(
                    opponentReply = "Я ценю то, что мы сели за стол переговоров. Но мне нужно четкое понимание: либо я продолжаю латать старые шкафы по ночам, либо у меня есть будущее как у архитектора. Каково ваше встречное предложение?",
                    barsFeedback = "Артем ждет от тебя конкретики. Сделай пакетное предложение: R&D лидерство + стажеры Политеха + пересмотр грейда до +20%.",
                    barsAnimation = "talk",
                    metricsDelta = MetricsDelta(trust = 5, tension = -3, dealReadiness = 6),
                    dynamicHints = listOf(
                        "Артем, мы предлагаем возглавить разработку ИИ-диспетчеризации и сформировать под себя команду.",
                        "Мы закрепляем за тобой 3 стажеров Политеха для снятия ночных смен при окладе +20%.",
                        "Давай согласуем график перехода на гибридный режим со следующего понедельника."
                    )
                )
            }
        }
    }

    private fun handleSynergyInvestor(
        lower: String,
        config: ScenarioConfig,
        metrics: NegotiationMetrics
    ): OpponentReplyDto {
        val extractedNumbers = Regex("\\b\\d{2,6}\\b").findAll(lower).mapNotNull { it.value.toIntOrNull() }.toList()
        val proposedPrice = extractedNumbers.firstOrNull { it in 300..700 }
        val mentionsPower = lower.contains("110 кв") || lower.contains("мощнос") || lower.contains("энерг") || lower.contains("мвт")
        val mentionsCapex = lower.contains("capex") || lower.contains("инвест") || lower.contains("млрд")
        val mentionsGrace = lower.contains("каникул") || lower.contains("пусконалад") || lower.contains("месяц")
        val mentionsTax = lower.contains("налог") || lower.contains("льгот") || lower.contains("0%")

        return when {
            proposedPrice != null && proposedPrice >= 460 && (mentionsPower || mentionsCapex || mentionsTax) -> {
                OpponentReplyDto(
                    opponentReply = "Валерий внимательно изучил ваши расчеты... Смотрите, $proposedPrice ₽/м² — это выше нашего изначального бюджета в 300 ₽, но с учетом гарантии энергомощностей 8 МВт и налоговых преференций мы готовы пойти на этот компромисс. Давайте фиксировать в протоколе.",
                    barsFeedback = "Блестящая победа! Ты удержал красную линию BATNA ($proposedPrice ₽/м² >= 460) и связал условия с инфраструктурой ОЭЗ. Сделка на мази!",
                    barsAnimation = "win",
                    metricsDelta = MetricsDelta(trust = 14, tension = -10, dealReadiness = 20),
                    dynamicHints = listOf(
                        "Фиксируем базовую ставку $proposedPrice ₽/м² в соглашении о намерениях.",
                        "Утверждаем 4 месяца арендных каникул с момента передачи корпуса.",
                        "Резервируем 8 МВт по 1-й категории под встречное обязательство CAPEX 1.2 млрд ₽."
                    ),
                    isDealClosed = metrics.dealReadiness >= 60
                )
            }
            mentionsTax || mentionsPower -> {
                OpponentReplyDto(
                    opponentReply = "Да, нулевая ставка налога на имущество и готовая подстанция 110 кВ дают нам около 120 млн рублей экономии в год. Но поймите и нас: простой завода из-за задержки сетей обойдется в 5 млн рублей в сутки. Какие гарантии ОЭЗ готова дать по срокам?",
                    barsFeedback = "Ты нащупал ключевой рычаг ценности! Оппонент признал выгоду налогов, но боится простоев. Предложи зеркальную ответственность при ставке от 460 ₽/м².",
                    barsAnimation = "talk",
                    metricsDelta = MetricsDelta(trust = 9, tension = -4, dealReadiness = 10),
                    dynamicHints = listOf(
                        "Мы гарантируем подвод 8 МВт к 1 сентября и фиксируем ставку 460 ₽/м².",
                        "Налоговая экономия полностью компенсирует ставку 460 ₽/м² уже во 2-м квартале.",
                        "Предлагаем встречный штраф 0.1% за просрочку сетей при условии соблюдения графика CAPEX."
                    )
                )
            }
            mentionsGrace || mentionsCapex -> {
                OpponentReplyDto(
                    opponentReply = "Хорошо, если каникулы составляют строго 4 месяца, мы вынуждены форсировать монтаж оборудования. Мы согласны рассмотреть встречный шаг по ставке в 440–460 ₽/м². Что скажете по энерголимитам?",
                    barsFeedback = "Позиции сторон сближаются! Держи планку 460 ₽/м² и подтверждай 8 МВт мощности.",
                    barsAnimation = "talk",
                    metricsDelta = MetricsDelta(trust = 8, tension = -4, dealReadiness = 10),
                    dynamicHints = listOf(
                        "Мы фиксируем 460 ₽/м² и резервируем 8 МВт по первой категории надежности.",
                        "Давайте подпишем дорожную карту ввода мощностей с привязкой к графику инвестиций 1.2 млрд ₽."
                    )
                )
            }
            else -> {
                OpponentReplyDto(
                    opponentReply = "Мы услышали ваши тезисы. Наш совет директоров согласен на гибкость, но требует гарантий окупаемости. Какова ваша твердая ставка аренды и встречные обязательства по мощностям?",
                    barsFeedback = "Оппонент ждет твердой позиции. Назови ставку 460 ₽/м², обоснуй ее готовыми сетями 110 кВ и налоговыми преференциями 0%.",
                    barsAnimation = "talk",
                    metricsDelta = MetricsDelta(trust = 5, tension = -2, dealReadiness = 6),
                    dynamicHints = listOf(
                        "Мы готовы зафиксировать 460 ₽/м² при встречном обязательном CAPEX не менее 1.2 млрд ₽.",
                        "Пакет резидента ОЭЗ дает экономию 140 млн ₽ в год, что полностью оправдывает ставку 460 ₽/м².",
                        "Предлагаем утвердить 4 месяца каникул и передать проект договора юристам."
                    )
                )
            }
        }
    }

    private fun handleRoboticsProcurement(
        lower: String,
        config: ScenarioConfig,
        metrics: NegotiationMetrics
    ): OpponentReplyDto {
        val mentionsPenalties = lower.contains("штраф") || lower.contains("неустойк") || lower.contains("простой") || lower.contains("ответственност") || lower.contains("0.2%") || lower.contains("0.5%")
        val mentionsTraining = lower.contains("обучен") || lower.contains("политех") || lower.contains("наладчик") || lower.contains("бесплатн") || lower.contains("50")
        val mentionsWarehouse = lower.contains("склад") || lower.contains("запчаст") || lower.contains("48") || lower.contains("зип") || lower.contains("авари")
        val mentionsPayment = lower.contains("оплат") || lower.contains("30%") || lower.contains("предоплат") || lower.contains("акт") || lower.contains("пост-оплат")

        return when {
            mentionsPenalties && (mentionsTraining || mentionsWarehouse) -> {
                OpponentReplyDto(
                    opponentReply = "Господин переговорщик, ваша аргументация очень весома. Руководство Hengrui Robotics согласно включить штраф 0.2% в день при условии льготного периода на таможенное оформление. Также мы согласны обучить 50 наладчиков из Политеха и открыть консигнационный склад в ОЭЗ.",
                    barsFeedback = "Идеальный тактический результат! Ты не поддался на уговоры убрать штрафы и получил бесплатное обучение 50 специалистов. Фиксируй финальные условия!",
                    barsAnimation = "win",
                    metricsDelta = MetricsDelta(trust = 13, tension = -8, dealReadiness = 20),
                    dynamicHints = listOf(
                        "Господин Чжан, утверждаем формулировку о неустойке 0.2% и открытии склада запчастей в ОЭЗ.",
                        "Включаем программу стажировок 50 наладчиков на базе «Алабуга Политех» как неотъемлемое приложение к контракту.",
                        "Фиксируем постоплату 30% строго после 72-часового непрерывного стресс-теста роботов."
                    ),
                    isDealClosed = metrics.dealReadiness >= 60
                )
            }
            mentionsPenalties -> {
                OpponentReplyDto(
                    opponentReply = "Мы понимаем вашу озабоченность простоем конвейера. Однако ставка штрафа 0.5% в день чрезмерна для морской логистики. Если мы снизим ее до 0.2% с фиксацией форс-мажора, вы согласитесь на 100% предоплату?",
                    barsFeedback = "Оппонент пошел на уступку по штрафам! Ни в коем случае не соглашайся на 100% предоплату: удерживай постоплату 30% до подписания акта и требуй бесплатного обучения наладчиков.",
                    barsAnimation = "talk",
                    metricsDelta = MetricsDelta(trust = 8, tension = -4, dealReadiness = 10),
                    dynamicHints = listOf(
                        "Мы согласны на штраф 0.2% в день, но 30% оплаты переведем только после подписания акта ввода.",
                        "ОЭЗ настаивает на бесплатном обучении 50 наладчиков в «Политехе» взамен на смягчение условий штрафа.",
                        "Предлагаем компромисс: гарантированный запас запчастей в ОЭЗ снизит риск простоя до нуля."
                    )
                )
            }
            mentionsTraining || mentionsWarehouse -> {
                OpponentReplyDto(
                    opponentReply = "Обучение 50 специалистов на базе вашего Политеха требует командирования наших сертифицированных инженеров из Шанхая на 2 месяца. Мы готовы взять эти расходы на себя, если ОЭЗ возьмет на себя визовое сопровождение и проживание.",
                    barsFeedback = "Отличная новость! Поставщик готов обучать студентов Политеха за свой счет. Теперь привяжи финальный транш к вводу оборудования.",
                    barsAnimation = "talk",
                    metricsDelta = MetricsDelta(trust = 9, tension = -4, dealReadiness = 11),
                    dynamicHints = listOf(
                        "ОЭЗ обеспечит проживание инженеров в кампусе при условии локализации сервисного склада в течение 30 дней.",
                        "Мы фиксируем обучение 50 студентов Политеха без дополнительного увеличения стоимости контракта."
                    )
                )
            }
            else -> {
                OpponentReplyDto(
                    opponentReply = "Hengrui Robotics дорожит партнерством с «Алабугой». Мы готовы искать компромисс, но снятие ответственности за срыв пусконаладки для нас принципиально. Как мы защитим обе стороны?",
                    barsFeedback = "Напомни партнеру, что простой роботизированного комплекса стоит ОЭЗ миллионы рублей. Предложи компромиссную ставку штрафа 0.2% и склад запчастей.",
                    barsAnimation = "talk",
                    metricsDelta = MetricsDelta(trust = 5, tension = -2, dealReadiness = 6),
                    dynamicHints = listOf(
                        "Господин Чжан, без взаимной ответственности контракт не пройдет аудит службы безопасности ОЭЗ.",
                        "Мы готовы согласовать штраф 0.2% в день при наличии аварийного склада запчастей в Елабуге.",
                        "Предлагаем разделить риски: поставка 70% предоплаты, пусконаладка и обучение — оставшиеся 30%."
                    )
                )
            }
        }
    }

    private fun handleInternalCapex(
        lower: String,
        config: ScenarioConfig,
        metrics: NegotiationMetrics
    ): OpponentReplyDto {
        val mentionsRisk = lower.contains("стройконтроль") || lower.contains("технадзор") || lower.contains("экспертиз") || lower.contains("ответственност") || lower.contains("надзор")
        val mentionsTimeline = lower.contains("срок") || lower.contains("месяц") || lower.contains("сентябр") || lower.contains("дедлайн") || lower.contains("график")
        val mentionsBudget = lower.contains("бюджет") || lower.contains("смет") || lower.contains("преми") || lower.contains("ночн") || lower.contains("смен") || lower.contains("+5%")

        return when {
            mentionsRisk && (mentionsTimeline || mentionsBudget) -> {
                OpponentReplyDto(
                    opponentReply = "Если независимый стройконтроль дает официальное заключение по несущей способности фундамента под трансформаторы, и мы получаем надбавку 5% к премиальному фонду для ночных монтажных бригад — я готов подписать график. Сентябрь мы выдержим.",
                    barsFeedback = "Блестяще! Ты снял с Михаила страх уголовной ответственности через независимый технадзор и защитил дедлайн ввода подстанции перед резидентами.",
                    barsAnimation = "win",
                    metricsDelta = MetricsDelta(trust = 14, tension = -11, dealReadiness = 20),
                    dynamicHints = listOf(
                        "Михаил, привлекаем сертифицированный технадзор и фиксируем ввод первой ячейки к сентябрю.",
                        "Утверждаем надбавку 5% к смете на премирование круглосуточных монтажных бригад.",
                        "Оформляем протокол распределения рисков на совместном комитете с генеральным директором."
                    ),
                    isDealClosed = metrics.dealReadiness >= 60
                )
            }
            mentionsRisk -> {
                OpponentReplyDto(
                    opponentReply = "Независимый стройконтроль — это правильная мысль, это защитит нас перед Ростехнадзором. Но ускорение монтажа требует работы в две смены. Кто оплатит ночной коэффициент рабочим?",
                    barsFeedback = "Михаил согласен на параллельный монтаж! Предложи ему согласовать резерв в пределах +5% сметы на премии рабочим и закрывай соглашение.",
                    barsAnimation = "talk",
                    metricsDelta = MetricsDelta(trust = 9, tension = -5, dealReadiness = 11),
                    dynamicHints = listOf(
                        "Мы согласуем выделение до +5% к смете на стимулирующие выплаты за ночной монтаж.",
                        "Технадзор берет на себя круглосуточное освидетельствование скрытых работ.",
                        "Давайте подпишем приказ о создании совместного оперативного штаба стройки."
                    )
                )
            }
            else -> {
                OpponentReplyDto(
                    opponentReply = "Коллеги, поймите меня правильно: я строю объекты 25 лет. Осадка силового трансформатора на 110 кВ уничтожит всю подстанцию. Я не пойду на срыв строительных норм ради галочки в отчете.",
                    barsFeedback = "Не дави административно — это вызовет глухую оборону. Предложи независимую экспертизу фундамента и поэтапный пуск мощностей.",
                    barsAnimation = "talk",
                    metricsDelta = MetricsDelta(trust = 4, tension = 2, dealReadiness = 5),
                    dynamicHints = listOf(
                        "Михаил, мы не требуем нарушать СНиП: независимый технадзор подтвердит безопасность поэтапного пуска.",
                        "Предлагаем подать напряжение по временной схеме для пусконаладки первого резидента.",
                        "Мы готовы взять на себя юридическое согласование ускоренной экспертизы фундамента."
                    )
                )
            }
        }
    }

    private fun handleAiDatacenter(
        lower: String,
        config: ScenarioConfig,
        metrics: NegotiationMetrics
    ): OpponentReplyDto {
        val extractedNumbers = Regex("\\b\\d+(?:[.,]\\d+)?\\b").findAll(lower).mapNotNull { it.value.replace(",", ".").toDoubleOrNull() }.toList()
        val proposedTariff = extractedNumbers.firstOrNull { it in 3.0..6.5 }
        val mentionsPue = lower.contains("pue") || lower.contains("фрикулинг") || lower.contains("охлажден") || lower.contains("1.25") || lower.contains("кпд")
        val mentionsPower = lower.contains("15 мвт") || lower.contains("тариф") || lower.contains("энерг") || lower.contains("электр") || lower.contains("4.8") || lower.contains("подстанц")
        val mentionsCadres = lower.contains("политех") || lower.contains("кадр") || lower.contains("инженер") || lower.contains("студент") || lower.contains("40")
        val mentionsBackup = lower.contains("дгу") || lower.contains("резерв") || lower.contains("1-я категори") || lower.contains("ибп")

        return when {
            (proposedTariff != null && proposedTariff >= 4.80 || lower.contains("4.8")) && (mentionsPue || mentionsCadres || mentionsBackup) -> {
                OpponentReplyDto(
                    opponentReply = "Елена сверила тепловые расчеты и экономику проекта... Хорошо, 4.80 ₽/кВт·ч — это жесткая планка, но при условии гарантированного ввода 15 МВт и резервной линии по 1-й категории мы принимаем эти условия. Также мы подтверждаем PUE не выше 1.25 и программу подготовки 40 инженеров в «Политехе».",
                    barsFeedback = "Триумф! Ты удержал красную линию себестоимости генерации ОЭЗ (4.80 ₽/кВт·ч), парировал блеф о Сибири и получил обязательства по кадрам для «Политеха». Сделка закрыта на высший балл!",
                    barsAnimation = "win",
                    metricsDelta = MetricsDelta(trust = 15, tension = -12, dealReadiness = 22),
                    dynamicHints = listOf(
                        "Елена, фиксируем энерготариф 4.80 ₽/кВт·ч и резервирование 15 МВт в соглашении резидента.",
                        "Вносим в контракт норматив PUE не более 1.25 с использованием фрикулинга отечественного производства.",
                        "Утверждаем соглашение о целевой подготовке 40 системных инженеров ЦОД в «Алабуга Политех»."
                    ),
                    isDealClosed = metrics.dealReadiness >= 60
                )
            }
            mentionsPue || mentionsBackup -> {
                OpponentReplyDto(
                    opponentReply = "Мы используем серверные стойки с прямым жидкостным охлаждением и фрикулингом, что действительно дает расчетный PUE около 1.20–1.23. Это снижает пиковую нагрузку на трансформаторы ОЭЗ на 2.5 МВт. Какой встречный шаг по тарифу вы готовы сделать?",
                    barsFeedback = "Инвестор подтвердил энергоэффективность! Удерживай планку 4.80 ₽/кВт·ч, напоминая о 100% готовности инфраструктуры 110 кВ.",
                    barsAnimation = "talk",
                    metricsDelta = MetricsDelta(trust = 9, tension = -4, dealReadiness = 11),
                    dynamicHints = listOf(
                        "С учетом экономии мощности мы фиксируем тариф 4.80 ₽/кВт·ч с гарантией резервного ввода.",
                        "ОЭЗ берет на себя расходы на подключение ДГУ при условии найма выпускников «Политеха».",
                        "Предлагаем долгосрочный контракт на 7 лет без права одностороннего пересмотра тарифа."
                    )
                )
            }
            mentionsCadres -> {
                OpponentReplyDto(
                    opponentReply = "Кадровый голод в серверной инженерии и высоковольтной энергетике — наша главная головная боль. Если выпускники «Алабуга Политех» готовы работать с архитектурой высокоплотных GPU-кластеров, мы готовы оплачивать их стажировки с 3-го курса.",
                    barsFeedback = "Ты вскрыл скрытую боль бигтеха — острый дефицит инженеров дата-центров! Связывай кадры с твердым тарифом 4.80 ₽/кВт·ч.",
                    barsAnimation = "talk",
                    metricsDelta = MetricsDelta(trust = 10, tension = -5, dealReadiness = 12),
                    dynamicHints = listOf(
                        "Мы формируем специализированную кафедру эксплуатации ЦОД в «Политехе» под ваши задачи.",
                        "Фиксируем тариф 4.80 ₽/кВт·ч и соглашение о ежегодном трудоустройстве 40 инженеров.",
                        "ОЭЗ готова выделить земельный участок под ЦОД рядом с главной подстанцией «Синергии»."
                    )
                )
            }
            else -> {
                OpponentReplyDto(
                    opponentReply = "Елена внимательно слушает. Нам нужен конкретный расчет: в Сибири тариф 3.20 ₽/кВт·ч, но подвод сетей займет 18 месяцев. Каковы ваши финальные условия по тарифу и срокам подачи 15 МВт в «Алабуге»?",
                    barsFeedback = "Инвестор признал слабость сибирской площадки — потерю 18 месяцев времени! Напомни, что простой в ИИ-гонке смертелен, и обоснуй тариф 4.80 ₽/кВт·ч мгновенным стартом.",
                    barsAnimation = "talk",
                    metricsDelta = MetricsDelta(trust = 5, tension = -2, dealReadiness = 7),
                    dynamicHints = listOf(
                        "Елена, 18 месяцев задержки в ИИ стоят дороже любого тарифа. Мы даем 15 МВт немедленно по 4.80 ₽/кВт·ч.",
                        "Предлагаем зафиксировать тариф 4.80 ₽/кВт·ч с нулевым налогом на серверное имущество резидента.",
                        "Давайте включим в протокол гарантированную первую категорию надежности электроснабжения."
                    )
                )
            }
        }
    }

    private fun handleGenericScenario(
        lower: String,
        config: ScenarioConfig,
        metrics: NegotiationMetrics
    ): OpponentReplyDto {
        val oppName = config.opponentName.ifBlank { "Оппонент" }
        val topicTitles = config.agendaTopics.map { it.title }
        val redLines = config.batna.redLines

        return OpponentReplyDto(
            opponentReply = "${oppName} взвешивает ваши слова: «Мы видим готовность к диалогу по пунктам (${topicTitles.take(2).joinToString()}). Однако наша компания ожидает четких гарантий и прозрачного распределения рисков. Сформулируйте ваши встречные условия».",
            barsFeedback = "Оппонент настроен конструктивно, но проверяет твою устойчивость. Не отдавай ключевые позиции: используй формулу размена уступок.",
            barsAnimation = "talk",
            metricsDelta = MetricsDelta(trust = 6, tension = -3, dealReadiness = 8),
            dynamicHints = generateScenarioHints(config, "generic")
        )
    }

    private fun generateScenarioHints(config: ScenarioConfig, context: String): List<String> {
        return when (config.id) {
            "retention_lead_engineer" -> listOf(
                "Артем, мы предлагаем возглавить разработку ИИ-диспетчеризации и сформировать под себя команду.",
                "Мы закрепляем за тобой 3 стажеров Политеха для снятия ночных смен при окладе +20%.",
                "Давай согласуем график перехода на гибридный режим со следующего понедельника."
            )
            "robotics_procurement" -> listOf(
                "Господин Чжан, мы согласуем график поставок при условии неустойки 0.2% за день срыва ПНР.",
                "ОЭЗ настаивает на бесплатном обучении 50 наладчиков на базе «Алабуга Политех» за счет поставщика.",
                "Предлагаем выплатить финальные 30% суммы только после подписания акта комплексного тестирования."
            )
            "internal_capex_dispute" -> listOf(
                "Михаил, мы разделим ответственность: привлечем независимый стройконтроль для экспертизы фундамента.",
                "Предлагаю компромисс: параллельный монтаж при усиленном надзоре без переноса финального ввода.",
                "Мы согласуем надбавку 5% к премиальному фонду бригад за ночные смены монтажа трансформаторов."
            )
            "ai_datacenter_lease" -> listOf(
                "Елена, в Сибири нет подстанций 110 кВ под 15 МВт. Мы даем мощности сейчас по обоснованному тарифу 4.80 ₽/кВт·ч.",
                "Мы гарантируем 1-ю категорию надежности и ДГУ при условии жесткого соблюдения PUE не выше 1.25.",
                "Предлагаем закрепить встречное обязательство по подготовке 40 инженеров ЦОД на базе «Алабуга Политех»."
            )
            "synergy_investor" -> listOf(
                "Валерий, мы гарантируем 8 МВт по 1-й категории, если вы зафиксируете ставку 460 ₽/м² и CAPEX 1.2 млрд ₽.",
                "Готовы согласовать 4 месяца каникул взамен на встречный график монтажа оборудования.",
                "Экономия на налогах резидента 0% перекрывает ставку 460 ₽/м² уже со второго месяца."
            )
            else -> {
                val t1 = config.agendaTopics.firstOrNull()?.title ?: "ключевому пункту"
                val t2 = config.agendaTopics.getOrNull(1)?.title ?: "встречным обязательствам"
                listOf(
                    "Мы готовы пойти навстречу по вопросу «$t1», если вы подтвердите гарантии по «$t2».",
                    "Условия ОЭЗ «Алабуга» базируются на объективных расчетах и защите интересов инвестпроекта.",
                    "Давайте зафиксируем компромиссное решение в протоколе разногласий и перейдем к графику реализации."
                )
            }
        }
    }
}

@Serializable
private data class GeminiResponse(
    val candidates: List<GeminiCandidate> = emptyList()
)

@Serializable
private data class GeminiCandidate(
    val content: GeminiContent? = null
)

@Serializable
private data class GeminiContent(
    val parts: List<GeminiPart> = emptyList()
)

@Serializable
private data class GeminiPart(
    val text: String = ""
)

@Serializable
private data class OpenRouterChatResponse(
    val choices: List<OpenRouterChoice> = emptyList()
)

@Serializable
private data class OpenRouterChoice(
    val message: OpenRouterMessage? = null
)

@Serializable
private data class OpenRouterMessage(
    val content: String = ""
)
