package ru.alabuga.bars.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class MessageSender {
    USER,
    OPPONENT,
    SYSTEM,
    BARS_FEEDBACK
}

@Serializable
enum class AgendaStatus {
    @SerialName("in_progress") IN_PROGRESS,
    @SerialName("negotiating") NEGOTIATING,
    @SerialName("agreed") AGREED,
    @SerialName("rejected") REJECTED,
    @SerialName("disputed") DISPUTED
}

@Serializable
data class ChatMessage(
    val id: String,
    val sender: MessageSender,
    val text: String,
    val timestamp: String,
    val barsFeedback: String? = null,
    val barsAnimation: String? = null,
    val isBatnaViolation: Boolean = false
)

@Serializable
data class NegotiationMetrics(
    val trust: Int = 50,
    val tension: Int = 35,
    val dealReadiness: Int = 20
)

@Serializable
data class MetricsDelta(
    val trust: Int = 0,
    val tension: Int = 0,
    @SerialName("deal_readiness") val dealReadiness: Int = 0
)

@Serializable
data class AgendaTopic(
    val topic: String,
    val status: String
)

@Serializable
data class BatnaRules(
    val minRate: Int = 460,
    val maxGraceMonths: Int = 4,
    val minCapexBillions: Double = 1.2,
    val redLines: List<String> = listOf(
        "Ставка не ниже 460 ₽/м² (ниже — убыток для инфраструктуры ОЭЗ)",
        "Арендные каникулы максимум 4 месяца (не более периода СМР)",
        "CAPEX резидента не менее 1.2 млрд ₽ под мощности 8 МВт"
    )
)

@Serializable
data class ScenarioConfig(
    val opponentName: String = "Михаил Громов",
    val opponentRole: String = "Вице-президент по развитию",
    val opponentCompany: String = "ООО «ТехноПром Инжиниринг»",
    val sphere: String = "Высокотехнологичное машиностроение",
    val initialContext: String = "Переговоры по размещению завода в индустриальном парке «Синергия» ОЭЗ «Алабуга».",
    val personalityTone: String = "Агрессивный прессинг, дефицит времени, блеф конкурентами",
    val difficulty: Int = 8,
    val bluffTendency: Int = 85,
    val hiddenGoal: String = "Скрыть критический дедлайн запуска к Q3 и выбить скидку любой ценой",
    val opponentBatna: String = "Уход в альтернативный индустриальный парк соседнего региона",
    val batna: BatnaRules = BatnaRules()
)

@Serializable
data class NegotiationState(
    val config: ScenarioConfig = ScenarioConfig(),
    val metrics: NegotiationMetrics = NegotiationMetrics(),
    val messages: List<ChatMessage> = emptyList(),
    val dynamicHints: List<String> = listOf(
        "Михаил, мы готовы зафиксировать ставку 460 ₽/м², если вы подтвердите [укажите объем CAPEX]...",
        "Каникулы более 4 месяцев невозможны по регламенту ОЭЗ, однако мы компенсируем [предложите льготу]...",
        "Учитывая ваш дедлайн запуска в Q3, ОЭЗ гарантирует готовность сетей при условии [укажите требование]..."
    ),
    val agendaStatus: List<AgendaTopic> = listOf(
        AgendaTopic("Арендная ставка (460 ₽/м²)", "negotiating"),
        AgendaTopic("Арендные каникулы (до 4 мес)", "negotiating"),
        AgendaTopic("CAPEX и мощности (1.2 млрд / 8 МВт)", "negotiating")
    ),
    val barsAnimation: String = "idle",
    val barsFeedback: String = "Следите за невербальными сигналами оппонента и защищайте базовую ставку 460 ₽/м².",
    val isDealClosed: Boolean = false,
    val isDealFailed: Boolean = false,
    val isLoading: Boolean = false
)

@Serializable
data class OpponentReplyDto(
    @SerialName("opponent_reply") val opponentReply: String,
    @SerialName("bars_feedback") val barsFeedback: String,
    @SerialName("bars_animation") val barsAnimation: String = "talk",
    @SerialName("metrics_delta") val metricsDelta: MetricsDelta = MetricsDelta(),
    @SerialName("is_batna_violated") val isBatnaViolated: Boolean = false,
    @SerialName("dynamic_hints") val dynamicHints: List<String> = emptyList(),
    @SerialName("agenda_status") val agendaStatus: List<AgendaTopic> = emptyList(),
    @SerialName("is_deal_closed") val isDealClosed: Boolean = false,
    @SerialName("is_deal_failed") val isDealFailed: Boolean = false
)
