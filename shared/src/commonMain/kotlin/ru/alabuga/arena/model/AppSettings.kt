package ru.alabuga.arena.model

object AppSettings {
    var geminiApiKey: String = ""
    var openRouterApiKey: String = "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"
    var openRouterModel: String = "google/gemini-2.5-flash"
    var selectedProvider: String = "openrouter" // "gemini" or "openrouter"

    // Grafana & Prometheus Telemetry Integration
    var enableTelemetry: Boolean = true
    var grafanaEndpoint: String = "http://localhost:3001"
    var prometheusPushGateway: String = "http://localhost:9091"
    var grafanaApiKey: String = ""
}
