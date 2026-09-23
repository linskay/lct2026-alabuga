# 🦾 Б.А.Р.С. — Симулятор жестких B2B-переговоров (ОЭЗ «Алабуга»)

[![Команда: No PHP - No problems](https://img.shields.io/badge/Team-No%20PHP%20--%20No%20problems-7b2cbf?style=for-the-badge&logo=target)](https://github.com)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js & Express](https://img.shields.io/badge/Node.js-Express%20Fullstack-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Google Model-Viewer 3D](https://img.shields.io/badge/3D-Web_Components%20GLTF-FF6F00?style=for-the-badge&logo=webcomponents.org&logoColor=white)](https://modelviewer.dev/)

Корпоративная платформа развития человеческого капитала и тренажер ведения жестких коммерческих переговоров с ключевыми резидентами особой экономической зоны **ОЭЗ «Алабуга»**.

Разработано командой **«No PHP - No problems»**.

---

## 🎯 Ключевые возможности

- 🤖 **3D-окно видеоконференции**: портретный план виртуального оппонента (Google `<model-viewer>` + GLTF-анимации эмоций в реальном времени).
- 🧠 **ИИ-оппонент на Gemini 2.5 Flash**: динамическая смена тактики, проверка жестких границ, блеф, калибровка стресса и сближение позиций.
- 🛡️ **Защита BATNA и регламентов ОЭЗ**: удержание ставки (не ниже 460 ₽/м²), контроль каникул (до 4 месяцев), CAPEX от 1.2 млрд ₽ под мощности 8 МВт.
- ⚡ **Двухколоночный HUD (70/30)**: чистая лента стенограммы без лишнего визуального шума + тактический центр мониторинга телеметрии (Доверие, Стресс, Готовность к сделке).
- 🧩 **Анти-кликер Scaffolding**: динамические чипсы-заготовки подсказок с горизонтальным drag-to-scroll скроллом и блокировкой отправки незаполненных шаблонов (`[...]`, `...`).
- ⏳ **Машина времени (Time Travel)**: древовидный откат шагов диалога назад для поиска оптимальной ветки переговоров.
- 📄 **Экспорт MOU / HR-отчета**: генерация официального протокола встречи в PDF/HTML с фиксацией параметров сделки, HR-метрик и стоп-лексикона сотрудника.
- 🌐 **Универсальный генератор сценариев**: динамическая адаптация под любую предметную область (B2B, фармацевтика, IT, логистика) со строгим фактчекингом отрицаний и динамическими чипсами `dynamic_hints`.

---

## 🧠 Универсальный движок кейсов и фактчекинг

1. **Динамический системный промпт**: формируется на лету из переменных конфигуратора (`scenario.opponent_name`, `scenario.description`, `scenario.tone`, `scenario.difficulty`, `scenario.batna_rules`).
2. **Семантический анализ (Фактчекинг отрицаний)**: отрицания игрока («не согласен», «не подписываем», «не пойдем на 400») строго трактуются как **удержание позиции**. Сдача BATNA фиксируется исключительно при явном согласии на недопустимые условия.
3. **Ступенчатый торг и калибровка**: оппонент не принимает первое встречное предложение, развивает диалог от аргументов игрока, а дельты метрик ограничены коридором `±15%` за шаг.
4. **Структурированный JSON-контракт**:
```json
{
  "opponent_reply": "Текст ответа оппонента с учетом его роли и контекста",
  "bars_feedback": "Тактический разбор: указание на маневр или ошибку по Гарвардскому методу / BATNA",
  "bars_animation": "idle | talk | warn | win",
  "metrics_delta": { "trust": 5, "tension": -5, "deal_readiness": 10 },
  "is_batna_violated": false,
  "dynamic_hints": ["Каркас аргумента 1...", "Каркас аргумента 2...", "Каркас аргумента 3..."],
  "agenda_status": [
    { "topic": "Арендная ставка", "status": "agreed | negotiating | rejected" }
  ]
}
```

---

## 🛠️ Стек технологий

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, `@google/model-viewer`.
- **Backend**: Node.js, Express, TSX, `@google/genai` SDK (Gemini 2.5 Flash со структурированным JSON-Schema выходом).
- **Сборка и продакшн**: Vite, Esbuild, CJS Server Bundle.

---

## 🚀 Быстрый старт

### 1. Требования
- **Node.js** v20+ 
- **npm** v10+
- API-ключ **Gemini API** (`GEMINI_API_KEY`)

### 2. Установка зависимостей
```bash
npm install
```

### 3. Переменные окружения
Создайте файл `.env` в корневой директории:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 4. Запуск в режиме разработки
```bash
npm run dev
```
Сервер запустится по адресу: `http://localhost:3000`

### 5. Сборка для продакшна
```bash
npm run build
npm start
```

---

## 📁 Структура проекта

```
.
├── src/
│   ├── components/
│   │   ├── ArenaScreenView.tsx          # Основной экран арены (сетка 70/30, чат, ввод)
│   │   ├── OpponentVideoWindow.tsx      # 3D-модель собеседника, подиум и телеметрия
│   │   ├── DebriefingModal.tsx          # Итоговый дебрифинг и кнопка экспорта MOU
│   │   ├── TimeTravelTree.tsx           # Машина времени: дерево состояний и откат
│   │   ├── ScenarioConfiguratorScreen.tsx # Конфигуратор кейсов и сценариев
│   │   ├── CaseInfoModal.tsx            # Диспозиция кейса ОЭЗ
│   │   └── AdminConfigModal.tsx         # Настройки параметров BATNA и оппонента
│   ├── utils/
│   │   └── exportProtocol.ts            # Генератор протокола MOU / PDF-отчета HRD
│   ├── types.ts                         # Интерфейсы телеметрии, повестки и сообщений
│   ├── App.tsx                          # Главный контроллер состояния сессии
│   └── index.css                        # Стили Tailwind, неоновые акценты и no-scrollbar
├── server.ts                            # Express API + Gemini 2.5 Flash диалоговый движок
├── public/
│   └── bars.glb                         # 3D-модель персонажа с анимациями
└── package.json
```

---

## 👥 Команда проекта

**«No PHP - No problems»**  
Разработано для корпоративного тренинга дирекций ОЭЗ «Алабуга».
