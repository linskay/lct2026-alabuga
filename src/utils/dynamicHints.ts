import { AdminScenarioConfig } from "../types";

/**
 * Extracts a respectful form of address based on full name or role.
 */
export function getOpponentPoliteName(fullName?: string, role?: string): string {
  if (!fullName || typeof fullName !== "string") {
    return role ? role.toLowerCase() : "коллега";
  }

  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);

  // Single word name (e.g. "Артем", "Алексей")
  if (parts.length === 1) return parts[0];

  // East Asian names or specific format (e.g. "Чжан Вэй", "Ли Мин")
  if (parts.length === 2 && (parts[0].length <= 4 || ["Чжан", "Ван", "Ли", "Чжао", "Чэнь", "Ян"].includes(parts[0]))) {
    return `господин ${parts[0]}`;
  }

  // Standard Russian name: First name is typically parts[0] in "Имя Фамилия"
  return parts[0];
}

/**
 * Generates 3 dynamic, context-aware negotiation scaffolding hints (context_hints)
 * tailored to ANY scenario (preset, user-customized, or AI-generated).
 *
 * Implements game theory frameworks:
 * 1. Harvard Integrative Question (ZOPA / Interest vs. Position & Phased MVP rollout)
 * 2. BATNA Cost of Inaction (quantifying risks/losses of opponent's alternative)
 * 3. Principled Trade-off (conditional concession protecting core red lines)
 */
export function generateDynamicCaseHints(
  config?: Partial<AdminScenarioConfig>,
  history?: any[],
  manipulationType?: string,
  isDealClosed?: boolean
): string[] {
  const name = getOpponentPoliteName(config?.opponentName, config?.opponentRole);
  const company = config?.opponentCompany || "ваша компания";
  const alternative = config?.opponentBatna || "альтернативная площадка или подрядчик";
  const sphere = config?.sphere || "B2B / Инвесторы ОЭЗ";
  const redLines = config?.batna?.redLines || [];
  const primaryRedLine = redLines[0] || (config?.batna?.minPricePerSqm ? `ставку не ниже ${config.batna.minPricePerSqm} ₽/м²` : "базовые условия договора");
  const targetKpis = config?.targetKpis || [];
  const primaryKpi = targetKpis[0] || primaryRedLine;
  const secondaryKpi = targetKpis[1] || (targetKpis.length > 2 ? targetKpis[2] : "график реализации проекта");

  // 1. Сделка успешно закрыта: фиксация протокола и следующих шагов
  if (isDealClosed) {
    return [
      `${name}, фиксируем согласованные параметры: [перечислите ключевые договоренности] и передаем протокол на подписание.`,
      `Отлично, все разногласия сняты. Передаем проект соглашения юридической службе с учетом договоренности по [укажите главный пункт]...`,
      `Благодарю за конструктивный диалог! Закрепляем встречные обязательства: [укажите первые шаги обеих сторон]...`,
    ];
  }

  // 2. Отражение блефа / жесткого давления / манипуляции
  if (manipulationType === "bluff" || manipulationType === "authority_press" || manipulationType === "hurry_trap") {
    const shortAlt = alternative.length > 60 ? alternative.slice(0, 57) + "..." : alternative;
    return [
      `${name}, сравнение с альтернативой (${shortAlt}) некорректно без учета скрытых рисков: у нас [укажите подтвержденный факт/преимущество ОЭЗ], тогда как там...`,
      `Мы не принимаем стратегические решения под давлением цейтнота или ультиматумов. Давайте вернемся к цифрам: мы готовы [укажите компромисс], если вы гарантируете [встречное обязательство]...`,
      `Давайте отложим эмоции и сфокусируемся на экономике: назовите ваши реальные технологические требования к [срокам ввода или объемам], и мы найдем решение...`,
    ];
  }

  // 3. Специфика сферы: HR / Наем и удержание топов
  if (sphere.includes("HR") || sphere.includes("Наем") || sphere.includes("инженер")) {
    return [
      `${name}, почему для вас сейчас в приоритете именно этот оффер? Давайте посмотрим глубже: что важнее — голый оклад или лидерство в новом проекте? Мы готовы предложить [опишите полномочия или проект], взамен на...`,
      `Если трезво оценить переход в другую компанию: там вы начнете с нуля в чужой операционке. В ОЭЗ вы получаете масштаб и команду [укажите стажеров Политеха/ресурсы], если зафиксируем [укажите KPI]...`,
      `Давайте не загонять диалог в ультиматум: мы готовы пересмотреть компенсационный пакет и снять рутину [укажите уступку], при условии, что вы берете на себя запуск [укажите проект]...`,
    ];
  }

  // 4. Специфика сферы: Закупки и тендеры / Поставка оборудования
  if (sphere.includes("Закупк") || sphere.includes("тендер") || sphere.includes("оборудован") || sphere.includes("поставк")) {
    return [
      `${name}, почему для вас так критично исключить этот пункт ответственности? Давайте разделим контракт на фазы: запустим пилотную партию с [укажите условие], а гарантии привяжем к [укажите компромисс]...`,
      `Если оценить риск простоя без жестких гарантий пусконаладки: убытки от заморозки цеха многократно превысят любую экономию на цене. Наше требование защищает обе стороны, если мы [укажите шаг навстречу]...`,
      `Мы готовы согласовать комфортный график авансирования [укажите уступку], но взамен настаиваем на защите ключевого пункта: [${primaryRedLine}]...`,
    ];
  }

  // 5. B2B / Инвесторы ОЭЗ / Общие промышленные сценарии (на базе теории игр и ZOPA)
  return [
    `${name}, почему для вас так критичен именно этот дедлайн/бюджет? Давайте разделим проект на фазы: обеспечим ввод первой очереди [укажите первоочередной объем] на наших базовых условиях, а по остальным [опишите компромисс]...`,
    `Если взвесить альтернативу (${alternative.length > 50 ? alternative.slice(0, 47) + '...' : alternative}): простой оборудования и дефицит мощностей обойдутся бизнесу дороже. Мы гарантируем готовность сетей, если вы подтверждаете [${primaryKpi}]...`,
    `Давайте не загонять переговоры в ловушку ультиматумов: мы готовы пойти навстречу по [укажите допустимую уступку из ${secondaryKpi}], при условии, что вы соблюдаете [${primaryRedLine}]...`,
  ];
}
