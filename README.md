# 🦾 Б.А.Р.С. — Симулятор жестких B2B-переговоров (ОЭЗ «Алабуга»)

[![Команда: No PHP - No problems](https://img.shields.io/badge/Team-No%20PHP%20--%20No%20problems-7b2cbf?style=for-the-badge&logo=target)](https://github.com)
[![Kotlin Multiplatform](https://img.shields.io/badge/Kotlin_Multiplatform-2.1-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)](https://kotlinlang.org/docs/multiplatform.html)
[![Compose Multiplatform](https://img.shields.io/badge/Compose_Multiplatform-1.7-4285F4?style=for-the-badge&logo=jetpackcompose&logoColor=white)](https://www.jetbrains.com/lp/compose-multiplatform/)
[![Android APK Target](https://img.shields.io/badge/Android-APK_Build-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com/)
[![Ktor Client](https://img.shields.io/badge/Ktor-3.0_Client-087CFA?style=for-the-badge&logo=ktor&logoColor=white)](https://ktor.io/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![React 19 Web Demo](https://img.shields.io/badge/React_19-Web_Preview_Interactive-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)

Корпоративная платформа развития человеческого капитала и тренажер ведения жестких коммерческих переговоров с ключевыми резидентами особой экономической зоны **ОЭЗ «Алабуга»**.

Архитектура: **Kotlin Multiplatform (Compose Multiplatform)** с единым UI-кодом для сборки нативного **Android .apk**, **Wasm (Web)** и кроссплатформенного **Desktop**, а также веб-стенда.

Разработано командой **«No PHP - No problems»**.

---

## 🏛️ Архитектура Kotlin Multiplatform (Compose Multiplatform)

```
                     ┌───────────────────────────────────────────┐
                     │          commonMain (Чистый Kotlin)       │
                     │  - MVI/Clean Architecture                 │
                     │  - Compose Multiplatform Material 3 UI    │
                     │  - Ktor Client (REST к Gemini 2.5 Flash)  │
                     │  - dynamicContext & BATNA engine          │
                     └─────────────────────┬─────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
       ┌─────────────────────────┐                   ┌─────────────────────────┐
       │   androidMain (.apk)    │                   │     wasmJsMain (Web)    │
       │ - Android Gradle Plugin │                   │ - Kotlin/Wasm Compiler  │
       │ - SceneView 3D (Native) │                   │ - Canvas / WebAssembly  │
       │ - Артефакт: release.apk │                   │ - Деплой на хостинг     │
       └─────────────────────────┘                   └─────────────────────────┘
```

### Сборка Android .apk через Gradle:
```bash
./gradlew :composeApp:assembleRelease
```
Релизный файл будет сформирован в `composeApp/build/outputs/apk/release/composeApp-release-unsigned.apk`.

### Сборка Kotlin/Wasm Web-версии:
```bash
./gradlew :composeApp:wasmJsBrowserDistribution
```

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
