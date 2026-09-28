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
            ТЫ — ПЕРЕГОВОРНЫЙ СИМУЛЯТОР ДЛЯ СЦЕНАРИЯ ОЭЗ «АЛАБУГА»:
            - Роль оппонента: ${config.opponentName}, ${config.opponentRole} (${config.opponentCompany})
            - Психотип: ${config.personalityTone} | Уровень жесткости: ${config.toughnessLevel}/100 | Склонность к блефу: ${config.bluffTendency}%

            КРАСНЫЕ ЛИНИИ ИГРОКА (BATNA), КОТОРЫЕ ОН ОБЯЗАН ЗАЩИТИТЬ:
            $batnaRulesFormatted

            СТРОГИЕ ПРАВИЛА ВЕДЕНИЯ ДИАЛОГА (АНТИ-ЗАЦИКЛИВАНИЕ):
            1. ЗАПРЕЩЕНО использовать одинаковые или схожие конструкции предложений в последовательных ответах!
            2. Каждый твой ответ должен динамически развивать беседу, выражать живые эмоции, соответствующие психотипу (${config.personalityTone}), и ссылаться на НОВЫЕ аспекты сделки (риски простоя, график финансирования, CAPEX, альтернативные площадки в других регионах, штрафные санкции, независимые гарантии), а не повторять шаблон «мощности в срок».
            3. ОБРАБОТКА НЕФОРМАЛЬНОГО / ГРУБОГО ВВОДА:
               Если игрок пишет неформально, на сленге, фамильярно или грубо (например: «давай по братски», «ты че гусь», «слышь», «погнали», «скинь цену»):
               - Твой персонаж обязан ЖЕСТКО отреагировать на нарушение делового этикета: выразить возмущение, потребовать профессионализма или пригрозить выходом из переговоров.
               - Метрика tension (напряженность) при этом должна вырасти (+15..+25), а trust (доверие) упасть (-10..-20).
               - Наставник Б.А.Р.С. в bars_feedback обязан предупредить игрока о недопустимости токсичного или непрофессионального тона в переговорах топ-уровня.

            ТРЕБОВАНИЕ К ПОЛЮ dynamic_hints:
            Ты ОБЯЗАН на каждый свой ход сгенерировать 3 релевантные контексту заготовки реплик для игрока:
            - Они должны быть строго по теме текущего собеседника (${config.opponentName}) и текущей проблемы!
            - Заготовки должны быть не законченными фразами, а каркасами с многоточием или [укажите...], чтобы игрок сам доформулировал условия.

            Пример:
            "dynamic_hints": [
              "Мы фиксируем ставку 480 ₽/м² при условии 100% предоплаты за [укажите период]...",
              "Налоговые преференции ОЭЗ (0% на имущество) полностью компенсируют [условие]...",
              "Срок ввода 110 кВ фиксируется в соглашении взамен на обязательства по CAPEX..."
            ]

            Выведи ответ строго в формате JSON:
            {
              "opponent_reply": "...",
              "bars_feedback": "...",
              "bars_animation": "idle | talk | warn | win",
              "metrics_delta": { "trust": 0, "tension": 0, "deal_readiness": 0 },
              "dynamic_hints": ["...", "...", "..."],
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

        // 1. Проверка на неформальный ввод, фамильярность, сленг и наезды
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
                    "Предлагаем зафиксировать параметры договора: аренда [площадь] м² по ставке 460 ₽/м²...",
                    "ОЭЗ «Алабуга» гарантирует юридическую чистоту и соблюдение регламентов..."
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
