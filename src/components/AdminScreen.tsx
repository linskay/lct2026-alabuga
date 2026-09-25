import React, { useState } from "react";
import { AdminScenarioConfig } from "../types";
import { PRESET_SCENARIOS } from "../data/scenarios";
import {
  Sparkles,
  Sliders,
  Shield,
  Briefcase,
  UserCheck,
  Building2,
  Users,
  Scale,
  Flame,
  Zap,
  Info,
  ChevronRight,
  ArrowLeft,
  Play,
} from "lucide-react";

interface AdminScreenProps {
  currentConfig?: AdminScenarioConfig;
  onBackToHome: () => void;
  onStartSimulation: (config: AdminScenarioConfig) => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  currentConfig,
  onBackToHome,
  onStartSimulation,
}) => {
  const [config, setConfig] = useState<AdminScenarioConfig>(
    currentConfig || PRESET_SCENARIOS[0]
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    currentConfig?.id || PRESET_SCENARIOS[0].id
  );
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  const handleSelectPreset = (preset: AdminScenarioConfig) => {
    setSelectedPresetId(preset.id);
    setConfig({ ...preset });
  };

  const handleSphereChange = (sphere: AdminScenarioConfig["sphere"]) => {
    const matchingPreset = PRESET_SCENARIOS.find((p) => p.sphere === sphere);
    if (matchingPreset) {
      handleSelectPreset(matchingPreset);
    } else {
      setConfig((prev) => ({ ...prev, sphere }));
    }
  };

  const handleGenerateAICase = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch("/api/generate-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sphere: config.sphere,
          personalityTone: config.personalityTone,
          toughnessLevel: config.toughnessLevel,
        }),
      });

      if (response.ok) {
        const generated = await response.json();
        setConfig((prev) => ({
          ...prev,
          ...generated,
          id: `custom_ai_${Date.now()}`,
        }));
        setSelectedPresetId("custom_ai");
        return;
      }

      // Fallback
      const randomizedToughness = Math.min(
        100,
        Math.max(40, config.toughnessLevel + Math.floor(Math.random() * 20 - 10))
      );
      setConfig({
        id: `custom_ai_${Date.now()}`,
        title: `AI Кейс: ${config.sphere}`,
        name: `AI Кейс: ${config.sphere}`,
        sphere: config.sphere,

        opponentRole:
          config.sphere === "B2B / Инвесторы ОЭЗ"
            ? "Генеральный директор агрохолдинга"
            : config.sphere === "Закупки и тендеры"
            ? "Коммерческий директор поставщика металлопроката"
            : config.sphere === "HR / Наем топов"
            ? "Главный технолог композитного производства"
            : "Руководитель смежного дивизиона ОЭЗ",
        opponentName: "Виктор Баранов",
        opponentCompany: "ЗАО «ПромСтройТорг»",
        opponentPersonality:
          "Напористый, требует специальных условий, давит на статус стратегического партнера",
        personalityTone: config.personalityTone,
        hiddenGoal:
          "Получить нулевой тариф на логистику и скрыть дефицит оборотного капитала",
        opponentBatna:
          "Уход на менее подготовленную площадку в соседний регион",
        toughnessLevel: randomizedToughness,
        bluffTendency: 75,
        difficulty:
          randomizedToughness > 80
            ? "Гендиректор Алабуги"
            : "Прожжённый закупщик",
        zoneCluster: "Индустриальный парк «Синергия»",
        initialContext:
          "Сгенерирован уникальный переговорный вызов: оппонент требует снижения цены на 40% и заморозки тарифов на 5 лет.",
        initialOpponentUtterance:
          "Приветствую. Ваши условия категорически не бьются с нашей моделью. Либо пересматриваем базовые цифры, либо контракт уходит в другой субъект.",
        initialBarsAdvice:
          "Внимание: оппонент пытается навязать деструктивный сценарий. Не соглашайся на уступки без взаимных встречных гарантий!",
        targetKpis: [
          "Отстоять рентабельность контракта ОЭЗ",
          "Зафиксировать обязательства по объемам",
          "Исключить односторонние риски",
        ],
        batna: {
          minPricePerSqm: 460,
          maxGracePeriodMonths: 4,
          taxHolidayYears: 10,
          minJobCreation: 150,
          minCapexMillionRub: 800,
          redLines: [
            "Не опускать порог доходности контракта (от 460 ₽/м²)",
            "Встречные гарантии на каждый пункт уступок",
            "Каникулы на пусконаладку не более 4 месяцев",
          ],
        },
      });
      setSelectedPresetId("custom_ai");
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const dynamicSystemPrompt = `ТЫ — ПЕРЕГОВОРНЫЙ СИМУЛЯТОР ДЛЯ СЦЕНАРИЯ:
- Роль оппонента: ${config.opponentName}, ${config.opponentRole} (${config.opponentCompany})
- Контекст сделки: ${config.initialContext || config.sphere}
- Психотип: ${config.personalityTone} | Уровень жесткости: ${Math.round(
    (config.toughnessLevel / 100) * 10
  )}/10 | Склонность к блефу: ${config.bluffTendency}%
- Скрытая цель оппонента: ${config.hiddenGoal}
- Альтернатива оппонента: ${config.opponentBatna}

КРАСНЫЕ ЛИНИИ ИГРОКА (BATNA), КОТОРЫЕ ОН ОБЯЗАН ЗАЩИТИТЬ:
${config.batna.redLines.map((r, idx) => `${idx + 1}. ${r}`).join("\n")}

ПРАВИЛА ЛОГИЧЕСКОГО АНАЛИЗА РЕПЛИК:
1. Отрицания игрока («не согласен», «не подписываем», «460 ₽/м² фиксированно») — удержание позиции.
2. Не уступать без встречного давления.`;

  return (
    <div className="relative min-h-screen w-full bg-[#07080D] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 select-none">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="ambient-glow-spot w-[600px] h-[600px] -top-40 -left-40 bg-purple-600/20" />
        <div
          className="ambient-glow-spot w-[500px] h-[500px] top-[30%] -right-40 bg-cyan-500/18"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="ambient-glow-spot w-[450px] h-[450px] -bottom-32 left-[25%] bg-indigo-600/15"
          style={{ animationDelay: "-10s" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-30" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full space-y-6">
        {/* TOP HEADER WITH BACK BUTTON */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#202538]">
          <div className="flex items-center gap-3.5">
            {/* КНОПКА НАЗАД НА ГЛАВНУЮ */}
            <button
              onClick={onBackToHome}
              className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white transition-all flex items-center gap-2 text-xs font-semibold shadow-sm hover:border-[#7b2cbf]/50"
            >
              <ArrowLeft className="w-4 h-4 text-[#00f0ff]" />
              <span>Назад на главную</span>
            </button>

            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-br from-[#7b2cbf]/30 via-[#240046]/40 to-[#00f0ff]/20 border border-[#7b2cbf]/60 items-center justify-center text-[#00f0ff] shadow-[0_0_20px_rgba(123,44,191,0.35)]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-[#7b2cbf]/30 text-[#9d4edd] border border-[#7b2cbf]/40">
                  ОЭЗ «Алабуга»
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 text-[#00f0ff] border border-cyan-500/30">
                  Admin Panel
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-0.5">
                КОНФИГУРАТОР ПЕРЕГОВОРНОЙ АРЕНЫ
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className="px-3 py-2 rounded-xl text-xs font-medium border border-[#232736] bg-[#12141e] hover:bg-[#1a1d29] text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Info className="w-4 h-4 text-[#00f0ff]" />
              {showPromptPreview ? "Скрыть Prompt" : "System Prompt"}
            </button>
            <button
              onClick={handleGenerateAICase}
              disabled={isGeneratingAI}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#7b2cbf]/60 bg-[#7b2cbf]/20 hover:bg-[#7b2cbf]/30 text-[#00f0ff] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(123,44,191,0.25)]"
            >
              <Sparkles
                className={`w-4 h-4 ${
                  isGeneratingAI ? "animate-spin text-[#00f0ff]" : ""
                }`}
              />
              {isGeneratingAI ? "Генерация AI..." : "Сгенерировать AI"}
            </button>
          </div>
        </div>

        {/* DEMO PRESETS BUTTONS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-200">
                Готовые сценарии ОЭЗ «Алабуга»
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Нажмите для быстрой смены параметров кейса
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESET_SCENARIOS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3.5 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? "bg-gradient-to-b from-[#7b2cbf]/30 to-[#121526] border-[#7b2cbf] shadow-[0_0_25px_rgba(123,44,191,0.35)]"
                      : "bg-[#0d101a]/80 border-[#1c2235] hover:border-slate-600 hover:bg-[#121522]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-mono text-[#00f0ff] px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30">
                        {preset.difficulty}
                      </span>
                      <span className="text-slate-400">{preset.sphere.split(" / ")[0]}</span>
                    </div>
                    <h3 className="font-bold text-sm text-white line-clamp-1">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {preset.opponentName} ({preset.opponentRole})
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Сложность:</span>
                    <span className="font-bold text-amber-400">{preset.toughnessLevel}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PROMPT PREVIEW MODAL / BLOCK */}
        {showPromptPreview && (
          <div className="p-4 rounded-2xl border border-cyan-500/30 bg-[#0c121d]/90 backdrop-blur-md space-y-2 font-mono text-xs text-cyan-200">
            <div className="flex items-center justify-between text-cyan-400 pb-2 border-b border-cyan-500/20">
              <span className="font-bold">SYSTEM PROMPT ДЛЯ GEMINI 2.5 FLASH / OPENROUTER:</span>
              <span className="text-[10px] text-slate-400">Чистый Kotlin / KMP совместим</span>
            </div>
            <pre className="whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed text-[11px] text-slate-300">
              {dynamicSystemPrompt}
            </pre>
          </div>
        )}

        {/* MAIN CONFIGURATION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COL 1: Сфера и Оппонент */}
          <div className="space-y-5 bg-[#0d101a]/90 border border-[#1c2235] p-5 rounded-3xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-[#1c2235] pb-3">
              <Briefcase className="w-4 h-4 text-[#00f0ff]" />
              <span>1. Сфера и Личность оппонента</span>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                Тематический трек переговоров
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  "B2B / Инвесторы ОЭЗ",
                  "Закупки и тендеры",
                  "HR / Наем топов",
                  "Внутренние конфликты",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSphereChange(s as any)}
                    className={`px-2.5 py-2 text-[11px] rounded-xl text-center border font-medium transition-all ${
                      config.sphere === s
                        ? "bg-[#7b2cbf]/30 border-[#7b2cbf] text-white shadow-sm"
                        : "bg-[#121522] border-[#22283a] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs text-slate-400 block mb-1">ФИО Оппонента</label>
                <input
                  type="text"
                  value={config.opponentName}
                  onChange={(e) => setConfig({ ...config, opponentName: e.target.value })}
                  className="w-full bg-[#121522] border border-[#22283a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Должность и Компания</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={config.opponentRole}
                    onChange={(e) => setConfig({ ...config, opponentRole: e.target.value })}
                    className="bg-[#121522] border border-[#22283a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                    placeholder="Должность"
                  />
                  <input
                    type="text"
                    value={config.opponentCompany}
                    onChange={(e) => setConfig({ ...config, opponentCompany: e.target.value })}
                    className="bg-[#121522] border border-[#22283a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                    placeholder="Компания"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Скрытая цель оппонента</label>
                <textarea
                  rows={2}
                  value={config.hiddenGoal}
                  onChange={(e) => setConfig({ ...config, hiddenGoal: e.target.value })}
                  className="w-full bg-[#121522] border border-[#22283a] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            </div>
          </div>

          {/* COL 2: Психотип и Жесткость */}
          <div className="space-y-5 bg-[#0d101a]/90 border border-[#1c2235] p-5 rounded-3xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-[#1c2235] pb-3">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>2. Психотип и Прессинг</span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-slate-300 font-medium">Жесткость оппонента</label>
                <span className="text-xs font-mono font-bold text-rose-400">
                  {config.toughnessLevel}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={config.toughnessLevel}
                onChange={(e) =>
                  setConfig({ ...config, toughnessLevel: parseInt(e.target.value, 10) })
                }
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-slate-300 font-medium">Склонность к блефу</label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {config.bluffTendency}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.bluffTendency}
                onChange={(e) =>
                  setConfig({ ...config, bluffTendency: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Психологический тон</label>
              <textarea
                rows={2}
                value={config.personalityTone}
                onChange={(e) => setConfig({ ...config, personalityTone: e.target.value })}
                className="w-full bg-[#121522] border border-[#22283a] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Альтернатива (BATNA оппонента)</label>
              <input
                type="text"
                value={config.opponentBatna}
                onChange={(e) => setConfig({ ...config, opponentBatna: e.target.value })}
                className="w-full bg-[#121522] border border-[#22283a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {/* COL 3: BATNA ОЭЗ и Красные Линии */}
          <div className="space-y-5 bg-[#0d101a]/90 border border-[#1c2235] p-5 rounded-3xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-[#1c2235] pb-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>3. Защита BATNA ОЭЗ «Алабуга»</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Мин. ставка (₽/м²)
                </label>
                <input
                  type="number"
                  value={config.batna.minPricePerSqm}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      batna: { ...config.batna, minPricePerSqm: parseInt(e.target.value, 10) || 0 },
                    })
                  }
                  className="w-full bg-[#121522] border border-[#22283a] rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Макс. каникулы (мес)
                </label>
                <input
                  type="number"
                  value={config.batna.maxGracePeriodMonths}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      batna: {
                        ...config.batna,
                        maxGracePeriodMonths: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                  className="w-full bg-[#121522] border border-[#22283a] rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-2 font-medium">
                Красные линии ОЭЗ (не нарушать):
              </label>
              <div className="space-y-2">
                {config.batna.redLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#121522] border border-[#22283a] text-xs text-slate-200 flex items-start gap-2"
                  >
                    <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      !
                    </span>
                    <input
                      type="text"
                      value={line}
                      onChange={(e) => {
                        const next = [...config.batna.redLines];
                        next[idx] = e.target.value;
                        setConfig({ ...config, batna: { ...config.batna, redLines: next } });
                      }}
                      className="w-full bg-transparent text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onStartSimulation(config)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#7b2cbf] to-[#00f0ff] text-slate-950 font-bold text-sm tracking-wide uppercase hover:opacity-95 transition-all shadow-[0_0_30px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>Запустить симуляцию с этим кейсом</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
