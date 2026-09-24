import React, { useEffect, useRef, useState } from "react";
import {
  AdminScenarioConfig,
  Message,
  NegotiationMetrics,
  NegotiationAgenda,
  BarsAnimationState,
  ZopaState,
} from "../types";
import { BarsAvatar } from "./BarsAvatar";
import { OpponentVideoWindow } from "./OpponentVideoWindow";
import { ZopaMapCard } from "./ZopaMapCard";
import { MethodologyTagBadge } from "./MethodologyTagBadge";
import { LatencyBadge } from "./LatencyBadge";
import { OfflineToggle } from "./OfflineToggle";
import {
  Send,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  ShieldCheck,
  Award,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Activity,
  Mic,
  SlidersHorizontal,
  Check,
  ArrowRightLeft,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
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
  zopa: ZopaState | null;
  latencyMs: number | null;
  modelName: string;
  providerName: string;
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
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
  zopa,
  latencyMs,
  modelName,
  providerName,
  isOfflineMode,
  onToggleOfflineMode,
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
  const [lastInsertedTemplate, setLastInsertedTemplate] = useState<string>("");
  const [showTelemetrySheet, setShowTelemetrySheet] = useState(false);
  const [telemetryTab, setTelemetryTab] = useState<"metrics" | "zopa" | "batna" | "agenda">("metrics");
  const [isBarsHudExpanded, setIsBarsHudExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chipsRowRef = useRef<HTMLDivElement | null>(null);

  // Drag-to-scroll and mouse wheel horizontal scrolling for chips
  useEffect(() => {
    const el = chipsRowRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
    };

    const onMouseLeave = () => {
      isDown = false;
      el.style.cursor = "grab";
    };

    const onMouseUp = () => {
      isDown = false;
      el.style.cursor = "grab";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5; // Smooth scroll speed multiplier
      el.scrollLeft = scrollLeft - walk;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.style.cursor = "grab";
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Validation logic: checks placeholders and exact unmodified template
  const val = inputText.trim();
  const hasPlaceholders = /\[.*?\]|\.\.\./.test(val);
  const isExactTemplate = lastInsertedTemplate.length > 0 && val === lastInsertedTemplate.trim();
  const isTooShort = val.length < 10;
  const isSendDisabled = isTooShort || isExactTemplate || hasPlaceholders || isLoading || isDealClosed || isDealFailed;

  let validationWarning = "";
  if (inputText.length > 0) {
    if (hasPlaceholders) {
      validationWarning = "Заполните ваши условия своими словами вместо [...] или ...";
    } else if (isExactTemplate) {
      validationWarning = "Добавьте конкретный аргумент или встречное требование в шаблон";
    } else if (isTooShort) {
      validationWarning = "Сформулируйте развернутый аргумент (минимум 10 символов)";
    }
  }

  const handleSend = () => {
    if (isSendDisabled) return;
    onSendMessage(val);
    setInputText("");
    setLastInsertedTemplate("");
  };

  const applyHint = (templateText: string) => {
    if (isLoading || isDealClosed || isDealFailed) return;
    setInputText(templateText);
    setLastInsertedTemplate(templateText);
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

  // Dynamic context hints: extract from the most recent opponent message
  const latestOpponentMsg = [...messages].reverse().find((m) => m.actor === "OPPONENT");
  const dynamicHints: string[] =
    latestOpponentMsg?.contextHints && latestOpponentMsg.contextHints.length > 0
      ? latestOpponentMsg.contextHints
      : [
          "Валерий, спешка в таких инвестициях рискованна. Мы готовы рассмотреть [укажите ставку], если вы гарантируете...",
          "Условие ОЭЗ — не менее 1.2 млрд CAPEX в обмен на [укажите объем мощностей или льготу]...",
          "Понимаю жесткий тайминг совета директоров. Давайте зафиксируем 460 ₽/м², но предусмотрим льготу [опишите компромисс]...",
        ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#07080e] text-slate-100 select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(123,44,191,0.12)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,240,255,0.06)_0%,transparent_50%)] pointer-events-none" />

      {/* ================= 2. ШАПКА СТРАНИЦЫ (HEADER): max-w-7xl mx-auto ================= */}
      <header
        id="m3-top-app-bar"
        className="sticky top-0 z-30 glass-panel border-b border-white/[0.08] min-h-[58px] shrink-0"
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          {/* Слева: Логотип ОЭЗ «Алабуга» + инфо о кейсе и оппоненте */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              id="m3-nav-back-button"
              onClick={onOpenConfigurator}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white glass-pill hover:bg-white/10 active:scale-95 transition-all shrink-0 cursor-pointer"
              title="Назад в Конфигуратор"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Официальный бейдж-логотип ОЭЗ «Алабуга» */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-indigo-600/30 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.25)]">
                <span className="text-[11px] font-black tracking-tighter text-cyan-300 font-mono">ОЭЗ</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-black tracking-wider text-white uppercase font-sans">
                  Алабуга
                </span>
                <span className="text-[9px] text-cyan-400/80 font-mono tracking-widest uppercase">
                  Арена переговоров
                </span>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-white/10 mx-1 hidden sm:block" />

            {/* Opponent Identity Avatar */}
            <div className="relative shrink-0 hidden xs:block">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-900 to-indigo-700 border border-cyan-400/50 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                {opponentInitials}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-cyan-400 border border-[#07080e] shadow-[0_0_6px_#00f0ff] animate-pulse" />
            </div>

            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[150px] sm:max-w-[240px]">
                  {config.opponentName}
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 font-medium whitespace-nowrap hidden md:inline-block">
                  {config.personalityTone.split("/")[0].trim()}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-sans truncate">
                {config.opponentRole} • <span className="text-slate-300">{config.opponentCompany}</span>
              </div>
            </div>
          </div>

          {/* Справа: Единая аккуратная группа кнопок (Откат, Дебрифинг, Сценарий, Таймер, Инфо) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 bg-white/[0.03] p-1 rounded-full border border-white/[0.08] shadow-inner">
            {/* Mobile Telemetry */}
            <button
              id="m3-telemetry-badge-button"
              onClick={() => setShowTelemetrySheet(true)}
              className="h-8 px-2.5 rounded-full glass-pill hover:bg-white/10 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer lg:hidden"
              title="Открыть полную телеметрию"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold text-cyan-300 font-mono">{metrics.trust}%</span>
            </button>

            {/* Кнопка Откат (Time Travel) */}
            <button
              onClick={onOpenTimeTravel}
              className="h-8 px-3 rounded-full glass-pill hover:bg-white/15 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-white/10"
              title="Машина времени: откатить раунд назад"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Откат</span>
            </button>

            {/* Кнопка Дебрифинг */}
            <button
              onClick={onOpenDebriefing}
              className="h-8 px-3 rounded-full glass-pill hover:bg-white/15 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-white/10"
              title="Итоговый дебрифинг и протокол MOU"
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Дебрифинг</span>
            </button>

            {/* Кнопка Сценарий (Кейсы) */}
            <button
              onClick={onOpenConfigurator}
              className="h-8 px-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_15px_rgba(123,44,191,0.35)] cursor-pointer"
              title="Выбрать другой сценарий переговоров"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden md:inline">Сценарий</span>
            </button>

          {/* Offline / Live Demo 1-Click Toggle */}
          <OfflineToggle
            isOffline={isOfflineMode}
            onToggle={onToggleOfflineMode}
            isLoading={isLoading}
          />

          {/* Latency & Model Badge */}
          <div className="hidden sm:flex">
            <LatencyBadge
              latencyMs={latencyMs}
              providerName={providerName}
              modelName={modelName}
            />
          </div>

          {/* Кнопка Диспозиция (Инфо) */}
          <button
            id="m3-info-button"
            onClick={onOpenCaseInfo}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white glass-pill hover:bg-white/15 active:scale-95 transition-all cursor-pointer border border-white/10"
            title="Диспозиция кейса"
          >
            <Info className="w-3.5 h-3.5 text-purple-300" />
          </button>

          {/* Timer Pill */}
          <div className="h-9 px-3 rounded-full bg-[#1d1b20] border border-[#49454f]/40 flex items-center gap-1.5 text-xs font-mono text-[#00f0ff]">
            <Clock className="w-3 h-3 text-[#00f0ff] animate-pulse" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>
          </div>
        </div>
      </header>

      {/* ================= STRICT 2-COLUMN MAIN WORKSPACE (70% Чат / 30% Тактика) ================= */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-4 py-3 grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-70px)] overflow-hidden">
        {/* ЛЕВАЯ КОЛОНКА (70%): Видео собеседника + Чат диалога */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0 gap-3">
          {/* Окно 3D (высота 340px) */}
          <div className="shrink-0">
            <OpponentVideoWindow
              config={config}
              metrics={metrics}
              barsAnimation={barsAnimation}
              isLoading={isLoading}
              isDealClosed={isDealClosed}
              isDealFailed={isDealFailed}
            />
          </div>

          {/* Область сообщений (скроллится внутри, ЧИСТЫЙ ЧАТ БЕЗ СОВЕТОВ ВНУТРИ) */}
          <div
            id="chat-messages"
            className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10"
          >
            {messages.map((msg) => {
              const isUser = msg.actor === "USER";
              const isBars = msg.actor === "BARS";

              if (isBars) {
                return null;
              }

              // Opponent Message with Dynamic Emotion Avatar and Status Badge
              if (!isUser) {
                const emotion =
                  msg.emotion ||
                  (msg.snapshotMetrics.tension >= 65
                    ? "attack"
                    : msg.snapshotMetrics.deal_readiness >= 65
                    ? "compromise"
                    : "neutral");
                let ringColor = "ring-slate-500/50";
                let badgeBg = "bg-slate-500/10 text-slate-300 border-slate-500/20";
                let emoji = msg.emotionEmoji || "💬";
                let statusLabel = msg.emotionLabel || "Позиция";

                if (emotion === "attack") {
                  ringColor = "ring-rose-500/60";
                  badgeBg = "bg-rose-500/15 text-rose-300 border-rose-500/30";
                  emoji = msg.emotionEmoji || "😠";
                  statusLabel = msg.emotionLabel || "Несогласие / Прессинг";
                } else if (emotion === "compromise") {
                  ringColor = "ring-emerald-500/60";
                  badgeBg = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
                  emoji = msg.emotionEmoji || "🤝";
                  statusLabel = msg.emotionLabel || "Сближение / Компромисс";
                } else if (emotion === "bluff") {
                  ringColor = "ring-amber-500/60";
                  badgeBg = "bg-amber-500/15 text-amber-300 border-amber-500/30";
                  emoji = msg.emotionEmoji || "⚠️";
                  statusLabel = msg.emotionLabel || "Блеф / Проверка границ";
                }

                return (
                  <div key={msg.id} className="animate-message-in flex items-start gap-3 my-2 max-w-[94%] sm:max-w-[88%]">
                    <div className="relative shrink-0 mt-0.5">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ${ringColor} overflow-hidden shadow-lg bg-gradient-to-tr from-purple-950 to-indigo-900 border border-white/10 flex items-center justify-center font-bold text-white text-xs sm:text-sm`}
                      >
                        {opponentInitials}
                      </div>
                      <span className="absolute -bottom-1 -right-1 text-xs bg-[#0b0c16] rounded-full p-0.5 border border-white/10 shadow-sm leading-none">
                        {emoji}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-white tracking-wide">
                          {config.opponentName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono hidden xs:inline-block">
                          {config.opponentRole}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${badgeBg}`}>
                          <span>{emoji}</span>
                          <span>{statusLabel}</span>
                        </span>
                      </div>

                      <div className="p-3.5 sm:p-4 rounded-2xl rounded-tl-xs bg-[#131525]/90 border border-white/[0.09] shadow-[0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur-md">
                        <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              // User Message (Right Aligned)
              return (
                <div
                  key={msg.id}
                  className="animate-message-in flex flex-col items-end my-2 group self-end max-w-[90%] sm:max-w-[85%]"
                >
                  {/* BARS Methodology Tag (SPIN / Harvard / BATNA / Error) */}
                  {isUser && msg.methodologyTag && (
                    <MethodologyTagBadge tag={msg.methodologyTag} />
                  )}

                  {/* Sender Name */}
                  <div className="text-[11px] font-medium mb-1 px-1 text-[#d0bcff]">
                    <span>Вы (ОЭЗ «Алабуга»)</span>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-2xl rounded-tr-xs bg-gradient-to-br from-indigo-600/90 via-purple-700/90 to-purple-900/90 text-white border border-cyan-400/30 shadow-[0_6px_25px_rgba(99,102,241,0.25)] backdrop-blur-md">
                    <p className="text-xs sm:text-sm text-white leading-relaxed font-sans whitespace-pre-wrap">
                      {msg.text}
                    </p>
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
                  Открыть итоговый дебрифинг и протокол MOU
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

          {/* Зона ввода (прибита снизу: 1. ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ ЧИПСОВ + Валидатор) */}
          <div className="shrink-0 pt-1 border-t border-white/[0.08]">
            {/* 1. ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ ЧИПСОВ: drag-to-scroll, wheel, скрытый скроллбар */}
            {!isDealClosed && !isDealFailed && (
              <div
                id="chips-row"
                ref={chipsRowRef}
                className="overflow-x-auto flex items-center gap-2 pb-2 no-scrollbar select-none"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {dynamicHints.map((hint, idx) => (
                  <button
                    key={idx}
                    disabled={isLoading}
                    onClick={() => applyHint(hint)}
                    className="shrink-0 h-8 px-3 rounded-full glass-pill hover:bg-white/10 active:bg-white/15 text-slate-200 hover:text-white border border-cyan-500/25 hover:border-cyan-400/50 text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer max-w-[280px] sm:max-w-[380px] truncate"
                    title={`Вставить тактический каркас: ${hint}`}
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{hint}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Validation Banner if user hasn't completed prompt or placeholders remain */}
            {validationWarning && (
              <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center gap-2 text-xs text-amber-200 animate-in fade-in duration-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-medium">{validationWarning}</span>
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="chat-input"
                  type="text"
                  placeholder={
                    isDealClosed || isDealFailed
                      ? "Раунд переговоров завершен"
                      : "Сформулируйте аргумент или дополните шаблон своими условиями..."
                  }
                  disabled={isLoading || isDealClosed || isDealFailed}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isSendDisabled && handleSend()}
                  className="w-full h-11 sm:h-12 px-4 rounded-full bg-[#0c0e18]/80 border border-white/15 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-xs sm:text-sm text-white placeholder-slate-400 transition-all outline-none disabled:opacity-50 shadow-inner"
                />
              </div>

              {/* Send Button with anti-cheat state */}
              <button
                id="send-btn"
                onClick={handleSend}
                disabled={isSendDisabled}
                className={`w-11 sm:w-12 h-11 sm:h-12 rounded-full flex items-center justify-center shrink-0 transition-all font-bold ${
                  isSendDisabled
                    ? "opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border border-white/10"
                    : "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 active:scale-95 text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer"
                }`}
                title={isSendDisabled ? validationWarning || "Введите аргумент" : "Отправить аргумент"}
              >
                <Send className="w-4 sm:w-5 h-4 sm:h-5 text-current" />
              </button>
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА (30%): Только приборы и Совет БАРС */}
        <aside className="hidden lg:flex lg:col-span-4 flex-col gap-4 h-full overflow-y-auto glass-panel rounded-3xl p-4 border border-white/[0.08] shadow-2xl">
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

          {/* 1. Телеметрия (Доверие, Стресс, Готовность) */}
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

          {/* M3 Dynamic ZOPA Map Card (Zone of Possible Agreement) */}
          <ZopaMapCard zopa={zopa} minPriceBatna={config.batna.minPricePerSqm} />

          {/* 2. Красные линии (BATNA ОЭЗ) */}
          <div className="p-4 rounded-2xl bg-[#1d1b20] border border-[#49454f]/40 space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#e6e0e9]">
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

          {/* Повестка встречи */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2.5 shadow-inner">
            <div className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Повестка встречи:
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <span className="text-slate-200">Ставка: {config.batna.minPricePerSqm} ₽/м²</span>
                <span className={agenda.rate.status === "agreed" ? "text-cyan-300 font-bold" : "text-amber-400"}>
                  {agenda.rate.status === "agreed" ? "✓ Согласовано" : "В процессе"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <span className="text-slate-200">Каникулы: {config.batna.maxGracePeriodMonths} мес.</span>
                <span className={agenda.grace_period.status === "agreed" ? "text-cyan-300 font-bold" : "text-amber-400"}>
                  {agenda.grace_period.status === "agreed" ? "✓ Согласовано" : "В процессе"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <span className="text-slate-200">Сети под инвестиции</span>
                <span className={agenda.power_capex.status === "agreed" ? "text-cyan-300 font-bold" : "text-amber-400"}>
                  {agenda.power_capex.status === "agreed" ? "✓ Согласовано" : "В процессе"}
                </span>
              </div>
            </div>
          </div>

          {/* 3. ТАКТИЧЕСКИЙ СОВЕТ Б.А.Р.С. (ЕДИНСТВЕННОЕ МЕСТО ОТОБРАЖЕНИЯ СОВЕТА!) */}
          {barsFeedback && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/50 via-purple-950/40 to-slate-900/80 border border-cyan-500/40 space-y-2.5 shadow-[0_4px_25px_rgba(0,240,255,0.12)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Тактический совет Б.А.Р.С.
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-400/30">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-100 leading-relaxed font-sans">
                {barsFeedback}
              </p>
            </div>
          )}
        </aside>
      </main>

      {/* ================= TELEMETRY DIALOG MODAL (Mobile View) ================= */}
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
                <h3 className="text-base font-bold text-white">Телеметрия встречи</h3>
                <p className="text-xs text-slate-400">Параметры состояния и подсказки Б.А.Р.С.</p>
              </div>
              <button
                onClick={() => setShowTelemetrySheet(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white glass-pill"
              >
                ✕
              </button>
            </div>

            {/* M3 Tabs: Metrics / ZOPA / BATNA / Agenda */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-[#1d1b20]">
              <button
                onClick={() => setTelemetryTab("metrics")}
                className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                  telemetryTab === "metrics" ? "bg-cyan-500/20 text-cyan-300 shadow-sm" : "text-slate-400"
                }`}
              >
                Индикаторы
              </button>
              <button
                onClick={() => setTelemetryTab("zopa")}
                className={`py-2 rounded-full text-xs font-semibold transition-all ${
                  telemetryTab === "zopa"
                    ? "bg-[#4f378b] text-[#eaddff] shadow-sm"
                    : "text-[#cac4d0] hover:text-white"
                }`}
              >
                ZOPA
              </button>
              <button
                onClick={() => setTelemetryTab("batna")}
                className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                  telemetryTab === "batna" ? "bg-purple-500/20 text-purple-300 shadow-sm" : "text-slate-400"
                }`}
              >
                Красные линии
              </button>
              <button
                onClick={() => setTelemetryTab("agenda")}
                className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                  telemetryTab === "agenda" ? "bg-indigo-500/20 text-indigo-300 shadow-sm" : "text-slate-400"
                }`}
              >
                Повестка
              </button>
            </div>

            {/* Content based on tab */}
            {telemetryTab === "metrics" && (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Доверие:</span>
                    <span className="text-cyan-300 font-bold font-mono">{metrics.trust}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
                      style={{ width: `${metrics.trust}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Напряжение:</span>
                    <span className="text-rose-400 font-bold font-mono">{metrics.tension}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500"
                      style={{ width: `${metrics.tension}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Готовность к сделке:</span>
                    <span className="text-emerald-300 font-bold font-mono">{metrics.deal_readiness}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 to-green-400"
                      style={{ width: `${metrics.deal_readiness}%` }}
                    />
                  </div>
                </div>

                {barsFeedback && (
                  <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-slate-200 mt-2">
                    <div className="text-[10px] font-bold text-cyan-300 uppercase font-mono mb-1">
                      Совет Б.А.Р.С.:
                    </div>
                    {barsFeedback}
                  </div>
                )}
              </div>
            )}

            {telemetryTab === "zopa" && (
              <div className="pt-1">
                <ZopaMapCard zopa={zopa} minPriceBatna={config.batna.minPricePerSqm} />
              </div>
            )}

            {telemetryTab === "batna" && (
              <div className="space-y-3 py-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                    <span className="text-[10px] text-slate-400 block font-mono">МИН. СТАВКА:</span>
                    <span className="font-bold text-white text-sm">{config.batna.minPricePerSqm} ₽/м²</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                    <span className="text-[10px] text-slate-400 block font-mono">МАКС. КАНИКУЛЫ:</span>
                    <span className="font-bold text-white text-sm">{config.batna.maxGracePeriodMonths} мес.</span>
                  </div>
                </div>
                <div className="space-y-1.5 pt-2">
                  {config.batna.redLines.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300 text-[11px]">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {telemetryTab === "agenda" && (
              <div className="space-y-2 py-2 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <span className="text-slate-200">Ставка: {config.batna.minPricePerSqm} ₽/м²</span>
                  <span className={agenda.rate.status === "agreed" ? "text-cyan-300 font-bold" : "text-amber-400"}>
                    {agenda.rate.status === "agreed" ? "✓ Согласовано" : "В процессе"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <span className="text-slate-200">Каникулы: {config.batna.maxGracePeriodMonths} мес.</span>
                  <span className={agenda.grace_period.status === "agreed" ? "text-cyan-300 font-bold" : "text-amber-400"}>
                    {agenda.grace_period.status === "agreed" ? "✓ Согласовано" : "В процессе"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <span className="text-slate-200">Сети под инвестиции</span>
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
