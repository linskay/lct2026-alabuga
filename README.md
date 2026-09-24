# 🦾 Арена переговоров — Нативный Kotlin Compose & KMP

[![Команда: No PHP - No problems](https://img.shields.io/badge/Team-No%20PHP%20--%20No%20problems-7b2cbf?style=for-the-badge&logo=target)](https://github.com)
[![Kotlin](https://img.shields.io/badge/Kotlin-2.1.10-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)](https://kotlinlang.org/)
[![Jetpack Compose](https://img.shields.io/badge/Compose-Material_3-4285F4?style=for-the-badge&logo=jetpackcompose&logoColor=white)](https://developer.android.com/jetpack/compose)
[![Android APK Target](https://img.shields.io/badge/Android-APK_Build-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com/)
[![CI/CD](https://img.shields.io/badge/GitHub_Actions-Automated_Release-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com)

Корпоративный интерактивный AI-полигон и симулятор жестких коммерческих переговоров ОЭЗ «Алабуга» на нативном стеке **Kotlin / Jetpack Compose (Material 3)**.

---

## 🏛️ Целевая структура репозитория на Kotlin

```
.
├── .github/
│   └── workflows/
│       └── release.yml                 # Пайплайн сборки и публикации релизов (.apk)
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── app/
│   ├── build.gradle.kts                # Android Application таргет (SDK 26-34)
│   └── src/main/
│       ├── AndroidManifest.xml
│       └── kotlin/ru/alabuga/arena/
│           ├── MainActivity.kt         # Точка входа приложения
│           ├── model/
│           │   └── Models.kt           # Domain модели (Metrics, Message, Batna)
│           └── ui/screens/
│               ├── HomeScreen.kt       # Стартовый экран (Логотип, 3D Б.А.Р.С., 2 кнопки)
│               ├── AdminScreen.kt      # Конфигуратор пресетов, сложность, BATNA
│               └── ArenaScreen.kt      # Боевой экран переговоров (чат, подсказки, tension)
├── build.gradle.kts                    # Корневой Gradle скрипт
├── settings.gradle.kts                 # Подключение модулей :app и :composeApp
├── gradle.properties
├── gradlew
├── gradlew.bat
└── README.md
```

---

## 📱 Архитектура и экраны Kotlin Compose (`app/src/main/kotlin/...`)

### 1. Главный экран (`HomeScreen.kt`) — Стартовый экран по умолчанию:
- **Mobile-First дизайн**: Глубокий космический фон `#07080D`, неоновые акценты.
- **Верхняя часть**: Логотип ОЭЗ 033 и заголовок «АРЕНА ПЕРЕГОВОРОВ | ОЭЗ АЛАБУГА».
- **Центр**: Подиум с виртуальным роботом-наставником Б.А.Р.С. в режиме Idle.
- **Две крупные кнопки**:
  1. `[ ▶ ВОЙТИ В ПЕРЕГОВОРНУЮ ]` — переход на экран переговоров `ArenaScreen`.
  2. `[ ⚙️ ПАНЕЛЬ АДМИНИСТРАТОРА ]` — переход на экран конфигуратора `AdminScreen`.

### 2. Экран конфигуратора (`AdminScreen.kt`):
- Перенесены все пресеты («Якорный инвестор в Синергию», «Закупка оборудования ЧПУ», «Найм Главного конструктора»).
- Ползунок жесткости и прессинга оппонента (30–100%).
- Настройка и защита BATNA ОЭЗ (минимальная ставка от 460 ₽/м², каникулы до 4 мес.).
- Кнопка **«← Назад»** в TopAppBar для мгновенного возврата на `HomeScreen`.

### 3. Боевой экран переговоров (`ArenaScreen.kt`):
- **Индикатор атмосферы и стресса**: Динамический фон верхней плашки оппонента, плавно меняющий цвет в зависимости от переменной `tension` (от глубокого фиолетового до неоново-красного при стрессе 70%+).
- **Стенограмма чата**: Чистый лаконичный чат без лишних синих плашек.
- **Горизонтальные подсказки (`LazyRow`)**: Интерактивные чипсы аргументов с обязательной валидацией параметров в скобках `[...]` перед отправкой.

---

## 🛠️ Сборка проекта и релизов

### Сборка Debug APK:
```bash
./gradlew :app:assembleDebug
```
Сгенерированный файл: `app/build/outputs/apk/debug/app-debug.apk`.

### Сборка Release APK:
```bash
./gradlew :app:assembleRelease
```
Сгенерированный файл: `app/build/outputs/apk/release/app-release.apk`.

### Автоматический релиз в GitHub Actions:
При создании git-тега (например, `git push origin v1.0.0`) пайплайн `.github/workflows/release.yml` автоматически собирает `app-release.apk` и публикует его в разделе **GitHub Releases**.
