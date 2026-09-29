package ru.alabuga.arena.model

object AppSettings {
    var geminiApiKey: String = ""
    var openRouterApiKey: String = ""
    var selectedProvider: String = "gemini" // "gemini" or "openrouter"

    // Grafana & Prometheus Telemetry Integration
    var enableTelemetry: Boolean = true
    var grafanaEndpoint: String = "http://localhost:3000"
    var prometheusPushGateway: String = "http://localhost:9091"
    var grafanaApiKey: String = ""
}
