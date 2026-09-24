import { DebriefingAnalytics, AdminScenarioConfig, NegotiationAgenda } from "../types";

export interface MouProtocolData {
  documentId: string;
  generatedDate: string;
  scenario: AdminScenarioConfig;
  agenda: NegotiationAgenda;
  analytics: DebriefingAnalytics;
  employeeName: string;
  supervisorRole: string;
}

export const generateProtocolHtml = (data: MouProtocolData): string => {
  const { documentId, generatedDate, scenario, agenda, analytics, employeeName } = data;

  const forbiddenLexicon = [
    { phrase: "«Мы пойдем вам навстречу без условий»", reason: "Бесплатная сдача позиции; разрушает переговорный рычаг", fix: "Зафиксировать зеркальное встречное требование (CAPEX / объемы)" },
    { phrase: "«К сожалению, у нас такие правила / регламент»", reason: "Слабая позиция оправдания; провоцирует агрессию", fix: "Обосновать экономическую выгоду готовой инфраструктуры 110 кВ" },
    { phrase: "«Давайте согласимся на 300-350 ₽/м²»", reason: "Прямой пробой BATNA ОЭЗ; недопустимо для инвест-комитета", fix: "Твердо держать нижнюю планку 460 ₽/м² со скидкой только на каникулы" },
    { phrase: "«Мы сделаем всё, что скажете»", reason: "Уничтожение статуса ОЭЗ как стратегического государственного партнера", fix: "Позиция равного диалога: льготы в обмен на кадры «Алабуга Политех»" },
  ];

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Протокол намерений (MOU) / HR-отчет — ${documentId}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.45;
      font-size: 11pt;
      margin: 0;
      padding: 24px;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .corp-title {
      font-size: 16pt;
      font-weight: 800;
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .corp-subtitle {
      font-size: 9pt;
      color: #64748b;
      font-weight: 600;
      margin-top: 2px;
    }
    .doc-meta {
      text-align: right;
      font-size: 9pt;
      color: #475569;
      font-family: ui-monospace, monospace;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-won { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .badge-failed { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .badge-progress { background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; }
    
    h2 {
      font-size: 12pt;
      color: #0f172a;
      border-left: 4px solid #0284c7;
      padding-left: 8px;
      margin: 16px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 16px;
      font-size: 10pt;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      text-align: left;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
    }
    .metric-grid {
      display: table;
      width: 100%;
      margin-bottom: 16px;
    }
    .metric-card {
      display: table-cell;
      width: 25%;
      border: 1px solid #e2e8f0;
      padding: 10px;
      background: #f8fafc;
      text-align: center;
      vertical-align: middle;
    }
    .metric-val {
      font-size: 18pt;
      font-weight: 800;
      color: #0284c7;
      font-family: ui-monospace, monospace;
    }
    .metric-lbl {
      font-size: 8.5pt;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 2px;
      font-weight: 600;
    }
    .lexicon-box {
      background: #fff1f2;
      border: 1px solid #fecdd3;
      border-radius: 6px;
      padding: 10px 14px;
      margin-top: 10px;
    }
    .lexicon-item {
      margin-bottom: 8px;
      font-size: 9.5pt;
    }
    .lexicon-bad {
      color: #be123c;
      font-weight: 700;
    }
    .lexicon-fix {
      color: #047857;
      font-weight: 600;
    }
    .footer-sign {
      margin-top: 30px;
      padding-top: 14px;
      border-top: 1px solid #cbd5e1;
      display: table;
      width: 100%;
      font-size: 9pt;
      color: #64748b;
    }
    .sign-left { display: table-cell; width: 50%; }
    .sign-right { display: table-cell; width: 50%; text-align: right; }
    .no-print {
      margin-bottom: 15px;
      padding: 10px;
      background: #0284c7;
      color: white;
      text-align: center;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
    }
    @media print {
      .no-print { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print" onclick="window.print()">
    🖨️ Нажмите сюда для печати или сохранения в PDF (Ctrl + P)
  </div>

  <table class="header-table">
    <tr>
      <td style="vertical-align: top;">
        <div class="corp-title">ОЭЗ «АЛАБУГА» • СИМУЛЯТОР ПЕРЕГОВОРОВ</div>
        <div class="corp-subtitle">СИСТЕМА РАЗВИТИЯ ЧЕЛОВЕЧЕСКОГО КАПИТАЛА И ОЦЕНКИ КОМПЕТЕНЦИЙ (HRD / L&D)</div>
      </td>
      <td class="doc-meta">
        <div><strong>ПРОТОКОЛ:</strong> ${documentId}</div>
        <div><strong>ДАТА:</strong> ${generatedDate}</div>
        <div style="margin-top: 4px;">
          <span class="badge ${
            analytics.finalOutcome === "WON"
              ? "badge-won"
              : analytics.finalOutcome === "FAILED"
              ? "badge-failed"
              : "badge-progress"
          }">
            ${
              analytics.finalOutcome === "WON"
                ? "✓ СОГЛАСОВАНО"
                : analytics.finalOutcome === "FAILED"
                ? "✕ СОРВАНО"
                : "В ПРОЦЕССЕ"
            }
          </span>
        </div>
      </td>
    </tr>
  </table>

  <h2>1. Диспозиция переговорного раунда</h2>
  <table class="data-table">
    <tr>
      <th style="width: 25%;">Сотрудник / Тренируемый:</th>
      <td><strong>${employeeName}</strong> (Представитель ОЭЗ «Алабуга»)</td>
      <th style="width: 20%;">Итоговый ранг:</th>
      <td><strong style="color: #0284c7; font-size: 12pt;">${analytics.overallRating}</strong> (по шкале S/A/B/C/F)</td>
    </tr>
    <tr>
      <th>Кейс / Сценарий:</th>
      <td>${scenario.title} (${scenario.zoneCluster})</td>
      <th>Оппонент:</th>
      <td><strong>${scenario.opponentName}</strong>, ${scenario.opponentRole} (${scenario.opponentCompany})</td>
    </tr>
  </table>

  <h2>2. Сводка зафиксированных условий (MOU)</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th>Параметр соглашения</th>
        <th>Утвержденное условие</th>
        <th>Норматив BATNA ОЭЗ</th>
        <th>Статус</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Базовая арендная ставка</strong></td>
        <td>460 ₽/м² в месяц</td>
        <td>Не ниже ${scenario.batna.minPricePerSqm} ₽/м²</td>
        <td><span class="badge ${agenda.rate.status === "agreed" ? "badge-won" : "badge-progress"}">${agenda.rate.status === "agreed" ? "Зафиксировано" : "На согласовании"}</span></td>
      </tr>
      <tr>
        <td><strong>Арендные каникулы</strong></td>
        <td>4 месяца (на монтаж оборудования)</td>
        <td>Не более ${scenario.batna.maxGracePeriodMonths} месяцев</td>
        <td><span class="badge ${agenda.grace_period.status === "agreed" ? "badge-won" : "badge-progress"}">${agenda.grace_period.status === "agreed" ? "Зафиксировано" : "На согласовании"}</span></td>
      </tr>
      <tr>
        <td><strong>Энергомощности и CAPEX</strong></td>
        <td>Подводка сетей под взаимный CAPEX 1.2 млрд ₽</td>
        <td>Инвестиции от 1.2 млрд ₽ + резерв 250 мест</td>
        <td><span class="badge ${agenda.power_capex.status === "agreed" ? "badge-won" : "badge-progress"}">${agenda.power_capex.status === "agreed" ? "Зафиксировано" : "На согласовании"}</span></td>
      </tr>
    </tbody>
  </table>

  <h2>3. Оценка компетенций сотрудника (HR-метрики)</h2>
  <div class="metric-grid">
    <div class="metric-card">
      <div class="metric-val">${analytics.batnaScore}%</div>
      <div class="metric-lbl">Соблюдение регламентов (BATNA)</div>
    </div>
    <div class="metric-card">
      <div class="metric-val">${analytics.stressManagementScore}%</div>
      <div class="metric-lbl">Стресс-менеджмент и невозмутимость</div>
    </div>
    <div class="metric-card">
      <div class="metric-val">${analytics.manipulationsHandledCount}/3</div>
      <div class="metric-lbl">Отражение манипуляций и давления</div>
    </div>
    <div class="metric-card">
      <div class="metric-val">${analytics.hiddenNeedsDiscovered ? "Да (Q3)" : "Нет"}</div>
      <div class="metric-lbl">Выявление скрытых потребностей</div>
    </div>
  </div>

  <h2>4. Рекомендации ИИ-наставника «Б.А.Р.С.»</h2>
  <p style="margin-bottom: 6px; font-size: 10pt; color: #334155;">
    <strong>Резюме встречи:</strong> ${analytics.barsExecutiveSummary}
  </p>

  <div class="lexicon-box">
    <div style="font-weight: 700; color: #9f1239; margin-bottom: 6px; font-size: 10pt; text-transform: uppercase;">
      ⚠️ Стоп-лексикон сотрудника (Фразы, которые необходимо исключить):
    </div>
    ${forbiddenLexicon
      .map(
        (item) => `
      <div class="lexicon-item">
        <span class="lexicon-bad">✕ ${item.phrase}</span> — <span style="color: #64748b;">${item.reason}.</span><br/>
        <span class="lexicon-fix">➜ Как правильно:</span> ${item.fix}.
      </div>`
      )
      .join("")}
  </div>

  <table class="footer-sign">
    <tr>
      <td class="sign-left">
        <div><strong>Сотрудник:</strong> ________________ / ${employeeName} /</div>
        <div style="margin-top: 4px;">С протоколом и рекомендациями ознакомлен</div>
      </td>
      <td class="sign-right">
        <div><strong>Наставник:</strong> Робот «Б.А.Р.С.» v4.2</div>
        <div style="margin-top: 4px;">Электронная верификация ОЭЗ «Алабуга»</div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export const downloadProtocolFile = (data: MouProtocolData) => {
  const html = generateProtocolHtml(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  // Create a printable popup or trigger download
  const printWindow = window.open(url, "_blank");
  if (!printWindow) {
    // If popup was blocked, fallback to downloading html file
    const a = document.createElement("a");
    a.href = url;
    a.download = `MOU_Protocol_${data.documentId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};
