import React, { useState } from "react";
import { AdminScenarioConfig } from "../types";
import { PRESET_SCENARIOS } from "../data/scenarios";
import {
  Sparkles,
  Play,
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
} from "lucide-react";

interface ScenarioConfiguratorScreenProps {
  onStartSimulation: (config: AdminScenarioConfig) => void;
}

export const ScenarioConfiguratorScreen: React.FC<ScenarioConfiguratorScreenProps> = ({
  onStartSimulation,
}) => {
  // Currently selected or customized config
  const [config, setConfig] = useState<AdminScenarioConfig>(PRESET_SCENARIOS[0]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_SCENARIOS[0].id);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  // Preset switch
  const handleSelectPreset = (preset: AdminScenarioConfig) => {
    setSelectedPresetId(preset.id);
    setConfig({ ...preset });
  };

  // Quick Sphere selector
  const handleSphereChange = (sphere: AdminScenarioConfig["sphere"]) => {
    // If there is a preset with this sphere, select it or adapt
    const matchingPreset = PRESET_SCENARIOS.find((p) => p.sphere === sphere);
    if (matchingPreset) {
      handleSelectPreset(matchingPreset);
    } else {
      setConfig((prev) => ({ ...prev, sphere }));
    }
  };

  // Generate new case via AI Studio
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
        setConfig(generated);
        setSelectedPresetId("custom_ai");
      } else {
        // AI fallback synthesis
        const randomizedToughness = Math.floor(65 + Math.random() * 30);
        setConfig({
          id: `ai_case_${Date.now()}`,
          title: `Генерация AI: Спецпроект «${config.sphere}»`,
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
          opponentPersonality: "Напористый, требует специальных условий, давит на статус стратегического партнера",
          personalityTone: config.personalityTone,
          hiddenGoal: "Получить нулевой тариф на логистику и скрыть дефицит оборотного капитала",
          opponentBatna: "Уход на менее подготовленную площадку в соседний регион",
          toughnessLevel: randomizedToughness,
          bluffTendency: 75,
          difficulty: randomizedToughness > 80 ? "Гендиректор Алабуги" : "Прожжённый закупщик",
          zoneCluster: "Индустриальный парк «Синергия»",
          initialContext: "Сгенерирован уникальный переговорный вызов: оппонент требует снижения цены на 40% и заморозки тарифов на 5 лет.",
          initialOpponentUtterance: "Приветствую. Ваши условия категорически не бьются с нашей моделью. Либо пересматриваем базовые цифры, либо контракт уходит в другой субъект.",
          initialBarsAdvice: "Внимание: оппонент пытается навязать деструктивный сценарий. Не соглашайся на уступки без взаимных встречных гарантий!",
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
              "Не опускать порог доходности контракта",
              "Встречные гарантии на каждый пункт уступок",
            ],
          },
        });
        setSelectedPresetId("custom_ai");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const dynamicSystemPrompt = `Ты — оппонент на «Арене переговоров» ОЭЗ «Алабуга».
Контекст встречи: ${config.sphere}
Твоя роль: ${config.opponentRole} (${config.opponentName}, ${config.opponentCompany})
Твой характер и стиль: ${config.personalityTone} (Уровень жесткости: ${config.toughnessLevel}/100, склонность к блефу: ${config.bluffTendency}/100)
Твоя скрытая цель: ${config.hiddenGoal}
Твоя альтернатива (BATNA оппонента): ${config.opponentBatna}

Красные линии игрока, которые он защищает:
${config.batna.redLines.map((r) => `• ${r}`).join("\n")}

Веди переговоры строго в рамках указанного характера. Не выходи из роли. Реагируй на давление и аргументы соответственно твоему психотипу.`;

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-[#0a0c12] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#202538]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7b2cbf]/30 via-[#240046]/40 to-[#00f0ff]/20 border border-[#7b2cbf]/60 flex items-center justify-center text-[#00f0ff] shadow-[0_0_25px_rgba(123,44,191,0.35)]">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-[#7b2cbf]/30 text-[#9d4edd] border border-[#7b2cbf]/40">
                  Алабуга AI Studio Arena
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 text-[#00f0ff] border border-cyan-500/30">
                  KMP / Gemini 3.8
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                КОНФИГУРАТОР ПЕРЕГОВОРНОЙ АРЕНЫ (ADMIN PANEL)
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Настройте психотип оппонента, красные линии BATNA или выберите готовый сценарий для демо жюри
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className="px-3 py-2 rounded-xl text-xs font-medium border border-[#232736] bg-[#12141e] hover:bg-[#1a1d29] text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Info className="w-4 h-4 text-[#00f0ff]" />
              {showPromptPreview ? "Скрыть Prompt LLM" : "Показать System Prompt"}
            </button>
            <button
              onClick={handleGenerateAICase}
              disabled={isGeneratingAI}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#7b2cbf]/60 bg-[#7b2cbf]/20 hover:bg-[#7b2cbf]/30 text-[#00f0ff] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(123,44,191,0.25)]"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingAI ? "animate-spin text-[#00f0ff]" : ""}`} />
              {isGeneratingAI ? "Генерация AI..." : "Сгенерировать через AI"}
            </button>
          </div>
        </div>

        {/* DEMO PRESETS BUTTONS (ДЛЯ ЖЮРИ НА ДЕМО - 2 СЕКУНДЫ) */}
        <div className="p-4 rounded-2xl bg-[#12141e] border border-[#232736] shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#00f0ff] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00f0ff]" />
              Готовые пресеты для демонстрации жюри (переключение в 1 клик):
            </label>
            <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
              Быстрый старт на защите проекта
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESET_SCENARIOS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? "border-[#00f0ff] bg-gradient-to-b from-[#00f0ff]/15 via-[#7b2cbf]/15 to-transparent text-white shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                      : "border-[#202538] bg-[#171a26]/70 text-slate-300 hover:border-slate-600 hover:bg-[#1c2030]"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#00f0ff] rounded-bl-lg shadow-[0_0_8px_#00f0ff]" />
                  )}
                  <div>
                    <div className="text-[10px] font-mono text-[#9d4edd] uppercase tracking-wider mb-1">
                      {preset.sphere}
                    </div>
                    <div className="text-xs font-bold text-white leading-tight">
                      «{preset.title}»
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {preset.opponentName} ({preset.opponentCompany})
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-mono">Жесткость: {preset.toughnessLevel}%</span>
                    <span
                      className={`font-semibold ${
                        preset.personalityTone.includes("Агрессивный")
                          ? "text-rose-400"
                          : preset.personalityTone.includes("Скрытный")
                          ? "text-amber-400"
                          : preset.personalityTone.includes("Эмоциональный")
                          ? "text-fuchsia-400"
                          : "text-blue-400"
                      }`}
                    >
                      {preset.personalityTone.split("/")[0].trim()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SYSTEM PROMPT DRAWER (ЕСЛИ ОТКРЫТ) */}
        {showPromptPreview && (
          <div className="p-4 rounded-2xl bg-[#0d0f17] border border-[#7b2cbf]/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#9d4edd]">
              <span className="flex items-center gap-1.5 font-bold">
                <Info className="w-4 h-4 text-[#00f0ff]" /> Сформированный системный промпт для Gemini 3.8 / KMP:
              </span>
              <span className="text-slate-500">Автоматическая склейка конфигуратора</span>
            </div>
            <pre className="p-3 rounded-xl bg-black/60 border border-[#202538] text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
              {dynamicSystemPrompt}
            </pre>
          </div>
        )}

        {/* 3 STEPS CONFIGURATION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* STEP 1: СФЕРА И ЦЕЛЕВАЯ АУДИТОРИЯ */}
          <div className="p-5 rounded-2xl bg-[#12141e] border border-[#232736] space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00f0ff] uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 flex items-center justify-center text-[10px]">
                1
              </span>
              Целевая аудитория / Сфера
            </div>

            <div className="space-y-2">
              {[
                { label: "B2B / Инвесторы ОЭЗ", icon: Building2, desc: "Переговоры с резидентами по аренде и мощностям" },
                { label: "Закупки и тендеры", icon: Briefcase, desc: "Торг с поставщиками оборудования и сырья" },
                { label: "HR / Наем топов", icon: UserCheck, desc: "Удержание ключевых инженеров и менторов Политеха" },
                { label: "Внутренний спор", icon: Scale, desc: "Согласование бюджетов и графиков капстроительства" },
              ].map((item) => {
                const isCurrent = config.sphere === item.label;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleSphereChange(item.label as any)}
                    className={`w-full p-3 rounded-xl text-left border transition-all flex items-start gap-3 ${
                      isCurrent
                        ? "border-[#7b2cbf] bg-[#7b2cbf]/20 text-white shadow-[0_0_15px_rgba(123,44,191,0.25)]"
                        : "border-[#202538] bg-[#171a26]/50 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isCurrent ? "bg-[#7b2cbf] text-white" : "bg-slate-800/80 text-slate-400"
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight flex items-center gap-2">
                        {item.label}
                        {isCurrent && <span className="text-[10px] text-[#00f0ff] font-mono">АКТИВНО</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#202538]">
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Кластер / Локация переговоров:
              </label>
              <input
                type="text"
                value={config.zoneCluster}
                onChange={(e) => setConfig({ ...config, zoneCluster: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171a26] border border-[#232736] text-xs text-white focus:outline-none focus:border-[#7b2cbf]"
              />
            </div>
          </div>

          {/* STEP 2: ПРОФИЛЬ СОБЕСЕДНИКА (AI PERSONA) */}
          <div className="p-5 rounded-2xl bg-[#12141e] border border-[#232736] space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00f0ff] uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 flex items-center justify-center text-[10px]">
                2
              </span>
              Профиль собеседника (AI Persona)
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Роль и статус оппонента:
                </label>
                <input
                  type="text"
                  value={config.opponentRole}
                  onChange={(e) => setConfig({ ...config, opponentRole: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#171a26] border border-[#232736] text-xs text-white focus:outline-none focus:border-[#7b2cbf]"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    type="text"
                    value={config.opponentName}
                    placeholder="ФИО оппонента"
                    onChange={(e) => setConfig({ ...config, opponentName: e.target.value })}
                    className="px-3 py-1.5 rounded-lg bg-[#171a26] border border-[#232736] text-xs text-white focus:outline-none focus:border-[#7b2cbf]"
                  />
                  <input
                    type="text"
                    value={config.opponentCompany}
                    placeholder="Организация"
                    onChange={(e) => setConfig({ ...config, opponentCompany: e.target.value })}
                    className="px-3 py-1.5 rounded-lg bg-[#171a26] border border-[#232736] text-xs text-white focus:outline-none focus:border-[#7b2cbf]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5">
                  Психотип и коммуникативный тон:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    "Агрессивный / Прессинг",
                    "Скрытный манипулятор",
                    "Бюрократ / Регламент",
                    "Эмоциональный / Шантаж",
                  ].map((tone) => {
                    const isSelected = config.personalityTone === tone;
                    return (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setConfig({ ...config, personalityTone: tone as any })}
                        className={`px-2.5 py-2 rounded-lg text-left text-[11px] font-medium border transition-all ${
                          isSelected
                            ? "border-[#7b2cbf] bg-[#7b2cbf]/30 text-white font-bold"
                            : "border-[#202538] bg-[#171a26] text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {tone}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Скрытая цель оппонента (pain / hidden agenda):
                </label>
                <textarea
                  rows={2}
                  value={config.hiddenGoal}
                  onChange={(e) => setConfig({ ...config, hiddenGoal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#171a26] border border-[#232736] text-xs text-white focus:outline-none focus:border-[#7b2cbf] resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Альтернатива оппонента (BATNA оппонента):
                </label>
                <input
                  type="text"
                  value={config.opponentBatna}
                  onChange={(e) => setConfig({ ...config, opponentBatna: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#171a26] border border-[#232736] text-xs text-white focus:outline-none focus:border-[#7b2cbf]"
                />
              </div>
            </div>
          </div>

          {/* STEP 3: ПАРАМЕТРЫ СЛОЖНОСТИ И КРАСНЫЕ ЛИНИИ (BATNA) */}
          <div className="p-5 rounded-2xl bg-[#12141e] border border-[#232736] space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00f0ff] uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 flex items-center justify-center text-[10px]">
                3
              </span>
              Параметры сложности и BATNA
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Уровень жесткости торга:</span>
                  <span className="font-mono font-bold text-[#00f0ff]">{config.toughnessLevel}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={config.toughnessLevel}
                  onChange={(e) => setConfig({ ...config, toughnessLevel: Number(e.target.value) })}
                  className="w-full accent-[#00f0ff] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Мягкий (30%)</span>
                  <span>Баланс (60%)</span>
                  <span>Бескомпромиссный (100%)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Склонность к блефу:</span>
                  <span className="font-mono font-bold text-[#9d4edd]">{config.bluffTendency}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={config.bluffTendency}
                  onChange={(e) => setConfig({ ...config, bluffTendency: Number(e.target.value) })}
                  className="w-full accent-[#9d4edd] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Редкий блеф</span>
                  <span>Активные угрозы конкурентами</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Красные линии игрока (BATNA Rules):</span>
                  <span className="text-[10px] text-emerald-400">{config.batna.redLines.length} правила</span>
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {config.batna.redLines.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#171a26] border border-[#202538] text-[11px] text-slate-300 flex items-start gap-2"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#00f0ff] shrink-0 mt-0.5" />
                      <span className="leading-snug">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#12141e] via-[#1a1c29] to-[#12141e] border border-[#232736] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                Сценарий готов к запуску: «{config.title}»
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  READY
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Оппонент: {config.opponentName} • Роль: {config.opponentRole} • Сложность: {config.toughnessLevel}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onStartSimulation(config)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#7b2cbf] to-[#00f0ff] text-white hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(0,240,255,0.4)]"
            >
              <Play className="w-4 h-4 fill-white" />
              ▶ ЗАПУСТИТЬ ТАКТИЧЕСКУЮ АРЕНУ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
