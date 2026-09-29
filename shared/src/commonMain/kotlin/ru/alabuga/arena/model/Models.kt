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
    val timestamp: Long = 0L,
    val stepIndex: Int = 0,
    val snapshotMetrics: NegotiationMetrics = NegotiationMetrics(),
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
data class AgendaTopic(
    val id: String,
    val title: String,
    val target: String,
    val status: String = "in_progress", // agreed, in_progress, disputed
    val detail: String = ""
)

@Serializable
data class ScenarioConfig(
    val id: String = "synergy_investor",
    val name: String = "Якорный инвестор в «Синергию»",
    val title: String = "Якорный инвестор в «Синергию»",
    val sphere: String = "B2B / Инвесторы ОЭЗ",
    val opponentName: String = "Валерий Смирнов",
    val opponentRole: String = "Вице-президент по развитию",
    val opponentCompany: String = "ГК «ПромКомпозит»",
    val personalityTone: String = "Агрессивно-доминантный",
    val toughnessLevel: Int = 85,
    val bluffTendency: Int = 70,
    val difficulty: String = "Прожжённый закупщик",
    val zoneCluster: String = "Индустриальный парк «Синергия»",
    val initialOpponentUtterance: String = "Добрый день. Мы готовы зайти в «Синергию» на 12 000 м², но требуем скидку до 300 руб/м² и 12 месяцев каникул на пусконаладку. Что скажете?",
    val initialBarsAdvice: String = "Оппонент с порога атакует ставку аренды! Не оправдывайся и не сдавай минимальный порог BATNA (460 ₽/м²). Напомни о готовых мощностях 110 кВ!",
    val initialDynamicHints: List<String> = listOf(
        "Валерий, спешка в таких инвестициях рискованна. Мы готовы рассмотреть [ставка], если вы гарантируете...",
        "Условие ОЭЗ — не менее 1.2 млрд CAPEX в обмен на [объем мощностей]...",
        "Давайте зафиксируем 460 ₽/м², но предусмотрим льготу [компромисс]..."
    ),
    val agendaTopics: List<AgendaTopic> = listOf(
        AgendaTopic("rate", "Базовая ставка аренды", "BATNA: от 460 ₽/м²", "disputed", "Оппонент требует 300 ₽/м²"),
        AgendaTopic("grace_period", "Каникулы на пусконаладку", "BATNA: до 4 мес.", "in_progress", "Оппонент просит 12 мес."),
        AgendaTopic("power_capex", "Электросети 8 МВт & CAPEX", "Инвестиции от 1.2 млрд ₽", "disputed", "Требуется встречный CAPEX")
    ),
    val batna: BatnaRules = BatnaRules()
)

@Serializable
data class OpponentReplyDto(
    @SerialName("internal_thought") val internalThought: String? = null,
    @SerialName("spoken_reply") val spokenReply: String? = null,
    @SerialName("opponent_reply") val opponentReply: String = "",
    @SerialName("bars_feedback") val barsFeedback: String = "",
    @SerialName("bars_animation") val barsAnimation: String = "talk",
    @SerialName("metrics_delta") val metricsDelta: MetricsDelta = MetricsDelta(),
    @SerialName("dynamic_hints") val dynamicHints: List<String> = emptyList(),
    @SerialName("is_deal_closed") val isDealClosed: Boolean = false,
    @SerialName("is_deal_failed") val isDealFailed: Boolean = false
) {
    fun getResolvedReply(): String = spokenReply?.takeIf { it.isNotBlank() } ?: opponentReply
}

data class ZopaState(
    val buyerMin: Int = 300,
    val buyerMax: Int = 420,
    val sellerMin: Int = 460,
    val sellerMax: Int = 500,
    val isOverlap: Boolean = false,
    val overlapMin: Int? = null,
    val overlapMax: Int? = null,
    val currentOffer: Int = 300,
    val status: String = "narrowing",
    val changeReason: String = "Оппонент удерживает заниженную планку (300 ₽/м²), коридор сделки пока закрыт."
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

data class DebriefingReport(
    val finalOutcome: String = "WON", // WON, FAILED, IN_PROGRESS
    val totalSteps: Int = 0,
    val timeTravelUsedCount: Int = 0,
    val batnaScore: Int = 85,
    val stressManagementScore: Int = 78,
    val overallRating: String = "A", // S, A, B, C, F
    val barsExecutiveSummary: String = "Переговоры завершены успешно. BATNA ОЭЗ защищена, ставка удержана выше минимального порога.",
    val manipulationsHandledCount: Int = 2,
    val hiddenNeedsDiscovered: Boolean = true,
    val mutualTradeOffsEnforced: Boolean = true,
    val achievements: List<Achievement> = emptyList()
)

