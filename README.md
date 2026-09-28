# 🦾 Арена переговоров — Kotlin Multiplatform & Compose

[![Команда: No PHP - No problems](https://img.shields.io/badge/Team-No%20PHP%20--%20No%20problems-7b2cbf?style=for-the-badge&logo=target)](https://github.com)
[![Kotlin](https://img.shields.io/badge/Kotlin-2.1.10-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)](https://kotlinlang.org/)
[![Jetpack Compose](https://img.shields.io/badge/Compose-Multiplatform-4285F4?style=for-the-badge&logo=jetpackcompose&logoColor=white)](https://www.jetbrains.com/lp/compose-multiplatform/)
[![Android APK Target](https://img.shields.io/badge/Android-APK_Build-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com/)
[![Desktop Target](https://img.shields.io/badge/Desktop-MSI%20%7C%20JAR-blue?style=for-the-badge&logo=windows&logoColor=white)](https://www.jetbrains.com/lp/compose-multiplatform/)
[![Web Wasm Target](https://img.shields.io/badge/Web-Wasm%20%28Compose%29-654FF0?style=for-the-badge&logo=webassembly&logoColor=white)](https://kotl.in/wasm)
[![CI/CD](https://img.shields.io/badge/GitHub_Actions-Automated_Release-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com)

Корпоративный интерактивный AI-полигон и симулятор жестких коммерческих переговоров ОЭЗ «Алабуга» на чистом нативном стеке **Kotlin Multiplatform / Compose Multiplatform (Material 3)**.

---

## 🏛️ Единая архитектура репозитория (Clean KMP Architecture)

```
.
├── .github/
│   └── workflows/
│       └── release.yml                 # Пайплайн сборки релизов (APK + MSI + JAR + Wasm)
├── gradle/
├── shared/                             # Единое ядро бизнес-логики и UI
│   └── src/
│       ├── commonMain/                 # Общий UI (Compose), модели, Ktor клиент, экраны
│       ├── androidMain/                # Android-специфичные реализации (expect/actual)
│       ├── desktopMain/                # Desktop-реализации (JME 3D Robot view)
│       └── wasmJsMain/                 # Web Wasm реализации (Canvas 60 FPS Robot view)
├── app/                                # Android Application (SDK 26–34)
├── desktop/                            # Desktop Application (JVM: Windows MSI / UberJar)
├── web/                                # Web Application (Compose Wasm / Browser bundle)
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── Dockerfile                          # Multi-stage Gradle + Nginx для раздачи Web Wasm
└── docker-compose.yml                  # Запуск веб-версии и локального LLM-контура
```

---

## 📱 Платформы и возможности

### 1. Единый UI и бизнес-логика (`:shared`)
- **HomeScreen**: Выбор сценариев, запуск переговоров, переход в админ-панель.
- **ArenaScreen**: Интерактивный чат переговоров с анализом напряжения (Tension), динамическими подсказками и карточками метрик (ZOPA, BATNA).
- **AdminScreen**: Конфигуратор сценариев резидентов ОЭЗ, уровня жесткости и параметров сделок.
- **Б.А.Р.С. Наставник**: Интерактивный робот с динамическими реакциями (3D JMonkeyEngine на Desktop, высокопроизводительный Canvas на Web/Android).
- **Машина времени & Разбор полетов**: Откат ходов и детальный AI-дебрифинг сделки.

---

## 🛠️ Сборка проекта и дистрибутивов

### 🤖 Android:
```bash
./gradlew :app:assembleDebug
./gradlew :app:assembleRelease
```
Сгенерированный APK: `app/build/outputs/apk/debug/app-debug.apk`.

### 🪟 Windows Desktop (MSI / JAR):
```bash
./gradlew :desktop:packageDistributionForCurrentOS   # MSI установщик
./gradlew :desktop:packageUberJarForCurrentOS        # Universal JAR
```
Сгенерированные файлы: `desktop/build/compose/binaries/main/msi/*.msi` и `desktop/build/compose/jars/*.jar`.

### 🌐 Web Wasm (Compose Multiplatform Browser):
```bash
./gradlew :web:wasmJsBrowserDevelopmentRun          # Запуск dev-сервера с hot-reload
./gradlew :web:wasmJsBrowserDistribution             # Продакшн бандл Wasm + JS + HTML
```
Сгенерированный бандл: `web/build/dist/wasmJs/productionExecutable/`.

### 🐳 Docker (Web Wasm + Nginx):
```bash
docker compose up -d --build
```
Доступно на `http://localhost:3000`.

---

## 🚀 CI/CD & Релизы

При пуше в `main` пайплайн GitHub Actions автоматически:
1. Создает патч-тег версии.
2. Собирает **Android APK**.
3. Собирает **Windows MSI** и **UberJar**.
4. Собирает **Web Wasm Distribution** (`arena-web-wasm.zip`).
5. Публикует релиз со всеми артефактами в **GitHub Releases**.
