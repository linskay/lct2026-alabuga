import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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

// Fallback generator for realistic, anti-looping, context-grounded simulation
function generateFallbackResponse(body: any) {
  const history = body.history || [];
  const context = body.context || {};
  const currentMetrics = context.currentMetrics || { trust: 50, tension: 40, deal_readiness: 30 };
  const currentAgenda = context.agenda || {
    rate: { id: "rate", title: "Арендная ставка", status: "disputed", detail: "Оппонент требует 300 ₽/м² (BATNA: от 460 ₽)" },
    grace_period: { id: "grace_period", title: "Каникулы на пусконаладку", status: "in_progress", detail: "Оппонент требует 12 мес. (Лимит: 4 мес.)" },
    power_capex: { id: "power_capex", title: "Электросети 8 МВт и CAPEX", status: "disputed", detail: "Оппонент требует бесплатный подвод" },
  };

  const lastUserMsg = [...history].reverse().find((m: any) => m.actor === "USER" || m.actor === "user")?.text || "";
  const lower = lastUserMsg.toLowerCase().trim();

  // Extract previous opponent responses to prevent loops
  const previousOpponentTexts = history
    .filter((m: any) => m.actor === "OPPONENT" || m.actor === "opponent")
    .map((m: any) => m.text);

  let trustDelta = 0;
  let tensionDelta = 0;
  let readinessDelta = 0;
  let opponentReply = "";
  let barsFeedback = "";
  let barsAnimation = "talk";
  let isDealClosed = false;
  let isDealFailed = false;

  const agenda = JSON.parse(JSON.stringify(currentAgenda));

  // --- RULE 2: REACTION TO ABSURDITY & IRREALISTIC DEADLINES ---
  const isAbsurdDeadline =
    lower.includes("1 день") ||
    lower.includes("один день") ||
    lower.includes("сутки") ||
    lower.includes("за сутки") ||
    lower.includes("завтра") ||
    lower.includes("за пару часов") ||
    lower.includes("за 2 часа") ||
    lower.includes("1 час");

  // --- RULE 2: REACTION TO EMPTY / VAGUE EVASIONS ("давайте согласуем", "ок") ---
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
    // Immediate punishment for absurd timeline
    trustDelta = -25;
    tensionDelta = +22;
    readinessDelta = -15;
    barsAnimation = "warn";
    opponentReply =
      "Спроектировать и подготовить производственный корпус на 12 000 м² за сутки? Вы сейчас шутите или совершенно не понимаете технологический цикл машиностроения? Это непрофессионально и подрывает доверие к вам как к партнеру.";
    barsFeedback =
      "КРИТИЧЕСКАЯ ОШИБКА: Нереалистичные обещания обвалили доверие (-25%)! На ПСД и пусконаладку крупного завода уходит 4–6 месяцев. Оперируйте реальными сроками.";
  } else if (isEmptyEvasion && (agenda.rate.status !== "agreed" || agenda.grace_period.status !== "agreed")) {
    // Opponent calls out empty evasions without concrete figures
    trustDelta = -15;
    tensionDelta = +15;
    barsAnimation = "warn";
    opponentReply =
      "Что именно вы предлагаете согласовать? Мы до сих пор не зафиксировали ни ставку за квадратный метр, ни сроки каникул. Назовите ваши конкретные условия по цифрам, а не общие слова.";
    barsFeedback =
      "Оппонент осадил вас за бессодержательную отписку. В жестких B2B-переговорах фраза «давайте согласуем» без цифр воспринимается как слабость и потеря контроля.";
  } else if (lower.includes("300") || lower.includes("350") || (lower.includes("скидк") && lower.includes("50%"))) {
    // Capitulation / Dumbing down rate below BATNA
    trustDelta = -18;
    tensionDelta = +20;
    barsAnimation = "warn";
    opponentReply =
      "Вы так легко прогибаетесь под наши требования? Это похвально для нашего бюджета, но заставляет сомневаться в качестве готовой инфраструктуры ОЭЗ. Или вы потом компенсируете это скрытыми платежами за сети?";
    barsFeedback =
      "ТРЕВОГА BATNA: Вы сдали базовую ставку ниже 460 ₽/м²! Оппонент заподозрил скрытый подвох. Немедленно привяжите ставку к встречным инвестициям или верните планку 460 ₽.";
  } else if ((lower.includes("460") || lower.includes("470") || lower.includes("480") || lower.includes("500")) && (lower.includes("рабоч") || lower.includes("инвест") || lower.includes("мест") || lower.includes("capex") || lower.includes("млрд"))) {
    // Solid defense of rate with mutual condition
    trustDelta = +16;
    tensionDelta = -10;
    readinessDelta = +25;
    barsAnimation = "talk";
    agenda.rate.status = "agreed";
    agenda.rate.detail = "Согласовано: 460 ₽/м² (под обязательства)";

    opponentReply =
      "Ставка 460 ₽/м² — это жестко, она выше наших первоначальных ориентиров. Однако связка с налоговыми льготами ОЭЗ и гарантией 250 рабочих мест делает это приемлемым. Ставку фиксируем. Теперь перейдем к каникулам: 12 месяцев на пусконаладку — наше строгое требование совета директоров.";
    barsFeedback =
      "ОТЛИЧНЫЙ ХОД: Ставка 460 ₽/м² удержана и зафиксирована (+25% готовность сделки)! Оппонент перешел к следующему пункту повестки — каникулам. Держите планку не более 4 месяцев.";
  } else if ((lower.includes("4 мес") || lower.includes("четыре мес") || lower.includes("каникул")) && agenda.rate.status === "agreed" && agenda.grace_period.status !== "agreed") {
    // Agreed on grace period
    trustDelta = +14;
    tensionDelta = -8;
    readinessDelta = +25;
    barsAnimation = "talk";
    agenda.grace_period.status = "agreed";
    agenda.grace_period.detail = "Согласовано: 4 месяца каникул";

    opponentReply =
      "4 месяца каникул вместо 12 — это существенное сокращение. Но если ОЭЗ обеспечит приоритетный аудит технадзора и ускоренную врезку в коммуникации, мы согласимся. Но остаётся критический вопрос: 8 МВт электроэнергии. Вы берете расходы на подвод мощностей 110 кВ на себя?";
    barsFeedback =
      "ВТОРОЙ ПУНКТ ЗАКРЫТ: Каникулы зафиксированы на 4 месяцах! Внимание: оппонент пытается продавить бесплатное технологическое присоединение 8 МВт. Требуйте встречный CAPEX от 1.2 млрд ₽.";
  } else if ((lower.includes("8 мвт") || lower.includes("энерг") || lower.includes("capex") || lower.includes("1.2") || lower.includes("инвестиц") || lower.includes("подвод")) && agenda.grace_period.status === "agreed" && agenda.power_capex.status !== "agreed") {
    // Power tied to CAPEX
    trustDelta = +18;
    tensionDelta = -12;
    readinessDelta = +25;
    barsAnimation = "talk";
    agenda.power_capex.status = "agreed";
    agenda.power_capex.detail = "Согласовано: 8 МВт под CAPEX 1.2 млрд ₽";

    opponentReply =
      "Логично. Если подстанция 110 кВ уже на границе участка «Синергии», мы готовы подтвердить гарантийный объем CAPEX в 1.2 млрд рублей на первую очередь. Похоже, все принципиальные разногласия сняты. Готовы зафиксировать договоренности в меморандуме?";
    barsFeedback =
      "ВСЯ ПОВЕСТКА СОГЛАСОВАНА: Ставка, каникулы и энергомощности закрыты в пользу ОЭЗ! Подтверждайте подписание итогового соглашения о резидентстве.";
  } else if ((lower.includes("подпис") || lower.includes("протокол") || lower.includes("соглашен") || lower.includes("фиксиру") || lower.includes("по рукам")) && agenda.rate.status === "agreed" && agenda.grace_period.status === "agreed" && agenda.power_capex.status === "agreed") {
    // Final closing
    isDealClosed = true;
    barsAnimation = "win";
    trustDelta = +10;
    readinessDelta = +20;
    opponentReply =
      "Договорились. Условия соответствуют стратегическим стандартам ОЭЗ «Алабуга» и инвестиционному плану нашего холдинга. Передаем документы юридической службе для подписания.";
    barsFeedback =
      "ПОБЕДА: Сделка закрыта на высший балл! Все красные линии защищены, ставка 460 ₽/м² удержана, привлечено 1.2 млрд инвестиций. Откройте «Дебрифинг» для оценки.";
  } else {
    // Default contextual answer without loop
    const stepCount = history.length;
    trustDelta = +3;
    tensionDelta = -2;
    readinessDelta = +5;
    barsAnimation = "talk";

    if (agenda.rate.status !== "agreed") {
      opponentReply =
        "Давайте вернемся к главному камню преткновения. 550 рублей за квадратный метр для нас неприемлемо. Мы готовы на 400–420 рублей только при условии гарантий со стороны ОЭЗ. Какова ваша встречная позиция по ставке?";
      barsFeedback =
        "Оппонент удерживает фокус на арендной ставке. Не давайте скидок просто так — предложите компромиссные 460 ₽/м² только в обмен на 250 рабочих мест.";
    } else if (agenda.grace_period.status !== "agreed") {
      opponentReply =
        "По ставке мы предварительно определились. Но мы не сдвинемся с места без ясности по каникулам: монтаж высокоточной немецкой линии займет минимум полгода. Какой срок каникул вы готовы утвердить?";
      barsFeedback =
        "Обсуждается срок каникул. Лимит BATNA ОЭЗ — не более 4–6 месяцев. Напомните, что цеха «Синергии» уже готовы к чистовой отделке.";
    } else {
      opponentReply =
        "У нас остался нерешенный вопрос инженерной инфраструктуры: подвод 8 МВт мощности и обеспечение водоснабжения. Каковы технические условия подключения?";
      barsFeedback =
        "Финальный спорный пункт — энергосети. Требуйте подтверждения инвестиций в 1.2 млрд ₽ в обмен на резервирование мощности.";
    }
  }

  // Double check: if opponentReply was already said before in this session, provide unique phrasing
  if (previousOpponentTexts.includes(opponentReply)) {
    opponentReply = `Повторюсь в контексте ваших слов: нам нужна предельная конкретика. ${opponentReply}`;
  }

  const finalTrust = Math.min(100, Math.max(0, currentMetrics.trust + trustDelta));
  const finalTension = Math.min(100, Math.max(0, currentMetrics.tension + tensionDelta));
  const finalReadiness = isDealClosed ? 100 : Math.min(100, Math.max(0, currentMetrics.deal_readiness + readinessDelta));

  if (finalTension >= 95 && finalTrust <= 20) {
    isDealFailed = true;
    barsAnimation = "warn";
    opponentReply =
      "Переговоры зашли в глухой тупик из-за неконструктивной позиции. Мы переносим инвестиционный проект на альтернативную площадку в Ульяновске. Всего доброго.";
    barsFeedback =
      "ПРОВАЛ ПЕРЕГОВОРОВ: Напряжение зашкалило, оппонент разорвал контакт. Используйте «Машину времени», чтобы вернуться на спорный шаг назад.";
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
    agenda,
    is_deal_closed: isDealClosed,
    is_deal_failed: isDealFailed,
  };
}

// API endpoint for negotiation turn
app.post("/api/negotiate", async (req, res) => {
  try {
    const { history, context } = req.body;
    const ai = getGenAI();

    if (!ai) {
      const fallback = generateFallbackResponse(req.body);
      return res.json(fallback);
    }

    const systemPrompt = `ТЫ — ВАЛЕРИЙ СТРОГАНОВ (Генеральный директор машиностроительного холдинга).
Ты ведешь жесткие, последовательные B2B-переговоры с представителем ОЭЗ «Алабуга» о размещении производства на 12 000 м² в индустриальном парке «Синергия».

ТАКЖЕ ты генерируешь реплики робота-наставника «Б.А.Р.С.» (Бортовой Аналитик Развития Стратегий ОЭЗ «Алабуга»).

ПРАВИЛА ТВОЕГО ПОВЕДЕНИЯ:
1. ПОСЛЕДОВАТЕЛЬНОСТЬ И ПАМЯТЬ:
   - Не перескакивай на новую тему, пока не закрыта текущая. Повестка включает 3 пункта:
     1) Арендная ставка (начальное требование 300 ₽, BATNA ОЭЗ: не ниже 460 ₽/м²);
     2) Каникулы на пусконаладку (начальное требование 12 мес, BATNA: не более 4-6 мес);
     3) Электросети 8 МВт и CAPEX (требует бесплатно, ОЭЗ дает только под гарантию 1.2 млрд ₽ CAPEX и 250 рабочих мест).
   - НИКОГДА не повторяй одну и ту же фразу дважды подряд. Реагируй именно на последние слова собеседника.

2. РЕАКЦИЯ НА НЕКОНКРЕТНЫЕ И НЕАДЕКВАТНЫЕ ОТВЕТЫ:
   - Если игрок пишет отписки вроде «давайте согласуем», «ок», осаждай его: «Что именно вы предлагаете согласовать? Мы не зафиксировали ни ставку, ни сроки. Назовите ваши конкретные условия».
   - Если игрок дает нереалистичные обещания (например, проектирование или запуск завода на 12 000 м² за 1 день / одни сутки), реагируй с недоверием и сарказмом: «Спроектировать завод на 12 000 м² за сутки? Вы сейчас шутите или не понимаете технологический цикл? Это подрывает доверие к вам как к партнеру».

3. ДИНАМИКА МЕТРИК:
   - Доверие (trust) РАСТЕТ ТОЛЬКО от твердых аргументов с цифрами и встречными условиями.
   - Напряжение (tension) РАСТЕТ (+15..+25%), а Доверие РЕЗКО ПАДАЕТ (-15..-25%), если игрок увиливает, торопит сделку («давайте подписывать») без согласования базы, соглашается на всё подряд без торга или несет чушь («1 день»).
   - Сделка НЕ МОЖЕТ быть готова (deal_readiness > 70%), пока не согласованы все 3 пункта повестки.

4. ЧЕК-ЛИСТ ДОГОВОРЕННОСТЕЙ (AGENDA):
Оценивай статус каждого пункта:
- rate: status ("agreed" | "in_progress" | "disputed"), detail (например: "Согласовано: 460 ₽/м²" или "Оппонент требует 300 ₽")
- grace_period: status ("agreed" | "in_progress" | "disputed"), detail (например: "Согласовано: 4 мес." или "Оппонент требует 12 мес.")
- power_capex: status ("agreed" | "in_progress" | "disputed"), detail (например: "Согласовано: 8 МВт под CAPEX 1.2 млрд ₽" или "Спорный вопрос")

Формат вывода строго в JSON.`;

    const formattedHistory = (history || []).map((m: any) => `${m.actor}: ${m.text}`).join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `История переговоров:\n${formattedHistory}\n\nТекущие метрики: ${JSON.stringify(context?.currentMetrics || {})}\n\nДай ответ строго в JSON формате.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            opponent_reply: { type: Type.STRING },
            bars_feedback: { type: Type.STRING },
            bars_animation: { type: Type.STRING },
            metrics: {
              type: Type.OBJECT,
              properties: {
                trust: { type: Type.INTEGER },
                tension: { type: Type.INTEGER },
                deal_readiness: { type: Type.INTEGER },
              },
              required: ["trust", "tension", "deal_readiness"],
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
              required: ["rate", "grace_period", "power_capex"],
            },
            is_deal_closed: { type: Type.BOOLEAN },
            is_deal_failed: { type: Type.BOOLEAN },
          },
          required: [
            "opponent_reply",
            "bars_feedback",
            "bars_animation",
            "metrics",
            "agenda",
            "is_deal_closed",
            "is_deal_failed",
          ],
        },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error) {
    console.warn("Gemini API call fallback to deterministic state engine:", error);
    const fallback = generateFallbackResponse(req.body);
    return res.json(fallback);
  }
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "Alabuga Negotiation Arena KMP Backend",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
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
