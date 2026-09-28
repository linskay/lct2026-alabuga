import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Multi-provider LLM Configuration (OpenRouter, Gemini, Local Docker LLM, Fallback)
export type LlmProvider = "openrouter" | "gemini" | "local" | "fallback";

let runtimeProviderOverride: LlmProvider | null = null;

export function setRuntimeProvider(provider: LlmProvider | null) {
  runtimeProviderOverride = provider;
}

export function getActiveProvider(): LlmProvider {
  if (runtimeProviderOverride) {
    return runtimeProviderOverride;
  }
  const explicit = (process.env.LLM_PROVIDER || "").toLowerCase().trim();
  if (explicit === "openrouter" || explicit === "gemini" || explicit === "local" || explicit === "fallback") {
    return explicit as LlmProvider;
  }
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.LOCAL_LLM_URL) return "local";
  return "fallback";
}

export interface MethodologyTag {
  category: "SPIN" | "HARVARD" | "BATNA" | "ERROR" | "TACTIC";
  tag: string;
  description: string;
  type: "positive" | "warning" | "danger" | "info";
}

export interface ZopaState {
  buyerMin: number;
  buyerMax: number;
  sellerMin: number;
  sellerMax: number;
  isOverlap: boolean;
  overlapMin?: number;
  overlapMax?: number;
  currentOffer?: number;
  status: "expanding" | "narrowing" | "deadlock" | "agreed";
  changeReason?: string;
}

// BARS Methodology Detector: analyzes player's utterance using SPIN, Harvard, and BATNA frameworks
export function detectMethodologyTag(userText: string, lastOpponentText?: string): MethodologyTag {
  const text = (userText || "").trim();
  const lower = text.toLowerCase();

  // 1. Ошибки / Конфликтогены / Безоговорочные уступки / Ловушка Ультиматума
  if (
    (lower.includes("или 460 или") || lower.includes("или вы соглашаетесь или") || lower.includes("других вариантов нет") || lower.includes("на этом разговор окончен")) &&
    !lower.includes("давайте")
  ) {
    return {
      category: "ERROR",
      tag: "Ошибка: Ловушка «Ультиматума»",
      description: "Поведенческая экономика (эксперимент «Ультиматум»): жесткий зажим оппонента в угол провоцирует иррациональный эмоциональный срыв сделки.",
      type: "danger",
    };
  }

  if (
    lower.startsWith("к сожалению") ||
    lower.startsWith("извините") ||
    lower.startsWith("простите") ||
    lower.includes("вынуждены отказать") ||
    lower.includes("не в нашей власти")
  ) {
    return {
      category: "ERROR",
      tag: "Ошибка: Конфликтоген / Оправдание",
      description: "Начало реплики с оправдания или извинений ставит вас в слабую позицию и провоцирует давление.",
      type: "danger",
    };
  }

  if (
    (lower.includes("согласны на 300") || lower.includes("хорошо, 300") || lower.includes("скидка 40%")) &&
    !lower.includes("в обмен") &&
    !lower.includes("при условии")
  ) {
    return {
      category: "ERROR",
      tag: "Ошибка: Сдача позиций без обмена",
      description: "Бесплатная уступка ключевой ставки BATNA разрушает маржинальность проекта и обесценивает предложение ОЭЗ.",
      type: "danger",
    };
  }

  // 2. Интегративные переговоры: Расширение пирога (ZOPA 100/100 из статьи Habr)
  if (
    (lower.includes("почему для вас") || lower.includes("почему именно этот срок") || lower.includes("почему бюджет")) &&
    (lower.includes("срок") || lower.includes("месяц") || lower.includes("бюджет") || lower.includes("квартал") || lower.includes("важен"))
  ) {
    return {
      category: "HARVARD",
      tag: "Гарвард: Расширение пирога (ZOPA)",
      description: "Выявление глубинных мотивов (сроки запуска, кассовый разрыв) превращает позиционный торг в интегративный win-win 100/100.",
      type: "positive",
    };
  }

  if (
    lower.includes("разделим на фазы") ||
    lower.includes("разбить на этап") ||
    lower.includes("первая очередь") ||
    lower.includes("mvp") ||
    lower.includes("поэтапн")
  ) {
    return {
      category: "HARVARD",
      tag: "Интегративный подход: Поэтапная реализация",
      description: "Разбивка проекта на фазы снимает кассовый стресс оппонента и гарантирует ввод критических мощностей без снижения ставки.",
      type: "positive",
    };
  }

  // 3. Гарвард: Разделение людей и проблемы
  if (
    lower.includes("отложим эмоци") ||
    lower.includes("без эмоци") ||
    lower.includes("понимаю вашу обеспокоенность") ||
    lower.includes("дело не в персонали") ||
    lower.includes("давайте опираться на цифры") ||
    lower.includes("давайте к фактам") ||
    lower.includes("деловой подход")
  ) {
    return {
      category: "HARVARD",
      tag: "Гарвард: Разделение людей и проблемы",
      description: "Эмоции отделены от существа спора. Снижение градуса агрессии без потери жесткости в отстаивании интересов.",
      type: "positive",
    };
  }

  // 4. BATNA: Расчет издержек альтернативы (Cost of Inaction)
  if (
    (lower.includes("простой") || lower.includes("убытк") || lower.includes("калуг") || lower.includes("14 месяцев") || lower.includes("заморозк")) &&
    (lower.includes("дороже") || lower.includes("обойдется") || lower.includes("потеря") || lower.includes("срыв контракта"))
  ) {
    return {
      category: "BATNA",
      tag: "BATNA: Демонстрация цены альтернативы",
      description: "Оцифровка издержек оппонента в альтернативной локации (простой оборудования, дефицит сетей) сдвигает его точку ухода.",
      type: "positive",
    };
  }

  // 3. SPIN: Извлекающие вопросы (риски простоя, последствия срыва сроков, штрафы)
  if (
    lower.includes("риск") ||
    lower.includes("просто") ||
    lower.includes("убыт") ||
    lower.includes("штраф") ||
    lower.includes("дедлайн") ||
    lower.includes("срыв") ||
    lower.includes("к чему приведет") ||
    lower.includes("что произойдет, если")
  ) {
    return {
      category: "SPIN",
      tag: "SPIN: Извлекающий вопрос",
      description: "Фокус на цене простоя оборудования и рисках срыва запуска заставляет оппонента осознать скрытые финансовые потери.",
      type: "positive",
    };
  }

  // 4. SPIN: Проблемные вопросы (вскрытие узких мест)
  if (
    lower.includes("в чем главная сложность") ||
    lower.includes("какие препятствия") ||
    lower.includes("почему именно") ||
    lower.includes("что вас смущает") ||
    lower.includes("в чем сомнения")
  ) {
    return {
      category: "SPIN",
      tag: "SPIN: Проблемный вопрос",
      description: "Вскрытие неудовлетворенности текущей ситуацией помогает найти истинный корень сопротивления оппонента.",
      type: "info",
    };
  }

  // 5. SPIN: Направляющие вопросы (ценность решения ОЭЗ)
  if (
    lower.includes("как бы повлияло") ||
    lower.includes("было бы полезно") ||
    lower.includes("насколько важно для вас") ||
    lower.includes("если мы решим")
  ) {
    return {
      category: "SPIN",
      tag: "SPIN: Направляющий вопрос",
      description: "Помогает оппоненту самому сформулировать выгоду от инфраструктуры, кадров Политеха и надежности ОЭЗ.",
      type: "positive",
    };
  }

  // 6. Гарвард: Объективные критерии & BATNA факты
  if (
    lower.includes("110 кв") ||
    lower.includes("подстанц") ||
    lower.includes("калуг") ||
    lower.includes("политех") ||
    lower.includes("гост") ||
    lower.includes("регламент") ||
    lower.includes("аудит")
  ) {
    return {
      category: "HARVARD",
      tag: "Гарвард: Объективные критерии",
      description: "Опора на независимые факты, технические параметры подстанции 110 кВ и регламенты ОЭЗ нейтрализует блеф.",
      type: "positive",
    };
  }

  // 7. BATNA: Принцип взаимного размена
  if (
    lower.includes("в обмен на") ||
    lower.includes("при условии") ||
    lower.includes("взамен") ||
    lower.includes("только если") ||
    lower.includes("встречн")
  ) {
    return {
      category: "BATNA",
      tag: "BATNA: Взаимный размен позиций",
      description: "Классическое правило Алабуги: ни единой уступки без встречной ценности (рабочие места, CAPEX или каникулы).",
      type: "positive",
    };
  }

  // 8. BATNA: Защита красной линии (ставка 460 ₽/м²)
  if (lower.includes("460") || lower.includes("базовая ставка") || lower.includes("порог") || lower.includes("красная линия")) {
    return {
      category: "BATNA",
      tag: "BATNA: Фиксация красной линии",
      description: "Четкое обозначение предела допустимых условий удерживает границы рентабельности и защищает активы ОЭЗ.",
      type: "positive",
    };
  }

  // Default tactic
  return {
    category: "TACTIC",
    tag: "Тактика: Позиционное зондирование",
    description: "Разведка намерений оппонента и тестирование его переговорных позиций.",
    type: "info",
  };
}

// Dynamic ZOPA (Zone of Possible Agreement) Calculator
export function calculateZopa(
  context: any,
  activeCounterOffer: number,
  agenda: any,
  isDealClosed: boolean,
  isDealFailed: boolean
): ZopaState {
  const sellerMin = context?.batna?.minPricePerSqm || 460;
  const sellerMax = 500; // Стандартная базовая ставка ОЭЗ
  const buyerMin = 300;  // Первоначальный ультиматум инвестора

  // Потолок готовности инвестора динамически растет по мере торга и закрытия болей
  let buyerMax = 420;
  if (activeCounterOffer >= 460) {
    buyerMax = 475;
  } else if (activeCounterOffer >= 400) {
    buyerMax = 460;
  } else if (activeCounterOffer >= 380) {
    buyerMax = 440;
  }

  // Если ставка уже согласована в чек-листе
  const isRateAgreed = agenda?.rate?.status === "agreed";
  const currentOffer = isRateAgreed ? sellerMin : Math.max(buyerMin, activeCounterOffer);

  // Вычисляем пересечение ZOPA
  const overlapMin = Math.max(sellerMin, buyerMin);
  const overlapMax = Math.min(sellerMax, buyerMax);
  const isOverlap = overlapMax >= overlapMin || isRateAgreed;

  let status: "expanding" | "narrowing" | "deadlock" | "agreed" = "narrowing";
  let changeReason = "Оппонент удерживает заниженную планку, зона торга не сформирована.";

  if (isDealClosed || isRateAgreed) {
    status = "agreed";
    changeReason = `Договоренность зафиксирована на отметке ${currentOffer} ₽/м². Интересы сторон согласованы!`;
  } else if (isDealFailed) {
    status = "deadlock";
    changeReason = "Схлопывание ZOPA: оппонент разорвал переговоры, позиции несовместимы.";
  } else if (isOverlap) {
    status = "expanding";
    changeReason = `ZOPA открыта [${overlapMin}–${overlapMax} ₽/м²]! Встречные уступки позволили найти коридор соглашения.`;
  } else if (activeCounterOffer > 300) {
    status = "narrowing";
    changeReason = `Разрыв сокращается (предложение выросло до ${activeCounterOffer} ₽/м²), но пока ниже BATNA (${sellerMin} ₽).`;
  }

  return {
    buyerMin,
    buyerMax,
    sellerMin,
    sellerMax,
    isOverlap,
    overlapMin: isOverlap ? overlapMin : undefined,
    overlapMax: isOverlap ? overlapMax : undefined,
    currentOffer,
    status,
    changeReason,
  };
}

async function callOpenAICompatible(options: {
  url: string;
  apiKey?: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  extraHeaders?: Record<string, string>;
}): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.extraHeaders || {}),
  };
  if (options.apiKey) {
    headers["Authorization"] = `Bearer ${options.apiKey}`;
  }

  const res = await fetch(options.url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: options.model,
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Model API call to ${options.url} failed (${res.status}): ${errText}`);
  }

  const data: any = await res.json();
  const rawContent = data.choices?.[0]?.message?.content?.trim();
  if (!rawContent) {
    throw new Error("Empty message content returned by model");
  }

  const sanitized = rawContent.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(sanitized);
}

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Fallback state engine implementing strict stepped resistance, manipulation attacks and trade-offs
function generateFallbackResponse(body: any) {
  const history = body.history || [];
  const context = body.context || {};
  const currentMetrics = context.currentMetrics || { trust: 50, tension: 40, deal_readiness: 25 };
  const currentAgenda = context.agenda || {
    rate: { id: "rate", title: "Арендная ставка", status: "disputed", detail: "Оппонент требует 300 ₽/м² (BATNA: от 460 ₽)" },
    grace_period: { id: "grace_period", title: "Каникулы на пусконаладку", status: "in_progress", detail: "Оппонент требует 12 мес. (Лимит: 4 мес.)" },
    power_capex: { id: "power_capex", title: "Электросети 8 МВт и CAPEX", status: "disputed", detail: "Оппонент требует бесплатный подвод" },
  };

  const userMessages = history.filter((m: any) => m.actor === "USER" || m.actor === "user");
  const opponentMessages = history.filter((m: any) => m.actor === "OPPONENT" || m.actor === "opponent");
  const userTurnCount = userMessages.length;
  const lastUserMsg = userMessages[userMessages.length - 1]?.text || "";
  const lastOpponentMsg = opponentMessages[opponentMessages.length - 1]?.text || "";
  const lower = lastUserMsg.toLowerCase().trim();

  const previousOpponentTexts = opponentMessages.map((m: any) => m.text);

  let trustDelta = 0;
  let tensionDelta = 0;
  let readinessDelta = 0;
  let opponentReply = "";
  let barsFeedback = "";
  let barsAnimation = "talk";
  let isDealClosed = false;
  let isDealFailed = false;
  let manipulationType: "none" | "bluff" | "authority_press" | "hurry_trap" = "none";
  let hiddenNeedRevealed = context.hiddenNeedsDiscovered || false;
  let activeCounterOffer = context.activeCounterOffer || 300;

  const agenda = JSON.parse(JSON.stringify(currentAgenda));

  // Detect whether player is repeating previous arguments (anti-spam / anti-loop)
  const previousUserMessages = userMessages.slice(0, -1);
  const isRepeatingArgument = previousUserMessages.some((prev: any) => {
    const prevText = (prev.text || "").toLowerCase().trim();
    if (!prevText || prevText.length < 10) return false;
    // Check direct equality or high substring overlap (e.g. repeated chip)
    if (prevText === lower) return true;
    if (lower.length > 25 && prevText.includes(lower.slice(0, 25))) return true;
    if (prevText.length > 25 && lower.includes(prevText.slice(0, 25))) return true;
    return false;
  });

  if (isRepeatingArgument) {
    trustDelta = -12;
    tensionDelta = +18;
    barsAnimation = "warn";
    opponentReply =
      "Вы уже повторяли этот аргумент слово в слово. Вашу позицию я услышал, но мои встречные вопросы остались без ответа. Не ходите по кругу — давайте конкретные встречные уступки, иначе диалог теряет смысл.";
    barsFeedback =
      "ОШИБКА: Повторение одного и того же тезиса! Оппонент раздражен хождением по кругу. Смените предмет торга или задайте встречный вопрос о приоритетах.";
    return buildResponse("attack", "Несогласие / Осаживание", "😠");
  }

  // Detect whether previous turn was a manipulation attack
  const wasBluff = lastOpponentMsg.includes("Калуга") || lastOpponentMsg.includes("калуга");
  const wasAuthorityPress = lastOpponentMsg.includes("уполномочены") || lastOpponentMsg.includes("генеральному директору");
  const wasHurryTrap = lastOpponentMsg.includes("самолет") || lastOpponentMsg.includes("2 часа");

  // 1. REACTION TO MANIPULATIONS (Deflection vs Panicking/Yielding)
  if (wasBluff) {
    const defendedKaluga =
      lower.includes("110 кв") ||
      lower.includes("подстанц") ||
      lower.includes("сет") ||
      lower.includes("калуг") ||
      lower.includes("логистик") ||
      lower.includes("готов");

    if (defendedKaluga) {
      trustDelta = +15;
      tensionDelta = -12;
      barsAnimation = "talk";
      opponentReply =
        "Хм. Вы неплохо осведомлены о проблемах с мощностями в Калужской области. Действительно, у них дефицит по высоковольтным подстанциям. Но это не повод соглашаться на вашу завышенную ставку. 380 ₽ — наше встречное предложение при условии, что вы берете на себя подведение сетей.";
      barsFeedback =
        "ОТЛИЧНАЯ ЗАЩИТА: Блеф по Калуге парирован фактами! Оппонент отступил и поднял предложение с 300 до 380 ₽/м². Теперь нащупайте его скрытую потребность (сроки ввода или кадры).";
      activeCounterOffer = 380;
      return buildResponse();
    } else if (lower.includes("300") || lower.includes("ладно") || lower.includes("хорошо") || lower.includes("скидк")) {
      // Panicked / Folded under bluff
      trustDelta = -20;
      tensionDelta = +25;
      barsAnimation = "warn";
      opponentReply =
        "Раз вы так легко испугались упоминания конкурентов и готовы прогибаться, значит, ваша базовая ставка 550 ₽ была дутой! Мы требуем 300 ₽/м² и бесплатный подвод всех коммуникаций. Иначе самолет в Калугу ждет.";
      barsFeedback =
        "СТРЕСС-ТЕСТ ПРОВАЛЕН: Вы запаниковали перед блефом! Оппонент почувствовал слабость и продавливает грабительские 300 ₽. Немедленно верните твердость позиции!";
      return buildResponse();
    }
  }

  if (wasAuthorityPress) {
    const defendedAuthority =
      lower.includes("уполномочен") ||
      lower.includes("дирекц") ||
      lower.includes("представител") ||
      lower.includes("мандат") ||
      lower.includes("протокол") ||
      lower.includes("согласован");

    if (defendedAuthority) {
      trustDelta = +16;
      tensionDelta = -10;
      barsAnimation = "talk";
      opponentReply =
        "Хорошо, вижу, что вы держите удар и уполномочены вести торг. Давайте без лишних звонков руководству. Но 460 ₽ — это всё равно выше нашей финмодели. 410 ₽/м² — вот реальная цифра, при которой совет директоров не заблокирует проект.";
      barsFeedback =
        "МАНИПУЛЯЦИЯ ОТРАЖЕНА: Вы хладнокровно защитили свой статус переговорщика! Оппонент зауважал вашу позицию и поднял ставку до 410 ₽/м².";
      activeCounterOffer = 410;
      return buildResponse();
    } else if (lower.includes("директор") || lower.includes("не знаю") || lower.includes("позвоните") || lower.includes("сейчас уточню")) {
      trustDelta = -25;
      tensionDelta = +25;
      barsAnimation = "warn";
      opponentReply =
        "Если вы даже не знаете границ своих полномочий, о чем мы вообще разговариваем? Соединяйте с тем, кто решает, либо мы сворачиваем диалог.";
      barsFeedback =
        "ПРОВАЛ: Потеря инициативы и статуса переговорщика! Оппонент перешагнул через вас. Используйте откат назад или жестко верните диалог в профессиональное русло.";
      return buildResponse();
    }
  }

  if (wasHurryTrap) {
    const defendedHurry =
      lower.includes("спешк") ||
      lower.includes("самолет") ||
      lower.includes("ультиматум") ||
      lower.includes("ошибк") ||
      lower.includes("качество") ||
      lower.includes("регламент") ||
      lower.includes("взвешенно");

    if (defendedHurry) {
      trustDelta = +16;
      tensionDelta = -12;
      barsAnimation = "talk";
      opponentReply =
        "Ладно, признаю: в спешке завод на 12 000 м² не проектируют. Рейс я могу и перенести на вечер. Но мы должны выйти на четкие условия: если мы поднимаемся до 450 ₽, вы гарантируете компенсацию простоя при задержке сетей.";
      barsFeedback =
        "ПОБЕДА НАД ЛОВУШКОЙ СПЕШКИ: Вы не поддались искусственному цейтноту! Оппонент пошел на уступку 450 ₽/м² с условием гарантий. Готовьте встречный размен!";
      activeCounterOffer = 450;
      return buildResponse();
    } else if (lower.includes("400") || lower.includes("согласен") || lower.includes("быстро") || lower.includes("подписываем")) {
      trustDelta = -20;
      tensionDelta = +25;
      barsAnimation = "warn";
      opponentReply =
        "Подписали за 5 минут? Отлично, значит, вы согласились на наши 400 ₽. Раз вы так торопитесь, скиньте и тариф на электроэнергию!";
      barsFeedback =
        "КАТАСТРОФА BATNA: Вы попались в ловушку спешки и сдали ставку ниже 460 ₽! Оппонент продавливает дальнейшие уступки.";
      return buildResponse();
    }
  }

  // 2. ABSURD DEADLINES & EMPTY EVASIONS
  const isAbsurdDeadline =
    lower.includes("1 день") ||
    lower.includes("один день") ||
    lower.includes("сутки") ||
    lower.includes("за сутки") ||
    lower.includes("завтра") ||
    lower.includes("за 2 часа") ||
    lower.includes("1 час");

  const isEmptyEvasion =
    lower === "ок" ||
    lower === "давайте согласуем" ||
    lower === "согласуем" ||
    lower === "давайте подписывать" ||
    lower === "по рукам" ||
    lower === "договорились" ||
    lower === "согласен" ||
    (lower.length < 15 && !/\d/.test(lower) && !lower.includes("ставк") && !lower.includes("каникул"));

  if (isAbsurdDeadline) {
    trustDelta = -25;
    tensionDelta = +24;
    readinessDelta = -15;
    barsAnimation = "warn";
    opponentReply =
      "Спроектировать и подготовить производственный корпус на 12 000 м² за сутки? Вы сейчас шутите или совершенно не понимаете технологический цикл машиностроения? Это непрофессионально и подрывает доверие к вам как к партнеру.";
    barsFeedback =
      "КРИТИЧЕСКАЯ ОШИБКА: Нереалистичные обещания обвалили доверие (-25%)! На ПСД и пусконаладку крупного завода уходит 4–6 месяцев. Оперируйте реальными сроками.";
    return buildResponse();
  }

  if (isEmptyEvasion && (agenda.rate.status !== "agreed" || agenda.grace_period.status !== "agreed")) {
    trustDelta = -15;
    tensionDelta = +15;
    barsAnimation = "warn";
    opponentReply =
      "Что именно вы предлагаете согласовать? Мы до сих пор не зафиксировали ни ставку за квадратный метр, ни сроки каникул. Назовите ваши конкретные условия по цифрам, а не общие слова.";
    barsFeedback =
      "Оппонент осадил вас за бессодержательную отписку. В жестких B2B-переговорах фраза «давайте согласуем» без цифр воспринимается как слабость и потеря контроля.";
    return buildResponse();
  }

  // 3. IDENTIFYING HIDDEN INTEREST / REAL PAIN (Phase 2)
  const isProbingPain =
    lower.includes("критичнее") ||
    lower.includes("ввод") ||
    lower.includes("3 квартал") ||
    lower.includes("срок") ||
    lower.includes("сентябр") ||
    lower.includes("запуск") ||
    lower.includes("боль") ||
    lower.includes("почему") ||
    lower.includes("приоритет");

  if (isProbingPain && !hiddenNeedRevealed) {
    hiddenNeedRevealed = true;
    trustDelta = +18;
    tensionDelta = -10;
    readinessDelta = +15;
    activeCounterOffer = 410;
    opponentReply =
      "Вы попали в самую точку. Не скрою: совет директоров зажал меня в тиски. Контракты на поставку станков уже подписаны, нам кровь из носу нужно запуститься в 3 квартале (к сентябрю). В Ульяновске голая площадка — там мы сорвем график на год. Но 460 ₽ — это всё равно слишком дорого! Готов подняться до 410 ₽/м², если дадите жесткие гарантии ввода корпуса точно к 3 кварталу.";
    barsFeedback =
      "БЛЕСТЯЩЕ: Вскрыт истинный интерес оппонента! Для Строганова критичен запуск к 3 кварталу из-за обязательств по станкам. Теперь он в вашей ловушке: меняйте гарантии сроков ввода на удержание ставки 460 ₽!";
    return buildResponse();
  }

  // 4. STEPPED RESISTANCE & COUNTER-OFFER LADDER
  // Phase 1 (Attack): Player names 460 ₽ early without probing pain or mutual trade
  if (lower.includes("460") && !hiddenNeedRevealed && activeCounterOffer < 380) {
    trustDelta = -5;
    tensionDelta = +15;
    readinessDelta = +5;
    activeCounterOffer = 380;
    opponentReply =
      "460 ₽ — это грабеж! При такой ставке наш инвестиционный проект вообще не окупается. Максимум 380 ₽, и только если ОЭЗ возьмет на себя подведение сетей. Иначе совет директоров развернет проект в Ульяновск.";
    barsFeedback =
      "СТРОГАНОВ ПОШЕЛ В АТАКУ: Оппонент не принимает ставку 460 ₽ с первого раза! Не отступайте по цене. Нащупайте его скрытую боль: спросите, что для него важнее — ставка или сроки запуска к 3 кварталу.";
    return buildResponse();
  }

  // Inject Manipulations strategically if not yet done
  if (userTurnCount === 2 && !history.some((m: any) => m.text.includes("Калуга"))) {
    manipulationType = "bluff";
    tensionDelta = +12;
    opponentReply =
      "Мне только что звонили из ОЭЗ «Калуга», они дают готовый корпус с каникулами на целый год. Почему я должен оставаться у вас и платить больше?";
    barsFeedback =
      "ВНИМАНИЕ: БЛЕФ ОППОНЕНТА! Строганов давит конкурентной площадкой в Калуге. Парируйте фактом: у Калуги нет свободной подстанции 110 кВ на границе участка!";
    barsAnimation = "warn";
    return buildResponse();
  }

  if (userTurnCount === 4 && !history.some((m: any) => m.text.includes("уполномочены"))) {
    manipulationType = "authority_press";
    tensionDelta = +14;
    opponentReply =
      "Вы вообще уполномочены принимать решения по ставкам и техусловиям, или мне сразу звонить вашему генеральному директору?";
    barsFeedback =
      "ПРЕССИНГ ПОЛНОМОЧИЙ: Оппонент пытается обесценить ваш статус переговорщика. Ответьте хладнокровно: вы официально уполномочены дирекцией вести сделку до протокола.";
    barsAnimation = "warn";
    return buildResponse();
  }

  if (userTurnCount === 6 && !history.some((m: any) => m.text.includes("самолет"))) {
    manipulationType = "hurry_trap";
    tensionDelta = +15;
    opponentReply =
      "У меня самолет через 2 часа. Либо мы фиксируем 400 ₽ за квадратный метр прямо сейчас, либо этой встречи больше не будет.";
    barsFeedback =
      "ЛОСКУТ ЦЕЙТНОТА (Ловушка спешки)! Не поддавайтесь панике. Напомните, что спешка приведет к ошибкам в ПСД, а условия фиксируются только взвешенно.";
    barsAnimation = "warn";
    return buildResponse();
  }

  // 5. STEPPED BARGAINING AROUND RATE (Ladder: 380 -> 410 -> 430 -> 450 -> 460)
  if ((lower.includes("460") || lower.includes("ставк")) && agenda.rate.status !== "agreed") {
    if (activeCounterOffer < 430 && (lower.includes("кадр") || lower.includes("политех") || lower.includes("сетей") || lower.includes("110"))) {
      activeCounterOffer = 430;
      trustDelta = +12;
      tensionDelta = -6;
      opponentReply =
        "Хорошо, кадры из «Алабуга Политех» и подстанция 110 кВ действительно снижают наши стартовые издержки. Я готов поднять планку до 430 ₽/м². Но 460 ₽ — это всё еще выше рынка. Какой ваш ответ?";
      barsFeedback =
        "ШАГ ВПЕРЕД: Оппонент поднялся до 430 ₽ (+12% доверие)! Держите планку 460 ₽, предложите взаимные гарантии сроков сдачи корпуса к сентябрю.";
      return buildResponse();
    } else if (activeCounterOffer === 430 && (lower.includes("срок") || lower.includes("простой") || lower.includes("гарант") || lower.includes("450") || lower.includes("460"))) {
      activeCounterOffer = 450;
      trustDelta = +14;
      tensionDelta = -8;
      opponentReply =
        "Ладно, 450 ₽ при условии, что ОЭЗ зафиксирует штрафные санкции за каждый день просрочки ввода сетей. Либо 460 ₽, но только если вы жестко закрепляете резерв 250 рабочих мест через «Алабуга Политех». По рукам?";
      barsFeedback =
        "ФАЗА РАЗМЕНА (450-460 ₽): Оппонент готов принять 460 ₽ при условии резерва рабочих мест «Политеха»! Подтверждайте размен: 460 ₽ взамен обязательств инвестора.";
      return buildResponse();
    } else if ((activeCounterOffer >= 450 || hiddenNeedRevealed) && (lower.includes("460") || lower.includes("соглас") || lower.includes("политех") || lower.includes("закрепл"))) {
      agenda.rate.status = "agreed";
      agenda.rate.detail = "Согласовано: 460 ₽/м² (под кадры «Политеха»)";
      trustDelta = +16;
      tensionDelta = -10;
      readinessDelta = +25;
      opponentReply =
        "Договорились. Ставка 460 ₽/м² утверждена взамен на гарантированное целевое обучение 250 специалистов в «Алабуга Политех» и ввод корпуса к сентябрю. Ставку зафиксировали. Теперь каникулы: 12 месяцев — наше базовое требование совета директоров.";
      barsFeedback =
        "СТАВКА ЗАЩИЩЕНА (460 ₽/м²)! Вы не сдали ни рубля без встречного размена (+25% готовность сделки). Переходим к каникулам: держите не более 4 месяцев!";
      return buildResponse();
    }
  }

  // 6. GRACE PERIOD (12 mos -> 8 mos -> 4 mos with conditions)
  if (agenda.rate.status === "agreed" && agenda.grace_period.status !== "agreed") {
    if (lower.includes("4 мес") || lower.includes("четыре") || (lower.includes("каникул") && (lower.includes("готов") || lower.includes("технадзор")))) {
      agenda.grace_period.status = "agreed";
      agenda.grace_period.detail = "Согласовано: 4 месяца каникул";
      trustDelta = +15;
      tensionDelta = -10;
      readinessDelta = +25;
      opponentReply =
        "4 месяца каникул вместо 12 — жестко. Но если ОЭЗ берет на себя ускоренную врезку и круглосуточный допуск шеф-монтажа оборудования, мы примем этот срок. Остается ключевой вопрос: 8 МВт электроэнергии. Вы берете расходы на подвод мощностей 110 кВ на себя?";
      barsFeedback =
        "ВТОРОЙ ПУНКТ ЗАКРЫТ: Каникулы зафиксированы на 4 месяцах! Внимание: оппонент пытается продавить бесплатное присоединение 8 МВт. Требуйте встречный CAPEX от 1.2 млрд ₽.";
      return buildResponse();
    } else {
      opponentReply =
        "По ставке мы договорились, но 4 месяца на монтаж тяжелых станков — это нереалистично. Мы настаиваем минимум на 8 месяцах каникул. На каких условиях вы готовы пойти на встречу?";
      barsFeedback =
        "Торг по каникулам: оппонент снизил планку с 12 до 8 месяцев. Напомните, что корпус «Синергии» уже готов к чистовой отделке, и предложите 4 месяца с приоритетным технадзором.";
      return buildResponse();
    }
  }

  // 7. POWER CAPEX & CLOSING CONDITIONS
  if (agenda.grace_period.status === "agreed" && agenda.power_capex.status !== "agreed") {
    if (lower.includes("8 мвт") || lower.includes("capex") || lower.includes("1.2") || lower.includes("млрд") || lower.includes("инвестиц") || lower.includes("сет")) {
      agenda.power_capex.status = "agreed";
      agenda.power_capex.detail = "Согласовано: 8 МВт под CAPEX 1.2 млрд ₽";
      trustDelta = +18;
      tensionDelta = -12;
      readinessDelta = +25;
      opponentReply =
        "Справедливо. Если подстанция 110 кВ гарантирует 8 МВт без перебоев, мы официально подтверждаем гарантийный объем CAPEX в 1.2 млрд рублей на первую очередь завода. Все спорные пункты согласованы. Готовы финализировать протокол о резидентстве?";
      barsFeedback =
        "ВСЯ ПОВЕСТКА СОГЛАСОВАНА! Ставка 460 ₽, 4 месяца каникул и 8 МВт под CAPEX 1.2 млрд ₽ зафиксированы в пользу ОЭЗ. Подтверждайте подписание протокола!";
      return buildResponse();
    } else {
      opponentReply =
        "Мы требуем бесплатного технологического присоединения 8 МВт электроэнергии. Почему наш холдинг должен оплачивать подвод высоковольтной линии 110 кВ?";
      barsFeedback =
        "Требуйте встречный CAPEX! Регламент ОЭЗ «Алабуга» дает 8 МВт бесплатно только под инвестиции от 1.2 млрд рублей и создание рабочих мест.";
      return buildResponse();
    }
  }

  // 8. FINAL CLOSING (Only permitted after round 6+ and full agenda agreed)
  if (agenda.rate.status === "agreed" && agenda.grace_period.status === "agreed" && agenda.power_capex.status === "agreed") {
    if (userTurnCount < 6) {
      // Hurried closing attempt
      trustDelta = -10;
      tensionDelta = +10;
      opponentReply =
        "Куда вы торопитесь? Сделка на 12 000 м² за 4 минуты не закрывается. Мы ещё не сверили взаимные штрафные санкции и ответственность за срыв пусконаладки. Подтвердите, что ОЭЗ гарантирует приоритет в кадровом отборе.";
      barsFeedback =
        "ОСТАНОВКА: Слишком поспешное закрытие сделки! В реальных переговорах с гендиректором необходима проверка рисков и фиксация штрафов.";
      return buildResponse();
    }

    if (lower.includes("подпис") || lower.includes("протокол") || lower.includes("соглашен") || lower.includes("по рукам") || lower.includes("фиксиру")) {
      isDealClosed = true;
      barsAnimation = "win";
      trustDelta = +15;
      readinessDelta = +25;
      opponentReply =
        "По рукам. Условия жесткие, но честные и взаимовыгодные для обеих сторон. Мы размещаем завод на 12 000 м² в парке «Синергия», создаем 250 рабочих мест и вкладываем 1.2 млрд рублей. Передаем документы на юридическое визирование.";
      barsFeedback =
        "ТАКТИЧЕСКИЙ ТРИУМФ: Сделка закрыта на высший ранг! Все манипуляции отражены, ступенчатое сопротивление пройдено, BATNA защищена.";
      return buildResponse();
    }
  }

  // Default step response
  opponentReply =
    "Давайте без абстракций. Моя цель — запустить производство на 12 000 м² с минимальными издержками, а ваша — загрузить мощности ОЭЗ. Каковы ваши реальные встречные условия по ставке и каникулам?";
  barsFeedback =
    "Строганов прощупывает вашу устойчивость. Используйте ступенчатое сопротивление: назовите 460 ₽/м² и выясните его дедлайн по вводу оборудования.";

  function buildResponse(
    customEmotion?: "attack" | "compromise" | "bluff" | "neutral",
    customLabel?: string,
    customEmoji?: string
  ) {
    // Double check anti-loop
    if (previousOpponentTexts.includes(opponentReply)) {
      opponentReply = `Слушайте меня внимательно: ${opponentReply}`;
    }

    const finalTrust = Math.min(100, Math.max(0, currentMetrics.trust + trustDelta));
    const finalTension = Math.min(100, Math.max(0, currentMetrics.tension + tensionDelta));
    const finalReadiness = isDealClosed ? 100 : Math.min(100, Math.max(0, currentMetrics.deal_readiness + readinessDelta));

    if (finalTension >= 95 && finalTrust <= 20) {
      isDealFailed = true;
      barsAnimation = "warn";
      opponentReply =
        "Переговоры зашли в глухой тупик из-за отсутствия гибкости. Мы переносим инвестиционный проект в Ульяновск. Всего доброго.";
      barsFeedback =
        "ПРОВАЛ ПЕРЕГОВОРОВ: Напряжение зашкалило, оппонент разорвал контакт. Используйте «Машину времени», чтобы вернуться на спорный шаг назад.";
    }

    const methodologyTag = detectMethodologyTag(lastUserMsg, lastOpponentMsg);
    const zopaState = calculateZopa(context, activeCounterOffer, agenda, isDealClosed, isDealFailed);

    // Determine emotion defaults
    let emotion: "attack" | "compromise" | "bluff" | "neutral" = customEmotion || "neutral";
    let emotionLabel = customLabel || "Внимательный диалог";
    let emotionEmoji = customEmoji || "💬";

    if (!customEmotion) {
      if (manipulationType === "bluff" || opponentReply.includes("Калуг") || opponentReply.includes("Ульяновск")) {
        emotion = "bluff";
        emotionLabel = "Блеф / Проверка границ";
        emotionEmoji = "⚠️";
      } else if (barsAnimation === "warn" || tensionDelta > 5 || finalTension >= 65) {
        emotion = "attack";
        emotionLabel = "Несогласие / Прессинг";
        emotionEmoji = "😠";
      } else if (barsAnimation === "win" || trustDelta > 5 || finalReadiness >= 65 || isDealClosed) {
        emotion = "compromise";
        emotionLabel = "Заинтересован / Компромисс";
        emotionEmoji = "🤝";
      }
    }

    // Determine context_hints scaffolding based on current negotiation turn & Habr theory of games
    let contextHints: string[] = [
      "Валерий, почему для вас так критичен срок ввода к 3 кварталу? Давайте разделим проект на фазы: подключим ключевые 15 МВт в первую очередь по ставке 460 ₽/м²...",
      "Если оценить альтернативу в Калуге: простой оборудования на 14 месяцев обойдется бизнесу дороже любой экономии на аренде. В Алабуге подстанция 110 кВ уже готова...",
      "Давайте не загонять диалог в ловушку ультиматумов: мы закрепляем целевое обучение кадров в «Политехе», а вы подтверждаете ставку 460 ₽/м² и график CAPEX...",
    ];

    if (manipulationType === "bluff" || opponentReply.includes("Калуг")) {
      contextHints = [
        "В Калуге нет свободной подстанции 110 кВ на границе площадки, а у нас [поясните готовность сетей]...",
        "Мы готовы зафиксировать базовую ставку 460 ₽/м² в обмен на [укажите встречное обязательство инвестора]...",
        "Сравнение с Калугой некорректно без учета логистики: назовите ваши реальные требования к [срокам или кадрам]...",
      ];
    } else if (opponentReply.includes("самолет") || opponentReply.includes("2 часа") || (manipulationType as string) === "hurry" || manipulationType === "hurry_trap") {

      contextHints = [
        "Спешка перед самолетом — плохой советчик при CAPEX в миллиарды. Давайте прямо сейчас согласуем [ставку или каникулы]...",
        "Мы не подписываем соглашения под давлением цейтнота, однако можем пойти навстречу по [укажите параметр]...",
        "Если вы цените свое время, зафиксируем 460 ₽/м² прямо сейчас при условии, что вы [укажите встречное требование]...",
      ];
    } else if (isDealClosed) {
      contextHints = [
        "Отлично, фиксируем протокол согласования: ставка [укажите ставку] и каникулы [укажите срок]...",
        "Передаем проект договора на подписание юристам обеих сторон с учетом [укажите обязательства]...",
        "Благодарю за конструктивный диалог. Закрепляем обязательства по CAPEX [укажите сумму]...",
      ];
    }

    return {
      opponent_reply: opponentReply,
      bars_feedback: barsFeedback,
      bars_animation: barsAnimation,
      metrics: {
        trust: finalTrust,
        tension: finalTension,
        deal_readiness: finalReadiness,
      },
      metrics_delta: {
        trust: trustDelta,
        tension: tensionDelta,
        deal_readiness: readinessDelta,
      },
      is_batna_violated: false,
      dynamic_hints: contextHints,
      agenda_status: [
        { topic: "Арендная ставка", status: agenda.rate.status },
        { topic: "Каникулы", status: agenda.grace_period.status },
        { topic: "Мощности и CAPEX", status: agenda.power_capex.status },
      ],
      agenda,
      is_deal_closed: isDealClosed,
      is_deal_failed: isDealFailed,
      manipulation_type: manipulationType,
      hidden_need_revealed: hiddenNeedRevealed,
      active_counter_offer: activeCounterOffer,
      methodology_tag: methodologyTag,
      zopa: zopaState,
      latency_ms: Math.floor(Math.random() * 25) + 15,
      provider_name: "fallback",
      model_name: "Autonomous Engine (Offline)",
      emotion,
      emotion_label: emotionLabel,
      emotion_emoji: emotionEmoji,
      context_hints: contextHints,
    };
  }

  return buildResponse();
}

// Helper for timeout
function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms)),
  ]);
}

// Fallback scenario generator
function generateFallbackCase(sphere?: string, personalityTone?: string, toughnessLevel?: number) {
  const chosenSphere = sphere || "B2B / Инвесторы ОЭЗ";
  const chosenToughness = toughnessLevel || 80;
  return {
    id: `case_${Date.now()}`,
    title: `Переговоры с инвестором: «${chosenSphere}»`,
    sphere: chosenSphere,
    opponentRole:
      chosenSphere === "B2B / Инвесторы ОЭЗ"
        ? "Генеральный директор агрохолдинга"
        : chosenSphere === "Закупки и тендеры"
        ? "Коммерческий директор поставщика"
        : chosenSphere === "HR / Наем топов"
        ? "Главный инженер производства"
        : "Руководитель дивизиона",
    opponentName: "Валерий Строганов",
    opponentCompany: "ООО «ТехноПром Инжиниринг»",
    opponentPersonality: "Хладнокровный прагматик, прессингует альтернативными площадками",
    personalityTone: personalityTone || "Агрессивный / Прессинг",
    hiddenGoal: "Срочный дедлайн запуска производства к 3 кварталу (подписаны контракты на станки)",
    opponentBatna: "Уход в индустриальный парк «Север» с готовым складом",
    toughnessLevel: chosenToughness,
    bluffTendency: 80,
    difficulty: "Прожжённый закупщик",
    zoneCluster: "Индустриальный парк «Синергия»",
    initialContext: "Крупный производитель оборудования выбирает между ОЭЗ «Алабуга» и альтернативной площадкой. Оппонент требует скидку на аренду и бесплатное технологическое присоединение.",
    initialOpponentUtterance: "Добрый день. Наше предложение: 400 ₽/м² и 6 месяцев каникул, плюс 8 МВт электросетей полностью за ваш счет. Иначе мы подписываем договор с Калугой.",
    initialBarsAdvice: "Внимание: оппонент сразу открывает встречу жестким блефом по Калуге. Парируйте дефицитом свободных мощностей 110 кВ у конкурентов!",
    targetKpis: [
      "Удержать базовую арендную ставку не ниже 460 ₽/м²",
      "Ограничить арендные каникулы максимум 4 месяцами",
      "Привязать подвод 8 МВт к встречному CAPEX от 1.2 млрд ₽"
    ],
    batna: {
      minPricePerSqm: 460,
      maxGracePeriodMonths: 4,
      taxHolidayYears: 10,
      minJobCreation: 250,
      minCapexMillionRub: 1200,
      redLines: [
        "Не опускать ставку ниже 460 ₽/м² без встречных инвестиций",
        "Не давать каникулы более 4 месяцев",
        "Технологическое присоединение только под твердый CAPEX инвестора"
      ]
    }
  };
}

// API endpoint for negotiation turn
app.post("/api/negotiate", async (req, res) => {
  const startTime = Date.now();
  const provider = getActiveProvider();
  const { history, context } = req.body;

  const userMessages = (history || []).filter((m: any) => m.actor === "USER" || m.actor === "user");
  const opponentMessages = (history || []).filter((m: any) => m.actor === "OPPONENT" || m.actor === "opponent");
  const lastUserMsg = userMessages[userMessages.length - 1]?.text || "";
  const lastOpponentMsg = opponentMessages[opponentMessages.length - 1]?.text || "";

  if (provider === "fallback") {
    const fallback = generateFallbackResponse(req.body);
    fallback.latency_ms = Date.now() - startTime;
    return res.json(fallback);
  }

  const sphere = context?.sphere || "B2B / Инвесторы ОЭЗ";
  const opponentRole = context?.opponentRole || "Генеральный директор";
  const opponentName = context?.opponentName || "Валерий Строганов";
  const opponentCompany = context?.opponentCompany || "ООО «ТехноПром Инжиниринг»";
  const personalityTone = context?.personalityTone || "Агрессивный / Прессинг";
  const toughnessLevel = context?.toughnessLevel || 80;
  const difficultyScore = Math.round((toughnessLevel / 100) * 10);
  const bluffTendency = context?.bluffTendency || 85;
  const hiddenGoal = context?.hiddenGoal || "Сбить цену любой ценой и скрыть дедлайн запуска к Q3";
  const opponentBatna = context?.opponentBatna || "Уход на другую площадку";
  const scenarioDescription = context?.initialContext || `${sphere}. Переговоры с ключевым партнером ${opponentCompany}.`;
  const redLines = context?.batna?.redLines || ["Не сдавать базовые параметры соглашения"];
  const batnaRulesFormatted = redLines.map((r: string, idx: number) => `${idx + 1}. ${r}`).join("\n");

  const dynamicSystemPrompt = `ТЫ — ПЕРЕГОВОРНЫЙ СИМУЛЯТОР ДЛЯ СЦЕНАРИЯ:
- Роль оппонента: ${opponentName}, ${opponentRole} (${opponentCompany})
- Контекст сделки: ${scenarioDescription}
- Психотип: ${personalityTone} | Уровень жесткости: ${difficultyScore}/10 | Склонность к блефу: ${bluffTendency}%
- Скрытая цель оппонента: ${hiddenGoal}
- Альтернатива оппонента: ${opponentBatna}

КРАСНЫЕ ЛИНИИ ИГРОКА (BATNA), КОТОРЫЕ ОН ОБЯЗАН ЗАЩИТИТЬ:
${batnaRulesFormatted}

ПРАВИЛА ЛОГИЧЕСКОГО АНАЛИЗА РЕПЛИК (ФАКТЧЕКИНГ):
1. СЕМАНТИЧЕСКИЙ АНАЛИЗ: Внимательно различай согласие, отказ и встречное условие:
   - Если игрок использует отрицания («не согласен», «не подписываем», «исключено», «не пойдем на 400», «не можем предоставить») в адрес требований оппонента — трактуй это как УДЕРЖАНИЕ позиции, а не уступку!
   - Фиксируй факт сдачи BATNA (is_batna_violated: true) ТОЛЬКО тогда, когда игрок явно соглашается на цифру оппонента хуже допустимой по правилам BATNA. Фраза «не согласны на 400» НИКОГДА не является нарушением BATNA.
2. СТУПЕНЧАТЫЙ ТОРГ:
   - Не принимай первое встречное предложение игрока, даже если оно логично. Требуй дополнительных уступок в рамках роли оппонента.
   - Не повторяй реплики слово в слово. Развивай диалог на основе последнего аргумента игрока.
   - Если игрок отправляет повторный аргумент или нажимает одну и ту же заготовку слово в слово — осади его («Вы уже говорили это. На мой вопрос вы не ответили»).
3. МЕТРИКИ:
   - Изменение метрик (trust, tension, deal_readiness) за один шаг не должно превышать ±15%. Не задирай стресс до 100% при нормальном торге.
   - Возвращай metrics_delta (изменение за ход в диапазоне от -15 до +15).
4. ТАКТИЧЕСКИЙ РАЗБОР Б.А.Р.С. (bars_feedback):
   - Указывай на сильный маневр или ошибку игрока в терминах Гарвардского метода принципиальных переговоров и концепции BATNA.
5. ДИНАМИЧЕСКИЕ ПОДСКАЗКИ (dynamic_hints):
   - Модель на лету генерирует ровно 3 тактических каркаса-шаблона под текущий контекст диалога с плейсхолдерами [...] или ... (scaffolding для игрока, чтобы он дополнил своими словами).

Верни ответ СТРОГО в JSON формате со следующими полями:
{
  "opponent_reply": "Реплика оппонента",
  "bars_feedback": "Тактический совет и разбор Б.А.Р.С.",
  "bars_animation": "idle | talk | warn | win",
  "metrics": {
    "trust": 0..100,
    "tension": 0..100,
    "deal_readiness": 0..100
  },
  "agenda": {
    "rate": { "status": "agreed|in_progress|disputed", "detail": "..." },
    "grace_period": { "status": "agreed|in_progress|disputed", "detail": "..." },
    "power_capex": { "status": "agreed|in_progress|disputed", "detail": "..." }
  },
  "is_deal_closed": false,
  "is_deal_failed": false,
  "manipulation_type": "none|bluff|authority_press|hurry_trap",
  "hidden_need_revealed": false,
  "active_counter_offer": 300
}`;

  const formattedHistory = (history || []).map((m: any) => `${m.actor}: ${m.text}`).join("\n");
  const currentMetrics = context?.currentMetrics || { trust: 50, tension: 40, deal_readiness: 25 };
  const userPrompt = `История переговоров:\n${formattedHistory}\n\nТекущие метрики игрока: ${JSON.stringify(currentMetrics)}\n\nДай ответ строго в JSON формате.`;

  try {
    let result: any = null;
    let modelName = "";

    if (provider === "openrouter") {
      const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";
      modelName = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free";
      result = await callOpenAICompatible({
        url: openRouterUrl,
        apiKey: process.env.OPENROUTER_API_KEY,
        model: modelName,
        systemPrompt: dynamicSystemPrompt,
        userPrompt,
        extraHeaders: {
          "HTTP-Referer": "https://alabuga.ru",
          "X-Title": "Alabuga Negotiation Arena",
        },
      });
    } else if (provider === "local") {
      const baseUrl = (process.env.LOCAL_LLM_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
      const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/v1/chat/completions`;
      modelName = process.env.LOCAL_LLM_MODEL || "llama3.2";
      result = await callOpenAICompatible({
        url: endpoint,
        model: modelName,
        systemPrompt: dynamicSystemPrompt,
        userPrompt,
      });
    } else if (provider === "gemini") {
      const ai = getGenAI();
      if (!ai) throw new Error("Gemini AI client not initialized (GEMINI_API_KEY missing)");
      modelName = "gemini-3.8-flash";

      const geminiCall = ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: dynamicSystemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              opponent_reply: { type: Type.STRING },
              bars_feedback: { type: Type.STRING },
              bars_animation: { type: Type.STRING },
              metrics_delta: {
                type: Type.OBJECT,
                properties: {
                  trust: { type: Type.INTEGER },
                  tension: { type: Type.INTEGER },
                  deal_readiness: { type: Type.INTEGER },
                },
                required: ["trust", "tension", "deal_readiness"],
              },
              is_batna_violated: { type: Type.BOOLEAN },
              dynamic_hints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              agenda_status: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    status: { type: Type.STRING },
                  },
                  required: ["topic", "status"],
                },
              },
              agenda: {
                type: Type.OBJECT,
                properties: {
                  rate: {
                    type: Type.OBJECT,
                    properties: {
                      status: { type: Type.STRING },
                      detail: { type: Type.STRING },
                    },
                    required: ["status", "detail"],
                  },
                  grace_period: {
                    type: Type.OBJECT,
                    properties: {
                      status: { type: Type.STRING },
                      detail: { type: Type.STRING },
                    },
                    required: ["status", "detail"],
                  },
                  power_capex: {
                    type: Type.OBJECT,
                    properties: {
                      status: { type: Type.STRING },
                      detail: { type: Type.STRING },
                    },
                    required: ["status", "detail"],
                  },
                },
              },
              metrics: {
                type: Type.OBJECT,
                properties: {
                  trust: { type: Type.INTEGER },
                  tension: { type: Type.INTEGER },
                  deal_readiness: { type: Type.INTEGER },
                },
              },
              is_deal_closed: { type: Type.BOOLEAN },
              is_deal_failed: { type: Type.BOOLEAN },
              manipulation_type: { type: Type.STRING },
              hidden_need_revealed: { type: Type.BOOLEAN },
              active_counter_offer: { type: Type.INTEGER },
              emotion: { type: Type.STRING },
              emotion_label: { type: Type.STRING },
              emotion_emoji: { type: Type.STRING },
            },
            required: [
              "opponent_reply",
              "bars_feedback",
              "bars_animation",
            ],
          },
        },
      });

      const response = await withTimeout(geminiCall, 7000, "Gemini call timeout");
      const text = response.text?.trim();
      if (!text) throw new Error("Empty response from Gemini");
      result = JSON.parse(text);
    }

    if (result) {
      // Calculate clamped metrics using metrics_delta (capped strictly at ±15% per step)
      const clampDelta = (d: number | undefined) => Math.min(15, Math.max(-15, Number(d) || 0));
      const deltaTrust = clampDelta(result.metrics_delta?.trust);
      const deltaTension = clampDelta(result.metrics_delta?.tension);
      const deltaReadiness = clampDelta(result.metrics_delta?.deal_readiness);

      const calcTrust = Math.min(100, Math.max(0, currentMetrics.trust + deltaTrust));
      const calcTension = Math.min(100, Math.max(0, currentMetrics.tension + deltaTension));
      const calcReadiness = result.is_deal_closed ? 100 : Math.min(100, Math.max(0, currentMetrics.deal_readiness + deltaReadiness));

      const finalMetrics = result.metrics || {
        trust: calcTrust,
        tension: calcTension,
        deal_readiness: calcReadiness,
      };

      result.metrics = finalMetrics;
      result.latency_ms = Date.now() - startTime;
      result.provider_name = provider;
      result.model_name = modelName;
      result.methodology_tag = result.methodology_tag || detectMethodologyTag(lastUserMsg, lastOpponentMsg);
      result.zopa = calculateZopa(
        context,
        result.active_counter_offer || 300,
        result.agenda || context?.agenda,
        result.is_deal_closed || false,
        result.is_deal_failed || false
      );
      result.context_hints = result.dynamic_hints || result.context_hints || [
        "Валерий, почему для вас так критичен срок ввода к 3 кварталу? Давайте разделим проект на фазы: подключим ключевые 15 МВт в первую очередь по ставке 460 ₽/м²...",
        "Если оценить альтернативу в Калуге: простой оборудования на 14 месяцев обойдется бизнесу дороже любой экономии на аренде. В Алабуге подстанция 110 кВ уже готова...",
        "Давайте не загонять диалог в ловушку ультиматумов: мы закрепляем целевое обучение кадров в «Политехе», а вы подтверждаете ставку 460 ₽/м² и график CAPEX...",
      ];
      result.is_deal_closed = Boolean(result.is_deal_closed || calcReadiness >= 100);
      result.is_deal_failed = Boolean(result.is_deal_failed || (calcTension >= 95 && calcTrust <= 20));

      return res.json(result);
    }
  } catch (error) {
    console.warn(`[${provider.toUpperCase()}] Provider failed, fallback to state engine:`, error);
    const fallback = generateFallbackResponse(req.body);
    fallback.latency_ms = Date.now() - startTime;
    return res.json(fallback);
  }

  const fallback = generateFallbackResponse(req.body);
  fallback.latency_ms = Date.now() - startTime;
  return res.json(fallback);
});

// Runtime provider switcher endpoint (1-click Live <-> Offline switch)
app.get("/api/provider", (_req, res) => {
  res.json({
    activeProvider: getActiveProvider(),
    runtimeOverride: runtimeProviderOverride,
  });
});

app.post("/api/provider", (req, res) => {
  const { provider } = req.body;
  if (provider === "openrouter" || provider === "gemini" || provider === "local" || provider === "fallback" || provider === null) {
    setRuntimeProvider(provider);
    return res.json({
      success: true,
      activeProvider: getActiveProvider(),
      runtimeOverride: runtimeProviderOverride,
    });
  }
  return res.status(400).json({ error: "Invalid provider name" });
});

// API endpoint to generate complete scenario using active LLM provider
app.post("/api/generate-case", async (req, res) => {
  const provider = getActiveProvider();
  const { sphere, personalityTone, toughnessLevel } = req.body;

  const prompt = `Сгенерируй новый реалистичный кейс для тренировки жестких переговоров в Особой Экономической Зоне «Алабуга».
Параметры:
- Сфера: ${sphere || "B2B / Инвесторы ОЭЗ"}
- Психотип оппонента: ${personalityTone || "Агрессивный / Прессинг"}
- Жесткость: ${toughnessLevel || 80}%

Верни строгий JSON объект со следующей структурой:
{
  "id": "ai_gen_${Date.now()}",
  "title": "Название кейса",
  "sphere": "${sphere || "B2B / Инвесторы ОЭЗ"}",
  "opponentRole": "Должность",
  "opponentName": "ФИО (русское или иностранное в зависимости от кейса)",
  "opponentCompany": "Название компании",
  "opponentPersonality": "Краткая характеристика психотипа",
  "personalityTone": "${personalityTone || "Агрессивный / Прессинг"}",
  "hiddenGoal": "Скрытая боль или скрытая выгода оппонента",
  "opponentBatna": "Запасной вариант оппонента",
  "toughnessLevel": ${toughnessLevel || 80},
  "bluffTendency": 75,
  "difficulty": "Прожжённый закупщик",
  "zoneCluster": "Индустриальный парк «Синергия»",
  "initialContext": "Описание ситуации переговоров (2-3 предложения)",
  "initialOpponentUtterance": "Первая реплика оппонента (напор, жесткое требование)",
  "initialBarsAdvice": "Совет наставника Б.А.Р.С. на старте раунда",
  "targetKpis": ["Цель 1", "Цель 2", "Цель 3"],
  "batna": {
    "minPricePerSqm": 460,
    "maxGracePeriodMonths": 4,
    "taxHolidayYears": 10,
    "minJobCreation": 150,
    "minCapexMillionRub": 800,
    "redLines": ["Красная линия 1", "Красная линия 2"]
  }
}`;

  try {
    if (provider === "openrouter") {
      const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";
      const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";
      const parsed = await callOpenAICompatible({
        url: openRouterUrl,
        apiKey: process.env.OPENROUTER_API_KEY,
        model,
        systemPrompt: "Ты — генератор индустриальных переговорных сценариев для ОЭЗ «Алабуга». Выводи строго JSON.",
        userPrompt: prompt,
        extraHeaders: {
          "HTTP-Referer": "https://alabuga.ru",
          "X-Title": "Alabuga Negotiation Arena",
        },
      });
      return res.json(parsed);
    }

    if (provider === "local") {
      const baseUrl = (process.env.LOCAL_LLM_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
      const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/v1/chat/completions`;
      const model = process.env.LOCAL_LLM_MODEL || "llama3.2";
      const parsed = await callOpenAICompatible({
        url: endpoint,
        model,
        systemPrompt: "Ты — генератор индустриальных переговорных сценариев для ОЭЗ «Алабуга». Выводи строго JSON.",
        userPrompt: prompt,
      });
      return res.json(parsed);
    }

    if (provider === "gemini") {
      const ai = getGenAI();
      if (!ai) throw new Error("Gemini API key not configured");

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text?.trim();
      if (!text) throw new Error("Empty response");
      return res.json(JSON.parse(text));
    }
  } catch (err) {
    console.warn(`[${provider.toUpperCase()}] Case generation fallback:`, err);
    return res.json(generateFallbackCase(sphere, personalityTone, toughnessLevel));
  }

  // Fallback case generation
  return res.json({
    id: `ai_gen_${Date.now()}`,
    title: `Спецпроект: ${sphere || "B2B Инвестиции"}`,
    sphere: sphere || "B2B / Инвесторы ОЭЗ",
    opponentRole: "Генеральный директор",
    opponentName: "Виктор Чернов",
    opponentCompany: "АО «ПромХолдинг Волга»",
    opponentPersonality: "Напористый переговорщик с завышенными требованиями к субсидиям",
    personalityTone: personalityTone || "Агрессивный / Прессинг",
    hiddenGoal: "Согласовать скидку до одобрения кредита банком к концу квартала",
    opponentBatna: "Рассмотрение других индустриальных парков ПФО",
    toughnessLevel: toughnessLevel || 80,
    bluffTendency: 75,
    difficulty: "Прожжённый закупщик",
    zoneCluster: "Индустриальный парк «Синергия»",
    initialContext: "Крупный производитель планирует развернуть сборочный цех. Требует максимальных льгот и заниженную ставку.",
    initialOpponentUtterance: "Добрый день. Мы готовы стать резидентами «Алабуги», но ваши текущие условия неконкурентны. Дайте нам скидку 40% и 10 месяцев каникул, иначе мы уходим к конкурентам.",
    initialBarsAdvice: "Внимание: оппонент блефует и прощупывает почву. Не уступайте базовую ставку, требуйте встречный объем инвестиций!",
    targetKpis: ["Защитить ставку BATNA", "Ограничить каникулы до 4 месяцев", "Зафиксировать создание 150 рабочих мест"],
    batna: {
      minPricePerSqm: 460,
      maxGracePeriodMonths: 4,
      taxHolidayYears: 10,
      minJobCreation: 150,
      minCapexMillionRub: 800,
      redLines: ["Не опускать ставку ниже 460 ₽/м²", "Каникулы строго до 4 месяцев"],
    },
  });
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  const active = getActiveProvider();
  res.json({
    status: "ok",
    app: "Alabuga Negotiation Arena KMP Backend",
    activeProvider: active,
    configuredProviders: {
      openrouter: !!process.env.OPENROUTER_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      local: !!process.env.LOCAL_LLM_URL,
      fallback: true,
    },
    models: {
      openrouter: process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet",
      gemini: "gemini-3.8-flash",
      local: process.env.LOCAL_LLM_MODEL || "llama3.2",
    },
  });
});

// Explicitly handle all unmatched /api/* requests so they NEVER fall through to Vite's SPA index.html
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Explicitly serve static assets from public/ (GLB models, images, achievements)
    app.use(express.static(path.resolve(process.cwd(), "public")));
    app.use(vite.middlewares);

    app.get("*", async (req, res, next) => {
      // Do not serve index.html for static file requests (.glb, .svg, .jpg, .png, etc.)
      if (req.path.match(/\.(glb|gltf|bin|jpg|jpeg|png|svg|webp|ico|json|css|js|map)$/i)) {
        return res.status(404).send("Not found");
      }
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(process.cwd(), "index.html");
        const fs = await import("fs");
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, "utf-8");
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
          return;
        }
        next();
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Alabuga Negotiation Arena server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
