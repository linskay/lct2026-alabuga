package ru.alabuga.arena.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class NegotiationMetrics(
    val trust: Int = 55,
    val tension: Int = 35,
    val dealReadiness: Int = 40
)

@Serializable
data class MetricsDelta(
    val trust: Int = 0,
    val tension: Int = 0,
    @SerialName("deal_readiness") val dealReadiness: Int = 0
)

@Serializable
enum class MessageActor {
    USER, OPPONENT, BARS
}

@Serializable
data class Message(
    val id: String,
    val actor: MessageActor,
    val text: String,
    val timestamp: Long = System.currentTimeMillis(),
    val stepIndex: Int = 0,
    val emotionEmoji: String = "",
    val emotionLabel: String = "",
    val contextHints: List<String> = emptyList()
)

@Serializable
data class BatnaRules(
    val minPricePerSqm: Int = 460,
    val maxGracePeriodMonths: Int = 4,
    val taxHolidayYears: Int = 10,
    val redLines: List<String> = listOf(
        "Не опускать базовую ставку ниже 460 ₽/м²",
        "Каникулы на пусконаладку не более 4 месяцев",
        "Встречные гарантии на каждый пункт уступок"
    )
)

@Serializable
data class ScenarioConfig(
    val id: String = "synergy_investor",
    val name: String = "Якорный инвестор в «Синергию»",
    val sphere: String = "B2B / Инвесторы ОЭЗ",
    val opponentName: String = "Валерий Смирнов",
    val opponentRole: String = "Вице-президент по развитию",
    val opponentCompany: String = "ГК «ПромКомпозит»",
    val personalityTone: String = "Агрессивно-доминантный",
    val toughnessLevel: Int = 85,
    val bluffTendency: Int = 70,
    val difficulty: String = "Прожжённый закупщик",
    val initialDynamicHints: List<String> = emptyList(),
    val batna: BatnaRules = BatnaRules()
)

enum class AchievementTier {
    LEGENDARY, EPIC, RARE
}

@Serializable
data class Achievement(
    val id: String,
    val title: String,
    val subtitle: String,
    val description: String,
    val isUnlocked: Boolean,
    val tier: AchievementTier = AchievementTier.RARE,
    val conditionText: String
)


@Serializable
data class OpponentReplyDto(
    @SerialName("opponent_reply") val opponentReply: String,
    @SerialName("bars_feedback") val barsFeedback: String,
    @SerialName("bars_animation") val barsAnimation: String = "talk",
    @SerialName("metrics_delta") val metricsDelta: MetricsDelta = MetricsDelta(),
    @SerialName("dynamic_hints") val dynamicHints: List<String> = emptyList(),
    @SerialName("is_deal_closed") val isDealClosed: Boolean = false,
    @SerialName("is_deal_failed") val isDealFailed: Boolean = false
)
