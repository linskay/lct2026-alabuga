package ru.alabuga.arena.util

@JsFun("""(scenarioName, opponentName, outcome, rating, steps, trust, tension, readiness, summary, weakZones, recommendations) => {
    if (typeof window !== 'undefined' && typeof window.exportNegotiationReportPdf === 'function') {
        window.exportNegotiationReportPdf(scenarioName, opponentName, outcome, rating, steps, trust, tension, readiness, summary, weakZones, recommendations);
        return;
    }
    const outcomeLabel = outcome === 'WON' ? 'СДЕЛКА ЗАКЛЮЧЕНА' : outcome === 'FAILED' ? 'ПРОВАЛ ПЕРЕГОВОРОВ' : 'КОМПРОМИСС';
    const outcomeColor = outcome === 'WON' ? '#059669' : outcome === 'FAILED' ? '#DC2626' : '#7C3AED';
    const outcomeBg = outcome === 'WON' ? '#ECFDF5' : outcome === 'FAILED' ? '#FEF2F2' : '#F5F3FF';
    const tensionColor = tension >= 60 ? '#DC2626' : tension >= 40 ? '#D97706' : '#6366F1';
    
    const weakList = weakZones.split(/<br\/>|\n/).filter(s => s.trim().length > 0).map(s => '<div class="list-item item-risk">' + s.replace(/^•/, '').trim() + '</div>').join('');
    const recsList = recommendations.split(/<br\/>|\n/).filter(s => s.trim().length > 0).map(s => '<div class="list-item item-rec">' + s.replace(/^•/, '').trim() + '</div>').join('');

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Отчет B2B-переговоров — ОЭЗ «Алабуга»</title>
<style>
@page { size: A4 portrait; margin: 16mm 14mm; }
* { box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #0F172A; margin: 0; padding: 24px; font-size: 13px; line-height: 1.55; }
.container { max-width: 820px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 16px; padding: 28px 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #7C3AED; padding-bottom: 18px; margin-bottom: 20px; }
.title { font-size: 20px; font-weight: 900; color: #0F172A; text-transform: uppercase; }
.subtitle { font-size: 12px; color: #64748B; margin-top: 4px; }
.badge { background: #7C3AED15; color: #7C3AED; border: 1.5px solid #7C3AED; padding: 6px 16px; border-radius: 12px; font-size: 15px; font-weight: 900; font-family: monospace; }
.metrics-grid { display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.metric-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px 14px; text-align: center; }
.metric-label { font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px; }
.metric-val { font-size: 20px; font-weight: 900; margin: 4px 0; font-family: monospace; }
.progress-track { width: 100%; height: 4px; background: #E2E8F0; border-radius: 10px; overflow: hidden; margin-top: 6px; }
.progress-bar { height: 100%; border-radius: 10px; }
.section-header { font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 18px; margin-bottom: 8px; }
.content-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px 18px; font-size: 13px; line-height: 1.6; color: #334155; margin-bottom: 14px; }
.box-warning { background: #FFFBEB; border-color: #FDE68A; }
.box-recommend { background: #F5F3FF; border-color: #DDD6FE; }
.list-item { margin-bottom: 8px; padding-left: 16px; position: relative; }
.list-item::before { content: "—"; position: absolute; left: 0; font-weight: 800; }
.item-risk::before { color: #DC2626; }
.item-rec::before { color: #7C3AED; }
.footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 14px; display: flex; justify-content: space-between; font-family: monospace; }
</style>
</head>
<body>
<div class="container">
<div class="header"><div><div class="title">ОЭЗ «АЛАБУГА» • АРЕНА B2B-ПЕРЕГОВОРОВ</div><div class="subtitle">Сценарий: <b>` + scenarioName + `</b> | Оппонент: <b>` + opponentName + `</b></div></div><div class="badge">РАНГ ` + rating + `</div></div>
<div class="metrics-grid">
<div class="metric-card" style="background: ` + outcomeBg + `; border-color: ` + outcomeColor + `40;"><div class="metric-label">Результат</div><div class="metric-val" style="color: ` + outcomeColor + `; font-size: 14px; font-weight: 900;">` + outcomeLabel + `</div><div style="font-size: 10px; color: #64748B;">Шагов: ` + steps + `</div></div>
<div class="metric-card"><div class="metric-label">Доверие</div><div class="metric-val" style="color: #0284C7;">` + trust + `%</div><div class="progress-track"><div class="progress-bar" style="width: ` + trust + `%; background: #0284C7;"></div></div></div>
<div class="metric-card"><div class="metric-label">Стресс</div><div class="metric-val" style="color: ` + tensionColor + `;">` + tension + `%</div><div class="progress-track"><div class="progress-bar" style="width: ` + tension + `%; background: ` + tensionColor + `;"></div></div></div>
<div class="metric-card"><div class="metric-label">Готовность</div><div class="metric-val" style="color: #059669;">` + readiness + `%</div><div class="progress-track"><div class="progress-bar" style="width: ` + readiness + `%; background: #059669;"></div></div></div>
</div>
<div class="section-header">Аналитическое резюме наставника Б.А.Р.С.</div>
<div class="content-box">` + summary + `</div>
<div class="section-header">Выявленные слабые зоны и риски</div>
<div class="content-box box-warning">` + weakList + `</div>
<div class="section-header">Тактические рекомендации для B2B-сделок</div>
<div class="content-box box-recommend">` + recsList + `</div>
<div class="footer"><span>ОЭЗ «АЛАБУГА» • ТАКТИЧЕСКИЙ AI-ПОЛИГОН</span><span>NEO-B2B DASHBOARD • 2026</span></div>
</div>
</body>
</html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
        printWin.document.write(html);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => { printWin.print(); }, 400);
    }
}""")
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
