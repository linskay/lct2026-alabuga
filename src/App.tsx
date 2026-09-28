import React, { useState, useEffect } from "react";
import {
  AdminScenarioConfig,
  Message,
  NegotiationMetrics,
  BarsAnimationState,
  NegotiationSessionSnapshot,
  DebriefingAnalytics,
  NegotiationAgenda,
  Achievement,
  ZopaState,
} from "./types";
import { PRESET_SCENARIOS } from "./data/scenarios";
import { ArenaScreenView } from "./components/ArenaScreenView";
import { AdminConfigModal } from "./components/AdminConfigModal";
import { TimeTravelTree } from "./components/TimeTravelTree";
import { DebriefingModal } from "./components/DebriefingModal";
import { CaseInfoModal } from "./components/CaseInfoModal";
import { ScenarioConfiguratorScreen } from "./components/ScenarioConfiguratorScreen";
import { HomeScreen } from "./components/HomeScreen";
import { AdminScreen } from "./components/AdminScreen";
import { generateDynamicCaseHints } from "./utils/dynamicHints";

export enum Screen {
  Home = "Home",
  Arena = "Arena",
  Admin = "Admin",
}

export default function App() {
  // Navigation: start on HomeScreen by default
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Home);

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
    emotion: "attack",
    emotionLabel: "Первый выпад / Давление",
    emotionEmoji: "😠",
    contextHints: generateDynamicCaseHints(PRESET_SCENARIOS[0]),
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

  // New ZOPA & Latency & Offline mode states
  const [zopa, setZopa] = useState<ZopaState | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [modelName, setModelName] = useState<string>("meta-llama/llama-3.1-8b-instruct:free");
  const [providerName, setProviderName] = useState<string>("openrouter");
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  // Query initial provider on mount
  useEffect(() => {
    fetch("/api/provider")
      .then((res) => res.json())
      .then((data) => {
        if (data.activeProvider === "fallback") {
          setIsOfflineMode(true);
          setProviderName("fallback");
          setModelName("Autonomous Engine (Offline)");
        } else {
          setIsOfflineMode(false);
          setProviderName(data.activeProvider || "openrouter");
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleOfflineMode = async () => {
    const nextMode = !isOfflineMode;
    try {
      const res = await fetch("/api/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: nextMode ? "fallback" : null }),
      });
      const data = await res.json();
      setIsOfflineMode(data.activeProvider === "fallback");
      setProviderName(data.activeProvider);
      if (data.activeProvider === "fallback") {
        setModelName("Autonomous Engine (Offline)");
      } else {
        setModelName(data.activeProvider === "gemini" ? "gemini-3.8-flash" : "meta-llama/llama-3.1-8b-instruct:free");
      }
    } catch (err) {
      console.error("Failed to switch provider:", err);
    }
  };

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
    setBarsAnimation("thinking");

    try {
      let data: any = null;
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

        const contentType = response.headers.get("content-type") || "";
        if (response.ok && contentType.includes("application/json")) {
          data = await response.json();
        }
      } catch (fetchErr) {
        console.warn("API request failed, switching to local state engine:", fetchErr);
      }

      // If network or server didn't return valid JSON, compute deterministic local fallback
      if (!data || !data.opponent_reply) {
        const lower = text.toLowerCase();
        let fallbackReply = "Ваше предложение требует дополнительного анализа. 400 ₽ за квадратный метр — наш ориентир, но назовите конкретные встречные уступки по срокам и сетям.";
        let fallbackFeedback = "Оппонент держит оборону. Удерживайте ставку 460 ₽/м² и проверьте его скрытую потребность по срокам запуска.";
        let fallbackAnimation = "talk";
        let newTrust = metrics.trust;
        let newTension = metrics.tension;
        let newReadiness = metrics.deal_readiness;

        if (lower.includes("460")) {
          fallbackReply = "460 ₽/м² — это серьезная планка. Чем вы обоснуете такую цену по сравнению с предложениями в других регионах?";
          fallbackFeedback = "Позиция по ставке обозначена. Подкрепите 460 ₽ надежностью подстанций ОЭЗ и гарантией ввода корпуса!";
          newTrust = Math.min(100, newTrust + 5);
          newReadiness = Math.min(100, newReadiness + 5);
        } else if (lower.includes("каникул") || lower.includes("срок")) {
          fallbackReply = "По каникулам мы готовы обсуждать оптимизацию графика, если вы гарантируете шеф-монтаж без задержек.";
          fallbackFeedback = "Диалог перешел в конструктивное русло. Фиксируйте каникулы не более 4 месяцев.";
          newTrust = Math.min(100, newTrust + 8);
          newTension = Math.max(0, newTension - 5);
        }

        data = {
          opponent_reply: fallbackReply,
          bars_feedback: fallbackFeedback,
          bars_animation: fallbackAnimation,
          metrics: { trust: newTrust, tension: newTension, deal_readiness: newReadiness },
          agenda,
          is_deal_closed: false,
          is_deal_failed: false,
        };
      }

      if (data.methodology_tag) {
        userMessage.methodologyTag = data.methodology_tag;
      }
      if (data.zopa) {
        setZopa(data.zopa);
      }
      if (data.latency_ms !== undefined) {
        setLatencyMs(data.latency_ms);
      }
      if (data.model_name) {
        setModelName(data.model_name);
      }
      if (data.provider_name) {
        setProviderName(data.provider_name);
        setIsOfflineMode(data.provider_name === "fallback");
      }

      if (data.hidden_need_revealed) {
        setHiddenNeedsDiscovered(true);
      }
      if (data.active_counter_offer) {
        setActiveCounterOffer(data.active_counter_offer);
      }

      // Determine emotion classification
      let emotion: "attack" | "compromise" | "bluff" | "neutral" = data.emotion || "neutral";
      let emotionLabel = data.emotion_label;
      let emotionEmoji = data.emotion_emoji;

      if (!emotionLabel) {
        if (data.manipulation_type === "bluff" || data.opponent_reply?.includes("Калуг")) {
          emotion = "bluff";
          emotionLabel = "Блеф конкурентами";
          emotionEmoji = "⚠️";
        } else if (data.bars_animation === "warn" || data.metrics?.tension >= 60) {
          emotion = "attack";
          emotionLabel = "Несогласие";
          emotionEmoji = "😠";
        } else if (data.bars_animation === "win" || data.metrics?.deal_readiness >= 65 || data.is_deal_closed) {
          emotion = "compromise";
          emotionLabel = "Заинтересован";
          emotionEmoji = "🤝";
        } else {
          emotion = "neutral";
          emotionLabel = "Позиция";
          emotionEmoji = "💬";
        }
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
        emotion,
        emotionLabel,
        emotionEmoji,
        contextHints:
          Array.isArray(data.context_hints) && data.context_hints.length > 0
            ? data.context_hints
            : generateDynamicCaseHints(config, updatedMessages, emotion, data.is_deal_closed),
      };

      const newHistory = [...updatedMessages, opponentMessage];

      setMessages(newHistory);
      setMetrics(data.metrics);
      if (data.agenda) {
        setAgenda(data.agenda);
      } else if (data.agenda_status && Array.isArray(data.agenda_status)) {
        // Map dynamic agenda_status array to agenda object
        setAgenda((prev) => {
          const next = { ...prev };
          data.agenda_status.forEach((item: any) => {
            const topic = (item.topic || "").toLowerCase();
            const status: "agreed" | "in_progress" | "disputed" =
              item.status === "agreed"
                ? "agreed"
                : item.status === "rejected"
                ? "disputed"
                : "in_progress";

            if (topic.includes("ставк") || topic.includes("цен") || topic.includes("аренд") || topic.includes("rate")) {
              next.rate = { ...next.rate, status, detail: `${item.topic}: ${status === "agreed" ? "Согласовано" : "В процессе торга"}` };
            } else if (topic.includes("каникул") || topic.includes("срок") || topic.includes("grace")) {
              next.grace_period = { ...next.grace_period, status, detail: `${item.topic}: ${status === "agreed" ? "Согласовано" : "В процессе торга"}` };
            } else if (topic.includes("мощност") || topic.includes("capex") || topic.includes("инвестиц") || topic.includes("сет") || topic.includes("power")) {
              next.power_capex = { ...next.power_capex, status, detail: `${item.topic}: ${status === "agreed" ? "Согласовано" : "В процессе торга"}` };
            }
          });
          return next;
        });
      }
      setBarsFeedback(data.bars_feedback);

      let nextRobotAnim: BarsAnimationState = "talk";
      if (data.is_deal_closed) {
        nextRobotAnim = "win";
      } else if (data.is_deal_failed) {
        nextRobotAnim = "death";
      } else if (data.methodology_tag?.category === "ERROR") {
        nextRobotAnim = "warn";
      } else if (data.manipulation_type === "bluff" || emotion === "bluff") {
        nextRobotAnim = "warn";
      } else if (emotion === "attack" || (data.metrics && data.metrics.tension >= 65)) {
        nextRobotAnim = "warn";
      } else if (data.methodology_tag?.type === "positive") {
        nextRobotAnim = "wave";
      } else {
        nextRobotAnim = data.bars_animation || "talk";
      }

      setBarsAnimation(nextRobotAnim);
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
      contextHints: generateDynamicCaseHints(activeCfg),
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

    const achievements: Achievement[] = [
      {
        id: "batna_shield",
        title: "Железная BATNA",
        subtitle: "Несокрушимая защита ОЭЗ",
        description: "Удержал базовую ставку не ниже 460 ₽/м² и лимит каникул, не сдав красные линии ОЭЗ «Алабуга».",
        imageUrl: "/achievements/batna_shield.jpg",
        isUnlocked: agenda.rate.status === "agreed" || batnaScore >= 80,
        tier: "epic",
        conditionText: "Зафиксировать ставку от 460 ₽/м² (BATNA)",
      },
      {
        id: "bluff_buster",
        title: "Детектор лжи",
        subtitle: "Калужский блеф-бастер",
        description: "Хладнокровно парировал блеф оппонента о конкурентах, используя факты о дефиците мощностей 110 кВ.",
        imageUrl: "/achievements/bluff_buster.jpg",
        isUnlocked: manipulationsCount >= 1,
        tier: "rare",
        conditionText: "Отразить минимум 1 манипуляцию или блеф",
      },
      {
        id: "hidden_pain",
        title: "Рентген потребностей",
        subtitle: "Истинная цель раскрыта",
        description: "Вскрыл скрытую боль инвестора: критическую зависимость от сроков ввода оборудования к 3-му кварталу.",
        imageUrl: "/achievements/hidden_pain.jpg",
        isUnlocked: painDiscovered,
        tier: "rare",
        conditionText: "Выявить скрытую боль и истинный дедлайн",
      },
      {
        id: "power_capex",
        title: "Энергетический барон",
        subtitle: "8 МВт под 1.2 млрд ₽",
        description: "Не уступил бесплатные энергомощности, а разменял подключение 8 МВт на встречные инвестиции 1.2 млрд ₽.",
        imageUrl: "/achievements/power_capex.jpg",
        isUnlocked: agenda.power_capex.status === "agreed",
        tier: "epic",
        conditionText: "Связать 8 МВт с обязательством CAPEX 1.2 млрд ₽",
      },
      {
        id: "grandmaster_s",
        title: "Гроссмейстер Алабуги",
        subtitle: "Безупречный ранг S",
        description: "Провел глубокие жесткие переговоры (6+ раундов), раскрыл боли, парировал атаки и закрыл идеальную сделку.",
        imageUrl: "/achievements/grandmaster_s.jpg",
        isUnlocked: rating === "S",
        tier: "legendary",
        conditionText: "Получить высший ранг S (6+ раундов без спешки)",
      },
    ];

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
      achievements,
    };
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0c12] text-slate-100 select-none">
      {currentScreen === Screen.Home && (
        <HomeScreen
          onEnterArena={() => setCurrentScreen(Screen.Arena)}
          onOpenAdmin={() => setCurrentScreen(Screen.Admin)}
        />
      )}

      {currentScreen === Screen.Admin && (
        <AdminScreen
          currentConfig={config}
          onBackToHome={() => setCurrentScreen(Screen.Home)}
          onStartSimulation={(newConfig) => {
            setConfig(newConfig);
            handleRestart(newConfig);
            setCurrentScreen(Screen.Arena);
          }}
        />
      )}

      {currentScreen === Screen.Arena && (
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
          zopa={zopa}
          latencyMs={latencyMs}
          modelName={modelName}
          providerName={providerName}
          isOfflineMode={isOfflineMode}
          onToggleOfflineMode={handleToggleOfflineMode}
          onSendMessage={handleSendMessage}
          onRollback={handleRollback}
          onOpenCaseInfo={() => setIsCaseInfoOpen(true)}
          onOpenAdmin={() => setCurrentScreen(Screen.Admin)}
          onOpenTimeTravel={() => setIsTimeTravelOpen(true)}
          onOpenDebriefing={() => setIsDebriefingOpen(true)}
          onRestart={() => handleRestart()}
          onOpenConfigurator={() => setCurrentScreen(Screen.Admin)}
          onBackToHome={() => setCurrentScreen(Screen.Home)}
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
        scenario={config}
        agenda={agenda}
        isOpen={isDebriefingOpen}
        onClose={() => setIsDebriefingOpen(false)}
        onRestart={handleRestart}
      />
    </div>
  );
}
