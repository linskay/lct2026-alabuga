import React from "react";
import { AdminScenarioConfig } from "../types";
import { Building2, X, Target, ShieldAlert, Award, FileText, CheckCircle2 } from "lucide-react";

interface CaseInfoModalProps {
  config: AdminScenarioConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const CaseInfoModal: React.FC<CaseInfoModalProps> = ({ config, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#2e344a] bg-[#141622] p-6 shadow-2xl text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#232738]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7b2cbf]/20 border border-[#7b2cbf] flex items-center justify-center text-[#00f0ff]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Диспозиция кейса: {config.title}
              </h2>
              <p className="text-xs text-slate-400">
                {config.zoneCluster} • Кластер Особой экономической зоны «Алабуга»
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="my-5 space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-sm">
          {/* Main Context */}
          <div className="p-4 rounded-xl bg-[#0d0e14] border border-[#232738]">
            <div className="text-xs font-bold uppercase tracking-wider text-[#9d4edd] mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#00f0ff]" /> Вводная ситуация
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {config.initialContext}
            </p>
          </div>

          {/* Opponent Dossier */}
          <div className="p-4 rounded-xl bg-[#181a26] border border-[#2b3044]">
            <div className="text-xs font-bold uppercase tracking-wider text-[#ffb703] mb-2">
              Досье оппонента
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">{config.opponentName}</div>
                <div className="text-xs text-[#00f0ff]">{config.opponentRole} • {config.opponentCompany}</div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-amber-500/20 text-[#ffb703] border border-amber-500/30 font-mono font-semibold">
                Сложность: {config.difficulty}
              </span>
            </div>
            <div className="text-xs text-slate-300 italic mt-2.5 pt-2 border-t border-slate-800">
              «{config.opponentPersonality}»
            </div>
          </div>

          {/* Target KPIs */}
          <div className="p-4 rounded-xl bg-[#0d0e14] border border-[#232738]">
            <div className="text-xs font-bold uppercase tracking-wider text-[#10b981] mb-2 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-[#10b981]" /> Целевые задачи переговорщика
            </div>
            <div className="space-y-1.5">
              {config.targetKpis.map((kpi, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                  <span>{kpi}</span>
                </div>
              ))}
            </div>
          </div>

          {/* BATNA & Boundaries */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Защита BATNA ОЭЗ
            </div>
            {config.batna.minPricePerSqm > 0 ? (
              <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-3">
                <div className="bg-black/50 p-2.5 rounded-lg border border-rose-950">
                  <span className="text-slate-400 text-[10px] block">МИН. АРЕНДНАЯ СТАВКА:</span>
                  <span className="text-white font-bold text-sm">{config.batna.minPricePerSqm} ₽/м²</span>
                </div>
                <div className="bg-black/50 p-2.5 rounded-lg border border-rose-950">
                  <span className="text-slate-400 text-[10px] block">МАКС. КАНИКУЛЫ:</span>
                  <span className="text-white font-bold text-sm">{config.batna.maxGracePeriodMonths} месяца</span>
                </div>
              </div>
            ) : null}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 block mb-1">Красные линии:</span>
              {config.batna.redLines.map((line, idx) => (
                <div key={idx} className="text-xs text-rose-200 flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold">⛔</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-[#232738]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#7b2cbf] hover:bg-[#9d4edd] text-white text-xs font-bold transition-all shadow-lg"
          >
            Понятно, к переговорам
          </button>
        </div>
      </div>
    </div>
  );
};
