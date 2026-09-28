<div align="center">

# 🦾 АРЕНА ПЕРЕГОВОРОВ • ОЭЗ «АЛАБУГА»
### *Интерактивный AI-тренажер жестких B2B-сделок с 3D-наставником Б.А.Р.С.*

[![Команда](https://img.shields.io/badge/Команда-NO%20PHP%20--%20NO%20PROBLEMS%20--%202026-7B2CBF?style=for-the-badge&logo=kotlin&logoColor=white)](https://github.com/linskay/lct2026-alabuga)
[![Kotlin](https://img.shields.io/badge/Kotlin-2.1.10-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)](https://kotlinlang.org/)
[![Compose Multiplatform](https://img.shields.io/badge/Compose-Multiplatform%201.7.3-4285F4?style=for-the-badge&logo=jetpackcompose&logoColor=white)](https://www.jetbrains.com/lp/compose-multiplatform/)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-Wasm_GC-654FF0?style=for-the-badge&logo=webassembly&logoColor=white)](https://kotl.in/wasm)
[![Android](https://img.shields.io/badge/Android-APK%20(Edge--to--Edge)-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com/)
[![Desktop](https://img.shields.io/badge/Desktop-Windows%20MSI%20%7C%20JAR-0078D7?style=for-the-badge&logo=windows&logoColor=white)](https://www.jetbrains.com/lp/compose-multiplatform/)

<br/>

> **«Учись побеждать в B2B-сделках без уступок. Защищай BATNA, держи красные линии ОЭЗ и заключай стратегические контракты в реальном времени!»**

</div>

---

## ⚡ Ключевые преимущества и ВАУ-эффекты

- 🤖 **Интерактивный 3D-наставник Б.А.Р.С.**:
  - Высокодетализированная модель с плавными невербальными реакциями на ход переговоров (`wave`, `nod`, `tilt`, `talk`, `idle`).
  - Мягкая радиальная подложка, кинематографичная эллиптическая тень и отсутствие фокус-рамок на десктопе и мобильных устройствах.
- 🎯 **Боевой экран «Арена» в пропорции 65% / 35%**:
  - **Live-окно оппонента**: встроенный стресс-индикатор (HUD) с динамической цветовой шкалой от спокойного фиолетового ($0\%$) до тревожного ало-красного ($100\%$).
  - **История диалога Cyber-Glass**: контрастная типографика (16–17sp), полупрозрачные бордеры, отсутствие перегруженности.
  - **Широкая строка ввода**: просторное поле в стиле *Google AI Studio* с поддержкой быстрых динамических чипсов-подсказок.
  - **Тактический центр**: отдельная плашка советов Б.А.Р.С., телеметрия (Доверие / Стресс / Готовность), интерактивная карта **ZOPA** и повестка **AGENDA**.
- 📥 **Аналитический PDF-дебрифинг**:
  - Моментальная выгрузка итогового отчета о поединке, защите BATNA, разборе манипуляций и финальном ранге ($S/A/B$).
- 📱 **Полный Immersive Sticky Mode на Android**:
  - Чистый полноэкранный Edge-to-Edge интерфейс с автоматическим скрытием системных кнопок и статус-бара.
- 🔑 **Панель конфигуратора и AI-бэкенда**:
  - Адаптивная сетка боевых пресетов ОЭЗ, шкала жесткости оппонентов и встроенная интеграция ключей **Google Gemini** и **OpenRouter**.

---

## 🏛️ Архитектура единого репозитория (100% Kotlin Multiplatform)

```
.
├── shared/                             # Единое ядро бизнес-логики и UI
│   ├── commonMain/                     # 100% общий Compose UI, экраны (Home, Arena, Admin)
│   ├── androidMain/                    # Android Immersive & Canvas implementations
│   ├── desktopMain/                    # Desktop JMonkeyEngine 3D implementations
│   └── wasmJsMain/                     # Web Wasm Google model-viewer 3D host
├── app/                                # Android-приложение (Immersive Sticky Mode, SDK 26-34)
├── desktop/                            # Desktop-приложение (Windows MSI установщик / UberJar)
├── web/                                # WebAssembly браузерная версия (Wasm GC, 60 FPS)
├── .github/workflows/release.yml       # Автоматическая сборка всех релизов (APK + MSI + Wasm)
├── Dockerfile                          # Multi-stage сборка Nginx + Wasm
└── docker-compose.yml                  # Мгновенное развертывание веб-версии
```

---

## 🚀 Быстрый запуск и сборка

### 🌐 1. WebAssembly (Браузерная версия):
```bash
./gradlew :web:wasmJsBrowserDevelopmentRun          # Запуск локального dev-сервера с hot-reload
./gradlew :web:wasmJsBrowserDistribution             # Продакшн-бандл Wasm + JS
```

### 📱 2. Android APK:
```bash
./gradlew :app:assembleDebug
./gradlew :app:assembleRelease
```
*Сгенерированный APK:* `app/build/outputs/apk/debug/app-debug.apk`.

### 🪟 3. Windows Desktop (MSI / JAR):
```bash
./gradlew :desktop:packageDistributionForCurrentOS   # Нативный MSI установщик
./gradlew :desktop:packageUberJarForCurrentOS        # Универсальный исполняемый JAR
```

### 🐳 4. Docker (Развертывание веб-версии):
```bash
docker compose up -d --build
```
Доступно в браузере по адресу: `http://localhost:3000`.

---

## 🏆 Разработано командой «NO PHP - NO PROBLEMS - 2026» для ОЭЗ «Алабуга»
> *Чистый нативный стек, передовые стандарты Compose Multiplatform и бескомпромиссная надежность.*
