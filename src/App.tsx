import React, { useState, useEffect } from "react";
import {
  AdminScenarioConfig,
  Message,
  NegotiationMetrics,
  BarsAnimationState,
  NegotiationSessionSnapshot,
  DebriefingAnalytics,
  NegotiationAgenda,
  AgendaTopicItem,
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

  // Helper to build initial agenda from scenario
  const buildInitialAgenda = (cfg: AdminScenarioConfig): NegotiationAgenda => {
    const topics = cfg.agendaTopics || [];
    const t0 = topics[0] || { id: "topic_1", title: "Ключевое условие", status: "disputed" as const, target: "По регламенту", detail: "В процессе торга" };
    const t1 = topics[1] || { id: "topic_2", title: "Дополнительное условие", status: "in_progress" as const, target: "По регламенту", detail: "В процессе торга" };
    const t2 = topics[2] || { id: "topic_3", title: "Гарантии и KPI", status: "disputed" as const, target: "По регламенту", detail: "В процессе торга" };
    return {
      rate: {
        id: t0.id,
        title: t0.title,
        status: t0.status,
        detail: t0.detail || ("target" in t0 ? (t0 as any).target : "По регламенту"),
      },
      grace_period: {
        id: t1.id,
        title: t1.title,
        status: t1.status,
        detail: t1.detail || ("target" in t1 ? (t1 as any).target : "По регламенту"),
      },
      power_capex: {
        id: t2.id,
        title: t2.title,
        status: t2.status,
        detail: t2.detail || ("target" in t2 ? (t2 as any).target : "По регламенту"),
      },
    };
  };

  const defaultPreset = PRESET_SCENARIOS[0];
  const initialAgenda: NegotiationAgenda = buildInitialAgenda(defaultPreset);

  // 1. Приветствие от живого робота-наставника Б.А.Р.С.
  const initialBarsWelcome: Message = {
    id: "init_bars_welcome",
    actor: "BARS",
    text: defaultPreset.initialBarsAdvice || `Приветствую на Арене переговоров ОЭЗ «Алабуга»! Я Б.А.Р.С. — твой живой бортовой наставник и тактик. Буду жестикулировать, анализировать каждое слово оппонента и страховать твои красные линии BATNA. Оппонент уже вошел в переговорную — парируй его первый выпад!`,
    timestamp: Date.now() - 2500,
    stepIndex: 0,
    snapshotMetrics: { ...initialMetrics },
    barsAnimation: "talk",
  };

  // 2. Первый выпад оппонента
  const initialOpponentMessage: Message = {
    id: "init_msg_0",
    actor: "OPPONENT",
    text: defaultPreset.initialOpponentUtterance || "Добрый день. Обозначьте ваши стартовые условия.",
    timestamp: Date.now(),
    stepIndex: 0,
    snapshotMetrics: { ...initialMetrics },
    emotion: "attack",
    emotionLabel: "Первый выпад / Давление",
    emotionEmoji: "😠",
    dynamicHints: defaultPreset.initialDynamicHints ? [...defaultPreset.initialDynamicHints] : [],
    contextHints: defaultPreset.initialDynamicHints ? [...defaultPreset.initialDynamicHints] : [],
  };

  const [messages, setMessages] = useState<Message[]>([initialBarsWelcome, initialOpponentMessage]);
  const [metrics, setMetrics] = useState<NegotiationMetrics>({ ...initialMetrics });
  const [agenda, setAgenda] = useState<NegotiationAgenda>(initialAgenda);
  const [agendaTopics, setAgendaTopics] = useState<AgendaTopicItem[]>(
    defaultPreset.agendaTopics ? [...defaultPreset.agendaTopics] : []
  );
  const [barsFeedback, setBarsFeedback] = useState<string>(
    defaultPreset.initialBarsAdvice || "Оппонент готов к переговорам. Защищайте красные линии BATNA!"
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
      lastBarsFeedback: defaultPreset.initialBarsAdvice || "Старт переговоров",
      lastBarsAnimation: "idle",
      agenda: initialAgenda,
      agendaTopics: defaultPreset.agendaTopics ? [...defaultPreset.agendaTopics] : [],
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
              agendaTopics,
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
        const oppName = config.opponentName.split(" ")[0] || "Коллега";
        const isArtem = config.opponentName.toLowerCase().includes("артем") || config.id === "retention_lead_engineer";
        const isZhang = config.opponentName.toLowerCase().includes("чжан") || config.id === "robotics_procurement";
        const isMikhail = config.opponentName.toLowerCase().includes("михаил") || config.id === "internal_capex_dispute";

        let fallbackReply = `Ваше предложение требует детального анализа. Назовите встречные условия и гарантии со стороны ОЭЗ.`;
        let fallbackFeedback = `Оппонент держит позицию. Опирайтесь на ключевые преимущества ОЭЗ и защищайте BATNA!`;
        let fallbackAnimation = "talk";
        let newTrust = metrics.trust;
        let newTension = metrics.tension;
        let newReadiness = metrics.deal_readiness;
        let generatedFallbackHints: string[] = [];

        if (isArtem) {
          if (lower.includes("оклад") || lower.includes("зарплат") || lower.includes("денег") || lower.includes("20%")) {
            fallbackReply = "Вы предлагаете прибавку к окладу, но финтех дает мне +50% чистыми на удаленке. Если ОЭЗ дает только +20%, чем вы компенсируете остальное? Мне нужны четкие гарантии бонусов и право вето на архитектуру.";
            fallbackFeedback = "Артем торгуется по деньгам! Не превышай лимит +20% к фиксу. Предложи квартальный KPI-бонус за сдачу вех SCADA и карт-бланш на выбор стека.";
            generatedFallbackHints = [
              "Артем, фиксируем +20% к окладу прямо сейчас плюс полугодовой бонус в размере [укажите %] за ввод SCADA...",
              "Мы гарантируем пересмотр грейда через 6 месяцев с фиксацией планки оклада в [укажите сумму]...",
              "Кроме оклада мы выделяем бюджет на твое обучение и даем право вето по архитектурным решениям для...",
            ];
            newTrust = Math.min(100, newTrust + 5);
          } else if (lower.includes("лидер") || lower.includes("руковод") || lower.includes("r&d") || lower.includes("проект") || lower.includes("scada")) {
            fallbackReply = "Лидство нового R&D модуля диспетчеризации — это то, чего мне не хватало. Но я хочу сам формировать техстек и не согласовывать каждый чих с бюрократами. Кто будет у меня в подчинении?";
            fallbackFeedback = "Бинго! Ты попал в истинную потребность Артема. Закрепи за ним 3 стажеров Политеха и дай свободу в выборе технологий.";
            generatedFallbackHints = [
              "Артем, ты получаешь прямой карт-бланш на архитектуру и команду из [укажите число] стажеров Политеха...",
              "Мы закрепляем за тобой 3 лучших выпускников «Алабуга Политех», чтобы они закрывали ночную рутину, пока ты...",
              "Ты становишься главным архитектором диспетчеризации с прямым подчинением [укажите топ-менеджера]...",
            ];
            newTrust = Math.min(100, newTrust + 10);
            newReadiness = Math.min(100, newReadiness + 12);
          } else if (lower.includes("дежур") || lower.includes("ноч") || lower.includes("аврал") || lower.includes("стажер") || lower.includes("политех")) {
            fallbackReply = "Если с меня снимут ночные подъемы из-за упавших шлюзов — это снимет 80% моего стресса. Но кто реально будет дежурить по ночам вместо меня?";
            fallbackFeedback = "Артем готов остаться, если решится боль авралов. Предложи передать мониторинг дежурной смене Политеха и согласовать 2 дня удаленки.";
            generatedFallbackHints = [
              "Артем, мы передаем ночные дежурства выделенной дежурной смене из выпускников Политеха, а тебе оставляем...",
              "Мы согласуем гибридный график с 2 днями удаленки и запретом на ночные вызовы без [укажите условие]...",
              "Давай утвердим регламент: дежурные инженеры берут первую линию, а ты подключаешься только при...",
            ];
            newTrust = Math.min(100, newTrust + 8);
            newTension = Math.max(0, newTension - 8);
          } else {
            fallbackReply = "Я устал чинить старые шлюзы по ночам. Мне прилетел оффер из московского финтеха: чистая удаленка и плюс 50% к деньгам. Что ОЭЗ может мне предложить, кроме бесконечных авралов?";
            fallbackFeedback = "Артем выгорел от операционки. Вскрой его истинную потребность: передай лидерство над новым R&D проектом SCADA и дай 3 стажеров Политеха!";
            generatedFallbackHints = [
              "Артем, проект масштабирования важнее рутины. Мы готовы передать тебе лидство над [укажите проект]...",
              "Деньги важны, но в финтехе ты будешь винтиком. Давай согласуем пересмотр грейда при условии...",
              "Давай разгрузим тебя от ночных дежурств: выделим 3 стажеров «Политеха» под твое начало, если ты...",
            ];
          }
        } else if (isZhang) {
          fallbackReply = "Мы ценим масштаб ОЭЗ «Алабуга». Однако пункт о штрафах 0.5% в день за задержку пусконаладки неприемлем: логистика непредсказуема.";
          fallbackFeedback = "Чжан Вэй увиливает от штрафов! Держи неустойку от 0.2%/день и требуй склад запчастей.";
          generatedFallbackHints = [
            "Господин Чжан, мы готовы обсуждать график поставки при условии штрафа [укажите %] за срыв пусконаладки...",
            "ОЭЗ настаивает на гарантийном складе критических запчастей и бесплатном обучении [укажите число] наладчиков...",
            "Мы можем зафиксировать предложенную базовую цену, если финальные 30% оплаты будут переведены после [укажите условие]...",
          ];
        } else if (isMikhail) {
          fallbackReply = "Я подписывать суицидальный график ускоренного ввода не буду. Если трансформатор 110 кВ даст просадку — меня под суд отдадут.";
          fallbackFeedback = "Громов ищет юридическую защиту от рисков надзора. Предложи независимый аудит и премиальный фонд!";
          generatedFallbackHints = [
            "Михаил, мы разделим ответственность: привлечем независимый технадзор и согласуем компенсацию за [укажите условие]...",
            "Срыв ввода подстанции сорвет контракты резидентов на 15 МВт. Мы предлагаем параллельный монтаж при гарантии...",
            "Давайте утвердим премиальный фонд для ночных бригад монтажников при условии сдачи к [укажите месяц]...",
          ];
        } else {
          if (lower.includes("460") || lower.includes("ставка")) {
            fallbackReply = `Ставка зафиксирована в нашей финмодели как критическая планка. Чем вы обоснуете такие цифры?`;
            fallbackFeedback = `Позиция обозначена. Удерживайте порог и предложите альтернативные льготы!`;
            newTrust = Math.min(100, newTrust + 5);
            newReadiness = Math.min(100, newReadiness + 5);
          } else if (lower.includes("каникул") || lower.includes("срок") || lower.includes("дедлайн")) {
            fallbackReply = `По срокам мы готовы обсуждать оптимизацию графика, если вы гарантируете выполнение условий без срывов.`;
            fallbackFeedback = `Диалог переходит в конструктивное русло. Зафиксируйте строгие рамки графика.`;
            newTrust = Math.min(100, newTrust + 8);
            newTension = Math.max(0, newTension - 5);
          }
          generatedFallbackHints = [
            `${oppName}, спешка в таких инвестициях рискованна. Мы готовы зафиксировать ставку [укажите ставку], если вы гарантируете...`,
            `Условие ОЭЗ — не менее 1.2 млрд CAPEX в обмен на [укажите объем мощностей или льготу]...`,
            `Понимаю жесткий тайминг совета директоров. Давайте согласуем компромисс при условии [опишите требование]...`,
          ];
        }

        data = {
          opponent_reply: fallbackReply,
          bars_feedback: fallbackFeedback,
          bars_animation: fallbackAnimation,
          metrics: { trust: newTrust, tension: newTension, deal_readiness: newReadiness },
          dynamic_hints: generatedFallbackHints,
          agenda,
          is_deal_closed: false,
          is_deal_failed: false,
        };
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
        if (data.manipulation_type === "bluff" || data.opponent_reply?.includes("Калуг") || data.opponent_reply?.includes("оффер")) {
          emotion = "bluff";
          emotionLabel = "Блеф / Проверка";
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

      const dynamicHintsList: string[] =
        Array.isArray(data.dynamic_hints) && data.dynamic_hints.length > 0
          ? data.dynamic_hints
          : Array.isArray(data.context_hints) && data.context_hints.length > 0
          ? data.context_hints
          : [];

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
        dynamicHints: dynamicHintsList,
        contextHints: dynamicHintsList,
      };

      const newHistory = [...updatedMessages, opponentMessage];

      setMessages(newHistory);
      setMetrics(data.metrics);

      // Update dynamic agenda topics
      if (data.agenda_status && Array.isArray(data.agenda_status)) {
        setAgendaTopics((prevTopics) => {
          return prevTopics.map((topicItem) => {
            const match = data.agenda_status.find((s: any) => {
              if (!s.topic) return false;
              const sTop = s.topic.toLowerCase();
              const tTitle = topicItem.title.toLowerCase();
              const tId = topicItem.id.toLowerCase();
              return tTitle.includes(sTop) || sTop.includes(tTitle) || sTop.includes(tId);
            });
            if (match) {
              const status: "agreed" | "in_progress" | "disputed" =
                match.status === "agreed" ? "agreed" : match.status === "rejected" ? "disputed" : "in_progress";
              return {
                ...topicItem,
                status,
                detail: status === "agreed" ? "✓ Согласовано сторонами" : status === "disputed" ? "Разногласие" : "В процессе торга",
              };
            }
            return topicItem;
          });
        });
      }

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
          agendaTopics: [...agendaTopics],
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
    if (snapshot.agendaTopics) {
      setAgendaTopics(snapshot.agendaTopics);
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

    const activeTopics: AgendaTopicItem[] = activeCfg.agendaTopics ? [...activeCfg.agendaTopics] : [];
    const activeAgenda: NegotiationAgenda = buildInitialAgenda(activeCfg);

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
      text: activeCfg.initialOpponentUtterance || `Приветствую. Готов обсудить ключевые вопросы. Каковы ваши встречные предложения?`,
      timestamp: Date.now() + 1,
      stepIndex: 0,
      snapshotMetrics: { ...initialMetrics },
      dynamicHints: activeCfg.initialDynamicHints ? [...activeCfg.initialDynamicHints] : [],
      contextHints: activeCfg.initialDynamicHints ? [...activeCfg.initialDynamicHints] : [],
    };

    setMessages([welcomeBars, resetOpponentMsg]);
    setMetrics({ ...initialMetrics });
    setAgenda(activeAgenda);
    setAgendaTopics(activeTopics);
    setBarsFeedback(activeCfg.initialBarsAdvice || "Сессия перезапущена. Б.А.Р.С. готов к тактическому анализу.");
    setBarsAnimation("idle");
    setIsDealClosed(false);
    setIsDealFailed(false);
    setSnapshots([
      {
        step: 0,
        messages: [welcomeBars, resetOpponentMsg],
        metrics: { ...initialMetrics },
        lastBarsFeedback: activeCfg.initialBarsAdvice || "Старт переговоров",
        lastBarsAnimation: "idle",
        agenda: activeAgenda,
        agendaTopics: activeTopics,
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
          agendaTopics={agendaTopics}
          barsFeedback={barsFeedback}
          barsAnimation={barsAnimation}
          isLoading={isLoading}
          isDealClosed={isDealClosed}
          isDealFailed={isDealFailed}
          timerSeconds={timerSeconds}
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
