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
import { ScenarioConfiguratorScreen } from "./components/ScenarioConfiguratorScreen";

export default function App() {
  // Scenario Config (defaults to first preset: Индустриальный парк «Синергия»)
  const [config, setConfig] = useState<AdminScenarioConfig>(PRESET_SCENARIOS[0]);
  const [isConfiguratorView, setIsConfiguratorView] = useState<boolean>(false);

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
  const [hiddenNeedsDiscovered, setHiddenNeedsDiscovered] = useState<boolean>(false);
  const [activeCounterOffer, setActiveCounterOffer] = useState<number>(300);

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
            hiddenNeedsDiscovered,
            activeCounterOffer,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.hidden_need_revealed) {
        setHiddenNeedsDiscovered(true);
      }
      if (data.active_counter_offer) {
        setActiveCounterOffer(data.active_counter_offer);
      }

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
  const handleRestart = (targetConfig?: AdminScenarioConfig) => {
    const activeCfg = targetConfig || config;
    setTimerSeconds(258);
    setHiddenNeedsDiscovered(false);
    setActiveCounterOffer(activeCfg.batna.minPricePerSqm ? activeCfg.batna.minPricePerSqm - 100 : 300);

    const welcomeBars: Message = {
      id: `init_bars_${Date.now()}`,
      actor: "BARS",
      text: activeCfg.initialBarsAdvice || `Приветствую на новом раунде по кейсу «${activeCfg.title}»! Я на связи. Сложность оппонента: ${activeCfg.difficulty}. Слежу за твоей BATNA. Поехали!`,
      timestamp: Date.now(),
      stepIndex: 0,
      snapshotMetrics: { ...initialMetrics },
      barsAnimation: "talk",
    };

    const resetOpponentMsg: Message = {
      id: `init_opp_${Date.now() + 1}`,
      actor: "OPPONENT",
      text: activeCfg.initialOpponentUtterance || `Приветствую. Давайте сразу к делу по площадке «${activeCfg.zoneCluster}». Каковы ваши встречные предложения по льготной ставке?`,
      timestamp: Date.now() + 1,
      stepIndex: 0,
      snapshotMetrics: { ...initialMetrics },
    };

    setMessages([welcomeBars, resetOpponentMsg]);
    setMetrics({ ...initialMetrics });
    setAgenda(initialAgenda);
    setBarsFeedback(activeCfg.initialBarsAdvice || "Сессия перезапущена. Б.А.Р.С. готов к тактическому анализу.");
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
    handleRestart(newConfig);
  };

  // Calculate Debriefing with strict realistic evaluation
  const calculateDebriefing = (): DebriefingAnalytics => {
    const userMessages = messages.filter((m) => m.actor === "USER");
    const userStepCount = userMessages.length;
    const opponentMessages = messages.filter((m) => m.actor === "OPPONENT");

    const tensionAvg =
      messages.reduce((acc, m) => acc + m.snapshotMetrics.tension, 0) / (messages.length || 1);
    const stressScore = Math.max(0, Math.min(100, Math.round(100 - tensionAvg)));

    // Count deflected manipulations
    let manipulationsCount = 0;
    const allOpponentText = opponentMessages.map((m) => m.text).join(" ");
    if (allOpponentText.includes("осведомлены о проблемах с мощностями в Калужской")) {
      manipulationsCount += 1;
    }
    if (allOpponentText.includes("вижу, что вы держите удар и уполномочены")) {
      manipulationsCount += 1;
    }
    if (allOpponentText.includes("в спешке завод на 12 000 м² не проектируют")) {
      manipulationsCount += 1;
    }

    // Check if true pain was discovered
    const painDiscovered =
      hiddenNeedsDiscovered ||
      allOpponentText.includes("совет директоров зажал меня в тиски") ||
      allOpponentText.includes("кровь из носу нужно запуститься в 3 квартале");

    // Check if mutual trade-offs were applied
    const tradeOffsEnforced =
      agenda.rate.status === "agreed" &&
      agenda.grace_period.status === "agreed" &&
      agenda.power_capex.status === "agreed";

    // BATNA Score calculation
    let batnaScore = 50;
    if (isDealClosed) {
      batnaScore = 95;
    } else if (agenda.rate.status === "agreed") {
      batnaScore = 80;
    } else if (metrics.deal_readiness >= 60) {
      batnaScore = 70;
    } else if (isDealFailed) {
      batnaScore = 35;
    }

    // Hurried closing warning
    let hurriedWarning: string | undefined;
    if (isDealClosed && userStepCount < 6) {
      hurriedWarning =
        "Сделка закрыта слишком поспешно: вы не проверили платежеспособность инвестора и не заложили штрафные санкции за срыв сроков пусконаладки.";
    }

    // Strict rating calculation
    let rating: "S" | "A" | "B" | "C" | "F" = "C";
    if (isDealFailed) {
      rating = "F";
    } else if (isDealClosed) {
      if (
        userStepCount >= 6 &&
        painDiscovered &&
        manipulationsCount >= 2 &&
        timeTravelRollbacksCount <= 1
      ) {
        rating = "S";
      } else if (userStepCount >= 5 && (painDiscovered || manipulationsCount >= 1)) {
        rating = "A";
      } else {
        rating = "B";
      }
    } else if (metrics.deal_readiness >= 60) {
      rating = "B";
    }

    // Summary text
    let summary = "";
    if (rating === "S") {
      summary =
        "ИДЕАЛЬНЫЙ ТАКТИЧЕСКИЙ РАУНД (Ранг S): Вы провели полноценные 6-8 раундов жестких B2B-переговоров, вскрыли истинную BATNA инвестора (критичность ввода к 3 кварталу из-за контрактов на станки), успешно парировали манипуляции оппонента и добились взаимного размена уступок (460 ₽/м² и 8 МВт под гарантии 1.2 млрд ₽ и кадры «Алабуга Политех»).";
    } else if (hurriedWarning) {
      summary =
        "ПРЕДОСТЕРЕЖЕНИЕ НАСТАВНИКА: " +
        hurriedWarning +
        " В жестких промышленных переговорах поспешное согласие на 4 шагах снижает рейтинг надежности контракта.";
    } else if (rating === "A") {
      summary =
        "УСПЕШНОЕ СОГЛАСОВАНИЕ (Ранг A): Основные красные линии ОЭЗ защищены, однако оппонент несколько раз пытался навязать свою повестку. Рекомендуется глубже зондировать скрытые риски партнера.";
    } else {
      summary =
        "В ходе сессии зафиксирована потеря инициативы или срыв критических требований BATNA. Воспользуйтесь рекомендациями Б.А.Р.С. и попробуйте альтернативную ветку диалога.";
    }

    const keyStrengths: string[] = [];
    if (painDiscovered) keyStrengths.push("Вскрыта скрытая боль: дедлайн запуска оборудования к Q3");
    if (manipulationsCount > 0) keyStrengths.push(`Отражено манипуляций и стресс-тестов: ${manipulationsCount}`);
    if (agenda.rate.status === "agreed") keyStrengths.push("Ставка зафиксирована на уровне BATNA (460 ₽/м²)");
    if (tradeOffsEnforced) keyStrengths.push("Взаимный размен уступок без бесплатной сдачи позиций");
    if (keyStrengths.length === 0) keyStrengths.push("Сохранение базовой линии диалога");

    const areasForGrowth: string[] = [];
    if (userStepCount < 6) {
      areasForGrowth.push("Не спешить с закрытием: генеральный директор требует 6–8 раундов проработки");
    }
    if (!painDiscovered) {
      areasForGrowth.push("Задавать открытые калибровочные вопросы о сроках и структуре окупаемости");
    }
    if (manipulationsCount < 2) {
      areasForGrowth.push("Хладнокровно разбивать блеф конкурентов (Калуга, дефицит 110 кВ)");
    }
    if (timeTravelRollbacksCount > 2) {
      areasForGrowth.push("Снизить количество откатов назад: вырабатывайте интуицию с первого дубля");
    }

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
      barsExecutiveSummary: summary,
      keyStrengths,
      areasForGrowth,
      hurriedWarning,
      manipulationsHandledCount: manipulationsCount,
      hiddenNeedsDiscovered: painDiscovered,
      mutualTradeOffsEnforced: tradeOffsEnforced,
    };
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0c12] text-slate-100 select-none">
      {isConfiguratorView ? (
        <ScenarioConfiguratorScreen
          onStartSimulation={(newConfig) => {
            setConfig(newConfig);
            setIsConfiguratorView(false);
            handleRestart(newConfig);
          }}
        />
      ) : (
        /* ARENA COMBAT INTERFACE */
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
          onRestart={() => handleRestart()}
          onOpenConfigurator={() => setIsConfiguratorView(true)}
        />
      )}

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
