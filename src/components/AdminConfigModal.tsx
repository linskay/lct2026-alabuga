import React, { useState } from "react";
import { AdminScenarioConfig, DifficultyLevel } from "../types";
import { PRESET_SCENARIOS } from "../data/scenarios";
import { X, ShieldAlert, Sparkles, Check, Sliders, Briefcase, Plus, Trash2 } from "lucide-react";

interface AdminConfigModalProps {
  currentConfig: AdminScenarioConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AdminScenarioConfig) => void;
}

export const AdminConfigModal: React.FC<AdminConfigModalProps> = ({
  currentConfig,
  isOpen,
  onClose,
  onSave,
}) => {
  const [config, setConfig] = useState<AdminScenarioConfig>(currentConfig);
  const [newRedLine, setNewRedLine] = useState("");

  if (!isOpen) return null;

  const handleSelectPreset = (preset: AdminScenarioConfig) => {
    setConfig({ ...preset });
  };

  const handleAddRedLine = () => {
    if (!newRedLine.trim()) return;
    setConfig((prev) => ({
      ...prev,
      batna: {
        ...prev.batna,
        redLines: [...prev.batna.redLines, newRedLine.trim()],
      },
    }));
    setNewRedLine("");
  };

  const handleRemoveRedLine = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      batna: {
        ...prev.batna,
        redLines: prev.batna.redLines.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-[#282c3c] bg-[#14161f] p-6 shadow-2xl text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#232736]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7b2cbf]/20 border border-[#7b2cbf] flex items-center justify-center text-[#9d4edd]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Панель администратора
                <span className="text-xs px-2 py-0.5 rounded bg-[#7b2cbf]/30 text-[#00f0ff] font-mono border border-[#7b2cbf]/50">
                  ОЭЗ «Алабуга»
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Конфигурация оппонента, красных линий (BATNA) и параметров симулятора
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Selector */}
        <div className="my-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#9d4edd] mb-2">
            Готовые сценарии ОЭЗ «Алабуга»
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {PRESET_SCENARIOS.map((preset) => {
              const isSelected = preset.id === config.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    isSelected
                      ? "border-[#7b2cbf] bg-[#7b2cbf]/15 text-white shadow-[0_0_15px_rgba(123,44,191,0.3)]"
                      : "border-[#232736] bg-[#1a1d29]/60 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold truncate">{preset.title}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#00f0ff]" />}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{preset.opponentRole}</div>
                  <div className="mt-2 inline-block text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-[#ffb703] border border-amber-500/20">
                    {preset.difficulty}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scenario Fields */}
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Название кейса</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e12] border border-[#282c3c] text-sm text-white focus:outline-none focus:border-[#7b2cbf]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Локация / Кластер ОЭЗ</label>
              <input
                type="text"
                value={config.zoneCluster}
                onChange={(e) => setConfig({ ...config, zoneCluster: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e12] border border-[#282c3c] text-sm text-white focus:outline-none focus:border-[#7b2cbf]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Роль оппонента</label>
              <input
                type="text"
                value={config.opponentRole}
                onChange={(e) => setConfig({ ...config, opponentRole: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e12] border border-[#282c3c] text-sm text-white focus:outline-none focus:border-[#7b2cbf]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Сложность ИИ оппонента</label>
              <div className="grid grid-cols-3 gap-2">
                {(["Новичок ОЭЗ", "Прожжённый закупщик", "Гендиректор Алабуги"] as DifficultyLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setConfig({ ...config, difficulty: level })}
                    className={`py-2 px-1 rounded-lg text-xs font-medium border text-center transition-all ${
                      config.difficulty === level
                        ? "border-[#7b2cbf] bg-[#7b2cbf] text-white shadow-[0_0_10px_rgba(123,44,191,0.5)]"
                        : "border-[#282c3c] bg-[#0d0e12] text-slate-400 hover:text-white"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Context Details */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Вводная диспозиция сценария</label>
            <textarea
              rows={2}
              value={config.initialContext}
              onChange={(e) => setConfig({ ...config, initialContext: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#0d0e12] border border-[#282c3c] text-xs text-white focus:outline-none focus:border-[#7b2cbf]"
            />
          </div>

          {/* BATNA & Red lines section */}
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/10 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs tracking-wider uppercase">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Красные линии ОЭЗ (BATNA) — за нарушение Б.А.Р.С. выдаст предупреждение:
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Мин. ставка (₽/м²)</span>
                <input
                  type="number"
                  value={config.batna.minPricePerSqm}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      batna: { ...config.batna, minPricePerSqm: Number(e.target.value) },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0d0e12] border border-[#282c3c] text-xs text-white font-mono"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Макс. каникулы (мес)</span>
                <input
                  type="number"
                  value={config.batna.maxGracePeriodMonths}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      batna: { ...config.batna, maxGracePeriodMonths: Number(e.target.value) },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0d0e12] border border-[#282c3c] text-xs text-white font-mono"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Мин. рабочих мест</span>
                <input
                  type="number"
                  value={config.batna.minJobCreation}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      batna: { ...config.batna, minJobCreation: Number(e.target.value) },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0d0e12] border border-[#282c3c] text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Список безусловных табу:</span>
              <div className="space-y-1.5 mb-2">
                {config.batna.redLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/40 border border-rose-900/30 text-xs text-rose-200"
                  >
                    <span className="truncate">⛔ {line}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRedLine(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Добавить новую красную линию..."
                  value={newRedLine}
                  onChange={(e) => setNewRedLine(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddRedLine()}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#0d0e12] border border-[#282c3c] text-xs text-white focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={handleAddRedLine}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/30 border border-rose-500/50 text-rose-300 text-xs font-semibold hover:bg-rose-600/50 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Добавить
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-5 border-t border-[#232736]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#7b2cbf] hover:bg-[#9d4edd] text-white shadow-[0_0_20px_rgba(123,44,191,0.5)] transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#00f0ff]" />
            Применить и перезапустить сессию
          </button>
        </div>
      </div>
    </div>
  );
};
