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

            4. ТРЕБОВАНИЕ К ПОЛЮ dynamic_hints (ГАРВАРДСКИЙ МЕТОД И ZOPA):
            Сгенерируй ровно 4 подсказки-шаблона для игрока по 4 классическим B2B-моделям:
            1. «Уступка в обмен на встречное требование» (Trade-off):
               "Мы готовы пойти навстречу по ставке до [укажите цифру] ₽/м², если вы возьмете на себя пусконаладку [обязательство]..."
            2. «Апелляция к объективным критериям / BATNA» (Objective Criteria):
               "Поймите, ставка [укажите цифру] ₽/м² обусловлена тем, что мы берем на себя все сети. У других резидентов [аргумент]..."
            3. «Пакетное предложение» (Package Deal):
               "Давайте зафиксируем [укажите цифру] ₽/м², но увеличим срок каникул до [укажите срок] месяцев, чтобы компенсировать [риск]..."
            4. «Шантаж альтернативой / BATNA» (Best Alternative):
               "У нас есть запрос от другого инвестора на эти площади, но мы хотим работать с вами. Давайте сойдемся на [условие]..."

            5. ФОРМАТ ОТВЕТА (ВНУТРЕННИЙ МОНОЛОГ ПЕРЕД РЕПЛИКОЙ):
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
     * Анализирует ценовые предложения, условия, уступки, вопросы и риски.
     */
    private fun createDynamicContextFallback(
        userMessage: String,
        config: ScenarioConfig,
        currentMetrics: NegotiationMetrics,
        history: List<Message>
    ): OpponentReplyDto {
        val lower = userMessage.lowercase().trim()
        val words = lower.split(Regex("\\s+")).filter { it.isNotBlank() }

        // Извлечение цифр (ставки аренды / CAPEX)
        val extractedNumbers = Regex("\\b\\d{2,6}\\b").findAll(lower).mapNotNull { it.value.toIntOrNull() }.toList()
        val proposedPrice = extractedNumbers.firstOrNull { it in 200..800 }

        // Анализ тем
        val mentionsPower = lower.contains("110 кв") || lower.contains("110кв") || lower.contains("квт") || lower.contains("мвт") || lower.contains("мощнос") || lower.contains("энерг")
        val mentionsCapex = lower.contains("capex") || lower.contains("инвест") || lower.contains("млрд") || lower.contains("млн") || lower.contains("вложени")
        val mentionsTax = lower.contains("налог") || lower.contains("льгот") || lower.contains("преференц") || lower.contains("0%")
        val mentionsGrace = lower.contains("каникул") || lower.contains("пусконалад") || lower.contains("месяц") || lower.contains("срок")
        val mentionsGuarantees = lower.contains("гарант") || lower.contains("штраф") || lower.contains("договор") || lower.contains("ответственност")
        val isQuestion = lower.contains("?") || lower.startsWith("как") || lower.startsWith("когда") || lower.startsWith("сколько") || lower.startsWith("какие")

        // 1. Проверка на базарный торг (голая цифра) или слишком короткий ввод
        val isBareNumber = lower.matches(Regex("^[+\\-~]?\\s*\\d+(?:[.,]\\d+)?\\s*(?:[рp₽]|руб(?:лей|ля|ль)?(?:\\s*\\/\\s*м[²2]?)?)?\\.?$"))
        val isShortWithoutB2B = words.size < 4 && !lower.contains("если") && !lower.contains("взамен") && !lower.contains("при условии") && !lower.contains("гарант")

        if (isBareNumber || isShortWithoutB2B) {
            val variants = listOf(
                "Слушайте, мы в ОЭЗ торгуемся как на рынке или обсуждаем стратегический проект? На чем основана эта цифра? Без встречных обязательств по мощностям и срокам пусконаладки я эту цифру даже обсуждать не буду.",
                "Коллеги, это несерьезный разговор. Назвать цифру без аргументов и расчета окупаемости — это базарный подход. Сформулируйте встречные условия.",
                "Вы предлагаете цифру в вакууме. А что по графику инвестиций? Что по подключению 110 кВ? Без встречного пакета мы топчемся на месте."
            )
            return OpponentReplyDto(
                opponentReply = variants[Random.nextInt(variants.size)],
                barsFeedback = "Оппонент жестко пресек попытку базарного торга! В B2B-переговорах никогда не называй цену без встречного условия («если вы..., то мы...»).",
                barsAnimation = "warn",
                metricsDelta = MetricsDelta(trust = -12, tension = 18, dealReadiness = -8),
                dynamicHints = listOf(
                    "Мы готовы зафиксировать ставку [ставка] ₽/м², если вы возьмете на себя обязательство по CAPEX не менее 1.2 млрд ₽...",
                    "Поймите, ставка 460 ₽/м² обусловлена готовой инфраструктурой 110 кВ. Предлагаем компромисс по каникулам...",
                    "Давайте свяжем ставку аренды со сроком ввода производственной линии..."
                ),
                isDealClosed = false
            )
        }

        // 2. Игрок задал вопрос
        if (isQuestion) {
            val replyText = when {
                mentionsPower -> "По мощностям нам требуется гарантированное подключение не менее 8 МВт к началу 3 квартала. Если ОЭЗ готова дать банковскую гарантию готовности сетей, мы готовы обсуждать ставку от 440 ₽/м²."
                mentionsGrace -> "По нашему графику монтаж оборудования тяжелой штамповки занимает минимум 8 месяцев. 12 месяцев было бы идеально, но на 4 месяца мы согласимся только при ставке 420 ₽/м²."
                mentionsCapex -> "Наш общий объем инвестиций в первую очередь составляет 1.4 млрд рублей. Из них 600 млн — это станки из дружественных юрисдикций. Мы несем колоссальные валютные риски."
                else -> "Нас в первую очередь интересует надежность энергосетей, налоговый пакет и фиксированная ставка аренды на 5 лет без скрытых индексаций. Что из этого ОЭЗ готова гарантировать?"
            }
            return OpponentReplyDto(
                opponentReply = replyText,
                barsFeedback = "Отличный ход: открытый вопрос вскрыл приоритеты и скрытые риски оппонента. Теперь формируй пакетное предложение!",
                barsAnimation = "talk",
                metricsDelta = MetricsDelta(trust = 6, tension = -4, dealReadiness = 6),
                dynamicHints = listOf(
                    "Мы гарантируем 8 МВт мощности по первой категории надежности в обмен на ставку 460 ₽/м²...",
                    "Предлагаем 4 месяца каникул при условии запуска пусконаладки во 2 квартале...",
                    "Пакет льгот 0% на имущество и землю компенсирует любые задержки уже в первый год..."
                )
            )
        }

        // 3. Игрок предложил ставку в районе BATNA (460 - 520 ₽/м²)
        if (proposedPrice != null && proposedPrice >= config.batna.minPricePerSqm) {
            val hasStrongTerms = mentionsCapex || mentionsPower || mentionsTax || mentionsGuarantees
            if (hasStrongTerms) {
                return OpponentReplyDto(
                    opponentReply = "Валерий внимательно изучил ваши расчеты... Смотрите, $proposedPrice ₽/м² — это выше нашего изначального бюджета, но с учетом гарантии энергомощностей 110 кВ и налоговых преференций мы готовы пойти на этот компромисс. Давайте фиксировать в протоколе.",
                    barsFeedback = "Блестящая победа! Ты удержал красную линию BATNA ($proposedPrice ₽/м²) и связал условия с инфраструктурой ОЭЗ. Сделка на мази!",
                    barsAnimation = "win",
                    metricsDelta = MetricsDelta(trust = 14, tension = -10, dealReadiness = 20),
                    dynamicHints = listOf(
                        "Фиксируем ставку $proposedPrice ₽/м² в соглашении о намерениях...",
                        "Утверждаем 4 месяца арендных каникул с момента передачи площадки...",
                        "Передаем проект договора в юридический департамент ОЭЗ..."
                    ),
                    isDealClosed = currentMetrics.dealReadiness >= 60
                )
            } else {
                return OpponentReplyDto(
                    opponentReply = "Вы предлагаете $proposedPrice ₽/м², но не даете конкретики по срокам ввода сетей. Если вы подтвердите подключение 8 МВт и каникулы 4 месяца — мы согласны на $proposedPrice ₽/м².",
                    barsFeedback = "Оппонент близок к согласию на нашу ставку! Добавь встречные гарантии по сетям и закрывай раунд.",
                    barsAnimation = "talk",
                    metricsDelta = MetricsDelta(trust = 8, tension = -5, dealReadiness = 12),
                    dynamicHints = listOf(
                        "Гарантируем ввод сетей 110 кВ до 1 сентября и фиксируем $proposedPrice ₽/м²...",
                        "Предоставляем 4 месяца каникул при встречном графике монтажа оборудования..."
                    )
                )
            }
        }

        // 4. Игрок затронул налоги или инфраструктуру
        if (mentionsTax || mentionsPower) {
            return OpponentReplyDto(
                opponentReply = "Да, нулевая ставка налога на имущество и транспорт дает нам около 120 млн рублей экономии в год. Это существенный фактор. Но поймите и нас: простой завода из-за сетей обойдется в 5 млн рублей в сутки. Каковы штрафные санкции ОЭЗ при срыве сроков?",
                barsFeedback = "Ты нащупал ключевой рычаг ценности! Оппонент признал выгоду налогов, но требует гарантий. Предложи пункт о взаимной ответственности.",
                barsAnimation = "talk",
                metricsDelta = MetricsDelta(trust = 9, tension = -4, dealReadiness = 10),
                dynamicHints = listOf(
                    "Мы готовы внести зеркальный штраф 0.1% за день просрочки при ставке 460 ₽/м²...",
                    "Налоговая экономия перекрывает ставку аренды уже со 2-го месяца работы...",
                    "Предлагаем зафиксировать ставку 460 ₽/м² с персональным куратором по техприсоединению..."
                )
            )
        }

        // 5. Игрок предложил уступку по каникулам или компромисс
        if (mentionsGrace || mentionsCapex) {
            return OpponentReplyDto(
                opponentReply = "Хорошо, если каникулы составляют 4 месяца, то мы вынуждены форсировать пусконаладку. Мы согласны рассмотреть встречный шаг по ставке, но не выше 440–460 ₽/м². Что скажете по энерголимитам?",
                barsFeedback = "Позиции сторон сближаются! Держи планку 460 ₽/м² и подтверждай энергомощности.",
                barsAnimation = "talk",
                metricsDelta = MetricsDelta(trust = 7, tension = -3, dealReadiness = 8),
                dynamicHints = listOf(
                    "Мы фиксируем 460 ₽/м² и резервируем 8 МВт по первой категории надежности...",
                    "Давайте подпишем дорожную карту ввода очередей с привязкой к CAPEX..."
                )
            )
        }

        // 6. Общий реалистичный контекстный ответ
        val defaultReplies = listOf(
            "Мы услышали ваши тезисы. Наш совет директоров согласен на гибкость, но требует гарантий окупаемости. Давайте конкретизируем: какая базовая ставка и какие обязательства по CAPEX будут в договоре?",
            "Позиция понятна, но без четких цифр по ставке и срокам каникул мы не сможем защитить этот инвестпроект перед акционерами. Каковы ваши финальные встречные условия?",
            "Слушайте, мы готовы работать с «Алабугой», площадка действительно сильная. Но нам нужна определенность по ставке (от 460 ₽/м²) и мощностям. Давайте сойдемся на конкретных параметрах."
        )

        return OpponentReplyDto(
            opponentReply = defaultReplies[Random.nextInt(defaultReplies.size)],
            barsFeedback = "Переходи к твердым B2B-аргументам: назови твердую ставку 460 ₽/м², обоснуй ее готовыми сетями 110 кВ и налоговыми преференциями 0%.",
            barsAnimation = "talk",
            metricsDelta = MetricsDelta(trust = 4, tension = -2, dealReadiness = 5),
            dynamicHints = listOf(
                "Мы готовы зафиксировать 460 ₽/м² при встречном обязательном CAPEX не менее 1.2 млрд ₽...",
                "Пакет резидента ОЭЗ дает экономию 140 млн ₽ в год, что полностью оправдывает ставку 460 ₽/м²...",
                "Предлагаем разбить ввод мощностей на 2 этапа и зафиксировать условия..."
            )
        )
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
