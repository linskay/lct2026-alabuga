package ru.alabuga.arena.util

import android.content.Intent
import androidx.core.content.FileProvider
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
        val context = AppContextHolder.appContext?.get() ?: return

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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Отчет B2B-переговоров — ОЭЗ «Алабуга»</title>
    <style>
        @page { size: A4 portrait; margin: 12mm 10mm; }
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #FFFFFF;
            color: #0F172A;
            margin: 0;
            padding: 16px;
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
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #7C3AED;
            padding-bottom: 14px;
            margin-bottom: 16px;
        }
        .title {
            font-size: 18px;
            font-weight: 900;
            color: #0F172A;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .subtitle {
            font-size: 11px;
            color: #64748B;
            margin-top: 4px;
            font-weight: 500;
        }
        .badge {
            background: #7C3AED15;
            color: #7C3AED;
            border: 1.5px solid #7C3AED;
            padding: 6px 14px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 900;
            font-family: monospace;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 10px;
            margin-bottom: 18px;
        }
        .metric-card {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 10px 12px;
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
            font-size: 18px;
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
            margin-top: 4px;
        }
        .progress-bar {
            height: 100%;
            border-radius: 10px;
        }
        .section-header {
            font-size: 12px;
            font-weight: 800;
            color: #0F172A;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-top: 14px;
            margin-bottom: 6px;
        }
        .content-box {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 12px 14px;
            font-size: 12px;
            line-height: 1.6;
            color: #334155;
            margin-bottom: 12px;
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
            margin-bottom: 6px;
            padding-left: 14px;
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
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #94A3B8;
            border-top: 1px solid #E2E8F0;
            padding-top: 10px;
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
                <div class="metric-val" style="color: $outcomeColor; font-size: 13px; font-weight: 900;">$outcomeLabel</div>
                <div style="font-size: 9px; color: #64748B;">Шагов диалога: $steps</div>
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

        <div class="section-header">Аналитическое резюме наставника Б.А.Р.С.</div>
        <div class="content-box">$summary</div>

        <div class="section-header">Выявленные слабые зоны и риски</div>
        <div class="content-box box-warning">$weakZonesHtml</div>

        <div class="section-header">Тактические рекомендации для B2B-сделок</div>
        <div class="content-box box-recommend">$recsHtml</div>

        <div class="footer">
            <span>ОЭЗ «АЛАБУГА» • ТАКТИЧЕСКИЙ AI-ПОЛИГОН</span>
            <span>NEO-B2B DASHBOARD • 2026</span>
        </div>
    </div>
    <script>
        window.onload = function() {
            setTimeout(function() {
                if (typeof window.print === 'function') {
                    window.print();
                }
            }, 500);
        };
    </script>
</body>
</html>"""

        val reportsDir = File(context.cacheDir, "reports").apply { mkdirs() }
        val reportFile = File(reportsDir, "alabuga_negotiation_report.html")
        reportFile.writeText(htmlContent, Charsets.UTF_8)

        val uri = FileProvider.getUriForFile(context, "ru.alabuga.arena.fileprovider", reportFile)

        val viewIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "text/html")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        val chooser = Intent.createChooser(viewIntent, "Открыть отчет ОЭЗ «Алабуга»").apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(chooser)
    } catch (e: Throwable) {
        e.printStackTrace()
    }
}
