import React, { useState } from "react";
import { DebriefingAnalytics, AdminScenarioConfig, NegotiationAgenda } from "../types";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  X,
  ShieldCheck,
  Trophy,
  Lock,
  Sparkles,
  FileDown,
  Printer,
} from "lucide-react";
import { downloadProtocolFile } from "../utils/exportProtocol";

interface DebriefingModalProps {
  analytics: DebriefingAnalytics;
  scenario?: AdminScenarioConfig;
  agenda?: NegotiationAgenda;
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
}

export const DebriefingModal: React.FC<DebriefingModalProps> = ({
  analytics,
  scenario,
  agenda,
  isOpen,
  onClose,
  onRestart,
}) => {
  const [employeeName, setEmployeeName] = useState("Сотрудник дирекции привлечения инвестиций");

  if (!isOpen) return null;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "S":
        return "text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_25px_rgba(0,240,255,0.4)]";
      case "A":
        return "text-[#10b981] border-[#10b981] bg-[#10b981]/10 shadow-[0_0_25px_rgba(16,185,129,0.4)]";
      case "B":
        return "text-[#ffb703] border-[#ffb703] bg-[#ffb703]/10";
      default:
        return "text-[#ff3366] border-[#ff3366] bg-[#ff3366]/10";
    }
  };

  const handleExportProtocol = () => {
    const defaultScenario: AdminScenarioConfig = scenario || {
      id: "industrial_synergy",
      title: "Индустриальный парк «Синергия»",
      difficulty: "HARD",
      opponentName: "Валерий Строганов",
      opponentRole: "Вице-президент по закупкам и капитальному строительству",
      opponentCompany: "ПАО «РосТехноПром»",
      personalityTone: "Агрессивный экспансионист / Закупщик",
      zoneCluster: "Синергия",
      batna: {
        minPricePerSqm: 460,
        maxGracePeriodMonths: 4,
        redLines: [
          "Минимальная ставка 460 ₽/м²",
          "Каникулы не более 4 месяцев",
          "CAPEX от 1.2 млрд ₽ под подключение 8 МВт",
        ],
      },
    };

    const defaultAgenda: NegotiationAgenda = agenda || {
      rate: { id: "rate", title: "Ставка", status: "agreed", detail: "460 ₽/м²" },
      grace_period: { id: "grace_period", title: "Каникулы", status: "agreed", detail: "4 мес." },
      power_capex: { id: "power_capex", title: "Сети", status: "agreed", detail: "8 МВт под CAPEX 1.2 млрд" },
    };

    downloadProtocolFile({
      documentId: `MOU-ALB-${Date.now().toString().slice(-6)}`,
      generatedDate: new Date().toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      scenario: defaultScenario,
      agenda: defaultAgenda,
      analytics,
      employeeName,
      supervisorRole: "Руководитель департамента по работе с резидентами",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl border border-[#7b2cbf]/50 bg-[#14161f] p-6 shadow-2xl text-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#232736] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7b2cbf]/20 border border-[#7b2cbf] flex items-center justify-center text-[#9d4edd]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Итоговый дебрифинг переговоров
              </h2>
              <p className="text-xs text-slate-400">
                Аналитический отчет робота-наставника «Б.А.Р.С.» (ОЭЗ «Алабуга»)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="my-4 overflow-y-auto pr-1 space-y-4 text-slate-200">
          {/* Grade & Outcome Banner */}
          <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#282c3c] flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Итог переговорной сессии</div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                {analytics.finalOutcome === "WON" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                    Сделка успешно закрыта в пользу ОЭЗ
                  </>
                ) : analytics.finalOutcome === "FAILED" ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-[#ff3366]" />
                    Переговоры сорваны закупщиком
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5 text-[#00f0ff]" />
                    Промежуточный результат сессии
                  </>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Пройдено шагов: <span className="font-mono text-white font-bold">{analytics.totalSteps}</span> |
                Откатов машины времени: <span className="font-mono text-[#00f0ff] font-bold">{analytics.timeTravelUsedCount}</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-[10px] text-slate-400 font-mono uppercase mb-1">Рейтинг тактики</div>
              <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-black font-mono ${getGradeColor(analytics.overallRating)}`}>
                {analytics.overallRating}
              </div>
            </div>
          </div>

          {/* Hurried Warning Banner if user closed prematurely */}
          {analytics.hurriedWarning && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/50 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                  Замечание наставника: поспешная сделка
                </div>
                <p className="text-xs text-amber-200 mt-0.5 leading-relaxed">
                  {analytics.hurriedWarning}
                </p>
              </div>
            </div>
          )}

          {/* Scores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#1a1d29]/70 border border-[#232736]">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00f0ff]" />
                  Защита BATNA (460 ₽/м²)
                </span>
                <span className="font-bold text-[#00f0ff] font-mono">{analytics.batnaScore}%</span>
              </div>
              <div className="w-full bg-[#0d0e12] h-2 rounded-full overflow-hidden border border-[#282c3c]">
                <div
                  className="bg-[#00f0ff] h-full rounded-full transition-all duration-500"
                  style={{ width: `${analytics.batnaScore}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#1a1d29]/70 border border-[#232736]">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Стресс-менеджмент</span>
                <span className="font-bold text-[#10b981] font-mono">{analytics.stressManagementScore}%</span>
              </div>
              <div className="w-full bg-[#0d0e12] h-2 rounded-full overflow-hidden border border-[#282c3c]">
                <div
                  className="bg-[#10b981] h-full rounded-full transition-all duration-500"
                  style={{ width: `${analytics.stressManagementScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Enterprise Value: Export MOU Protocol Box */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-purple-950/40 to-slate-900 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 uppercase tracking-wide">
                <Printer className="w-4 h-4 text-cyan-400" />
                Протокол встречи (MOU) / HR-отчет
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Сводка условий (460 ₽/м², 4 мес., 1.2 млрд CAPEX), HR-метрики и стоп-лексикон сотрудника.
              </p>
            </div>

            <button
              onClick={handleExportProtocol}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Скачать MOU / PDF</span>
            </button>
          </div>

          {/* Advanced Criteria */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-[#12141d] border border-[#232736] text-center">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Скрытая боль (Q3)</div>
              <div className="text-xs font-bold mt-1">
                {analytics.hiddenNeedsDiscovered ? (
                  <span className="text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Вскрыта
                  </span>
                ) : (
                  <span className="text-slate-500">Не выявлена</span>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#12141d] border border-[#232736] text-center">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Манипуляции</div>
              <div className="text-xs font-bold mt-1">
                {analytics.manipulationsHandledCount >= 2 ? (
                  <span className="text-[#00f0ff] flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {analytics.manipulationsHandledCount}/3 парировано
                  </span>
                ) : (
                  <span className="text-amber-400">
                    {analytics.manipulationsHandledCount}/3 парировано
                  </span>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#12141d] border border-[#232736] text-center">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Размен уступок</div>
              <div className="text-xs font-bold mt-1">
                {analytics.mutualTradeOffsEnforced ? (
                  <span className="text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Соблюден
                  </span>
                ) : (
                  <span className="text-amber-400">Частичный</span>
                )}
              </div>
            </div>
          </div>

          {/* BARS Analysis */}
          <div className="p-4 rounded-xl bg-[#7b2cbf]/10 border border-[#7b2cbf]/40 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#9d4edd] flex items-center gap-1.5">
              Заключение наставника «Б.А.Р.С.»:
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {analytics.barsExecutiveSummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-wider">Сильные маневры:</span>
                {analytics.keyStrengths.map((s, idx) => (
                  <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-[#10b981]">✓</span> {s}
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#ffb703] uppercase tracking-wider">Точки роста:</span>
                {analytics.areasForGrowth.map((g, idx) => (
                  <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-[#ffb703]">▲</span> {g}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ACHIEVEMENTS / АЧИВКИ СЕКЦИЯ */}
          {analytics.achievements && analytics.achievements.length > 0 && (
            <div className="p-4 rounded-xl bg-[#10121a] border border-[#2b3046]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      Достижения раунда (Ачивки ОЭЗ «Алабуга»)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Геймификация переговорных навыков и побед
                    </p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-[#7b2cbf]/20 border border-[#7b2cbf]/40 text-[#d0bcff] text-xs font-mono font-bold">
                  {analytics.achievements.filter((a) => a.isUnlocked).length} / {analytics.achievements.length} открыто
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {analytics.achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`relative p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      ach.isUnlocked
                        ? ach.tier === "legendary"
                          ? "bg-amber-950/25 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                          : ach.tier === "epic"
                          ? "bg-purple-950/30 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                          : "bg-cyan-950/25 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                        : "bg-[#0b0c10] border-slate-800/80 opacity-60 grayscale-[0.85]"
                    }`}
                  >
                    {/* Badge Image */}
                    <div className="relative shrink-0">
                      <img
                        src={ach.imageUrl}
                        alt={ach.title}
                        className={`w-14 h-14 rounded-xl object-cover border-2 ${
                          ach.isUnlocked
                            ? ach.tier === "legendary"
                              ? "border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                              : ach.tier === "epic"
                              ? "border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                              : "border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                            : "border-slate-700"
                        }`}
                      />
                      {!ach.isUnlocked && (
                        <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                          <Lock className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-bold text-white truncate">
                          {ach.title}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-semibold ${
                            ach.tier === "legendary"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : ach.tier === "epic"
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          }`}
                        >
                          {ach.tier === "legendary" ? "Legendary" : ach.tier === "epic" ? "Epic" : "Rare"}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 italic mb-1 truncate">
                        {ach.subtitle}
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug line-clamp-2">
                        {ach.description}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[9px] font-mono">
                        {ach.isUnlocked ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Разблокировано!
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            Цель: {ach.conditionText}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#232736] shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
          >
            Вернуться в арену
          </button>
          <button
            onClick={() => {
              onRestart();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#7b2cbf] hover:bg-[#9d4edd] text-white shadow-[0_0_15px_rgba(123,44,191,0.5)] flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Начать новый раунд
          </button>
        </div>
      </div>
    </div>
  );
};
