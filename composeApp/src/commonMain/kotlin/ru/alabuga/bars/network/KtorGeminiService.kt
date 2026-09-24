package ru.alabuga.bars.network

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import ru.alabuga.bars.model.ChatMessage
import ru.alabuga.bars.model.NegotiationMetrics
import ru.alabuga.bars.model.OpponentReplyDto
import ru.alabuga.bars.model.ScenarioConfig

class KtorGeminiService(private val apiKey: String = "") {

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
        history: List<ChatMessage>,
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
            - Контекст сделки: ${config.initialContext}
            - Психотип: ${config.personalityTone} | Уровень жесткости: ${config.difficulty}/10 | Склонность к блефу: ${config.bluffTendency}%
            - Скрытая цель оппонента: ${config.hiddenGoal}
            - Альтернатива оппонента (BATNA): ${config.opponentBatna}

            КРАСНЫЕ ЛИНИИ ИГРОКА (BATNA), КОТОРЫЕ ОН ОБЯЗАН ЗАЩИТИТЬ:
            $batnaRulesFormatted

            ПРАВИЛА ЛОГИЧЕСКОГО АНАЛИЗА РЕПЛИК (ФАКТЧЕКИНГ):
            1. СЕМАНТИЧЕСКИЙ АНАЛИЗ:
               - Если игрок использует отрицания («не согласен», «не подписываем», «исключено», «не пойдем на 400», «не можем предоставить») — трактуй как УДЕРЖАНИЕ позиции, а не уступку!
               - Фиксируй факт сдачи BATNA (is_batna_violated: true) ТОЛЬКО тогда, когда игрок явно соглашается на цифру оппонента хуже допустимой.
            2. СТУПЕНЧАТЫЙ ТОРГ:
               - Не принимай первое встречное предложение игрока. Требуй дополнительных уступок.
               - Не повторяй реплики слово в слово. Развивай диалог на основе последнего аргумента игрока.
            3. МЕТРИКИ:
               - Изменение метрик (trust, tension, deal_readiness) за один шаг не должно превышать ±15%.

            Выведи ответ строго в формате JSON:
            {
              "opponent_reply": "...",
              "bars_feedback": "...",
              "bars_animation": "idle | talk | warn | win",
              "metrics_delta": { "trust": 0, "tension": 0, "deal_readiness": 0 },
              "is_batna_violated": false,
              "dynamic_hints": ["...", "...", "..."],
              "agenda_status": [
                {"topic": "Арендная ставка", "status": "agreed | negotiating | rejected"}
              ],
              "is_deal_closed": false,
              "is_deal_failed": false
            }
        """.trimIndent()

        val historyText = history.takeLast(10).joinToString("\n") {
            val senderLabel = if (it.sender == ru.alabuga.bars.model.MessageSender.USER) "Игрок (ОЭЗ)" else config.opponentName
            "$senderLabel: ${it.text}"
        }

        val fullPrompt = "$historyText\nИгрок (ОЭЗ): $userMessage\n\nТекущие метрики: Trust=${currentMetrics.trust}, Tension=${currentMetrics.tension}, Readiness=${currentMetrics.dealReadiness}"

        return try {
            val response: GeminiResponse = client.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey") {
                contentType(ContentType.Application.Json)
                setBody(
                    buildJsonObject {
                        put("systemInstruction", buildJsonObject {
                            put("parts", json.parseToJsonElement("""[{"text": ${Json.encodeToString(systemPrompt)}}]"""))
                        })
                        put("contents", json.parseToJsonElement("""[{"role": "user", "parts": [{"text": ${Json.encodeToString(fullPrompt)}}]}]"""))
                        put("generationConfig", buildJsonObject {
                            put("responseMimeType", "application/json")
                        })
                    }
                )
            }.body()

            val responseText = response.candidates.firstOrNull()?.content?.parts?.firstOrNull()?.text ?: ""
            json.decodeFromString<OpponentReplyDto>(responseText)
        } catch (e: Exception) {
            fallbackResponse(userMessage, config, currentMetrics)
        }
    }

    private fun fallbackResponse(
        userMessage: String,
        config: ScenarioConfig,
        currentMetrics: NegotiationMetrics
    ): OpponentReplyDto {
        val lower = userMessage.lowercase()
        val isHolding = lower.contains("не соглас") || lower.contains("не можем") || lower.contains("460")
        val trustDelta = if (isHolding) 5 else -5
        val tensionDelta = if (isHolding) -5 else 5

        return OpponentReplyDto(
            opponentReply = "Я услышал вашу позицию. Однако совет директоров требует жестких гарантий. Чем вы компенсируете риски задержки подключения к сетям?",
            barsFeedback = if (isHolding)
                "Отличный маневр: вы удержали позицию без агрессии и отстояли BATNA."
            else
                "Внимание: не уступайте параметры без встречного требования встречных уступок.",
            barsAnimation = if (isHolding) "win" else "talk",
            metricsDelta = ru.alabuga.bars.model.MetricsDelta(trust = trustDelta, tension = tensionDelta, dealReadiness = 5),
            isBatnaViolated = false,
            dynamicHints = listOf(
                "Михаил, мы гарантируем готовность сетей 8 МВт по графику в обмен на...",
                "Ставка 460 ₽/м² неизменна, но мы предоставляем юридическое сопровождение...",
                "Если срок запуска критичен, подпишем протокол с фиксацией штрафов сторон..."
            ),
            agendaStatus = listOf(
                ru.alabuga.bars.model.AgendaTopic("Арендная ставка (460 ₽/м²)", if (isHolding) "negotiating" else "agreed")
            ),
            isDealClosed = false,
            isDealFailed = false
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
