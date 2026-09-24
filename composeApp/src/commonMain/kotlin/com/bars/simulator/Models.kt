package com.bars.simulator

enum class SpeakerRole {
    USER,
    ROBOT,
    SYSTEM
}

enum class RobotEmotion {
    NEUTRAL,
    PRESSURING,
    ANALYTICAL,
    SATISFIED,
    DISSATISFIED
}

enum class AgendaStatus {
    PENDING,
    DISCUSSING,
    AGREED,
    REJECTED
}

data class Message(
    val id: String,
    val role: SpeakerRole,
    val content: String,
    val timestamp: Long = 0L,
    val emotion: RobotEmotion? = null
)

data class AgendaItem(
    val title: String,
    val initialOffer: String,
    val userOffer: String? = null,
    val agreedValue: String? = null,
    val status: AgendaStatus = AgendaStatus.PENDING
)

data class Agenda(
    val rate: AgendaItem = AgendaItem(
        title = "Арендная ставка",
        initialOffer = "400 ₽/м²"
    ),
    val gracePeriod: AgendaItem = AgendaItem(
        title = "Арендные каникулы",
        initialOffer = "6 месяцев"
    ),
    val powerCapex: AgendaItem = AgendaItem(
        title = "CAPEX на подстанцию (3 МВт)",
        initialOffer = "100% за счет Арендодателя"
    )
)

data class NegotiationMetrics(
    val trust: Int = 50,
    val tension: Int = 30,
    val dealReadiness: Int = 20
)
