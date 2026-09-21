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
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  X,
  Activity,
  Mic,
  Shield,
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
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [bottomSheetTab, setBottomSheetTab] = useState<"telemetry" | "batna" | "agenda">("telemetry");
  const [isBarsHudCollapsed, setIsBarsHudCollapsed] = useState(false);
  const [isBarsModalOpen, setIsBarsModalOpen] = useState(false);

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

  // Extract initials for opponent avatar badge
  const opponentInitials =
    config.opponentName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ОП";

  // Dynamic tactical chips tailored to current case
  const getDynamicTactics = () => {
    if (config.id === "robotics_procurement") {
      return [
        {
          label: "Вскрыть боль: квоты",
          text: "Чжан Вэй, давайте начистоту: какова реальная загрузка шанхайской линии и почему вы избегаете ответственности за сроки?",
        },
        {
          label: "Штраф 0.2% за день",
          text: "ОЭЗ не может рисковать простоем цехов. Мы согласуем контракт только при наличии штрафа 0.2% за каждый день задержки ПНР.",
        },
        {
          label: "Кадры «Политеха»",
          text: "Мы берем 40 роботов только с условием бесплатного сертифицированного курса для 50 студентов и инженеров «Алабуга Политех».",
        },
        {
          label: "Склад запчастей",
          text: "Обязательное условие резидентов — гарантийный склад критических сервоприводов и плат непосредственно на территории ОЭЗ.",
        },
        {
          label: "30% постоплата",
          text: "Финальный транш 30% мы перечисляем строго после успешного 72-часового непрерывного стресс-теста роботов на линии.",
        },
      ];
    }
    if (config.id === "retention_lead_engineer") {
      return [
        {
          label: "Вскрыть боль: рутина",
          text: "Артем, я понимаю твою усталость от ночных аварий. Дело только в деньгах или в том, что ты погряз в операционке вместо архитектуры?",
        },
        {
          label: "Лидерство R&D ИИ",
          text: "Мы отдаем тебе карт-бланш: ты возглавляешь разработку новой системы ИИ-диспетчеризации энергосетей ОЭЗ как технический лидер.",
        },
        {
          label: "3 стажера Политеха",
          text: "Мы снимаем с тебя ночные дежурства: закрепляем за тобой 3 лучших выпускников «Алабуга Политех», чтобы они закрывали рутину.",
        },
        {
          label: "Оклад +20% и KPI",
          text: "Мы поднимаем фиксированный оклад на 20% плюс закладываем квартальный бонус за ключевые вехи запуска SCADA.",
        },
        {
          label: "Гибридный график",
          text: "Ты сможешь работать гибко, но минимум 2 дня в неделю быть очно для координации команды и критических тестов.",
        },
      ];
    }
    if (config.id === "internal_capex_dispute") {
      return [
        {
          label: "Вскрыть страх проверки",
          text: "Михаил, мы ценим вашу щепетильность к ГОСТам. Скажите прямо: какой конкретный узел вызывает наибольшие опасения у технадзора?",
        },
        {
          label: "Стройконтроль",
          text: "Мы привлекаем аккредитованный независимый технадзор за счет фонда оптимизации, чтобы снять с вас единоличную ответственность.",
        },
        {
          label: "Премия монтажникам",
          text: "Мы выделяем целевой фонд премирования подрядчикам за работу в 2 смены без нарушения технологических пауз бетонирования.",
        },
        {
          label: "Ввод без сдвига",
          text: "Контрактные обязательства перед резидентами не допускают сдвига на 6 месяцев. Давайте утвердим параллельный монтаж ячеек 110 кВ.",
        },
      ];
    }
    // Default synergy tenant
    return [
      {
        label: "Вскрыть боль: Q3",
        text: "Валерий, давайте начистоту: для вас критичнее ставка или гарантированный ввод завода к 3 кварталу?",
      },
      {
        label: "Отразить Калугу",
        text: "В Калуге нет свободной подстанции 110 кВ на границе площадки, а у нас она уже введена в эксплуатацию и готова к подключению.",
      },
      {
        label: "Ставка 460 ₽ + Политех",
        text: "Мы готовы зафиксировать базовую ставку 460 ₽/м² в обмен на резерв 250 рабочих мест через «Алабуга Политех» и гарантию сроков сдачи корпуса.",
      },
      {
        label: "Каникулы 4 мес",
        text: "12 месяцев каникул исключены регламентом ОЭЗ. Мы согласовываем 4 месяца с приоритетным допуском шеф-монтажа станков.",
      },
      {
        label: "8 МВт под CAPEX 1.2 млрд",
        text: "Подвод 8 МВт мощности мы обеспечим в приоритетном порядке, но только под взаимное обязательство CAPEX не менее 1.2 млрд рублей.",
      },
      {
        label: "Фиксация протокола",
        text: "Если ключевые параметры ставки 460 ₽, каникул 4 месяца и CAPEX 1.2 млрд согласованы, предлагаю зафиксировать их в итоговом соглашении.",
      },
    ];
  };

  const quickTactics = getDynamicTactics();

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "Гендиректор Алабуги":
        return {
          bg: "bg-rose-950/80 text-rose-300 border-rose-500/60",
          icon: "🔥",
          label: "Гендиректор Алабуги (Хардкор)",
        };
      case "Прожжённый закупщик":
        return {
          bg: "bg-amber-950/80 text-amber-300 border-amber-500/60",
          icon: "⚡",
          label: "Прожжённый закупщик (Высокая)",
        };
      default:
        return {
          bg: "bg-cyan-950/80 text-cyan-300 border-cyan-500/60",
          icon: "🔹",
          label: "Новичок ОЭЗ (Базовая)",
        };
    }
  };

  const diffBadge = getDifficultyBadge(config.difficulty);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#0a0c12] text-slate-100 relative">
      {/* ========================================================================= */}
      {/* 1. MOBILE NATIVE APP HEADER (< lg) — Height <= 60px, Clean & Informative */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-[#0d0f17]/95 backdrop-blur-md border-b border-[#202538] px-3 py-2 flex items-center justify-between min-h-[56px] lg:hidden shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Back button to Configurator */}
          <button
            onClick={onOpenConfigurator}
            className="p-1.5 -ml-1 text-slate-400 hover:text-white active:scale-95 transition-all"
            title="К конфигуратору арены"
          >
            <ArrowLeft className="w-5 h-5 text-[#00f0ff]" />
          </button>

          {/* Opponent Avatar with online status */}
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center font-bold text-amber-300 text-xs shadow-inner">
              {opponentInitials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0d0f17] shadow-[0_0_6px_#10b981]" />
          </div>

          {/* Name & compact 1-line parameters */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-[200px]">
                {config.opponentName}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap font-medium">
                {config.personalityTone.split("/")[0].trim()}
              </span>
            </div>

            {/* Checklist in 1 line */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mt-0.5 truncate">
              <span
                className={
                  agenda.rate.status === "agreed"
                    ? "text-emerald-400 font-bold"
                    : "text-rose-400 font-medium"
                }
              >
                {agenda.rate.status === "agreed" ? "460₽" : "300₽"}
              </span>
              <span>•</span>
              <span
                className={
                  agenda.grace_period.status === "agreed"
                    ? "text-emerald-400 font-bold"
                    : "text-amber-400 font-medium"
                }
              >
                {agenda.grace_period.status === "agreed" ? "4м" : "12м"}
              </span>
              <span>•</span>
              <span className="text-cyan-400 font-semibold">
                Trust: {metrics.trust}%
              </span>
            </div>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Telemetry quick toggle button */}
          <button
            onClick={() => {
              setBottomSheetTab("telemetry");
              setIsBottomSheetOpen(true);
            }}
            className="px-2 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-[#00f0ff] text-[11px] font-mono font-bold flex items-center gap-1 active:scale-95 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
            title="Открыть шторку телеметрии и BATNA"
          >
            <Activity className="w-3 h-3 text-[#00f0ff]" />
            <span>{metrics.trust}%</span>
          </button>

          {/* Case info */}
          <button
            onClick={onOpenCaseInfo}
            className="p-1.5 rounded-lg bg-[#181a24] text-slate-300 hover:text-white border border-[#2b3044] active:scale-95"
            title="Инфо о кейсе"
          >
            <Info className="w-4 h-4 text-[#00f0ff]" />
          </button>

          {/* Timer */}
          <div className="px-2 py-1 rounded-lg bg-[#0c0e14] border border-[#232738] text-[11px] font-mono text-[#00f0ff]">
            {formatTimer(timerSeconds)}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE MINI-HUD Б.А.Р.С. (< lg) — Collapsible & High-impact */}
      {/* ========================================================================= */}
      <div className="lg:hidden px-3 py-1.5 bg-gradient-to-r from-[#171328] via-[#101321] to-[#0c0e17] border-b border-[#7b2cbf]/30 flex items-center justify-between text-xs shrink-0 shadow-sm">
        <div
          className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
          onClick={() => setIsBarsModalOpen(true)}
        >
          <div className="w-6 h-6 rounded-lg bg-[#7b2cbf]/30 border border-[#7b2cbf]/60 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#00f0ff] animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-[#00f0ff] uppercase tracking-wider">
                Mini-HUD Б.А.Р.С.
              </span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  barsAnimation === "warn"
                    ? "bg-rose-950/60 text-rose-300 border border-rose-500/40"
                    : barsAnimation === "win"
                    ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                    : "bg-purple-950/60 text-purple-300 border border-purple-500/40"
                }`}
              >
                {barsAnimation === "warn"
                  ? "ОПАСНОСТЬ"
                  : barsAnimation === "win"
                  ? "УСПЕХ"
                  : "АНАЛИЗ"}
              </span>
            </div>
            {!isBarsHudCollapsed && (
              <p className="text-[11px] text-slate-200 truncate mt-0.5 font-sans">
                «{barsFeedback}»
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={() => setIsBarsHudCollapsed(!isBarsHudCollapsed)}
            className="p-1 rounded text-slate-400 hover:text-slate-200"
            title={isBarsHudCollapsed ? "Развернуть Mini-HUD" : "Свернуть Mini-HUD"}
          >
            {isBarsHudCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DESKTOP TOPBAR (>= lg) — Full Tactical War Room Header */}
      {/* ========================================================================= */}
      <header className="hidden lg:flex px-4 py-3 border-b border-[#202538] bg-[#0d0f17] items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7b2cbf] to-[#00f0ff] p-[1px] flex items-center justify-center shadow-[0_0_15px_rgba(123,44,191,0.5)]">
            <div className="w-full h-full bg-[#0d0f17] rounded-[11px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#00f0ff]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider uppercase text-white">
                АРЕНА ПЕРЕГОВОРОВ ОЭЗ «АЛАБУГА»
              </h1>
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

        {/* Desktop Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Countdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c0e14] border border-[#232738] text-xs font-mono text-[#00f0ff] shadow-inner">
            <Clock className="w-3.5 h-3.5 text-[#00f0ff] animate-pulse" />
            <span className="font-bold tracking-wider">{formatTimer(timerSeconds)}</span>
          </div>

          <button
            onClick={onOpenCaseInfo}
            className="px-2.5 py-1.5 rounded-lg bg-[#181a24] hover:bg-[#222533] border border-[#2b3044] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Диспозиция кейса и цели ОЭЗ"
          >
            <Info className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>Инфо</span>
          </button>

          <button
            onClick={onOpenTimeTravel}
            className="px-2.5 py-1.5 rounded-lg bg-[#181a24] hover:bg-[#222533] border border-[#2b3044] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Машина времени: откат назад"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#ffb703]" />
            <span>Откат</span>
          </button>

          <button
            onClick={onOpenDebriefing}
            className="px-3 py-1.5 rounded-lg bg-[#181a24] hover:bg-[#222533] border border-[#2b3044] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Итоговая аналитика"
          >
            <Award className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Дебрифинг</span>
          </button>

          <button
            onClick={onOpenConfigurator}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#7b2cbf]/30 to-[#00f0ff]/20 hover:brightness-125 border border-[#00f0ff]/50 text-[#00f0ff] text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,240,255,0.25)]"
            title="Открыть Конфигуратор сценария / Панель администратора"
          >
            <Sliders className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>Конфигуратор</span>
          </button>

          <button
            onClick={onOpenAdmin}
            className="px-2.5 py-1.5 rounded-lg bg-[#181a24] hover:bg-[#222533] border border-[#2b3044] text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Настройка красных линий BATNA"
          >
            <span className="font-mono text-[11px]">BATNA</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 4. MAIN CONTENT AREA (Mobile: Full-screen Chat | Desktop: 60/40 Split)    */}
      {/* ========================================================================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-3.5 p-0 lg:p-3.5 overflow-hidden">
        {/* ================= LEFT 60% (Full width on mobile) — COMBAT DIALOGUE ZONE ================= */}
        <section className="lg:col-span-7 xl:col-span-7 flex flex-col rounded-none lg:rounded-2xl border-0 lg:border border-[#222638] bg-[#11131c] shadow-2xl overflow-hidden h-full">
          {/* Desktop Subheader with Opponent identity (hidden on mobile) */}
          <div className="hidden lg:flex px-4 py-2.5 border-b border-[#222638] bg-[#141724] items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs">
                {opponentInitials}
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

          {/* Desktop Agenda Mini-Tracker (hidden on mobile, accessible via drawer) */}
          <div className="hidden lg:flex px-3.5 py-2 border-b border-[#222638] bg-[#0c0e15] flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider mr-1">
              <ListTodo className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span>Повестка:</span>
            </div>

            {/* Rate */}
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

            {/* Grace Period */}
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

            {/* Power 8 MW */}
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

          {/* ================= LIVE MESSAGE AREA (85% of screen on mobile) ================= */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 bg-[#0a0c12]/80 flex flex-col">
            {messages.map((msg) => {
              const isUser = msg.actor === "USER";
              const isBars = msg.actor === "BARS";

              if (isBars) {
                // Mentor B.A.R.S. Advice Bubble
                return (
                  <div key={msg.id} className="flex gap-2.5 sm:gap-3 items-start my-1 max-w-[95%] sm:max-w-[90%]">
                    <BarsAvatar animation={msg.barsAnimation || barsAnimation} size="sm" />
                    <div className="flex-1 rounded-2xl p-3 sm:p-4 bg-gradient-to-r from-[#1d1633] via-[#141624] to-[#0f111a] border border-[#7b2cbf]/80 text-purple-100 shadow-[0_4px_20px_rgba(123,44,191,0.25)]">
                      <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-purple-500/20 text-[10px] sm:text-[11px] font-mono">
                        <span className="text-[#00f0ff] font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
                          Б.А.Р.С. (Наставник ОЭЗ)
                        </span>
                        <span className="text-purple-300 text-[9px] px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-800">
                          {barsAnimation === "warn"
                            ? "ТРЕВОГА"
                            : barsAnimation === "win"
                            ? "ПОБЕДА"
                            : "СОВЕТ"}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-100 font-sans">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              }

              // User or Opponent message bubble
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col group ${isUser ? "items-end" : "items-start"}`}
                >
                  {/* Sender Label Above Bubble */}
                  <div
                    className={`flex items-center gap-2 mb-1 text-[10px] sm:text-[11px] font-mono px-1 ${
                      isUser ? "text-purple-300 flex-row-reverse" : "text-amber-300"
                    }`}
                  >
                    <span className="font-bold">
                      {isUser ? "Вы (Переговорщик ОЭЗ)" : config.opponentName}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Bubble Body */}
                  <div
                    className={`p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[88%] sm:max-w-[80%] shadow-lg ${
                      isUser
                        ? "bg-gradient-to-r from-[#7b2cbf] to-[#5a189a] text-white rounded-tr-xs border border-purple-400/30"
                        : "bg-[#161926] text-slate-100 rounded-tl-xs border border-[#2b3044]"
                    }`}
                  >
                    <p className="font-sans whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#141724] border border-amber-500/30 text-amber-300 text-xs w-fit animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>{config.opponentName} анализирует условия...</span>
              </div>
            )}

            {/* Outcome Banners */}
            {isDealClosed && (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/80 text-center space-y-1.5 my-2 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                <div className="text-sm font-black text-emerald-400 tracking-wide uppercase">
                  СДЕЛКА УСПЕШНО ЗАКРЫТА!
                </div>
                <p className="text-xs text-slate-200">
                  Вы защитили минимальную ставку аренды и привлекли резидента на условиях ОЭЗ «Алабуга».
                </p>
                <button
                  onClick={onOpenDebriefing}
                  className="mt-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Открыть итоговый дебрифинг
                </button>
              </div>
            )}

            {isDealFailed && (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/80 text-center space-y-1.5 my-2 shadow-[0_0_25px_rgba(255,51,102,0.3)]">
                <AlertTriangle className="w-7 h-7 text-rose-400 mx-auto" />
                <div className="text-sm font-black text-rose-400 tracking-wide uppercase">
                  ПЕРЕГОВОРЫ СОРВАНЫ
                </div>
                <p className="text-xs text-slate-200">
                  Напряжение превысило критический порог, либо оппонент вышел из переговорной комнаты.
                </p>
                <button
                  onClick={onOpenTimeTravel}
                  className="mt-2 px-4 py-2 rounded-lg bg-[#7b2cbf] hover:bg-[#9d4edd] text-white font-bold text-xs shadow-md flex items-center gap-1.5 mx-auto active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Включить «Машину времени» и переиграть
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Desktop Mentor Advice Pod (hidden on mobile since we have Mini-HUD) */}
          <div className="hidden lg:flex px-3.5 py-2.5 border-t border-[#222638] bg-[#141724] items-center gap-3 shadow-inner shrink-0">
            <BarsAvatar animation={barsAnimation} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] font-mono mb-0.5">
                <span className="text-[#00f0ff] font-bold flex items-center gap-1">
                  <span>Б.А.Р.С.</span>
                  <span className="text-slate-400 font-normal">анализирует ход:</span>
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
              <span>Подсказка</span>
            </button>
          </div>

          {/* ================= 5. FIXED BOTTOM CHAT BAR (Mobile & Desktop) ================= */}
          <div className="sticky bottom-0 z-20 bg-[#0d0f17]/95 backdrop-blur-md border-t border-[#222638] shrink-0">
            {/* Horizontal Scrollable Chips Row */}
            {!isDealClosed && !isDealFailed && (
              <div className="px-2.5 py-1.5 overflow-x-auto flex gap-1.5 scrollbar-none border-b border-[#1c2030]">
                <span className="text-[10px] text-[#00f0ff] font-mono shrink-0 flex items-center gap-1 font-bold pr-0.5">
                  <Zap className="w-3 h-3 text-[#ffb703]" /> Ход:
                </span>
                {quickTactics.map((tac, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputText(tac.text)}
                    className="shrink-0 text-[11px] px-2.5 py-1 rounded-lg bg-[#171a26] hover:bg-[#7b2cbf]/30 hover:border-[#7b2cbf] border border-[#2b3044] text-slate-200 hover:text-white transition-all whitespace-nowrap active:scale-95 shadow-xs font-medium"
                  >
                    {tac.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Row with Touch Accessibility */}
            <div className="p-2 sm:p-3 flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  isDealClosed || isDealFailed
                    ? "Переговоры завершены"
                    : "Введите ответ или условие сделки..."
                }
                disabled={isLoading || isDealClosed || isDealFailed}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 px-3.5 py-2.5 sm:py-3 rounded-xl bg-[#090b10] border border-[#24293c] text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] transition-colors disabled:opacity-50 font-sans"
              />

              {/* Quick Spoken / Mic Hint Button */}
              <button
                type="button"
                onClick={() => {
                  const randomTactic = quickTactics[Math.floor(Math.random() * quickTactics.length)].text;
                  setInputText(randomTactic);
                }}
                disabled={isLoading || isDealClosed || isDealFailed}
                className="w-10 h-10 rounded-xl bg-[#171a26] border border-[#2b3044] text-slate-300 hover:text-[#00f0ff] flex items-center justify-center shrink-0 active:scale-95 transition-all"
                title="Сгенерировать реплику аргумента"
              >
                <Mic className="w-4 h-4 text-purple-400" />
              </button>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading || isDealClosed || isDealFailed}
                className="h-10 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-[#7b2cbf] to-[#9d4edd] hover:brightness-110 active:scale-95 disabled:opacity-40 text-white text-xs font-bold shadow-[0_0_15px_rgba(123,44,191,0.5)] flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="hidden xs:inline">Отправить</span>
                <Send className="w-4 h-4 text-[#00f0ff]" />
              </button>
            </div>

            {/* ================= MOBILE BOTTOM ACTION BAR (< lg) ================= */}
            <div className="grid grid-cols-5 gap-1 px-2 py-1.5 bg-[#090b10] border-t border-[#1a1d2c] lg:hidden text-[10px] font-medium">
              <button
                onClick={() => {
                  setBottomSheetTab("telemetry");
                  setIsBottomSheetOpen(true);
                }}
                className="py-1 px-1 rounded-lg flex flex-col items-center gap-0.5 text-slate-400 hover:text-[#00f0ff] active:bg-white/5 transition-all"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate">Метрики</span>
              </button>

              <button
                onClick={() => {
                  setBottomSheetTab("batna");
                  setIsBottomSheetOpen(true);
                }}
                className="py-1 px-1 rounded-lg flex flex-col items-center gap-0.5 text-slate-400 hover:text-emerald-400 active:bg-white/5 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">BATNA</span>
              </button>

              <button
                onClick={() => {
                  setBottomSheetTab("agenda");
                  setIsBottomSheetOpen(true);
                }}
                className="py-1 px-1 rounded-lg flex flex-col items-center gap-0.5 text-slate-400 hover:text-amber-400 active:bg-white/5 transition-all"
              >
                <ListTodo className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate">Повестка</span>
              </button>

              <button
                onClick={onOpenTimeTravel}
                className="py-1 px-1 rounded-lg flex flex-col items-center gap-0.5 text-slate-400 hover:text-purple-400 active:bg-white/5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#ffb703]" />
                <span className="truncate">Откат</span>
              </button>

              <button
                onClick={onOpenDebriefing}
                className="py-1 px-1 rounded-lg flex flex-col items-center gap-0.5 text-slate-400 hover:text-rose-400 active:bg-white/5 transition-all"
              >
                <Award className="w-3.5 h-3.5 text-rose-400" />
                <span className="truncate">Дебрифинг</span>
              </button>
            </div>
          </div>
        </section>

        {/* ================= RIGHT 40% (DESKTOP ONLY >= lg) — TACTICAL COMMAND & TELEMETRY ================= */}
        <aside className="hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col rounded-2xl border border-[#7b2cbf]/40 bg-[#11131c] shadow-2xl p-4 overflow-y-auto space-y-4">
          {/* Header */}
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

          {/* Телеметрия диалога */}
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

            {/* Напряжение (Tension) */}
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

          {/* Action buttons */}
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

      {/* ========================================================================= */}
      {/* 6. MOBILE BOTTOM SHEET (DRAWER) FOR TELEMETRY, BATNA & AGENDA            */}
      {/* ========================================================================= */}
      {isBottomSheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs transition-opacity lg:hidden"
            onClick={() => setIsBottomSheetOpen(false)}
          />

          {/* Slide-up Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-3xl bg-[#0f121e] border-t border-[#7b2cbf]/60 shadow-[0_-12px_45px_rgba(0,0,0,0.9)] flex flex-col lg:hidden transition-transform animate-in slide-in-from-bottom duration-200">
            {/* Handle Bar */}
            <div className="pt-3 pb-1 flex justify-center cursor-pointer" onClick={() => setIsBottomSheetOpen(false)}>
              <div className="w-12 h-1.5 rounded-full bg-slate-600" />
            </div>

            {/* Header */}
            <div className="px-4 py-2 border-b border-[#222638] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Тактический Центр ОЭЗ
                </h3>
              </div>
              <button
                onClick={() => setIsBottomSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-[#181a24] border border-[#2b3044] text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Switcher */}
            <div className="grid grid-cols-3 gap-1 p-2 bg-[#090b10] border-b border-[#202538] text-xs">
              <button
                onClick={() => setBottomSheetTab("telemetry")}
                className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                  bottomSheetTab === "telemetry"
                    ? "bg-[#7b2cbf] text-white shadow-[0_0_12px_rgba(123,44,191,0.5)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Телеметрия</span>
              </button>
              <button
                onClick={() => setBottomSheetTab("batna")}
                className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                  bottomSheetTab === "batna"
                    ? "bg-[#7b2cbf] text-white shadow-[0_0_12px_rgba(123,44,191,0.5)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>BATNA</span>
              </button>
              <button
                onClick={() => setBottomSheetTab("agenda")}
                className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                  bottomSheetTab === "agenda"
                    ? "bg-[#7b2cbf] text-white shadow-[0_0_12px_rgba(123,44,191,0.5)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ListTodo className="w-3.5 h-3.5" />
                <span>Повестка</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-4 overflow-y-auto space-y-4 max-h-[60vh]">
              {bottomSheetTab === "telemetry" && (
                <div className="space-y-4">
                  {/* Status card */}
                  <div className="p-3 rounded-xl bg-[#141724] border border-[#282c3f] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Оппонент</div>
                      <div className="text-xs font-bold text-white mt-0.5">
                        {config.opponentName} ({config.opponentRole})
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${diffBadge.bg}`}>
                      {diffBadge.icon} {diffBadge.label.split(" ")[0]}
                    </span>
                  </div>

                  {/* Trust */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">Доверие оппонента (Trust):</span>
                      <span className="text-[#00f0ff] font-bold">{metrics.trust}%</span>
                    </div>
                    <div className="w-full bg-[#181a24] h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                        style={{ width: `${metrics.trust}%` }}
                      />
                    </div>
                  </div>

                  {/* Tension */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">Напряжение / Стресс (Tension):</span>
                      <span className="text-rose-400 font-bold">{metrics.tension}%</span>
                    </div>
                    <div className="w-full bg-[#181a24] h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_10px_rgba(255,51,102,0.5)]"
                        style={{ width: `${metrics.tension}%` }}
                      />
                    </div>
                  </div>

                  {/* Deal Readiness */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">Готовность к сделке:</span>
                      <span className="text-emerald-400 font-bold">{metrics.deal_readiness}%</span>
                    </div>
                    <div className="w-full bg-[#181a24] h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        style={{ width: `${metrics.deal_readiness}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {bottomSheetTab === "batna" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#141724] border border-[#2b3044] flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Статус защиты BATNA</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                        agenda.rate.status === "agreed"
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                          : "bg-amber-950/60 text-amber-400 border-amber-800/40"
                      }`}
                    >
                      {agenda.rate.status === "agreed" ? "ЗАЩИЩЕНА" : "ПОД ДАВЛЕНИЕМ"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-[#090b10] p-3 rounded-xl border border-[#222638]">
                      <span className="text-slate-400 text-[10px] block">МИН. СТАВКА:</span>
                      <span className="text-white font-bold text-base">{config.batna.minPricePerSqm} ₽/м²</span>
                    </div>
                    <div className="bg-[#090b10] p-3 rounded-xl border border-[#222638]">
                      <span className="text-slate-400 text-[10px] block">МАКС. КАНИКУЛЫ:</span>
                      <span className="text-white font-bold text-base">{config.batna.maxGracePeriodMonths} мес.</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#222638]">
                    <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                      Красные линии ОЭЗ (Табу):
                    </div>
                    {config.batna.redLines.map((line, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[#141724] border border-[#2b3044] text-xs text-slate-200 flex items-start gap-2">
                        <span className="text-rose-400 font-bold shrink-0">✕</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bottomSheetTab === "agenda" && (
                <div className="space-y-2.5">
                  <div className="text-xs text-slate-400">
                    Статус согласования ключевых пунктов протокола разногласий:
                  </div>

                  {/* Rate */}
                  <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    agenda.rate.status === "agreed"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                      : "bg-[#141724] border-[#2b3044] text-slate-300"
                  }`}>
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{agenda.rate.status === "agreed" ? "✓" : "⏳"}</span>
                        <span>Ставка аренды</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{agenda.rate.detail}</div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/40">
                      {agenda.rate.status === "agreed" ? "Согласовано" : "В процессе"}
                    </span>
                  </div>

                  {/* Grace Period */}
                  <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    agenda.grace_period.status === "agreed"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                      : "bg-[#141724] border-[#2b3044] text-slate-300"
                  }`}>
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{agenda.grace_period.status === "agreed" ? "✓" : "⏳"}</span>
                        <span>Арендные каникулы</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{agenda.grace_period.detail}</div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/40">
                      {agenda.grace_period.status === "agreed" ? "Согласовано" : "В процессе"}
                    </span>
                  </div>

                  {/* Power & CAPEX */}
                  <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    agenda.power_capex.status === "agreed"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                      : "bg-[#141724] border-[#2b3044] text-slate-300"
                  }`}>
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{agenda.power_capex.status === "agreed" ? "✓" : "⏳"}</span>
                        <span>Электросети 8 МВт и CAPEX</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{agenda.power_capex.detail}</div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/40">
                      {agenda.power_capex.status === "agreed" ? "Согласовано" : "В процессе"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions inside Sheet */}
            <div className="p-3 border-t border-[#222638] bg-[#0c0e14] flex gap-2">
              <button
                onClick={() => {
                  setIsBottomSheetOpen(false);
                  onOpenDebriefing();
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#7b2cbf] to-[#00f0ff] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <Award className="w-4 h-4" />
                <span>Итоговый дебрифинг</span>
              </button>
              <button
                onClick={() => {
                  setIsBottomSheetOpen(false);
                  onOpenTimeTravel();
                }}
                className="px-4 py-3 rounded-xl bg-[#171a26] border border-[#2b3044] text-slate-200 text-xs font-medium flex items-center gap-1 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#ffb703]" />
                <span>Откат</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 7. MOBILE B.A.R.S. FULL ADVICE MODAL                                      */}
      {/* ========================================================================= */}
      {isBarsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#12141f] border border-[#7b2cbf] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#232738] pb-3">
              <div className="flex items-center gap-2.5">
                <BarsAvatar animation={barsAnimation} size="sm" />
                <div>
                  <h4 className="text-sm font-bold text-white">Б.А.Р.С. Наставник</h4>
                  <p className="text-[11px] text-purple-300 font-mono">Тактический разбор текущего шага</p>
                </div>
              </div>
              <button
                onClick={() => setIsBarsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1c2030] text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090b10] border border-[#24283b] text-xs leading-relaxed text-slate-200 space-y-2">
              <p className="font-medium text-white">Рекомендация аналитика:</p>
              <p className="text-slate-300 font-sans">«{barsFeedback}»</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Рекомендуемый ход:</div>
              <button
                onClick={() => {
                  setInputText(quickTactics[0].text);
                  setIsBarsModalOpen(false);
                }}
                className="w-full text-left p-2.5 rounded-xl bg-[#181b28] hover:bg-[#7b2cbf]/20 border border-purple-500/30 text-xs text-slate-200 hover:text-white transition-all"
              >
                {quickTactics[0].text}
              </button>
            </div>

            <button
              onClick={() => setIsBarsModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#7b2cbf] hover:bg-[#9d4edd] text-white font-bold text-xs transition-all"
            >
              Понятно, продолжить раунд
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
