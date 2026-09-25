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
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import ru.alabuga.arena.model.Message
import ru.alabuga.arena.model.MessageActor
import ru.alabuga.arena.model.NegotiationMetrics
import ru.alabuga.arena.model.OpponentReplyDto
import ru.alabuga.arena.model.ScenarioConfig

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

            Пример для кейса удержания сотрудника (Артем):
            "dynamic_hints": [
              "Артем, проект масштабирования важнее рутины. Мы готовы передать тебе лидство над [укажите проект]...",
              "Деньги важны, но в финтехе ты будешь винтиком. Давай согласуем пересмотр грейда при условии...",
              "Давай разгрузим тебя от ночных дежурств: наймем двух дежурных инженеров, если ты..."
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
            val cleaned = textContent.replace("```json", "").replace("```", "").trim()
            json.decodeFromString<OpponentReplyDto>(cleaned)
        } catch (e: Exception) {
            val oppFirstName = config.opponentName.split(" ").firstOrNull() ?: "Коллега"
            val fallbackHints = config.initialDynamicHints.ifEmpty {
                listOf(
                    "$oppFirstName, мы готовы пойти навстречу при условии [укажите требование]...",
                    "Позиция ОЭЗ основана на регламенте. Давайте согласуем компромисс по [вопрос]...",
                    "Предлагаем зафиксировать условия взамен на встречные инвестиции в [сфера]..."
                )
            }
            OpponentReplyDto(
                opponentReply = "Ваша позиция понятна. Однако нам необходимы четкие гарантии и фиксация сроков по объектам «Синергии».",
                barsFeedback = "Оппонент прощупывает почву. Удерживайте красные линии и требуйте встречных шагов!",
                barsAnimation = "talk",
                metricsDelta = ru.alabuga.arena.model.MetricsDelta(trust = 4, tension = -2, dealReadiness = 5),
                dynamicHints = fallbackHints,
                isDealClosed = false,
                isDealFailed = false
            )
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
    val text: String? = null
)
