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
  User,
  Bot,
  ListTodo,
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
}) => {
  const [inputText, setInputText] = useState("");
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

  // Concise, tactical chips without truncation
  const quickTactics = [
    {
      label: "Предложить 460 ₽ взамен на 250 рабочих мест",
      text: "Мы готовы зафиксировать базовую ставку 460 ₽/м² исключительно при гарантии создания 250 рабочих мест и соблюдения графика инвестиций.",
    },
    {
      label: "Запросить структуру их окупаемости",
      text: "На чем экономически базируется ваш запрос в 300 ₽/м²? В нашу ставку уже заложены сети 110 кВ и логистический хаб ОЭЗ. Покажите структуру финмодели.",
    },
    {
      label: "Ограничить каникулы 4 месяцами",
      text: "12 месяцев каникул исключены регламентом ОЭЗ. Мы согласовываем максимум 4 месяца на пусконаладку при параллельном монтаже оборудования.",
    },
    {
      label: "Подтвердить 8 МВт при гарантии CAPEX",
      text: "Подвод 8 МВт мощности мы обеспечим в приоритетном порядке, но только под взаимное обязательство CAPEX не менее 1.2 млрд рублей.",
    },
    {
      label: "Зафиксировать дедлайн подписания 10 дней",
      text: "Если ключевые параметры ставки 460 ₽ и каникул 4 месяца согласованы, предлагаю зафиксировать их в соглашении о намерениях с дедлайном 10 дней.",
    },
  ];

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "Новичок ОЭЗ":
        return {
          label: "Новичок ОЭЗ",
          bg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
          icon: "🟢",
        };
      case "Гендиректор Алабуги":
        return {
          label: "Гендиректор Алабуги (БОСС)",
          bg: "bg-rose-500/20 border-rose-500/50 text-rose-300",
          icon: "🔴",
        };
      case "Прожжённый закупщик":
      default:
        return {
          label: "Прожжённый закупщик",
          bg: "bg-amber-500/20 border-amber-500/40 text-amber-300",
          icon: "🟡",
        };
    }
  };

  const diffBadge = getDifficultyBadge(config.difficulty);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0c12] text-slate-100 overflow-hidden select-none font-sans">
      {/* ================= TOP BAR ================= */}
      <header className="h-14 border-b border-[#222638] bg-[#11131c] px-5 flex items-center justify-between shrink-0 z-20">
        {/* Brand & Arena Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7b2cbf] to-[#5a189a] p-0.5 shadow-[0_0_12px_rgba(123,44,191,0.6)] flex items-center justify-center font-black text-white text-xs">
            А
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-black uppercase tracking-wider text-white">
                АРЕНА ПЕРЕГОВОРОВ
              </h1>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#7b2cbf]/30 text-[#00f0ff] font-mono border border-[#7b2cbf]/50">
                ОЭЗ «АЛАБУГА»
              </span>
              <span
                className={`text-[10px] px-2 py-0.2 rounded-full font-semibold border ${diffBadge.bg}`}
              >
                {diffBadge.icon} {diffBadge.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-sm">
              Кейс: <span className="text-slate-200 font-medium">{config.title}</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Countdown */}
        <div className="flex items-center gap-2.5">
          {/* Active Round Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c0e14] border border-[#232738] text-xs font-mono text-[#00f0ff] shadow-inner">
            <Clock className="w-3.5 h-3.5 text-[#00f0ff] animate-pulse" />
            <span className="font-bold tracking-wider">{formatTimer(timerSeconds)}</span>
          </div>

          {/* Info Modal Button */}
          <button
            onClick={onOpenCaseInfo}
            className="px-2.5 py-1.5 rounded-lg bg-[#181a24] hover:bg-[#222533] border border-[#2b3044] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Диспозиция кейса и цели ОЭЗ"
          >
            <Info className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="hidden sm:inline">Инфо о кейсе</span>
          </button>

          {/* Time-Travel Rewind Button */}
          <button
            onClick={onOpenTimeTravel}
            className="px-2.5 py-1.5 rounded-lg bg-[#181a24] hover:bg-[#222533] border border-[#2b3044] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Машина времени: откат на любой шаг назад"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#ffb703]" />
            <span className="hidden sm:inline">Шаг назад</span>
          </button>

          {/* Debriefing Button */}
          <button
            onClick={onOpenDebriefing}
            className="px-3 py-1.5 rounded-lg bg-[#181a24] hover:bg-[#222533] border border-[#2b3044] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Итоговая аналитика"
          >
            <Award className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Дебрифинг</span>
          </button>

          {/* BATNA Config */}
          <button
            onClick={onOpenAdmin}
            className="px-3 py-1.5 rounded-lg bg-[#7b2cbf]/20 hover:bg-[#7b2cbf]/35 border border-[#7b2cbf]/60 text-[#9d4edd] text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Настройка красных линий BATNA"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">BATNA</span>
          </button>
        </div>
      </header>

      {/* ================= MAIN SPLIT: COMBAT DIALOGUE (60%) & TELEMETRY (40%) ================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 p-3.5 overflow-hidden">
        {/* ================= LEFT 60% — COMBAT DIALOGUE ZONE ================= */}
        <section className="lg:col-span-7 xl:col-span-7 flex flex-col rounded-2xl border border-[#222638] bg-[#11131c] shadow-2xl overflow-hidden">
          {/* Subheader with Opponent identity & Step Counter */}
          <div className="px-4 py-2.5 border-b border-[#222638] bg-[#141724] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs">
                {config.opponentName.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Оппонент: {config.opponentName}</span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    [{config.opponentRole}]
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {config.zoneCluster} • «{config.opponentCompany}»
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">
                Шаг: <strong className="text-white">{messages[messages.length - 1]?.stepIndex || 0}</strong>
              </span>
              <button
                onClick={onOpenCaseInfo}
                className="text-[11px] text-[#00f0ff] hover:underline flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-950/40 border border-cyan-800/40 font-medium"
              >
                Условия ОЭЗ ↗
              </button>
            </div>
          </div>

          {/* ================= AGENDA MINI-TRACKER (ЧЕК-ЛИСТ ДОГОВОРЕННОСТЕЙ ВВЕРХУ ЧАТА) ================= */}
          <div className="px-3.5 py-2 border-b border-[#222638] bg-[#0c0e15] flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider mr-1">
              <ListTodo className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span>Повестка:</span>
            </div>

            {/* Item 1: Rate */}
            <div
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-all duration-300 ${
                agenda.rate.status === "agreed"
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-medium"
                  : agenda.rate.status === "in_progress"
                  ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                  : "bg-rose-950/40 border-rose-500/40 text-rose-300"
              }`}
            >
              <span>{agenda.rate.status === "agreed" ? "✓" : agenda.rate.status === "in_progress" ? "⏳" : "✕"}</span>
              <span className="font-bold">Ставка:</span>
              <span className="truncate max-w-[150px] sm:max-w-[190px]">
                {agenda.rate.status === "agreed" ? "Согласовано: 460 ₽/м²" : agenda.rate.detail}
              </span>
            </div>

            {/* Item 2: Grace Period */}
            <div
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-all duration-300 ${
                agenda.grace_period.status === "agreed"
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-medium"
                  : agenda.grace_period.status === "in_progress"
                  ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                  : "bg-rose-950/40 border-rose-500/40 text-rose-300"
              }`}
            >
              <span>{agenda.grace_period.status === "agreed" ? "✓" : agenda.grace_period.status === "in_progress" ? "⏳" : "✕"}</span>
              <span className="font-bold">Каникулы:</span>
              <span className="truncate max-w-[150px] sm:max-w-[190px]">
                {agenda.grace_period.status === "agreed" ? "Согласовано: 4 мес." : agenda.grace_period.detail}
              </span>
            </div>

            {/* Item 3: Power 8 MW & CAPEX */}
            <div
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-all duration-300 ${
                agenda.power_capex.status === "agreed"
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-medium"
                  : agenda.power_capex.status === "in_progress"
                  ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                  : "bg-rose-950/40 border-rose-500/40 text-rose-300"
              }`}
            >
              <span>{agenda.power_capex.status === "agreed" ? "✓" : agenda.power_capex.status === "in_progress" ? "⏳" : "✕"}</span>
              <span className="font-bold">Сети 8 МВт:</span>
              <span className="truncate max-w-[150px] sm:max-w-[200px]">
                {agenda.power_capex.status === "agreed" ? "Согласовано под CAPEX" : agenda.power_capex.detail}
              </span>
            </div>
          </div>

          {/* Live Message Area (Vertical messenger flow, zero dead space!) */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0a0c12]/80 flex flex-col">
            {messages.map((msg) => {
              const isUser = msg.actor === "USER";
              const isBars = msg.actor === "BARS";

              if (isBars) {
                // Living Mentor B.A.R.S. Avatar Message in Dialogue!
                return (
                  <div key={msg.id} className="flex gap-3 items-start my-1 max-w-[94%]">
                    {/* 3D Living Avatar Head of B.A.R.S. gesturing */}
                    <BarsAvatar animation={msg.barsAnimation || barsAnimation} size="md" />

                    <div className="flex-1 rounded-2xl p-4 bg-gradient-to-r from-[#1d1633] via-[#141624] to-[#0f111a] border border-[#7b2cbf] text-purple-100 shadow-[0_4px_20px_rgba(123,44,191,0.3)]">
                      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-purple-500/20 text-[11px] font-mono">
                        <span className="text-[#00f0ff] font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
                          Б.А.Р.С. (Бортовой Наставник ОЭЗ)
                        </span>
                        <span className="text-purple-300 text-[10px] px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-800">
                          {barsAnimation === "warn"
                            ? "ЖЕСТ: ТРЕВОГА / ОТРИЦАНИЕ"
                            : barsAnimation === "win"
                            ? "ЖЕСТ: ПОБЕДА"
                            : "ЖЕСТ: ОБЪЯСНЕНИЕ"}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-100 font-sans">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              }

              // User or Opponent message
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col group ${isUser ? "items-end" : "items-start"}`}
                >
                  {/* Sender Header Above Bubble */}
                  <div
                    className={`flex items-center gap-2 mb-1 text-[11px] font-mono px-1 ${
                      isUser ? "text-purple-300 flex-row-reverse" : "text-amber-300"
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      {isUser ? (
                        <>
                          <User className="w-3 h-3 text-[#00f0ff]" /> ВЫ (ОЭЗ «Алабуга»)
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3 text-amber-400" /> {config.opponentName}
                        </>
                      )}
                    </span>
                    <span className="text-slate-500 text-[10px]">Шаг {msg.stepIndex}</span>

                    {/* Time Travel Rewind Button on Hover */}
                    {msg.stepIndex > 0 && (
                      <button
                        onClick={() => onRollback(msg.stepIndex)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded bg-[#181a24] hover:bg-[#7b2cbf] text-slate-400 hover:text-white text-[10px] border border-slate-700 flex items-center gap-1"
                        title="Откатить переговоры к этому моменту"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Откатить сюда</span>
                      </button>
                    )}
                  </div>

                  {/* Bubble Content */}
                  <div
                    className={`max-w-[88%] rounded-2xl p-4 text-sm leading-relaxed select-text shadow-md transition-all ${
                      isUser
                        ? "bg-gradient-to-r from-[#7b2cbf] to-[#5a189a] border border-[#9d4edd]/50 text-white shadow-[0_4px_20px_rgba(123,44,191,0.25)] rounded-tr-sm"
                        : "bg-[#181b26] border border-[#2b3042] text-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.4)] rounded-tl-sm"
                    }`}
                  >
                    <p className="font-sans whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              );
            })}

            {/* AI Generation State */}
            {isLoading && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#141724] border border-[#7b2cbf]/50 max-w-sm shadow-lg animate-pulse">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-ping" />
                <span className="text-xs text-purple-200 font-mono">
                  Оппонент обдумывает контраргумент...
                </span>
              </div>
            )}

            {/* Outcome Banners */}
            {isDealClosed && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/80 text-center space-y-1.5 my-2 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                <div className="text-sm font-black text-emerald-400 tracking-wide uppercase">
                  СДЕЛКА УСПЕШНО ЗАКРЫТА!
                </div>
                <p className="text-xs text-slate-200">
                  Вы защитили минимальную ставку аренды и привлекли резидента на условиях ОЭЗ «Алабуга».
                </p>
                <button
                  onClick={onOpenDebriefing}
                  className="mt-2 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md transition-all"
                >
                  Открыть итоговый дебрифинг
                </button>
              </div>
            )}

            {isDealFailed && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/80 text-center space-y-1.5 my-2 shadow-[0_0_25px_rgba(255,51,102,0.3)]">
                <AlertTriangle className="w-7 h-7 text-rose-400 mx-auto" />
                <div className="text-sm font-black text-rose-400 tracking-wide uppercase">
                  ПЕРЕГОВОРЫ СОРВАНЫ
                </div>
                <p className="text-xs text-slate-200">
                  Напряжение превысило критический порог, либо оппонент вышел из переговорной комнаты.
                </p>
                <button
                  onClick={onOpenTimeTravel}
                  className="mt-2 px-4 py-1.5 rounded-lg bg-[#7b2cbf] hover:bg-[#9d4edd] text-white font-bold text-xs shadow-md flex items-center gap-1.5 mx-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Включить «Машину времени» и переиграть
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Living Mentor Companion Pod (Living Avatar gesturing and giving live advice) */}
          <div className="px-3.5 py-2.5 border-t border-[#222638] bg-[#141724] flex items-center gap-3 shadow-inner">
            <BarsAvatar animation={barsAnimation} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] font-mono mb-0.5">
                <span className="text-[#00f0ff] font-bold flex items-center gap-1">
                  <span>Б.А.Р.С.</span>
                  <span className="text-slate-400 font-normal">жестикулирует & анализирует:</span>
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                    barsAnimation === "warn"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : barsAnimation === "win"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-[#7b2cbf]/30 text-purple-200 border border-[#7b2cbf]/40"
                  }`}
                >
                  {barsAnimation === "warn"
                    ? "Угроза BATNA"
                    : barsAnimation === "win"
                    ? "Успех"
                    : "Анализ"}
                </span>
              </div>
              <p className="text-xs text-slate-200 truncate leading-snug">
                {barsFeedback}
              </p>
            </div>
            <button
              onClick={() => setInputText(quickTactics[0].text)}
              className="px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-xs font-semibold text-purple-200 flex items-center gap-1 shrink-0 transition-colors"
              title="Вставить сильный контраргумент"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span className="hidden sm:inline">Подсказка</span>
            </button>
          </div>

          {/* ================= SHORT, TACTICAL TEMPLATE CHIPS (БЕЗ ОБРЕЗАНИЯ) ================= */}
          {!isDealClosed && !isDealFailed && (
            <div className="p-2 border-t border-[#222638] bg-[#11131c] overflow-x-auto flex gap-2 scrollbar-none">
              <span className="text-[11px] text-[#00f0ff] font-mono shrink-0 flex items-center gap-1 pl-1 font-bold">
                <Zap className="w-3.5 h-3.5 text-[#ffb703]" /> Ходы:
              </span>
              {quickTactics.map((tac, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(tac.text)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-xl bg-[#181b26] hover:bg-[#7b2cbf]/40 hover:border-[#7b2cbf] border border-[#2b3042] text-slate-200 hover:text-white transition-all whitespace-nowrap shadow-sm font-medium"
                >
                  [{tac.label}]
                </button>
              ))}
            </div>
          )}

          {/* Combat Input Bar */}
          <div className="p-3 border-t border-[#222638] bg-[#141724] flex gap-2 items-center">
            <input
              type="text"
              placeholder={
                isDealClosed || isDealFailed
                  ? "Сессия завершена. Откатитесь назад или запустите новый раунд."
                  : "Введите вашу реплику, контраргумент или условие сделки..."
              }
              disabled={isLoading || isDealClosed || isDealFailed}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 px-4 py-3 rounded-xl bg-[#0a0c12] border border-[#282c3f] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] transition-colors disabled:opacity-50 font-sans"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading || isDealClosed || isDealFailed}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#7b2cbf] to-[#9d4edd] hover:from-[#9d4edd] hover:to-[#c77dff] disabled:opacity-40 text-white text-xs font-bold shadow-[0_0_15px_rgba(123,44,191,0.5)] flex items-center gap-2 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Отправить</span>
              <Send className="w-3.5 h-3.5 text-[#00f0ff]" />
            </button>
          </div>
        </section>

        {/* ================= RIGHT 40% — TACTICAL COMMAND & TELEMETRY HUB ================= */}
        <aside className="lg:col-span-5 xl:col-span-5 flex flex-col rounded-2xl border border-[#7b2cbf]/40 bg-[#11131c] shadow-2xl p-4 overflow-y-auto space-y-4">
          {/* Header of Tactical Module */}
          <div className="flex items-center justify-between border-b border-[#222638] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-pulse" />
              <h2 className="text-xs font-black uppercase tracking-wider text-white">
                ТАКТИЧЕСКИЙ ЦЕНТР
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300">
              ОЭЗ АЛАБУГА
            </span>
          </div>

          {/* Gamified Level & Matchup Card */}
          <div className="p-3.5 rounded-xl bg-[#141724] border border-[#282c3f] flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Уровень сложности спарринга:
              </div>
              <div className="text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
                <span>{diffBadge.icon}</span>
                <span>{diffBadge.label}</span>
              </div>
            </div>
            <button
              onClick={onOpenAdmin}
              className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-[#7b2cbf]/30 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              Изменить
            </button>
          </div>

          {/* Кибер-терминал: Телеметрия диалога (Контрастные градиенты) */}
          <div className="p-4 rounded-xl bg-[#0a0c12] border border-[#222638] space-y-4 shadow-inner">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
              <span className="flex items-center gap-1.5 text-[#00f0ff]">
                <Zap className="w-3.5 h-3.5 text-[#00f0ff]" /> ТЕЛЕМЕТРИЯ ПЕРЕГОВОРОВ
              </span>
              <span className="text-[10px] font-mono text-slate-500">LIVE FEED</span>
            </div>

            {/* Доверие (Trust) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> Доверие оппонента:
                </span>
                <span className="text-[#00f0ff] font-bold text-sm tracking-wider">
                  {metrics.trust}%
                </span>
              </div>
              <div className="w-full bg-[#181a24] h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_12px_rgba(0,240,255,0.6)]"
                  style={{
                    width: `${metrics.trust}%`,
                    transition: "all 0.5s ease-out",
                  }}
                />
              </div>
            </div>

            {/* Напряжение / Стресс (Tension) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Напряжение / Стресс:
                </span>
                <span className="text-rose-400 font-bold text-sm tracking-wider">
                  {metrics.tension}%
                </span>
              </div>
              <div className="w-full bg-[#181a24] h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_12px_rgba(255,51,102,0.6)]"
                  style={{
                    width: `${metrics.tension}%`,
                    transition: "all 0.5s ease-out",
                  }}
                />
              </div>
            </div>

            {/* Готовность к сделке (Deal Readiness) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Готовность к сделке:
                </span>
                <span className="text-emerald-400 font-bold text-sm tracking-wider">
                  {metrics.deal_readiness}%
                </span>
              </div>
              <div className="w-full bg-[#181a24] h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  style={{
                    width: `${metrics.deal_readiness}%`,
                    transition: "all 0.5s ease-out",
                  }}
                />
              </div>
            </div>
          </div>

          {/* BATNA & Красные линии ОЭЗ */}
          <div className="p-4 rounded-xl bg-[#141724] border border-[#2e3447] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-rose-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                КРАСНЫЕ ЛИНИИ (BATNA)
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                  agenda.rate.status === "agreed" && agenda.grace_period.status === "agreed"
                    ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                    : "bg-amber-950/60 text-amber-400 border-amber-800/40"
                }`}
              >
                {agenda.rate.status === "agreed" ? "ЗАЩИЩЕНА" : "ПОД ДАВЛЕНИЕМ"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#0a0c12] p-2.5 rounded-lg border border-[#222638]">
                <span className="text-slate-400 text-[10px] block">МИН. СТАВКА:</span>
                <span className="text-white font-bold text-sm">{config.batna.minPricePerSqm} ₽/м²</span>
              </div>
              <div className="bg-[#0a0c12] p-2.5 rounded-lg border border-[#222638]">
                <span className="text-slate-400 text-[10px] block">МАКС. КАНИКУЛЫ:</span>
                <span className="text-white font-bold text-sm">{config.batna.maxGracePeriodMonths} мес.</span>
              </div>
            </div>

            <div className="text-xs text-slate-300 pt-1 space-y-1.5 border-t border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Табу раунда:</div>
              {config.batna.redLines.map((line, idx) => (
                <div key={idx} className="text-[11px] text-rose-300 flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action to trigger debriefing or reset */}
          <div className="pt-1 flex gap-2">
            <button
              onClick={onOpenDebriefing}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#7b2cbf] to-[#5a189a] hover:from-[#9d4edd] hover:to-[#7b2cbf] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span>Итоговый дебрифинг</span>
            </button>
            <button
              onClick={onRestart}
              className="px-3 py-2.5 rounded-xl bg-[#181a24] hover:bg-[#222533] border border-[#2b3044] text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              title="Начать сессию заново"
            >
              Сброс
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
