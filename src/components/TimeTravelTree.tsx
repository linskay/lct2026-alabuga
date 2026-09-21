import React from "react";
import { Message, NegotiationSessionSnapshot } from "../types";
import { History, RotateCcw, GitBranch, ArrowDown } from "lucide-react";

interface TimeTravelTreeProps {
  messages: Message[];
  snapshots: NegotiationSessionSnapshot[];
  currentStep: number;
  onRollback: (step: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const TimeTravelTree: React.FC<TimeTravelTreeProps> = ({
  messages,
  snapshots,
  currentStep,
  onRollback,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  // Group messages by turn / step
  const stepsMap: { [step: number]: Message[] } = {};
  messages.forEach((msg) => {
    if (!stepsMap[msg.stepIndex]) {
      stepsMap[msg.stepIndex] = [];
    }
    stepsMap[msg.stepIndex].push(msg);
  });

  const stepKeys = Object.keys(stepsMap)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#282c3c] bg-[#14161f] p-6 shadow-2xl text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#232736]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00f0ff]/15 border border-[#00f0ff] flex items-center justify-center text-[#00f0ff]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Машина времени (Time-travel branch)
                <span className="text-xs px-2 py-0.5 rounded bg-[#7b2cbf]/30 text-[#9d4edd] font-mono border border-[#7b2cbf]/50">
                  Метрики & Снимки
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Выберите любой пройденный шаг, чтобы откатить состояние переговоров и пойти по новой ветке.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            Закрыть
          </button>
        </div>

        <div className="my-4 max-h-[60vh] overflow-y-auto space-y-4 pr-1">
          {stepKeys.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Сессия только началась. Сделайте первые ходы для накопления истории снимков.
            </div>
          ) : (
            stepKeys.map((step) => {
              const stepMessages = stepsMap[step];
              const isCurrent = step === currentStep;
              const lastMsg = stepMessages[stepMessages.length - 1];
              const metrics = lastMsg?.snapshotMetrics;

              return (
                <div
                  key={step}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? "border-[#00f0ff] bg-[#00f0ff]/5 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                      : "border-[#232736] bg-[#0d0e12]/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#7b2cbf] text-white flex items-center justify-center text-xs font-bold font-mono">
                        {step}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        Раунд {step === 0 ? "Вводный" : `Шаг №${step}`}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] font-semibold border border-[#00f0ff]/40">
                          Текущий ход
                        </span>
                      )}
                    </div>

                    {!isCurrent && (
                      <button
                        onClick={() => {
                          onRollback(step);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#7b2cbf]/20 border border-[#7b2cbf] text-[#9d4edd] hover:bg-[#7b2cbf] hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Откатить до этого шага
                      </button>
                    )}
                  </div>

                  {/* Telemetry snapshot for this step */}
                  {metrics && (
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-[#14161f] border border-[#232736] text-[11px] font-mono mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Доверие:</span>
                        <span className="text-[#00f0ff] font-bold">{metrics.trust}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Стресс:</span>
                        <span className="text-[#ff3366] font-bold">{metrics.tension}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Готовность:</span>
                        <span className="text-[#10b981] font-bold">{metrics.deal_readiness}%</span>
                      </div>
                    </div>
                  )}

                  {/* Message previews */}
                  <div className="space-y-1 text-xs">
                    {stepMessages.map((m) => (
                      <div key={m.id} className="flex gap-2 items-start text-slate-300">
                        <span
                          className={`font-semibold font-mono text-[10px] shrink-0 mt-0.5 ${
                            m.actor === "USER"
                              ? "text-[#00f0ff]"
                              : m.actor === "OPPONENT"
                              ? "text-[#ffb703]"
                              : "text-[#9d4edd]"
                          }`}
                        >
                          [{m.actor === "USER" ? "ВЫ" : m.actor === "OPPONENT" ? "ОППОНЕНТ" : "Б.А.Р.С."}]:
                        </span>
                        <span className="text-slate-300 line-clamp-1">{m.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
