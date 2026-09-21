import React, { useState, useEffect } from "react";
import {
  AdminScenarioConfig,
  Message,
  NegotiationMetrics,
  BarsAnimationState,
  NegotiationSessionSnapshot,
  DebriefingAnalytics,
  NegotiationAgenda,
} from "./types";
import { PRESET_SCENARIOS } from "./data/scenarios";
import { ArenaScreenView } from "./components/ArenaScreenView";
import { AdminConfigModal } from "./components/AdminConfigModal";
import { TimeTravelTree } from "./components/TimeTravelTree";
import { DebriefingModal } from "./components/DebriefingModal";
import { CaseInfoModal } from "./components/CaseInfoModal";

export default function App() {
  // Scenario Config (defaults to first preset: Индустриальный парк «Синергия»)
  const [config, setConfig] = useState<AdminScenarioConfig>(PRESET_SCENARIOS[0]);

  // Round Timer: default 4 minutes 18 seconds (258s)
  const [timerSeconds, setTimerSeconds] = useState<number>(258);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial metrics
  const initialMetrics: NegotiationMetrics = {
    trust: 55,
    tension: 35,
    deal_readiness: 40,
  };

  // Initial Agenda (Чек-лист договоренностей)
  const initialAgenda: NegotiationAgenda = {
    rate: {
      id: "rate",
      title: "Арендная ставка",
      status: "disputed",
      detail: "Оппонент требует 300 ₽/м² (BATNA: от 460 ₽)",
    },
    grace_period: {
      id: "grace_period",
      title: "Каникулы на пусконаладку",
      status: "in_progress",
      detail: "Оппонент требует 12 мес. (BATNA: до 4 мес.)",
    },
    power_capex: {
      id: "power_capex",
      title: "Электросети 8 МВт & CAPEX",
      status: "disputed",
      detail: "Оппонент требует бесплатный подвод",
    },
  };

  // 1. Приветствие от живого робота-наставника Б.А.Р.С.
  const initialBarsWelcome: Message = {
    id: "init_bars_welcome",
    actor: "BARS",
    text: "Приветствую на Арене переговоров ОЭЗ «Алабуга»! Я Б.А.Р.С. — твой живой бортовой наставник и тактик. Буду жестикулировать, анализировать каждое слово оппонента и страховать твои красные линии. Главное правило: не опускай базовую ставку ниже 460 ₽/м² и держи арендные каникулы до 4 месяцев. Оппонент уже вошел в переговорную — парируй его первый выпад!",
    timestamp: Date.now() - 2500,
    stepIndex: 0,
    snapshotMetrics: { ...initialMetrics },
    barsAnimation: "talk",
  };

  // 2. Первый выпад оппонента
  const initialOpponentMessage: Message = {
    id: "init_msg_0",
    actor: "OPPONENT",
    text: "Добрый день. Наша корпорация рассматривает несколько площадок в ПФО. Мы готовы зайти в индустриальный парк «Синергия» на 12 000 м², но ваши базовые ставки аренды завышены минимум на 35%. Требуем скидку до 300 руб/м² и 12 месяцев каникул на пусконаладку. Что скажете?",
    timestamp: Date.now(),
    stepIndex: 0,
    snapshotMetrics: { ...initialMetrics },
  };

  const [messages, setMessages] = useState<Message[]>([initialBarsWelcome, initialOpponentMessage]);
  const [metrics, setMetrics] = useState<NegotiationMetrics>({ ...initialMetrics });
  const [agenda, setAgenda] = useState<NegotiationAgenda>(initialAgenda);
  const [barsFeedback, setBarsFeedback] = useState<string>(
    "Оппонент с порога атакует арендную ставку! Не оправдывайся и не сдавай минимальный порог BATNA (460 ₽/м²). Напомни о готовых мощностях 110 кВ и кадрах «Алабуга Политех»."
  );
  const [barsAnimation, setBarsAnimation] = useState<BarsAnimationState>("idle");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDealClosed, setIsDealClosed] = useState<boolean>(false);
  const [isDealFailed, setIsDealFailed] = useState<boolean>(false);

  // Time-travel snapshots
  const [snapshots, setSnapshots] = useState<NegotiationSessionSnapshot[]>([
    {
      step: 0,
      messages: [initialBarsWelcome, initialOpponentMessage],
      metrics: { ...initialMetrics },
      lastBarsFeedback: "Старт переговоров",
      lastBarsAnimation: "idle",
      agenda: initialAgenda,
      timestamp: Date.now(),
    },
  ]);
  const [timeTravelRollbacksCount, setTimeTravelRollbacksCount] = useState<number>(0);

  // Modals
  const [isCaseInfoOpen, setIsCaseInfoOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTimeTravelOpen, setIsTimeTravelOpen] = useState(false);
  const [isDebriefingOpen, setIsDebriefingOpen] = useState(false);

  // Send turn to backend
  const handleSendMessage = async (text: string) => {
    const currentStep = messages[messages.length - 1]?.stepIndex || 0;
    const nextStep = currentStep + 1;

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      actor: "USER",
      text,
      timestamp: Date.now(),
      stepIndex: nextStep,
      snapshotMetrics: { ...metrics },
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setBarsAnimation("talk");

    try {
      const response = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: updatedMessages,
          context: {
            ...config,
            currentMetrics: metrics,
            agenda,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const opponentMessage: Message = {
        id: `msg_opp_${Date.now()}`,
        actor: "OPPONENT",
        text: data.opponent_reply,
        timestamp: Date.now(),
        stepIndex: nextStep,
        snapshotMetrics: { ...data.metrics },
        tacticalNote: data.bars_feedback,
        barsAnimation: data.bars_animation,
      };

      const newHistory = [...updatedMessages, opponentMessage];

      // If B.A.R.S. triggers a warning, win, or critical feedback, insert a living mentor bubble
      if (data.bars_animation === "warn" || data.bars_animation === "win" || nextStep % 2 === 0) {
        const barsMessage: Message = {
          id: `msg_bars_${Date.now() + 1}`,
          actor: "BARS",
          text: data.bars_feedback,
          timestamp: Date.now() + 1,
          stepIndex: nextStep,
          snapshotMetrics: { ...data.metrics },
          barsAnimation: data.bars_animation,
        };
        newHistory.push(barsMessage);
      }

      setMessages(newHistory);
      setMetrics(data.metrics);
      if (data.agenda) {
        setAgenda(data.agenda);
      }
      setBarsFeedback(data.bars_feedback);
      setBarsAnimation(data.bars_animation || "talk");
      setIsDealClosed(data.is_deal_closed);
      setIsDealFailed(data.is_deal_failed);

      // Save step snapshot for Time-travel
      setSnapshots((prev) => [
        ...prev,
        {
          step: nextStep,
          messages: newHistory,
          metrics: data.metrics,
          lastBarsFeedback: data.bars_feedback,
          lastBarsAnimation: data.bars_animation,
          agenda: data.agenda || agenda,
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      console.error("Negotiation turn error:", error);
      setBarsFeedback("Б.А.Р.С. перехватил сессию. Сформируйте следующий аргумент.");
      setBarsAnimation("warn");
    } finally {
      setIsLoading(false);
    }
  };

  // Time-travel rollback handler
  const handleRollback = (targetStep: number) => {
    const snapshot = snapshots.find((s) => s.step === targetStep);
    if (!snapshot) return;

    setTimeTravelRollbacksCount((prev) => prev + 1);

    const prunedMessages = messages.filter((m) => m.stepIndex <= targetStep);
    setMessages(prunedMessages);
    setMetrics({ ...snapshot.metrics });
    if (snapshot.agenda) {
      setAgenda(snapshot.agenda);
    }
    setBarsFeedback(
      `«Машина времени» вернула состояние к шагу №${targetStep}. Сформируйте альтернативную реплику.`
    );
    setBarsAnimation("talk");
    setIsDealClosed(false);
    setIsDealFailed(false);
    setSnapshots((prev) => prev.filter((s) => s.step <= targetStep));
  };

  // Restart session
  const handleRestart = () => {
    setTimerSeconds(258);
    const welcomeBars: Message = {
      id: `init_bars_${Date.now()}`,
      actor: "BARS",
      text: `Приветствую на новом раунде по кейсу «${config.title}»! Я на связи. Сложность оппонента: ${config.difficulty}. Слежу за твоей BATNA. Поехали!`,
      timestamp: Date.now(),
      stepIndex: 0,
      snapshotMetrics: { ...initialMetrics },
      barsAnimation: "talk",
    };

    const resetOpponentMsg: Message = {
      id: `init_opp_${Date.now() + 1}`,
      actor: "OPPONENT",
      text: `Приветствую. Давайте сразу к делу по площадке «${config.zoneCluster}». Каковы ваши встречные предложения по льготной ставке?`,
      timestamp: Date.now() + 1,
      stepIndex: 0,
      snapshotMetrics: { ...initialMetrics },
    };

    setMessages([welcomeBars, resetOpponentMsg]);
    setMetrics({ ...initialMetrics });
    setAgenda(initialAgenda);
    setBarsFeedback("Сессия перезапущена. Б.А.Р.С. готов к тактическому анализу.");
    setBarsAnimation("idle");
    setIsDealClosed(false);
    setIsDealFailed(false);
    setSnapshots([
      {
        step: 0,
        messages: [welcomeBars, resetOpponentMsg],
        metrics: { ...initialMetrics },
        lastBarsFeedback: "Старт переговоров",
        lastBarsAnimation: "idle",
        agenda: initialAgenda,
        timestamp: Date.now(),
      },
    ]);
  };

  // Save new scenario config
  const handleSaveConfig = (newConfig: AdminScenarioConfig) => {
    setConfig(newConfig);
    handleRestart();
  };

  // Calculate Debriefing
  const calculateDebriefing = (): DebriefingAnalytics => {
    const tensionAvg =
      messages.reduce((acc, m) => acc + m.snapshotMetrics.tension, 0) / (messages.length || 1);
    const stressScore = Math.max(0, Math.min(100, Math.round(100 - tensionAvg)));
    const batnaScore = isDealFailed ? 45 : metrics.trust >= 60 ? 95 : 75;

    let rating: "S" | "A" | "B" | "C" | "F" = "C";
    if (isDealClosed && timeTravelRollbacksCount === 0) rating = "S";
    else if (isDealClosed) rating = "A";
    else if (metrics.deal_readiness >= 60) rating = "B";
    else if (isDealFailed) rating = "F";

    return {
      finalOutcome: isDealClosed ? "WON" : isDealFailed ? "FAILED" : "IN_PROGRESS",
      totalSteps: messages[messages.length - 1]?.stepIndex || 0,
      timeTravelUsedCount: timeTravelRollbacksCount,
      trustProgression: messages.map((m) => m.snapshotMetrics.trust),
      tensionProgression: messages.map((m) => m.snapshotMetrics.tension),
      readinessProgression: messages.map((m) => m.snapshotMetrics.deal_readiness),
      batnaScore,
      stressManagementScore: stressScore,
      overallRating: rating,
      barsExecutiveSummary:
        "В ходе раунда продемонстрировано строгое удержание красной линии по арендной ставке ОЭЗ. Аргументация через энергомощности 110 кВ и кадровый ресурс «Алабуга Политех» позволила перехватить инициативу.",
      keyStrengths: [
        "Ставка удержана выше порога BATNA (460 ₽/м²)",
        "Отказ от односторонних уступок по каникулам",
        "Своевременная фиксация инвестиционных обязательств",
      ],
      areasForGrowth: [
        "Не затягивать стадию выяснения скрытых мотивов оппонента",
        "Четче формулировать дедлайны подписания протокола",
      ],
    };
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0c12] text-slate-100 select-none">
      {/* ARENA COMBAT INTERFACE */}
      <ArenaScreenView
        config={config}
        messages={messages}
        metrics={metrics}
        agenda={agenda}
        barsFeedback={barsFeedback}
        barsAnimation={barsAnimation}
        isLoading={isLoading}
        isDealClosed={isDealClosed}
        isDealFailed={isDealFailed}
        timerSeconds={timerSeconds}
        onSendMessage={handleSendMessage}
        onRollback={handleRollback}
        onOpenCaseInfo={() => setIsCaseInfoOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenTimeTravel={() => setIsTimeTravelOpen(true)}
        onOpenDebriefing={() => setIsDebriefingOpen(true)}
        onRestart={handleRestart}
      />

      {/* MODALS */}
      <CaseInfoModal
        config={config}
        isOpen={isCaseInfoOpen}
        onClose={() => setIsCaseInfoOpen(false)}
      />

      <AdminConfigModal
        currentConfig={config}
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onSave={handleSaveConfig}
      />

      <TimeTravelTree
        messages={messages}
        snapshots={snapshots}
        currentStep={messages[messages.length - 1]?.stepIndex || 0}
        onRollback={handleRollback}
        isOpen={isTimeTravelOpen}
        onClose={() => setIsTimeTravelOpen(false)}
      />

      <DebriefingModal
        analytics={calculateDebriefing()}
        isOpen={isDebriefingOpen}
        onClose={() => setIsDebriefingOpen(false)}
        onRestart={handleRestart}
      />
    </div>
  );
}
