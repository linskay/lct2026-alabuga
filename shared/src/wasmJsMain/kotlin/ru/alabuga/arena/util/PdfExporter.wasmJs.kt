package ru.alabuga.arena.util

@JsFun("(scenarioName, opponentName, outcome, rating, steps, trust, tension, readiness, summary, weakZones, recommendations) => { if (typeof window !== 'undefined' && typeof window.exportNegotiationReportPdf === 'function') { window.exportNegotiationReportPdf(scenarioName, opponentName, outcome, rating, steps, trust, tension, readiness, summary, weakZones, recommendations); } }")
private external fun jsExportReportPdf(
    scenarioName: String,
    opponentName: String,
    outcome: String,
    rating: String,
    steps: Int,
    trust: Int,
    tension: Int,
    readiness: Int,
    summary: String,
    weakZones: String,
    recommendations: String
)

actual fun exportPdfReport(
    scenarioName: String,
    opponentName: String,
    outcome: String,
    rating: String,
    steps: Int,
    trust: Int,
    tension: Int,
    readiness: Int,
    summary: String,
    weakZones: String,
    recommendations: String
) {
    try {
        jsExportReportPdf(
            scenarioName,
            opponentName,
            outcome,
            rating,
            steps,
            trust,
            tension,
            readiness,
            summary,
            weakZones,
            recommendations
        )
    } catch (_: Throwable) {
        // Fallback
    }
}
