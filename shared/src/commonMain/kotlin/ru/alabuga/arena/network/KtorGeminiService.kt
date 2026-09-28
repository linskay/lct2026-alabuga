package ru.alabuga.arena.network

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import ru.alabuga.arena.model.Message
import ru.alabuga.arena.model.MessageActor
import ru.alabuga.arena.model.NegotiationMetrics
import ru.alabuga.arena.model.OpponentReplyDto
import ru.alabuga.arena.model.ScenarioConfig

/**
 * ## KtorGeminiService
 *
 * REST-клиент интеграции с нейросетевыми сервисами Google Gemini и LLM-бэкендом тренажера переговоров.
 *
 * ### Назначение:
 * Выполняет генерацию реплик оппонента, расчёт дельты психологических метрик (Trust / Tension / Deal Readiness),
 * формирование оперативного совета тактического наставника Б.А.Р.С. и подсказок для игрока.
 *
 * ### Спецификация API (OpenAPI / Spring-like Contract):
 * - **Protocol:** HTTPS
 * - **Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
 * - **Query Params:** `key={apiKey}`
 * - **Headers:** `Content-Type: application/json`
 * - **Response Codes:**
 *   - `200 OK` — Успешная генерация структурированного JSON-ответа оппонента и наставника Б.А.Р.С.
 *   - `400 Bad Request` — Некорректный синтаксис промпта или системной инструкции.
 *   - `401 Unauthorized` — Отсутствует или недействителен ключ Google AI Studio API.
 *   - `429 Too Many Requests` — Превышена квота запросов (активируется встроенный Smart Fallback).
 *   - `500 Internal Error / Offline` — Ошибка сети или недоступность серверов (бесшовный переход на детерминированный движок).
 *
 * @param apiKey Ключ доступа к Google Gemini API (Google AI Studio).
 */
class KtorGeminiService(private val apiKey: String = "AQ.Ab8RN6J_y1T93WtfF7T-WR4X0KFd37VOkNo4Uvy2suGRtjVKyQ") {

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

    /**
     * Отправляет текущее состояние диалога в нейросетевой движок и возвращает структурированный ответ.
     *
     * ### Поведение метода:
     * 1. Формирует системную директиву с психотипом оппонента, уровнем жесткости и границами BATNA ОЭЗ «Алабуга».
     * 2. Передает последние 10 реплик диалога с текущими метриками.
     * 3. При сбое сети, невалидном ключе или таймауте выполняет автоматический откат на встроенный
     *    детерминированный тактический движок (Deterministic Tactical Fallback).
     *
     * @param history Список предыдущих сообщений диалога с метаданными акторов.
     * @param userMessage Новая аргументационная реплика, отправленная игроком.
     * @param config Конфигурация сценария (имя, психотип, жесткость, красные линии BATNA, повестка).
     * @param currentMetrics Текущие показатели доверия, стресса и готовности к сделке.
     *
     * @return [OpponentReplyDto] Структурированный объект ответа, содержащий:
     *         - `opponent_reply` — встречная речь оппонента;
     *         - `bars_feedback` — тактический анализ наставника Б.А.Р.С.;
     *         - `bars_animation` — триггер 3D-анимации робота (`idle`, `talk`, `warn`, `win`);
     *         - `metrics_delta` — дельта метрик trust, tension, deal_readiness;
     *         - `dynamic_hints` — 3 контекстные заготовки аргументов для следующего раунда.
     */
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

            2. ЭМОЦИОНАЛЬНЫЙ ОТКЛИК И РЕАКЦИЯ НА ХАМСТВО / БАЗАР (TONE MATCHING):
            - Внимательно анализируй тон собеседника.
            - Если игрок пишет неформально, коротко, на сленге или фамильярно (например: «ты че гусь», «давай по братски», «слышь», «скинь 50»):
              ОСАДИ ЕГО ЖЕСТКО. Отвечай резко, раздраженно или иронично. Покажи, что такое базарное поведение недопустимо на уровне топ-менеджмента ОЭЗ. Метрика tension взлетает (+15..+25), trust падает (-10..-20).
            - Если собеседник приводит сильный, логичный B2B-аргумент: прояви сдержанное уважение, но не сдавай позиции сразу. Сделай паузу в тексте (используй многоточия).

            3. ПАМЯТЬ И ПРИВЯЗКА К КОНТЕКСТУ (CHAIN OF THOUGHT & CONTEXT MEMORY):
            - Обязательно помни и развивай мысль из предыдущих 2-3 ходов диалога.
            - Если оппонент повторяет одну и ту же цифру или шаблон без встречных уступок — разозлись и прямо скажи:
              «Мы уже обсуждали эти цифры, я же сказал — мне нужны гарантии сетей и сроков, а не просто пустой торг. Вы меня вообще слышите?»
            - Не повторяй свои аргументы слово в слово.

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

        val fullPrompt = "$historyText\nИгрок (ОЭЗ): $userMessage\n\nТекущие метрики: Trust=${currentMetrics.trust}, Tension=${currentMetrics.tension}, Readiness=${currentMetrics.dealReadiness}"

        return try {
            if (apiKey.isBlank()) throw IllegalStateException("API key is not set, using smart fallback")

            val response: GeminiResponse = client.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey") {
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

            json.decodeFromString<OpponentReplyDto>(cleanJson)
        } catch (_: Throwable) {
            // Smart Deterministic Fallback
            createSmartFallback(userMessage, config)
        }
    }

    /**
     * Локальный детерминированный движок тактической генерации (Fallback Engine).
     * Срабатывает при отсутствии интернет-соединения, исчерпании лимитов API или сбоях LLM.
     */
    private fun createSmartFallback(
        userMessage: String,
        config: ScenarioConfig
    ): OpponentReplyDto {
        val lower = userMessage.lowercase().trim()
        val words = lower.split(Regex("\\s+")).filter { it.isNotBlank() }

        // 1. Проверка на базарный торг без аргументов
        val isBazaarTorg = lower.matches(Regex("^[+\\-~]?\\s*\\d+(?:[.,]\\d+)?\\s*(?:[рp₽]|руб(?:лей|ля)?)?\\.?$")) ||
                (words.size < 4 && (lower.contains("скинь") || lower.contains("дешев") || lower.contains("руб") || lower.contains("давай за")))

        if (isBazaarTorg) {
            return OpponentReplyDto(
                opponentReply = "Я не на базаре, коллеги. Обоснуйте, за счет чего мы должны снизить цену? Какую гарантию или объем вы даете взамен?",
                barsFeedback = "Оппонент отверг базарный торг! В B2B-переговорах любая уступка по цене разменивается на встречные обязательства (сроки, CAPEX, объем инвестиций).",
                barsAnimation = "warn",
                metricsDelta = ru.alabuga.arena.model.MetricsDelta(trust = -10, tension = 15, dealReadiness = -5),
                dynamicHints = listOf(
                    "Мы готовы пойти навстречу по ставке до 460 ₽/м², если вы возьмете на себя пусконаладку оборудования...",
                    "Поймите, ставка 480 ₽/м² обусловлена тем, что мы берем на себя все сети. У других резидентов условия жестче...",
                    "Давайте зафиксируем ставку 460 ₽/м², но увеличим срок каникул до 4 месяцев, чтобы компенсировать ваши риски по CAPEX...",
                    "У нас есть запрос от другого инвестора на эти площади, но мы хотим работать с вами. Давайте сойдемся на 460 ₽/м²..."
                ),
                isDealClosed = false
            )
        }

        // 2. Проверка на неформальный ввод, фамильярность, сленг и наезды
        val isInformalOrRude = lower.contains("гусь") || lower.contains("брат") || lower.contains("слышь") ||
                lower.contains("чё") || lower.contains("че ") || lower.contains("погнали") ||
                lower.contains("э ") || lower.contains("чувак") || lower.contains("лох") ||
                lower.contains("фигн") || lower.contains("херн") || lower.contains("забей") ||
                lower.contains("ты кто") || lower.length < 5

        if (isInformalOrRude) {
            return OpponentReplyDto(
                opponentReply = "Коллега, мы находимся на переговорах стратегического уровня, а не на базаре. Прошу соблюдать деловой этикет и формулировать условия языком цифр и контрактных обязательств, иначе мы прервем диалог.",
                barsFeedback = "Грубая тактическая ошибка! Фамильярность и неформальный тон обрушивают доверие оппонента и взвинчивают стресс. Возвращайся к строгому деловому языку.",
                barsAnimation = "warn",
                metricsDelta = ru.alabuga.arena.model.MetricsDelta(trust = -15, tension = 20, dealReadiness = -10),
                dynamicHints = listOf(
                    "Приношу извинения за резкость. Давайте вернемся к расчету окупаемости по ставке...",
                    "Мы готовы пойти навстречу по ставке до 460 ₽/м², если вы возьмете на себя пусконаладку оборудования...",
                    "ОЭЗ «Алабуга» гарантирует юридическую чистоту и строгое соблюдение регламентов..."
                ),
                isDealClosed = false
            )
        }

        return when {
            lower.contains("460") || lower.contains("capex") || lower.contains("гарант") || lower.contains("110 кв") -> {
                OpponentReplyDto(
                    opponentReply = "Ваша позиция аргументирована. Если вы юридически фиксируете график ввода подстанции 110 кВ и банковскую гарантию компенсации простоев, мы согласны рассмотреть ставку 460 ₽/м².",
                    barsFeedback = "Отличный тактический ход! Оппонент пошел на сближение позиций, признав встречные гарантии.",
                    barsAnimation = "win",
                    metricsDelta = ru.alabuga.arena.model.MetricsDelta(trust = 8, tension = -6, dealReadiness = 12),
                    dynamicHints = listOf(
                        "Фиксируем ставку 460 ₽/м² и график ввода мощностей до [квартал/год]...",
                        "Готовы подписать протокол о намерениях с условием CAPEX 1.2 млрд ₽...",
                        "Согласуем льготный период 4 месяца при встречной гарантии инвестиций..."
                    ),
                    isDealClosed = false
                )
            }
            lower.contains("налог") || lower.contains("преференци") || lower.contains("0%") || lower.contains("прибыль") -> {
                OpponentReplyDto(
                    opponentReply = "Да, налоговые льготы ОЭЗ (0% на имущество и транспорт) снижают нашу фискальную нагрузку на 140 млн ₽ в год. Это весомый аргумент, однако риски задержки пусконаладки всё ещё высоки.",
                    barsFeedback = "Превосходно! Апелляция к налоговым преференциям усилила ценность предложения ОЭЗ без уступок в базовой ставке.",
                    barsAnimation = "talk",
                    metricsDelta = ru.alabuga.arena.model.MetricsDelta(trust = 6, tension = -4, dealReadiness = 10),
                    dynamicHints = listOf(
                        "Налоговая экономия перекрывает ставку 480 ₽/м² уже со второго года работы...",
                        "Предлагаем закрепить налоговый статус резидента в течение 30 дней...",
                        "Готовы включить сопровождение подключения инженерных сетей под ключ..."
                    )
                )
            }
            lower.contains("скидк") || lower.contains("уступ") || lower.contains("соглас") || lower.contains("380") -> {
                OpponentReplyDto(
                    opponentReply = "Мы видим вашу готовность идти навстречу. Однако ставка ниже 460 ₽/м² нарушает финансовую модель проекта. Давайте зафиксируем 440 ₽/м² только при предоплате за 6 месяцев.",
                    barsFeedback = "Внимание: не сдавай позиции без встречных требований! Защищай BATNA и требуй жестких встречных обязательств.",
                    barsAnimation = "warn",
                    metricsDelta = ru.alabuga.arena.model.MetricsDelta(trust = 4, tension = 5, dealReadiness = 6),
                    dynamicHints = listOf(
                        "Ставка ниже 460 ₽/м² невозможна по регламенту ОЭЗ. Наш минимум — 460 ₽/м²...",
                        "Мы можем рассмотреть скидку только при объеме аренды от 15 000 м²...",
                        "Снижение ставки возможно только взамен на сокращение арендных каникул до 2 месяцев..."
                    )
                )
            }
            lower.contains("штраф") || lower.contains("риск") || lower.contains("ответственност") -> {
                OpponentReplyDto(
                    opponentReply = "Мы готовы внести пункт о взаимных штрафных санкциях: 0.1% за каждый день просрочки ввода сетей взамен на наши обязательства по запуску производства во 2 квартале.",
                    barsFeedback = "Конструктивное русло! Закрепление взаимной ответственности уравновешивает переговорные силы.",
                    barsAnimation = "talk",
                    metricsDelta = ru.alabuga.arena.model.MetricsDelta(trust = 7, tension = -3, dealReadiness = 9),
                    dynamicHints = listOf(
                        "Фиксируем предел ответственности в размере 5% от годовой аренды...",
                        "Включаем форс-мажорную оговорку по поставкам высоковольтного оборудования...",
                        "Утверждаем зеркальный штраф за срыв сроков монтажа оборудования резидентом..."
                    )
                )
            }
            else -> {
                OpponentReplyDto(
                    opponentReply = "Мы выслушали вас, но наши финансовые консультанты настаивают на конкретизации условий по энергомощностям и компенсациям CAPEX. Каковы ваши финальные встречные предложения?",
                    barsFeedback = "Переходи в наступление: назови твердую ставку 460–480 ₽/м² и обоснуй ее налоговыми льготами 0% и гарантией сетей 110 кВ.",
                    barsAnimation = "talk",
                    metricsDelta = ru.alabuga.arena.model.MetricsDelta(trust = 3, tension = 2, dealReadiness = 4),
                    dynamicHints = listOf(
                        "Налоговый пакет ОЭЗ (0% на имущество) полностью компенсирует арендную ставку...",
                        "Свободные мощности 110 кВ в нашем кластере обеспечат ваш запуск без задержек...",
                        "Предлагаем разбить ввод мощностей на два этапа с фиксацией ставки 460 ₽/м²..."
                    )
                )
            }
        }
    }
}

/**
 * Вспомогательные транспортные DTO для десериализации ответа Google Gemini REST API.
 */
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
