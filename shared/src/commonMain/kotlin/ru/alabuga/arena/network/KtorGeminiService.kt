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
            ТЫ — ПЕРЕГОВОРНЫЙ СИМУЛЯТОР ДЛЯ СЦЕНАРИЯ:
            - Роль оппонента: ${config.opponentName}, ${config.opponentRole} (${config.opponentCompany})
            - Психотип: ${config.personalityTone} | Уровень жесткости: ${config.toughnessLevel}/100 | Склонность к блефу: ${config.bluffTendency}%

            КРАСНЫЕ ЛИНИИ ИГРОКА (BATNA), КОТОРЫЕ ОН ОБЯЗАН ЗАЩИТИТЬ:
            $batnaRulesFormatted

            ТРЕБОВАНИЕ К ПОЛЮ dynamic_hints:
            Ты ОБЯЗАН на каждый свой ход сгенерировать 3 релевантные контексту заготовки реплик для игрока:
            - Они должны быть строго по теме текущего собеседника (${config.opponentName}) и текущей проблемы!
            - Заготовки должны быть не законченными фразами, а каркасами с многоточием или [укажите...], чтобы игрок сам доформулировал условия.

            Пример для кейса инвестора:
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
        val lower = userMessage.lowercase()

        return when {
            lower.contains("460") || lower.contains("capex") || lower.contains("гарант") -> {
                OpponentReplyDto(
                    opponentReply = "Ваша позиция аргументирована. Если вы фиксируете мощности 110 кВ в договоре, мы согласны рассмотреть ставку ближе к 460 ₽/м².",
                    barsFeedback = "Отличный тактический ход! Оппонент пошел на сближение позиций, признав встречные гарантии.",
                    barsAnimation = "win",
                    metricsDelta = ru.alabuga.arena.model.MetricsDelta(trust = 8, tension = -6, dealReadiness = 12),
                    dynamicHints = listOf(
                        "Фиксируем ставку 460 ₽/м² и график ввода мощностей...",
                        "Готовы подписать протокол о намерениях с условием CAPEX 1.2 млрд ₽...",
                        "Согласуем льготный период 4 месяца при встречной гарантии..."
                    ),
                    isDealClosed = false
                )
            }
            lower.contains("скидк") || lower.contains("уступ") || lower.contains("соглас") -> {
                OpponentReplyDto(
                    opponentReply = "Мы видим вашу готовность идти навстречу. Давайте тогда зафиксируем ставку 380 ₽/м² и 6 месяцев каникул.",
                    barsFeedback = "Внимание: не сдавай позиции без встречных требований! Требуй жестких обязательств по инвестициям.",
                    barsAnimation = "warn",
                    metricsDelta = ru.alabuga.arena.model.MetricsDelta(trust = 4, tension = 5, dealReadiness = 6),
                    dynamicHints = listOf(
                        "Ставка 380 ₽/м² ниже BATNA ОЭЗ. Наш минимум — 460 ₽/м²...",
                        "Мы можем рассмотреть скидку только при объеме аренды от 15 000 м²...",
                        "Снижение ставки возможно только взамен на сокращение каникул до 2 месяцев..."
                    )
                )
            }
            else -> {
                OpponentReplyDto(
                    opponentReply = "Мы выслушали вас, но наши инвестиционные комитеты требуют большей определенности по срокам и затратам.",
                    barsFeedback = "Напомни оппоненту о налоговых преференциях 0% и дефиците сетей 110 кВ на других площадках региона.",
                    barsAnimation = "talk",
                    metricsDelta = ru.alabuga.arena.model.MetricsDelta(trust = 3, tension = 2, dealReadiness = 4),
                    dynamicHints = listOf(
                        "Налоговый пакет ОЭЗ (0% на имущество) полностью компенсирует арендную ставку...",
                        "Свободные мощности 110 кВ в нашем кластере обеспечат ваш запуск без задержек...",
                        "Предлагаем разбить ввод мощностей на два этапа..."
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
