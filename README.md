# 🦾 Б.А.Р.С. - Тренажер жестких коммерческих переговоров

> **Мультиплатформенная реализация на Kotlin (Compose Multiplatform: Android, Desktop Windows .EXE, Web Kotlin/Wasm)**

---

## 📱 Мультиплатформенная архитектура (Compose Multiplatform)

Проект полностью переведен на стек **Kotlin Multiplatform (KMP)** с единым ядром UI на **Jetpack Compose / Material Design 3**:

```
.
├── composeApp/
│   ├── src/
│   │   ├── commonMain/        # 🎯 Единая кодовая база UI и логики (Compose Material 3)
│   │   │   └── kotlin/com/bars/simulator/
│   │   │       ├── App.kt             # Главный вход в Compose-приложение
│   │   │       ├── ArenaScreen.kt     # Экран переговоров, HUD-телеметрия, чат
│   │   │       ├── Models.kt          # Состояния переговоров, метрики стресса/доверия
│   │   │       └── Theme.kt           # Киберпанк/Industrial палитра Material 3
│   │   ├── androidMain/       # 🤖 Специфика Android (AndroidManifest, Activity)
│   │   ├── desktopMain/       # 💻 Десктопная точка входа для Windows (.exe / .msi)
│   │   └── wasmJsMain/        # 🌐 Web Kotlin/Wasm для браузера
│   └── build.gradle.kts       # Настройка таргетов Android, Desktop и Wasm
├── .github/workflows/
│   └── release.yml            # 🚀 CI/CD: сборка APK, EXE и публикация GitHub Release
├── build.gradle.kts           # Корневой Gradle-конфиг
└── settings.gradle.kts        # Настройка репозиториев и модулей
```

---

## 🚀 CI/CD и релизы (Скачивание APK и EXE)

В репозитории настроен автоматический пайплайн GitHub Actions (`.github/workflows/release.yml`).

### Как получить готовый APK и EXE в релизах:

1. **Автоматический запуск по тегу:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. **Ручной запуск в GitHub:**
   - Перейдите во вкладку **Actions** в репозитории на GitHub.
   - Выберите воркфлоу **Build & Release (Android APK & Windows EXE)**.
   - Нажмите **Run workflow**.

3. **Результат:**
   В разделе **Releases** вашего GitHub репозитория автоматически сформируется релиз с прикрепленными файлами для прямого скачивания:
   * 📲 **`BARS-Simulator-release.apk`** — готовый установочный файл под Android.
   * 💻 **`*.exe` / `*.msi`** — десктопный инсталлятор под Windows 10/11.

---

## 🛠 Локальная сборка

### Сборка Android APK:
```bash
./gradlew :composeApp:assembleRelease
# Результат: composeApp/build/outputs/apk/release/composeApp-release.apk
```

### Сборка Windows .EXE инсталлятора:
```bash
./gradlew :composeApp:packageDistributionForCurrentOS
# Результат: composeApp/build/compose/binaries/main/exe/
```

### Сборка Web Kotlin (Wasm):
```bash
./gradlew :composeApp:wasmJsBrowserDistribution
# Результат: composeApp/build/dist/wasmJs/productionExecutable/
```
