package ru.alabuga.arena.util

import java.awt.Desktop
import java.io.File

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
        val outcomeLabel = if (outcome == "WON") "СДЕЛКА ЗАКЛЮЧЕНА" else if (outcome == "FAILED") "ПРОВАЛ ПЕРЕГОВОРОВ" else "КОМПРОМИСС"
        val outcomeColor = if (outcome == "WON") "#059669" else if (outcome == "FAILED") "#DC2626" else "#7C3AED"
        val outcomeBg = if (outcome == "WON") "#ECFDF5" else if (outcome == "FAILED") "#FEF2F2" else "#F5F3FF"
        val tensionColor = if (tension >= 60) "#DC2626" else if (tension >= 40) "#D97706" else "#6366F1"

        val weakZonesHtml = weakZones.split("<br/>", "\n")
            .filter { it.isNotBlank() }
            .joinToString("") { "<div class=\"list-item item-risk\">${it.removePrefix("•").trim()}</div>" }

        val recsHtml = recommendations.split("<br/>", "\n")
            .filter { it.isNotBlank() }
            .joinToString("") { "<div class=\"list-item item-rec\">${it.removePrefix("•").trim()}</div>" }

        val htmlContent = """<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Отчет B2B-переговоров — ОЭЗ «Алабуга»</title>
    <style>
        @page { size: A4 portrait; margin: 16mm 14mm; }
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #FFFFFF;
            color: #0F172A;
            margin: 0;
            padding: 24px;
            font-size: 13px;
            line-height: 1.55;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .container {
            max-width: 820px;
            margin: 0 auto;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 16px;
            padding: 28px 32px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #7C3AED;
            padding-bottom: 18px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 20px;
            font-weight: 900;
            color: #0F172A;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .subtitle {
            font-size: 12px;
            color: #64748B;
            margin-top: 4px;
            font-weight: 500;
        }
        .badge {
            background: #7C3AED15;
            color: #7C3AED;
            border: 1.5px solid #7C3AED;
            padding: 6px 16px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 900;
            font-family: monospace;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: 1.3fr 1fr 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
        }
        .metric-card {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 12px 14px;
            text-align: center;
        }
        .metric-label {
            font-size: 10px;
            color: #64748B;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.8px;
        }
        .metric-val {
            font-size: 20px;
            font-weight: 900;
            margin: 4px 0;
            font-family: monospace;
        }
        .progress-track {
            width: 100%;
            height: 4px;
            background: #E2E8F0;
            border-radius: 10px;
            overflow: hidden;
            margin-top: 6px;
        }
        .progress-bar {
            height: 100%;
            border-radius: 10px;
        }
        .section-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            font-weight: 800;
            color: #0F172A;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-top: 18px;
            margin-bottom: 8px;
        }
        .section-icon {
            width: 16px;
            height: 16px;
            display: inline-block;
        }
        .content-box {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 14px 18px;
            font-size: 13px;
            line-height: 1.6;
            color: #334155;
            margin-bottom: 14px;
        }
        .box-warning {
            background: #FFFBEB;
            border-color: #FDE68A;
        }
        .box-recommend {
            background: #F5F3FF;
            border-color: #DDD6FE;
        }
        .list-item {
            margin-bottom: 8px;
            padding-left: 16px;
            position: relative;
        }
        .list-item:last-child { margin-bottom: 0; }
        .list-item::before {
            content: "—";
            position: absolute;
            left: 0;
            font-weight: 800;
        }
        .item-risk::before { color: #DC2626; }
        .item-rec::before { color: #7C3AED; }
        .footer {
            margin-top: 24px;
            text-align: center;
            font-size: 11px;
            color: #94A3B8;
            border-top: 1px solid #E2E8F0;
            padding-top: 14px;
            font-family: monospace;
            display: flex;
            justify-content: space-between;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div class="title">ОЭЗ «АЛАБУГА» • АРЕНА B2B-ПЕРЕГОВОРОВ</div>
                <div class="subtitle">Сценарий: <b>$scenarioName</b> | Оппонент: <b>$opponentName</b></div>
            </div>
            <div class="badge">РАНГ $rating</div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card" style="background: $outcomeBg; border-color: ${outcomeColor}40;">
                <div class="metric-label">Результат</div>
                <div class="metric-val" style="color: $outcomeColor; font-size: 14px; font-weight: 900;">$outcomeLabel</div>
                <div style="font-size: 10px; color: #64748B;">Шагов диалога: $steps</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Доверие</div>
                <div class="metric-val" style="color: #0284C7;">$trust%</div>
                <div class="progress-track"><div class="progress-bar" style="width: $trust%; background: #0284C7;"></div></div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Стресс</div>
                <div class="metric-val" style="color: $tensionColor;">$tension%</div>
                <div class="progress-track"><div class="progress-bar" style="width: $tension%; background: $tensionColor;"></div></div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Готовность</div>
                <div class="metric-val" style="color: #059669;">$readiness%</div>
                <div class="progress-track"><div class="progress-bar" style="width: $readiness%; background: #059669;"></div></div>
            </div>
        </div>

        <div class="section-header">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            Аналитическое резюме наставника Б.А.Р.С.
        </div>
        <div class="content-box">
            $summary
        </div>

        <div class="section-header">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Выявленные слабые зоны и коммуникативные риски
        </div>
        <div class="content-box box-warning">
            $weakZonesHtml
        </div>

        <div class="section-header">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Тактические рекомендации для реальных B2B-сделок
        </div>
        <div class="content-box box-recommend">
            $recsHtml
        </div>

        <div class="footer">
            <span>ОЭЗ «АЛАБУГА» • ТАКТИЧЕСКИЙ AI-ПОЛИГОН</span>
            <span>NEO-B2B DASHBOARD • 2026</span>
        </div>
    </div>
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>
</body>
</html>"""

        val tempFile = File.createTempFile("alabuga_negotiation_report_", ".html")
        tempFile.writeText(htmlContent, Charsets.UTF_8)
        tempFile.deleteOnExit()

        if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
            Desktop.getDesktop().browse(tempFile.toURI())
        }
    } catch (e: Exception) {
        e.printStackTrace()
    }
}
