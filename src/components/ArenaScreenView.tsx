import React, { useState, useRef, useEffect } from "react";
import {
  Message,
  AdminScenarioConfig,
  NegotiationMetrics,
  BarsAnimationState,
  NegotiationAgenda,
} from "../types";
import { OpponentVideoWindow } from "./OpponentVideoWindow";
import {
  Send,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
  Award,
  Clock,
  ShieldCheck,
  ArrowLeft,
  X,
  Activity,
  Mic,
  ArrowDownRight,
} from "lucide-react";

interface ArenaScreenViewProps {
  config: AdminScenarioConfig;
  messages: Message[];
  metrics: NegotiationMetrics;
  agenda: NegotiationAgenda;
  barsFeedback: string;
  barsAnimation: BarsAnimationState;
  isLoading: boolean;
  isDealClosed: boolean;
  isDealFailed: boolean;
  timerSeconds: number;
  onSendMessage: (text: string) => void;
  onRollback: (step: number) => void;
  onOpenCaseInfo: () => void;
  onOpenAdmin: () => void;
  onOpenTimeTravel: () => void;
  onOpenDebriefing: () => void;
  onRestart: () => void;
  onOpenConfigurator: () => void;
}

export const ArenaScreenView: React.FC<ArenaScreenViewProps> = ({
  config,
  messages,
  metrics,
  agenda,
  barsFeedback,
  barsAnimation,
  isLoading,
  isDealClosed,
  isDealFailed,
  timerSeconds,
  onSendMessage,
  onRollback,
  onOpenCaseInfo,
  onOpenAdmin,
  onOpenTimeTravel,
  onOpenDebriefing,
  onRestart,
  onOpenConfigurator,
}) => {
  const [inputText, setInputText] = useState("");
  const [showTelemetrySheet, setShowTelemetrySheet] = useState(false);
  const [telemetryTab, setTelemetryTab] = useState<"metrics" | "batna" | "agenda">("metrics");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading || isDealClosed || isDealFailed) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const opponentInitials =
    config.opponentName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ОП";

  const getSuggestionChips = () => {
    if (config.id === "robotics_procurement") {
      return [
        { label: "Квоты линий", text: "Чжан Вэй, давайте начистоту: какова реальная загрузка шанхайской линии и почему вы избегаете ответственности за сроки?" },
        { label: "Штраф 0.2%/день", text: "ОЭЗ не может рисковать простоем цехов. Мы согласуем контракт только при наличии штрафа 0.2% за каждый день задержки ПНР." },
        { label: "Кадры Политеха", text: "Мы берем 40 роботов только с условием бесплатного сертифицированного курса для 50 студентов и инженеров «Алабуга Политех»." },
        { label: "Склад запчастей", text: "Обязательное условие резидентов — гарантийный склад критических сервоприводов и плат непосредственно на территории ОЭЗ." },
        { label: "30% постоплата", text: "Финальный транш 30% мы перечисляем строго после успешного 72-часового непрерывного стресс-теста роботов на линии." },
      ];
    }
    if (config.id === "retention_lead_engineer") {
      return [
        { label: "Вскрыть боль", text: "Артем, я понимаю твою усталость от ночных аварий. Дело только в деньгах или в том, что ты погряз в операционке вместо архитектуры?" },
        { label: "R&D Лидерство", text: "Мы отдаем тебе карт-бланш: ты возглавляешь разработку новой системы ИИ-диспетчеризации энергосетей ОЭЗ как технический лидер." },
        { label: "3 стажера Политеха", text: "Мы снимаем с тебя ночные дежурства: закрепляем за тобой 3 лучших выпускников «Алабуга Политех», чтобы они закрывали рутину." },
        { label: "Оклад +20% и KPI", text: "Мы поднимаем фиксированный оклад на 20% плюс закладываем квартальный бонус за ключевые вехи запуска SCADA." },
      ];
    }
    if (config.id === "internal_capex_dispute") {
      return [
        { label: "Страх проверки", text: "Михаил, мы ценим вашу щепетильность к ГОСТам. Скажите прямо: какой конкретный узел вызывает наибольшие опасения у технадзора?" },
        { label: "Независимый надзор", text: "Мы привлекаем аккредитованный независимый технадзор за счет фонда оптимизации, чтобы снять с вас единоличную ответственность." },
        { label: "Премия сменам", text: "Мы выделяем целевой фонд премирования подрядчикам за работу в 2 смены без нарушения технологических пауз бетонирования." },
      ];
    }
    return [
      { label: "Предложить 460 ₽", text: "Мы готовы зафиксировать базовую ставку 460 ₽/м² в обмен на резерв 250 рабочих мест через «Алабуга Политех»." },
      { label: "Каникулы до 4 мес", text: "12 месяцев каникул исключены регламентом ОЭЗ. Мы согласовываем 4 месяца с приоритетным допуском шеф-монтажа станков." },
      { label: "8 МВт под CAPEX 1.2 млрд", text: "Подвод 8 МВт мощности мы обеспечим в приоритетном порядке, но только под взаимное обязательство CAPEX не менее 1.2 млрд рублей." },
      { label: "Отразить Калугу", text: "В Калуге нет свободной подстанции 110 кВ на границе площадки, а у нас она уже введена в эксплуатацию и готова к подключению." },
      { label: "Закрепить протокол", text: "Если ключевые параметры ставки 460 ₽, каникул 4 месяца и CAPEX 1.2 млрд согласованы, предлагаю зафиксировать их в итоговом соглашении." },
    ];
  };

  const suggestionChips = getSuggestionChips();

  return (
    <div
      id="m3-scaffold"
      className="relative flex flex-col h-full w-full overflow-hidden bg-[#07080e] text-[#f8fafc] select-none font-sans"
    >
      {/* ========================================================================= */}
      {/* 1. AMBIENT RADIAL GLOW BACKGROUND SPHERES (Modern Apple / Awwwards UI)   */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="ambient-glow-spot w-[650px] h-[650px] -top-48 -left-48 bg-purple-600/20" />
        <div
          className="ambient-glow-spot w-[550px] h-[550px] top-[22%] -right-36 bg-cyan-500/15"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="ambient-glow-spot w-[500px] h-[500px] -bottom-36 left-[18%] bg-rose-600/12"
          style={{ animationDelay: "-9s" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-25" />
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP APP BAR                                                           */}
      {/* ========================================================================= */}
      <header
        id="m3-top-app-bar"
        className="sticky top-0 z-30 glass-panel px-3 sm:px-5 py-2 flex items-center justify-between min-h-[56px] shrink-0 border-b border-white/[0.08]"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Navigation Back Button */}
          <button
            id="m3-nav-back-button"
            onClick={onOpenConfigurator}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white glass-pill hover:bg-white/10 active:scale-95 transition-all shrink-0 cursor-pointer"
            title="Назад в Конфигуратор"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Opponent Avatar with Glowing Status */}
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-900 to-indigo-700 border border-cyan-400/50 flex items-center justify-center font-bold text-white text-xs shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              {opponentInitials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-[#07080e] shadow-[0_0_8px_#00f0ff] animate-pulse" />
          </div>

          {/* Title & Context */}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-white truncate max-w-[160px] sm:max-w-[280px]">
                {config.opponentName}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 font-medium whitespace-nowrap hidden xs:inline-block">
                {config.personalityTone.split("/")[0].trim()}
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-sans truncate">
              {config.opponentRole} • <span className="text-slate-300">{config.opponentCompany}</span>
            </div>
          </div>
        </div>

        {/* Actions Row (Cleaned up: No redundant buttons) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Telemetry Badge Button (Mobile and Quick Glance) */}
          <button
            id="m3-telemetry-badge-button"
            onClick={() => setShowTelemetrySheet(true)}
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full glass-pill hover:bg-white/10 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Открыть полную телеметрию"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-cyan-300 font-mono">{metrics.trust}%</span>
          </button>

          {/* Case Disposition Trigger */}
          <button
            id="m3-info-button"
            onClick={onOpenCaseInfo}
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white glass-pill hover:bg-white/10 active:scale-95 transition-all"
            title="Диспозиция кейса"
          >
            <Info className="w-4 h-4 text-purple-300" />
          </button>

          {/* Desktop Direct Actions */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={onOpenTimeTravel}
              className="h-9 px-3 rounded-full glass-pill hover:bg-white/10 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="Машина времени (Откат)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Откат</span>
            </button>

            <button
              onClick={onOpenDebriefing}
              className="h-9 px-3 rounded-full glass-pill hover:bg-white/10 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="Итоговый дебрифинг"
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Дебрифинг</span>
            </button>

            <button
              onClick={onOpenConfigurator}
              className="h-9 px-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(123,44,191,0.4)] cursor-pointer"
              title="Конфигуратор"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-300" />
              <span>Кейсы</span>
            </button>
          </div>

          {/* Timer Display */}
          <div className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full glass-pill border border-cyan-500/30 flex items-center gap-1.5 text-xs font-mono text-cyan-300">
            <Clock className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MAIN ARENA VIEWPORT (Strict 2-Column: Video Call + Chat | Telemetry)   */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 min-h-0 overflow-hidden">
        {/* ================= LEFT / MAIN COLUMN (~70%): VIDEO CALL & DIALOGUE ================= */}
        <section className="lg:col-span-8 xl:col-span-8 flex flex-col h-full min-h-0 overflow-hidden glass-panel rounded-3xl border border-white/[0.08]">
          {/* 3D СОБЕСЕДНИК НАПРОТИВ (Интерактивное окно видеосвязи) */}
          <div className="p-2 sm:p-3 pb-0 shrink-0">
            <OpponentVideoWindow
              config={config}
              metrics={metrics}
              barsAnimation={barsAnimation}
              isLoading={isLoading}
              isDealClosed={isDealClosed}
              isDealFailed={isDealFailed}
            />
          </div>

          {/* СТЕНОГРАММА / СУБТИТРЫ ПЕРЕГОВОРОВ (Чат диалога) */}
          <div
            id="m3-chat-list"
            className="flex-1 px-3 sm:px-4 py-3 min-h-0 overflow-y-auto space-y-3 flex flex-col"
          >
            {messages.map((msg) => {
              const isUser = msg.actor === "USER";
              const isBars = msg.actor === "BARS";

              // B.A.R.S. Tactical Whisper (Sleek, unobtrusive coaching note)
              if (isBars) {
                return (
                  <div
                    key={msg.id}
                    className="animate-message-in my-1 w-full flex justify-center"
                  >
                    <div className="max-w-[92%] px-3.5 py-2.5 rounded-2xl bg-[#14162a]/90 border border-cyan-500/30 backdrop-blur-md flex items-start gap-2.5 text-xs text-slate-200 shadow-md">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-mono text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
                            Совет наставника Б.А.Р.С.
                          </span>
                        </div>
                        <p className="font-sans text-slate-200 leading-relaxed text-[11px] sm:text-xs">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              // Human-to-Opponent Negotiation Dialogue
              return (
                <div
                  key={msg.id}
                  className={`animate-message-in flex flex-col group ${isUser ? "items-end" : "items-start"}`}
                >
                  {/* Sender Label */}
                  <div
                    className={`text-[11px] font-medium mb-1 px-1 flex items-center gap-1.5 ${
                      isUser ? "text-cyan-300" : "text-slate-400"
                    }`}
                  >
                    <span>{isUser ? "Вы (ОЭЗ «Алабуга»)" : config.opponentName}</span>
                    {!isUser && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/5 border border-white/10 text-slate-400">
                        {config.opponentCompany}
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-3 sm:p-3.5 rounded-3xl text-xs sm:text-sm leading-relaxed max-w-[90%] sm:max-w-[85%] transition-all ${
                      isUser
                        ? "bg-gradient-to-br from-indigo-600/90 via-purple-700/90 to-purple-900/90 text-white rounded-tr-xs border border-cyan-400/30 shadow-[0_6px_25px_rgba(99,102,241,0.25)] backdrop-blur-md"
                        : "bg-[#141624]/90 text-slate-100 rounded-tl-xs border border-white/[0.09] shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md"
                    }`}
                  >
                    <p className="font-sans whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              );
            })}

            {/* Live Typing State */}
            {isLoading && (
              <div className="animate-message-in flex items-center gap-2.5 p-3 rounded-2xl glass-panel text-slate-300 text-xs w-fit border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-mono text-cyan-300">{config.opponentName} обдумывает ответ...</span>
              </div>
            )}

            {/* Deal Outcome Banners */}
            {isDealClosed && (
              <div className="animate-message-in p-5 rounded-3xl bg-gradient-to-b from-emerald-950/80 to-[#071d15]/90 border border-emerald-400/50 text-center space-y-2.5 shadow-[0_0_40px_rgba(16,185,129,0.3)] my-2 backdrop-blur-xl">
                <CheckCircle2 className="w-9 h-9 text-emerald-400 mx-auto animate-bounce" />
                <div className="text-base font-bold text-emerald-200 uppercase tracking-wide">
                  Сделка успешно согласована!
                </div>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Вы защитили экономические интересы ОЭЗ «Алабуга», удержали ключевые показатели и закрыли партнерство.
                </p>
                <button
                  onClick={onOpenDebriefing}
                  className="mt-2 h-9 px-6 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer"
                >
                  Открыть итоговый дебрифинг
                </button>
              </div>
            )}

            {isDealFailed && (
              <div className="animate-message-in p-5 rounded-3xl bg-gradient-to-b from-rose-950/80 to-[#200910]/90 border border-rose-500/50 text-center space-y-2.5 shadow-[0_0_40px_rgba(244,63,94,0.3)] my-2 backdrop-blur-xl">
                <AlertTriangle className="w-9 h-9 text-rose-400 mx-auto animate-pulse" />
                <div className="text-base font-bold text-rose-200 uppercase tracking-wide">
                  Переговоры зашли в тупик
                </div>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Оппонент прервал диалог из-за превышения порога жесткости или срыва критических условий.
                </p>
                <button
                  onClick={onOpenTimeTravel}
                  className="mt-2 h-9 px-6 rounded-full bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs active:scale-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.5)] flex items-center gap-1.5 mx-auto cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-300" />
                  <span>Откатить ход назад</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* BOTTOM CONTROLS & INPUT DOCK */}
          <footer
            id="m3-bottom-bar"
            className="sticky bottom-0 z-20 glass-panel-elevated border-t border-white/[0.08] p-3 pb-safe shrink-0 shadow-2xl"
          >
            {/* Тонкая плашка подсказки Б.А.Р.С. прямо над вводом (Без визуального мусора) */}
            {barsFeedback && barsFeedback !== "Ожидаем реплику оппонента..." && !isDealClosed && !isDealFailed && (
              <div className="mb-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-[10px] font-mono font-bold text-cyan-300 shrink-0 uppercase">
                    Совет наставника:
                  </span>
                  <span className="text-slate-200 truncate">{barsFeedback}</span>
                </div>
                <button
                  onClick={() => setInputText(barsFeedback)}
                  className="text-[10px] font-medium text-cyan-300 hover:text-white shrink-0 px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Подставить совет в поле ввода"
                >
                  <span>Вставить</span>
                  <ArrowDownRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Быстрые переговорные чипсы */}
            {!isDealClosed && !isDealFailed && (
              <div
                id="m3-suggestion-chips-row"
                className="overflow-x-auto flex items-center gap-2 pb-2.5 scrollbar-none"
              >
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputText(chip.text)}
                    className="shrink-0 h-7 sm:h-8 px-3 rounded-full glass-pill hover:bg-white/10 active:bg-white/15 text-slate-200 hover:text-white text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap active:scale-95 shadow-sm flex items-center gap-1.5 border border-white/10 hover:border-cyan-400/40 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="m3-outlined-text-field"
                  type="text"
                  placeholder={
                    isDealClosed || isDealFailed
                      ? "Раунд переговоров завершен"
                      : "Введите аргумент или предложение по условиям..."
                  }
                  disabled={isLoading || isDealClosed || isDealFailed}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="w-full h-11 sm:h-12 px-4 rounded-full bg-[#0c0e18]/80 border border-white/15 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-xs sm:text-sm text-white placeholder-slate-400 transition-all outline-none disabled:opacity-50 shadow-inner"
                />
              </div>

              {/* Quick Prompt Mic Hint */}
              <button
                type="button"
                onClick={() => {
                  const rnd = suggestionChips[Math.floor(Math.random() * suggestionChips.length)].text;
                  setInputText(rnd);
                }}
                disabled={isLoading || isDealClosed || isDealFailed}
                className="w-11 sm:w-12 h-11 sm:h-12 rounded-full glass-pill hover:bg-white/15 text-slate-300 hover:text-cyan-300 flex items-center justify-center shrink-0 active:scale-95 transition-all border border-white/10 cursor-pointer"
                title="Подставить реплику"
              >
                <Mic className="w-4 sm:w-5 h-4 sm:h-5 text-cyan-400" />
              </button>

              {/* Send Button */}
              <button
                id="m3-filled-icon-button"
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading || isDealClosed || isDealFailed}
                className="w-11 sm:w-12 h-11 sm:h-12 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 active:scale-95 disabled:opacity-35 text-slate-950 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all cursor-pointer disabled:cursor-not-allowed font-bold"
                title="Отправить аргумент"
              >
                <Send className="w-4 sm:w-5 h-4 sm:h-5 text-slate-950" />
              </button>
            </div>
          </footer>
        </section>

        {/* ================= RIGHT COLUMN (~30%): ТАКТИЧЕСКИЙ ЦЕНТР И BATNA ================= */}
        <aside className="hidden lg:flex lg:col-span-4 xl:col-span-4 flex-col glass-panel rounded-3xl p-4 space-y-4 overflow-y-auto min-h-0 border border-white/[0.08] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-pulse" />
              <h2 className="text-xs font-bold tracking-wider text-white font-mono uppercase">
                ТАКТИЧЕСКИЙ ЦЕНТР
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
              HUD LIVE
            </span>
          </div>

          {/* Индикаторы встречи (Телеметрия с неоновыми шкалами) */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-3.5 shadow-inner">
            <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              Индикаторы встречи
            </div>

            {/* Trust Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Доверие оппонента:</span>
                <span className="text-cyan-300 font-bold font-mono">{metrics.trust}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-[1px] border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 transition-all duration-500 shadow-[0_0_8px_#00f0ff]"
                  style={{ width: `${metrics.trust}%` }}
                />
              </div>
            </div>

            {/* Tension Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Напряжение / Стресс:</span>
                <span className="text-rose-400 font-bold font-mono">{metrics.tension}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-[1px] border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 transition-all duration-500 shadow-[0_0_8px_#ff3366]"
                  style={{ width: `${metrics.tension}%` }}
                />
              </div>
            </div>

            {/* Deal Readiness */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Готовность к сделке:</span>
                <span className="text-emerald-300 font-bold font-mono">{metrics.deal_readiness}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-[1px] border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-green-300 transition-all duration-500 shadow-[0_0_8px_#10b981]"
                  style={{ width: `${metrics.deal_readiness}%` }}
                />
              </div>
            </div>
          </div>

          {/* Красные линии BATNA (Шпаргалка переговорщика) */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Красные линии (BATNA)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-mono">
                ОЭЗ
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] text-slate-400 block font-mono">МИН. СТАВКА:</span>
                <span className="font-bold text-white text-sm">{config.batna.minPricePerSqm} ₽/м²</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] text-slate-400 block font-mono">МАКС. КАНИКУЛЫ:</span>
                <span className="font-bold text-white text-sm">{config.batna.maxGracePeriodMonths} мес.</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/[0.06] text-xs">
              {config.batna.redLines.map((line, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300 text-[11px]">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Повестка встречи (Agenda Checklist) */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2.5 shadow-inner">
            <div className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Повестка встречи:
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <span className="text-slate-200">Ставка: 460 ₽/м²</span>
                <span className={agenda.rate.status === "agreed" ? "text-cyan-300 font-bold" : "text-amber-400"}>
                  {agenda.rate.status === "agreed" ? "✓ Согласовано" : "В процессе"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <span className="text-slate-200">Каникулы: 4 мес.</span>
                <span className={agenda.grace_period.status === "agreed" ? "text-cyan-300 font-bold" : "text-amber-400"}>
                  {agenda.grace_period.status === "agreed" ? "✓ Согласовано" : "В процессе"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <span className="text-slate-200">Сети под CAPEX 1.2 млрд</span>
                <span className={agenda.power_capex.status === "agreed" ? "text-cyan-300 font-bold" : "text-amber-400"}>
                  {agenda.power_capex.status === "agreed" ? "✓ Согласовано" : "В процессе"}
                </span>
              </div>
            </div>
          </div>

          {/* Компактный тактический модуль Б.А.Р.С. */}
          {barsFeedback && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-purple-950/30 to-slate-900/60 border border-cyan-500/30 space-y-2 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5 font-mono uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Тактический совет Б.А.Р.С.
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
                «{barsFeedback}»
              </p>
            </div>
          )}
        </aside>
      </main>

      {/* ========================================================================= */}
      {/* 4. TELEMETRY DIALOG MODAL (On-Demand / Mobile)                            */}
      {/* ========================================================================= */}
      {showTelemetrySheet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowTelemetrySheet(false)}
        >
          <div
            id="m3-telemetry-dialog"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl mx-auto rounded-3xl glass-panel-elevated p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-white/15"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Телеметрия встречи</h3>
                <p className="text-xs text-slate-400">Кейс: {config.title}</p>
              </div>
              <button
                onClick={() => setShowTelemetrySheet(false)}
                className="w-9 h-9 rounded-full glass-pill hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Закрыть окно"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-full bg-black/50 border border-white/10">
              <button
                onClick={() => setTelemetryTab("metrics")}
                className={`py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  telemetryTab === "metrics"
                    ? "bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Метрики
              </button>
              <button
                onClick={() => setTelemetryTab("batna")}
                className={`py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  telemetryTab === "batna"
                    ? "bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                BATNA
              </button>
              <button
                onClick={() => setTelemetryTab("agenda")}
                className={`py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  telemetryTab === "agenda"
                    ? "bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Повестка
              </button>
            </div>

            {/* Content */}
            {telemetryTab === "metrics" && (
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Доверие оппонента</span>
                    <span className="text-cyan-300 font-bold font-mono">{metrics.trust}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-white/10 p-[1px]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500 shadow-[0_0_10px_#00f0ff]"
                      style={{ width: `${metrics.trust}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Стресс / Напряжение</span>
                    <span className="text-rose-400 font-bold font-mono">{metrics.tension}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-white/10 p-[1px]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-600 transition-all duration-500 shadow-[0_0_10px_#ff3366]"
                      style={{ width: `${metrics.tension}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Готовность к сделке</span>
                    <span className="text-emerald-300 font-bold font-mono">{metrics.deal_readiness}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-white/10 p-[1px]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 to-green-300 transition-all duration-500 shadow-[0_0_10px_#10b981]"
                      style={{ width: `${metrics.deal_readiness}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {telemetryTab === "batna" && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-slate-400 block font-mono">МИНИМАЛЬНАЯ СТАВКА</span>
                    <span className="text-base font-bold text-white font-mono">{config.batna.minPricePerSqm} ₽/м²</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-slate-400 block font-mono">МАКС. КАНИКУЛЫ</span>
                    <span className="text-base font-bold text-white font-mono">{config.batna.maxGracePeriodMonths} мес.</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-xs font-semibold text-rose-400">Красные линии ОЭЗ (Табу):</div>
                  {config.batna.redLines.map((line, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-200 flex items-start gap-2">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {telemetryTab === "agenda" && (
              <div className="space-y-2.5 pt-1 text-xs">
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <span className="text-slate-300">Ставка: 460 ₽/м²</span>
                  <span className={agenda.rate.status === "agreed" ? "text-cyan-300 font-bold" : "text-amber-400"}>
                    {agenda.rate.status === "agreed" ? "✓ Согласовано" : "В процессе"}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <span className="text-slate-300">Каникулы: 4 мес.</span>
                  <span className={agenda.grace_period.status === "agreed" ? "text-cyan-300 font-bold" : "text-amber-400"}>
                    {agenda.grace_period.status === "agreed" ? "✓ Согласовано" : "В процессе"}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <span className="text-slate-300">Сети под CAPEX 1.2 млрд</span>
                  <span className={agenda.power_capex.status === "agreed" ? "text-cyan-300 font-bold" : "text-amber-400"}>
                    {agenda.power_capex.status === "agreed" ? "✓ Согласовано" : "В процессе"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
