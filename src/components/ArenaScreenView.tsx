import React, { useState, useRef, useEffect } from "react";
import {
  Message,
  AdminScenarioConfig,
  NegotiationMetrics,
  BarsAnimationState,
  NegotiationAgenda,
} from "../types";
import { BarsAvatar } from "./BarsAvatar";
import {
  Send,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
  Award,
  Clock,
  ShieldCheck,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  X,
  Activity,
  Mic,
  SlidersHorizontal,
  Check,
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
  const [isBarsHudExpanded, setIsBarsHudExpanded] = useState(false);

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

  // Dynamic SuggestionChips tailored to selected case (Material 3 SuggestionChips)
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
    // Synergy tenant
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
      className="flex flex-col h-full w-full overflow-hidden bg-[#141218] text-[#e6e0e9] select-none font-sans"
    >
      {/* ========================================================================= */}
      {/* 1. M3 TOPAPPBAR (Compact, Tonal SurfaceContainer, 8dp Grid)              */}
      {/* ========================================================================= */}
      <header
        id="m3-top-app-bar"
        className="sticky top-0 z-30 bg-[#211f26] border-b border-[#49454f]/30 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between min-h-[56px] shrink-0 shadow-sm"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Navigation Icon [<-] */}
          <button
            id="m3-nav-back-button"
            onClick={onOpenConfigurator}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#cac4d0] hover:text-[#d0bcff] hover:bg-[#36343b]/60 active:bg-[#49454f] transition-all shrink-0"
            title="Назад в Конфигуратор"
          >
            <ArrowLeft className="w-5 h-5 text-[#d0bcff]" />
          </button>

          {/* Opponent Avatar with Online Indicator */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#4f378b]/40 border border-[#d0bcff]/40 flex items-center justify-center font-bold text-[#d0bcff] text-xs shadow-inner">
              {opponentInitials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00f0ff] border-2 border-[#211f26] shadow-[0_0_6px_#00f0ff]" />
          </div>

          {/* Title & Subtitle Column */}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-semibold text-[#e6e0e9] truncate max-w-[150px] sm:max-w-[260px]">
                {config.opponentName}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4f378b]/30 text-[#d0bcff] border border-[#d0bcff]/20 font-medium whitespace-nowrap hidden xs:inline-block">
                {config.personalityTone.split("/")[0].trim()}
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-[#cac4d0] font-sans truncate">
              {agenda.rate.status === "agreed" ? "460 ₽/м²" : "300 ₽/м²"} •{" "}
              {agenda.grace_period.status === "agreed" ? "4 мес." : "12 мес."} •{" "}
              <span className="text-[#00f0ff] font-medium">Trust: {metrics.trust}%</span>
            </div>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile Telemetry Status Pill (Linear Indicator Hint) */}
          <button
            id="m3-telemetry-badge-button"
            onClick={() => setShowTelemetrySheet(true)}
            className="h-9 px-2.5 rounded-full bg-[#2b2930] hover:bg-[#36343b] border border-[#49454f] text-[#d0bcff] text-xs font-medium flex items-center gap-1.5 transition-colors active:scale-95 shadow-sm"
            title="Открыть телеметрию и BATNA"
          >
            <Activity className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="font-semibold">{metrics.trust}%</span>
          </button>

          {/* Case Info Dialog Trigger */}
          <button
            id="m3-info-button"
            onClick={onOpenCaseInfo}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#cac4d0] hover:text-[#e6e0e9] hover:bg-[#36343b]/60 active:bg-[#49454f] transition-all"
            title="Диспозиция кейса"
          >
            <Info className="w-4 h-4 text-[#d0bcff]" />
          </button>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={onOpenTimeTravel}
              className="h-9 px-3 rounded-full bg-[#2b2930] hover:bg-[#36343b] border border-[#49454f]/50 text-[#e6e0e9] text-xs font-medium flex items-center gap-1.5 transition-all"
              title="Машина времени"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#ffb703]" />
              <span>Откат</span>
            </button>

            <button
              onClick={onOpenDebriefing}
              className="h-9 px-3 rounded-full bg-[#2b2930] hover:bg-[#36343b] border border-[#49454f]/50 text-[#e6e0e9] text-xs font-medium flex items-center gap-1.5 transition-all"
              title="Итоговый дебрифинг"
            >
              <Award className="w-3.5 h-3.5 text-[#10b981]" />
              <span>Дебрифинг</span>
            </button>

            <button
              onClick={onOpenConfigurator}
              className="h-9 px-3 rounded-full bg-[#4f378b] hover:bg-[#5a189a] text-[#eaddff] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Конфигуратор"
            >
              <Sliders className="w-3.5 h-3.5 text-[#d0bcff]" />
              <span>Конфигуратор</span>
            </button>
          </div>

          {/* Timer Pill */}
          <div className="h-9 px-3 rounded-full bg-[#1d1b20] border border-[#49454f]/40 flex items-center gap-1.5 text-xs font-mono text-[#00f0ff]">
            <Clock className="w-3 h-3 text-[#00f0ff] animate-pulse" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BODY CONTENT (Material 3 LazyColumn & Dual-Pane on Desktop)            */}
      {/* ========================================================================= */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-4 p-0 lg:p-4 overflow-hidden">
        {/* ================= LEFT / PRIMARY CHAT COLUMN (M3 Scaffold Content) ================= */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full overflow-hidden bg-[#141218]">
          {/* M3 ELEVATEDCARD: HUD наставника Б.А.Р.С. / 3D Viewer (160dp / Adaptive) */}
          <div className="px-3 sm:px-4 pt-2.5 pb-1 shrink-0">
            <div
              id="m3-bars-elevated-card"
              className="rounded-2xl bg-[#2b2930] border border-[#49454f]/40 p-3 sm:p-3.5 shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="shrink-0">
                    <BarsAvatar animation={barsAnimation} size="xs" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#d0bcff]">Б.А.Р.С.</span>
                      <span className="text-[10px] text-[#cac4d0]">| Наставник ОЭЗ</span>
                    </div>
                    <p className="text-xs text-[#e6e0e9] font-sans truncate max-w-sm sm:max-w-md">
                      «{barsFeedback}»
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      barsAnimation === "warn"
                        ? "bg-[#8c1d18] text-[#f9dedc]"
                        : barsAnimation === "win"
                        ? "bg-[#004f58] text-[#9eeffd]"
                        : "bg-[#4f378b] text-[#eaddff]"
                    }`}
                  >
                    {barsAnimation === "warn" ? "Опасность" : barsAnimation === "win" ? "Успех" : "Анализ"}
                  </span>
                  <button
                    onClick={() => setIsBarsHudExpanded(!isBarsHudExpanded)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[#cac4d0] hover:text-white hover:bg-[#36343b]"
                    title="Подробнее"
                  >
                    {isBarsHudExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Advice & Prompt Hint */}
              {isBarsHudExpanded && (
                <div className="mt-2.5 pt-2.5 border-t border-[#49454f]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <span className="text-[#cac4d0]">
                    Тактический совет: <strong className="text-[#e6e0e9]">{barsFeedback}</strong>
                  </span>
                  <button
                    onClick={() => setInputText(suggestionChips[0].text)}
                    className="px-2.5 py-1 rounded-full bg-[#4f378b]/40 hover:bg-[#4f378b] text-[#d0bcff] text-[11px] font-medium border border-[#d0bcff]/30 shrink-0 transition-colors"
                  >
                    Использовать контраргумент
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* M3 CHAT LAZYCOLUMN: Messages List */}
          <div
            id="m3-chat-list"
            className="flex-1 px-3 sm:px-4 py-2 overflow-y-auto space-y-3 sm:space-y-4 flex flex-col"
          >
            {messages.map((msg) => {
              const isUser = msg.actor === "USER";
              const isBars = msg.actor === "BARS";

              if (isBars) {
                return (
                  <div
                    key={msg.id}
                    className="flex gap-2.5 sm:gap-3 items-start my-1 max-w-[95%] sm:max-w-[85%]"
                  >
                    <BarsAvatar animation={msg.barsAnimation || barsAnimation} size="xs" />
                    <div className="flex-1 rounded-2xl p-3 sm:p-3.5 bg-[#332d41] border border-[#49454f]/40 text-[#e8def8] shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-1 text-[11px]">
                        <span className="font-semibold text-[#d0bcff] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
                          Б.А.Р.С. (Тактический разбор)
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed text-[#e6e0e9] font-sans">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col group ${isUser ? "items-end" : "items-start"}`}
                >
                  {/* Sender Name */}
                  <div
                    className={`text-[11px] font-medium mb-1 px-1 ${
                      isUser ? "text-[#d0bcff]" : "text-[#cac4d0]"
                    }`}
                  >
                    {isUser ? "Вы (ОЭЗ «Алабуга»)" : config.opponentName}
                  </div>

                  {/* M3 Message Bubbles: SurfaceVariant vs PrimaryContainer */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[88%] sm:max-w-[80%] shadow-sm ${
                      isUser
                        ? "bg-[#4f378b] text-[#eaddff] rounded-tr-xs" // PrimaryContainer
                        : "bg-[#2b2930] text-[#e6e0e9] rounded-tl-xs border border-[#49454f]/30" // SurfaceContainerHigh
                    }`}
                  >
                    <p className="font-sans whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              );
            })}

            {/* M3 Typing State */}
            {isLoading && (
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#2b2930] border border-[#49454f]/30 text-[#cac4d0] text-xs w-fit animate-pulse">
                <span className="w-2 h-2 rounded-full bg-[#d0bcff] animate-ping" />
                <span>{config.opponentName} обдумывает позицию...</span>
              </div>
            )}

            {/* Outcome Cards */}
            {isDealClosed && (
              <div className="p-4 rounded-2xl bg-[#004f58]/80 border border-[#00f0ff]/50 text-center space-y-2 shadow-lg my-2">
                <CheckCircle2 className="w-8 h-8 text-[#00f0ff] mx-auto" />
                <div className="text-sm font-bold text-[#9eeffd] uppercase tracking-wide">
                  Сделка успешно согласована!
                </div>
                <p className="text-xs text-[#e6e0e9]">
                  Вы удержали ключевые показатели ОЭЗ и защитили экономическую эффективность.
                </p>
                <button
                  onClick={onOpenDebriefing}
                  className="mt-2 h-10 px-5 rounded-full bg-[#00f0ff] text-[#00363d] font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md"
                >
                  Открыть дебрифинг
                </button>
              </div>
            )}

            {isDealFailed && (
              <div className="p-4 rounded-2xl bg-[#8c1d18]/80 border border-[#f2b8b5]/50 text-center space-y-2 shadow-lg my-2">
                <AlertTriangle className="w-8 h-8 text-[#f2b8b5] mx-auto" />
                <div className="text-sm font-bold text-[#f9dedc] uppercase tracking-wide">
                  Переговоры зашли в тупик
                </div>
                <p className="text-xs text-[#e6e0e9]">
                  Оппонент прервал раунд из-за критического давления или нарушения условий.
                </p>
                <button
                  onClick={onOpenTimeTravel}
                  className="mt-2 h-10 px-5 rounded-full bg-[#d0bcff] text-[#381e72] font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-1.5 mx-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  Откатить ход назад
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ================= 3. M3 BOTTOM BAR: Surface(tonalElevation = 3.dp) ================= */}
          <footer
            id="m3-bottom-bar"
            className="sticky bottom-0 z-20 bg-[#211f26] border-t border-[#49454f]/30 p-2.5 sm:p-3 pb-safe shrink-0 shadow-lg"
          >
            {/* Horizontal SuggestionChips Carousel (LazyRow M3) */}
            {!isDealClosed && !isDealFailed && (
              <div
                id="m3-suggestion-chips-row"
                className="overflow-x-auto flex items-center gap-2 pb-2 scrollbar-none"
              >
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputText(chip.text)}
                    className="shrink-0 h-8 px-3 rounded-lg bg-[#2b2930] hover:bg-[#36343b] active:bg-[#49454f] border border-[#49454f] text-[#e6e0e9] hover:text-white text-xs font-medium transition-all whitespace-nowrap active:scale-95 shadow-xs flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d0bcff]" />
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* OutlinedTextField + FilledIconButton Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="m3-outlined-text-field"
                  type="text"
                  placeholder={
                    isDealClosed || isDealFailed
                      ? "Раунд переговоров завершен"
                      : "Введите аргумент или встречное предложение..."
                  }
                  disabled={isLoading || isDealClosed || isDealFailed}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="w-full h-12 px-4 rounded-full bg-[#1d1b20] border border-[#938f99]/50 focus:border-[#d0bcff] focus:ring-1 focus:ring-[#d0bcff] text-sm text-[#e6e0e9] placeholder-[#cac4d0] transition-colors outline-none disabled:opacity-50"
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
                className="w-12 h-12 rounded-full bg-[#2b2930] hover:bg-[#36343b] border border-[#49454f]/50 text-[#cac4d0] hover:text-[#d0bcff] flex items-center justify-center shrink-0 active:scale-95 transition-all"
                title="Сгенерировать реплику"
              >
                <Mic className="w-5 h-5 text-[#d0bcff]" />
              </button>

              {/* M3 FilledIconButton (Send) */}
              <button
                id="m3-filled-icon-button"
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading || isDealClosed || isDealFailed}
                className="w-12 h-12 rounded-full bg-[#d0bcff] hover:bg-[#eaddff] active:scale-95 disabled:opacity-40 text-[#381e72] flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
                title="Отправить аргумент"
              >
                <Send className="w-5 h-5 text-[#381e72]" />
              </button>
            </div>
          </footer>
        </div>

        {/* ================= RIGHT / DESKTOP TACTICAL CENTER (>= lg) ================= */}
        <aside className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col rounded-2xl bg-[#211f26] border border-[#49454f]/40 p-4 space-y-4 overflow-y-auto shadow-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#49454f]/30 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-pulse" />
              <h2 className="text-sm font-bold text-[#e6e0e9]">ТАКТИЧЕСКИЙ ЦЕНТР</h2>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#4f378b]/40 text-[#d0bcff] border border-[#d0bcff]/30">
              M3 Telemetry
            </span>
          </div>

          {/* M3 Progress Indicators */}
          <div className="p-4 rounded-2xl bg-[#1d1b20] border border-[#49454f]/40 space-y-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#cac4d0]">
              Шкалы взаимодействия
            </div>

            {/* Trust Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#cac4d0]">Доверие оппонента:</span>
                <span className="text-[#d0bcff] font-bold">{metrics.trust}%</span>
              </div>
              <div className="w-full bg-[#36343b] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#d0bcff] transition-all duration-500"
                  style={{ width: `${metrics.trust}%` }}
                />
              </div>
            </div>

            {/* Tension Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#cac4d0]">Напряжение / Стресс:</span>
                <span className="text-[#f2b8b5] font-bold">{metrics.tension}%</span>
              </div>
              <div className="w-full bg-[#36343b] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#f2b8b5] transition-all duration-500"
                  style={{ width: `${metrics.tension}%` }}
                />
              </div>
            </div>

            {/* Deal Readiness */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#cac4d0]">Готовность к соглашению:</span>
                <span className="text-[#00f0ff] font-bold">{metrics.deal_readiness}%</span>
              </div>
              <div className="w-full bg-[#36343b] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#00f0ff] transition-all duration-500"
                  style={{ width: `${metrics.deal_readiness}%` }}
                />
              </div>
            </div>
          </div>

          {/* BATNA Card */}
          <div className="p-4 rounded-2xl bg-[#1d1b20] border border-[#49454f]/40 space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#e6e0e9]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#00f0ff]" />
                Красные линии BATNA
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4f378b]/30 text-[#d0bcff]">
                ОЭЗ
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#2b2930] border border-[#49454f]/30">
                <span className="text-[10px] text-[#cac4d0] block">МИН. СТАВКА:</span>
                <span className="font-bold text-white">{config.batna.minPricePerSqm} ₽/м²</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#2b2930] border border-[#49454f]/30">
                <span className="text-[10px] text-[#cac4d0] block">МАКС. КАНИКУЛЫ:</span>
                <span className="font-bold text-white">{config.batna.maxGracePeriodMonths} мес.</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#49454f]/30 text-xs">
              {config.batna.redLines.map((line, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[#cac4d0]">
                  <span className="text-[#f2b8b5] font-bold">✕</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agenda Checklist */}
          <div className="p-4 rounded-2xl bg-[#1d1b20] border border-[#49454f]/40 space-y-2.5 shadow-sm flex-1">
            <div className="text-xs font-bold text-[#e6e0e9]">Повестка встречи:</div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#2b2930] border border-[#49454f]/30 flex items-center justify-between">
                <span>Ставка: 460 ₽/м²</span>
                <span className={agenda.rate.status === "agreed" ? "text-[#00f0ff] font-bold" : "text-[#ffb703]"}>
                  {agenda.rate.status === "agreed" ? "✓ Согласовано" : "В процессе"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#2b2930] border border-[#49454f]/30 flex items-center justify-between">
                <span>Каникулы: 4 мес.</span>
                <span className={agenda.grace_period.status === "agreed" ? "text-[#00f0ff] font-bold" : "text-[#ffb703]"}>
                  {agenda.grace_period.status === "agreed" ? "✓ Согласовано" : "В процессе"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#2b2930] border border-[#49454f]/30 flex items-center justify-between">
                <span>Сети под CAPEX</span>
                <span className={agenda.power_capex.status === "agreed" ? "text-[#00f0ff] font-bold" : "text-[#ffb703]"}>
                  {agenda.power_capex.status === "agreed" ? "✓ Согласовано" : "В процессе"}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* ========================================================================= */}
      {/* 4. M3 MODAL BOTTOM SHEET (Mobile & On-Demand)                             */}
      {/* ========================================================================= */}
      {showTelemetrySheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Backdrop Click Dismiss */}
          <div
            className="flex-1 w-full"
            onClick={() => setShowTelemetrySheet(false)}
          />

          {/* Sheet Container (rounded-t-[28px], shape extraLarge) */}
          <div
            id="m3-modal-bottom-sheet"
            className="w-full max-w-xl mx-auto rounded-t-[28px] bg-[#211f26] border-t border-[#49454f]/50 p-4 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
          >
            {/* M3 Drag Handle */}
            <div className="w-8 h-1 rounded-full bg-[#938f99] mx-auto mb-2" />

            <div className="flex items-center justify-between border-b border-[#49454f]/30 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#e6e0e9]">Телеметрия встречи</h3>
                <p className="text-xs text-[#cac4d0]">Кейс: {config.title}</p>
              </div>
              <button
                onClick={() => setShowTelemetrySheet(false)}
                className="w-9 h-9 rounded-full bg-[#2b2930] hover:bg-[#36343b] text-[#cac4d0] hover:text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* M3 Tabs: Metrics / BATNA / Agenda */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-full bg-[#1d1b20]">
              <button
                onClick={() => setTelemetryTab("metrics")}
                className={`py-2 rounded-full text-xs font-semibold transition-all ${
                  telemetryTab === "metrics"
                    ? "bg-[#4f378b] text-[#eaddff] shadow-sm"
                    : "text-[#cac4d0] hover:text-white"
                }`}
              >
                Метрики
              </button>
              <button
                onClick={() => setTelemetryTab("batna")}
                className={`py-2 rounded-full text-xs font-semibold transition-all ${
                  telemetryTab === "batna"
                    ? "bg-[#4f378b] text-[#eaddff] shadow-sm"
                    : "text-[#cac4d0] hover:text-white"
                }`}
              >
                BATNA
              </button>
              <button
                onClick={() => setTelemetryTab("agenda")}
                className={`py-2 rounded-full text-xs font-semibold transition-all ${
                  telemetryTab === "agenda"
                    ? "bg-[#4f378b] text-[#eaddff] shadow-sm"
                    : "text-[#cac4d0] hover:text-white"
                }`}
              >
                Повестка
              </button>
            </div>

            {/* Content Area */}
            {telemetryTab === "metrics" && (
              <div className="space-y-4 pt-1">
                {/* LinearProgressIndicator: Trust */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#cac4d0]">Доверие оппонента ({metrics.trust}%)</span>
                    <span className="text-[#d0bcff] font-bold">{metrics.trust}%</span>
                  </div>
                  <div className="w-full bg-[#36343b] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#d0bcff] transition-all duration-500"
                      style={{ width: `${metrics.trust}%` }}
                    />
                  </div>
                </div>

                {/* LinearProgressIndicator: Tension */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#cac4d0]">Стресс / Напряжение ({metrics.tension}%)</span>
                    <span className="text-[#f2b8b5] font-bold">{metrics.tension}%</span>
                  </div>
                  <div className="w-full bg-[#36343b] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#f2b8b5] transition-all duration-500"
                      style={{ width: `${metrics.tension}%` }}
                    />
                  </div>
                </div>

                {/* LinearProgressIndicator: Readiness */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#cac4d0]">Готовность к сделке ({metrics.deal_readiness}%)</span>
                    <span className="text-[#00f0ff] font-bold">{metrics.deal_readiness}%</span>
                  </div>
                  <div className="w-full bg-[#36343b] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#00f0ff] transition-all duration-500"
                      style={{ width: `${metrics.deal_readiness}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {telemetryTab === "batna" && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-[#1d1b20] border border-[#49454f]/40">
                    <span className="text-[10px] text-[#cac4d0] block">МИНИМАЛЬНАЯ СТАВКА</span>
                    <span className="text-base font-bold text-white">{config.batna.minPricePerSqm} ₽/м²</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#1d1b20] border border-[#49454f]/40">
                    <span className="text-[10px] text-[#cac4d0] block">МАКС. КАНИКУЛЫ</span>
                    <span className="text-base font-bold text-white">{config.batna.maxGracePeriodMonths} мес.</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#49454f]/30">
                  <div className="text-xs font-semibold text-[#f2b8b5]">Красные линии ОЭЗ (Табу):</div>
                  {config.batna.redLines.map((line, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[#2b2930] border border-[#49454f]/30 text-xs text-[#e6e0e9] flex items-start gap-2">
                      <span className="text-[#f2b8b5] font-bold shrink-0">✕</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {telemetryTab === "agenda" && (
              <div className="space-y-2 pt-1">
                <div className="p-3 rounded-2xl bg-[#1d1b20] border border-[#49454f]/40 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">Ставка аренды</div>
                    <div className="text-[11px] text-[#cac4d0]">{agenda.rate.detail}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                    agenda.rate.status === "agreed" ? "bg-[#004f58] text-[#9eeffd]" : "bg-[#4f378b]/40 text-[#d0bcff]"
                  }`}>
                    {agenda.rate.status === "agreed" ? "Согласовано" : "В процессе"}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#1d1b20] border border-[#49454f]/40 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">Арендные каникулы</div>
                    <div className="text-[11px] text-[#cac4d0]">{agenda.grace_period.detail}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                    agenda.grace_period.status === "agreed" ? "bg-[#004f58] text-[#9eeffd]" : "bg-[#4f378b]/40 text-[#d0bcff]"
                  }`}>
                    {agenda.grace_period.status === "agreed" ? "Согласовано" : "В процессе"}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#1d1b20] border border-[#49454f]/40 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">Сети 8 МВт и CAPEX</div>
                    <div className="text-[11px] text-[#cac4d0]">{agenda.power_capex.detail}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                    agenda.power_capex.status === "agreed" ? "bg-[#004f58] text-[#9eeffd]" : "bg-[#4f378b]/40 text-[#d0bcff]"
                  }`}>
                    {agenda.power_capex.status === "agreed" ? "Согласовано" : "В процессе"}
                  </span>
                </div>
              </div>
            )}

            {/* Actions Inside Bottom Sheet */}
            <div className="pt-3 border-t border-[#49454f]/30 flex gap-2">
              <button
                onClick={() => {
                  setShowTelemetrySheet(false);
                  onOpenDebriefing();
                }}
                className="flex-1 h-11 rounded-full bg-[#d0bcff] hover:bg-[#eaddff] text-[#381e72] font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
              >
                <Award className="w-4 h-4" />
                <span>Итоговый дебрифинг</span>
              </button>
              <button
                onClick={() => {
                  setShowTelemetrySheet(false);
                  onOpenTimeTravel();
                }}
                className="h-11 px-4 rounded-full bg-[#2b2930] hover:bg-[#36343b] border border-[#49454f] text-[#e6e0e9] font-medium text-xs flex items-center gap-1.5 transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-[#ffb703]" />
                <span>Откат</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
