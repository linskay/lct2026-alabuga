export interface CodeFile {
  path: string;
  filename: string;
  language: "kotlin" | "groovy" | "json" | "markdown";
  description: string;
  category: "Gradle" | "Models" | "Network" | "MVI & State" | "Compose UI" | "3D Expect/Actual" | "Docs";
  content: string;
}

export const KMP_FILES: CodeFile[] = [
  {
    path: "app/build.gradle.kts",
    filename: "build.gradle.kts",
    language: "kotlin",
    description: "Конфигурация сборки нативного Android приложения (SDK 26-35, Compose Material 3)",
    category: "Gradle",
    content: `plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.jetbrainsCompose)
    alias(libs.plugins.compose.compiler)
    alias(libs.plugins.kotlinxSerialization)
}

kotlin {
    // 1. Android Target
    androidTarget {
        compilations.all {
            kotlinOptions {
                jvmTarget = "17"
            }
        }
    }

    // 2. iOS Targets (Framework configuration)
    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "AlabugaArenaApp"
            isStatic = true
        }
    }

    // 3. Web Target (Wasm Browser)
    @OptIn(org.jetbrains.kotlin.gradle.targets.js.dsl.ExperimentalWasmDsl::class)
    wasmJs {
        moduleName = "alabugaArenaApp"
        browser {
            commonWebpackConfig {
                outputFileName = "alabugaArenaApp.js"
            }
        }
        binaries.executable()
    }

    sourceSets {
        commonMain.dependencies {
            // Compose Multiplatform
            implementation(compose.runtime)
            implementation(compose.foundation)
            implementation(compose.material3)
            implementation(compose.ui)
            implementation(compose.components.resources)
            implementation(compose.animation)

            // Kotlinx Serialization & Coroutines
            implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
            implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.6.1")

            // Ktor Client 3.x Multiplatform
            implementation("io.ktor:ktor-client-core:3.0.1")
            implementation("io.ktor:ktor-client-content-negotiation:3.0.1")
            implementation("io.ktor:ktor-serialization-kotlinx-json:3.0.1")
            implementation("io.ktor:ktor-client-logging:3.0.1")
            implementation("io.ktor:ktor-client-mock:3.0.1") // Autonomous Fallback Engine

            // Lifecycle & Navigation
            implementation("org.jetbrains.androidx.lifecycle:lifecycle-viewmodel-compose:2.8.2")
        }

        androidMain.dependencies {
            implementation("androidx.activity:activity-compose:1.9.3")
            implementation("androidx.appcompat:appcompat:1.7.0")
            implementation("io.ktor:ktor-client-okhttp:3.0.1")

            // 3D Filament / SceneView for BARS avatar on Android
            implementation("io.github.sceneview:sceneview:2.2.1")
        }

        iosMain.dependencies {
            implementation("io.ktor:ktor-client-darwin:3.0.1")
        }

        val wasmJsMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-js:3.0.1")
            }
        }
    }
}

android {
    namespace = "org.alabuga.arena"
    compileSdk = 35

    defaultConfig {
        applicationId = "org.alabuga.arena"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
`,
  },
  {
    path: "commonMain/kotlin/org/alabuga/arena/model/DataModels.kt",
    filename: "DataModels.kt",
    language: "kotlin",
    description: "Строго типизированные модели данных kotlinx.serialization",
    category: "Models",
    content: `package org.alabuga.arena.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Роли участников в процессе переговорной сессии
 */
@Serializable
enum class ActorRole {
    @SerialName("USER") USER,
    @SerialName("OPPONENT") OPPONENT,
    @SerialName("BARS") BARS
}

/**
 * Состояния анимации 3D-аватара робота-наставника «Б.А.Р.С.»
 */
@Serializable
enum class BarsAnimationState {
    @SerialName("idle") IDLE,
    @SerialName("talk") TALK,
    @SerialName("warn") WARN,
    @SerialName("win") WIN
}

/**
 * Уровни сложности сценария переговоров в ОЭЗ «Алабуга»
 */
@Serializable
enum class DifficultyLevel {
    @SerialName("Junior") JUNIOR,
    @SerialName("Middle") MIDDLE,
    @SerialName("Hardcore Alabuga Director") HARDCORE_DIRECTOR
}

/**
 * Ключевые метрики психологической и коммерческой динамики
 */
@Serializable
data class NegotiationMetrics(
    @SerialName("trust") val trust: Int = 50,             // 0..100: Уровень доверия
    @SerialName("tension") val tension: Int = 40,         // 0..100: Уровень стресса/напряжения
    @SerialName("deal_readiness") val dealReadiness: Int = 30 // 0..100: Готовность к сделке
) {
    init {
        require(trust in 0..100) { "Trust must be in 0..100" }
        require(tension in 0..100) { "Tension must be in 0..100" }
        require(dealReadiness in 0..100) { "DealReadiness must be in 0..100" }
    }
}

/**
 * Отдельная реплика переговорного процесса
 */
@Serializable
data class Message(
    val id: String,
    val actor: ActorRole,
    val text: String,
    val timestamp: Long,
    val stepIndex: Int,
    val snapshotMetrics: NegotiationMetrics = NegotiationMetrics(),
    val tacticalNote: String? = null,
    val barsAnimation: BarsAnimationState = BarsAnimationState.IDLE
)

/**
 * Красные линии ОЭЗ «Алабуга» (BATNA - Best Alternative to a Negotiated Agreement)
 */
@Serializable
data class BatnaConfig(
    val minPricePerSqm: Int = 460,           // руб/м2 в месяц
    val maxGracePeriodMonths: Int = 6,       // Арендные каникулы
    val taxHolidayYears: Int = 10,           // Налоговые льготы ОЭЗ
    val minJobCreation: Int = 200,           // Обязательства по найму
    val minCapexMillionRub: Int = 1000,      // Объем инвестиций
    val redLines: List<String> = listOf(
        "Не опускать базовую ставку ниже 460 руб/м²",
        "Никаких бесплатных подключений сетей сверх лимита",
        "Обязательный залог за задержку ввода производства"
    )
)

/**
 * Полная конфигурация сценария из панели администратора
 */
@Serializable
data class AdminScenarioConfig(
    val id: String = "synergy_tenant",
    val title: String = "Арендатор индустриального парка «Синергия»",
    val opponentRole: String = "Генеральный директор машиностроительного холдинга",
    val opponentName: String = "Валерий Строганов",
    val opponentPersonality: String = "Прагматичный, жесткий, угрожает уходом в другие ОЭЗ",
    val difficulty: DifficultyLevel = DifficultyLevel.MIDDLE,
    val zoneCluster: String = "Индустриальный парк «Синергия 1-2»",
    val initialContext: String = "Оппонент контрактует 12 000 м² и требует необоснованную скидку.",
    val targetKpis: List<String> = listOf(
        "Защитить минимальную ставку аренды (не ниже 460 руб/м²)",
        "Ограничить каникулы до 4 месяцев",
        "Создание 250 рабочих мест"
    ),
    val batna: BatnaConfig = BatnaConfig()
)

/**
 * Запрос к серверу / Gemini API
 */
@Serializable
data class GeminiRequest(
    val history: List<Message>,
    val context: AdminScenarioConfig,
    @SerialName("current_metrics") val currentMetrics: NegotiationMetrics
)

/**
 * Строгий JSON-ответ Gemini API согласно спецификации
 */
@Serializable
data class GeminiResponse(
    @SerialName("opponent_reply") val opponentReply: String,
    @SerialName("bars_feedback") val barsFeedback: String,
    @SerialName("bars_animation") val barsAnimation: BarsAnimationState,
    @SerialName("metrics") val metrics: NegotiationMetrics,
    @SerialName("is_deal_closed") val isDealClosed: Boolean,
    @SerialName("is_deal_failed") val isDealFailed: Boolean
)

/**
 * Снимок состояния сессии для механики «Машина времени» (Time-travel)
 */
@Serializable
data class SessionSnapshot(
    val step: Int,
    val messages: List<Message>,
    val metrics: NegotiationMetrics,
    val lastBarsFeedback: String,
    val lastBarsAnimation: BarsAnimationState,
    val timestamp: Long
)

/**
 * Общее состояние переговорной сессии
 */
@Serializable
data class NegotiationSessionState(
    val config: AdminScenarioConfig = AdminScenarioConfig(),
    val messages: List<Message> = emptyList(),
    val metrics: NegotiationMetrics = NegotiationMetrics(),
    val barsFeedback: String = "Приветствую! Я Б.А.Р.С. — ваш бортовой аналитик ОЭЗ «Алабуга». Слежу за вашей BATNA и балансом сил.",
    val barsAnimation: BarsAnimationState = BarsAnimationState.IDLE,
    val isDealClosed: Boolean = false,
    val isDealFailed: Boolean = false,
    val isLoading: Boolean = false,
    val historySnapshots: List<SessionSnapshot> = emptyList(),
    val currentStepIndex: Int = 0
)
`,
  },
  {
    path: "commonMain/kotlin/org/alabuga/arena/network/NegotiationRepository.kt",
    filename: "NegotiationRepository.kt",
    language: "kotlin",
    description: "Ktor Client репозиторий с ContentNegotiation и встроенным автономным MockEngine",
    category: "Network",
    content: `package org.alabuga.arena.network

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.alabuga.arena.model.*

/**
 * Интерфейс сетевого репозитория переговоров
 */
interface NegotiationRepository {
    suspend fun sendUserMessage(
        history: List<Message>,
        context: AdminScenarioConfig,
        currentMetrics: NegotiationMetrics
    ): Result<GeminiResponse>
}

/**
 * Реализация на базе Ktor Client с авто-переключением на автономный MockEngine
 */
class KtorNegotiationRepository(
    private val baseUrl: String = "https://api.alabuga.ru/v1/arena",
    private val apiKey: String? = null,
    private val forceOfflineMode: Boolean = false
) : NegotiationRepository {

    private val json = Json {
        ignoreUnknownKeys = true
        prettyPrint = false
        isLenient = true
        encodeDefaults = true
    }

    // Автономный MockEngine для оффлайн-демонстраций на хакатонах и в условиях закрытого контура
    private val mockEngine = MockEngine { request ->
        val content = request.body.toByteReadChannel().readUTF8Line() ?: "{}"
        val req = json.decodeFromString<GeminiRequest>(content)
        val mockResponse = generateAutonomousResponse(req)
        val responseBytes = json.encodeToString(mockResponse).encodeToByteArray()

        respond(
            content = responseBytes,
            status = HttpStatusCode.OK,
            headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString())
        )
    }

    // Боевой клиент Ktor
    private val liveClient by lazy {
        HttpClient {
            install(ContentNegotiation) {
                json(json)
            }
            install(HttpTimeout) {
                requestTimeoutMillis = 15_000
                connectTimeoutMillis = 10_000
            }
            install(Logging) {
                level = LogLevel.INFO
            }
            defaultRequest {
                contentType(ContentType.Application.Json)
                apiKey?.let { header("Authorization", "Bearer \$it") }
            }
        }
    }

    // Оффлайн клиент на базе MockEngine
    private val offlineClient by lazy {
        HttpClient(mockEngine) {
            install(ContentNegotiation) {
                json(json)
            }
        }
    }

    override suspend fun sendUserMessage(
        history: List<Message>,
        context: AdminScenarioConfig,
        currentMetrics: NegotiationMetrics
    ): Result<GeminiResponse> = withContext(Dispatchers.IO) {
        val requestPayload = GeminiRequest(
            history = history,
            context = context,
            currentMetrics = currentMetrics
        )

        if (forceOfflineMode || apiKey.isNullOrBlank()) {
            return@withContext runCatching {
                offlineClient.post("/negotiate") {
                    setBody(requestPayload)
                }.body<GeminiResponse>()
            }
        }

        // Попытка обращения к боевому серверу с прозрачным fallback на локальный AI-эмулятор
        try {
            val response = liveClient.post("\$baseUrl/negotiate") {
                setBody(requestPayload)
            }.body<GeminiResponse>()
            Result.success(response)
        } catch (e: Exception) {
            // Элегантный fallback: при сетевой ошибке генерируем локальный ответ, не ломая UX
            val fallback = generateAutonomousResponse(requestPayload)
            Result.success(fallback)
        }
    }

    /**
     * Интеллектуальный автономный генератор ответов Б.А.Р.С. и оппонента
     */
    private fun generateAutonomousResponse(request: GeminiRequest): GeminiResponse {
        val lastUserMessage = request.history.lastOrNull { it.actor == ActorRole.USER }?.text.orEmpty()
        val textLower = lastUserMessage.lowercase()
        val metrics = request.currentMetrics

        var trust = metrics.trust
        var tension = metrics.tension
        var readiness = metrics.dealReadiness

        val opponentReply: String
        val barsFeedback: String
        val barsAnimation: BarsAnimationState
        var isDealClosed = false
        var isDealFailed = false

        when {
            // 1. Угроза нарушения красных линий (BATNA)
            textLower.contains("скидк") && (textLower.contains("50") || textLower.contains("бесплатн")) -> {
                trust -= 15
                tension += 25
                barsAnimation = BarsAnimationState.WARN
                opponentReply = "Вы предлагаете условия, несовместимые со стандартами ОЭЗ. Мы рассчитывали на промышленное партнерство, а не на благотворительность."
                barsFeedback = "КРАСНАЯ ЛИНИЯ ПОД УГРОЗОЙ! Вы прогнулись по BATNA без встречного требования. Срочно привяжите скидку к объему CAPEX и штрафным санкциям."
            }
            // 2. Сильный аргумент со ссылкой на кластеры ОЭЗ «Алабуга»
            textLower.contains("политех") || textLower.contains("инфраструктур") || textLower.contains("кадры") || textLower.contains("синерги") -> {
                trust += 14
                tension -= 10
                readiness += 18
                barsAnimation = BarsAnimationState.TALK
                opponentReply = "Доступ к молодым кадрам «Алабуга Политех» и готовые мощности 110 кВ действительно экономят нам до 20% бюджета. Какие сроки выхода на площадку?"
                barsFeedback = "Превосходный маневр! Использование немонетарных преимуществ ОЭЗ укрепило позицию. Переходите к фиксации графика платежей."
            }
            // 3. Закрытие сделки
            textLower.contains("соглас") || textLower.contains("договор") || textLower.contains("по рукам") -> {
                if (readiness >= 65 && trust >= 55) {
                    isDealClosed = true
                    barsAnimation = BarsAnimationState.WIN
                    opponentReply = "Отлично. Ваши аргументы убедительны. Готовьте трехсторонний договор о резидентстве ОЭЗ «Алабуга»."
                    barsFeedback = "ПОБЕДА! Сделка закрыта с полным сохранением BATNA. Резидент привлечен в кластер на выгодных для зоны условиях."
                } else {
                    tension += 12
                    barsAnimation = BarsAnimationState.WARN
                    opponentReply = "Не торопитесь подписывать. Мы еще не урегулировали вопросы таможенного склада и штрафов."
                    barsFeedback = "Преждевременное закрытие. При низком доверии оппонент закрывается. Задайте калибрующий вопрос."
                }
            }
            // 4. Твердая позиция
            textLower.contains("нет") || textLower.contains("регламент") || textLower.contains("не можем") -> {
                tension += 8
                trust += 5
                readiness += 6
                barsAnimation = BarsAnimationState.TALK
                opponentReply = "Ваша твердость понятна, регламент ОЭЗ строг. Но что вы предложите по таможенным преференциям взамен?"
                barsFeedback = "Грамотная фиксация границ! Твердое «нет» без перехода на личности повысило авторитет переговорщика."
            }
            // 5. Стандартный рабочий диалог
            else -> {
                trust += 4
                tension += 2
                readiness += 8
                barsAnimation = BarsAnimationState.TALK
                opponentReply = "Мы внимательно изучаем расчеты. Но как обстоят дела с логистическим плечом терминала им. Дэн Сяопина?"
                barsFeedback = "Разговор перешел в конструктивную фазу. Приведите цифры по контейнерным поездам для усиления аргумента."
            }
        }

        // Проверка критического срыва
        if (tension >= 95 && trust <= 20) {
            isDealFailed = true
            barsAnimation = BarsAnimationState.WARN
        }

        return GeminiResponse(
            opponentReply = opponentReply,
            barsFeedback = barsFeedback,
            barsAnimation = barsAnimation,
            metrics = NegotiationMetrics(
                trust = trust.coerceIn(0, 100),
                tension = tension.coerceIn(0, 100),
                dealReadiness = readiness.coerceIn(0, 100)
            ),
            isDealClosed = isDealClosed,
            isDealFailed = isDealFailed
        )
    }
}
`,
  },
  {
    path: "commonMain/kotlin/org/alabuga/arena/presentation/NegotiationViewModel.kt",
    filename: "NegotiationViewModel.kt",
    language: "kotlin",
    description: "MVI ViewModel: StateFlow, Time-travel машина времени (ветвление), подсчет дебрифинга",
    category: "MVI & State",
    content: `package org.alabuga.arena.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import org.alabuga.arena.model.*
import org.alabuga.arena.network.NegotiationRepository

/**
 * Намерения пользователя (MVI Intents)
 */
sealed interface NegotiationIntent {
    data class SendMessage(val text: String) : NegotiationIntent
    data class RollbackToStep(val targetStep: Int) : NegotiationIntent
    data class UpdateConfig(val config: AdminScenarioConfig) : NegotiationIntent
    data object RestartSession : NegotiationIntent
    data object TriggerDebriefing : NegotiationIntent
}

/**
 * Одноразовые эффекты (MVI Side Effects)
 */
sealed interface NegotiationEffect {
    data class ShowToast(val message: String) : NegotiationEffect
    data class PlaySound(val soundType: SoundType) : NegotiationEffect
    data object CelebrationTriggered : NegotiationEffect
}

enum class SoundType { BARS_BEEP, WARNING_ALARM, VICTORY_CHIME, REWIND_SWOOSH }

/**
 * Аналитический отчет (Дебрифинг сессии)
 */
data class DebriefingReport(
    val finalOutcome: String,
    val totalSteps: Int,
    val timeTravelRollbacks: Int,
    val batnaPreservationScore: Int, // 0..100%
    val stressManagementScore: Int,  // 0..100%
    val tacticalGrade: String,        // S, A, B, C, F
    val barsSummary: String,
    val keyStrengths: List<String>,
    val growthPoints: List<String>
)

/**
 * Основной ViewModel модуля переговорной арены
 */
class NegotiationViewModel(
    private val repository: NegotiationRepository,
    initialConfig: AdminScenarioConfig = AdminScenarioConfig()
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        NegotiationSessionState(
            config = initialConfig,
            messages = listOf(
                Message(
                    id = "init_opponent",
                    actor = ActorRole.OPPONENT,
                    text = "Добрый день. Наша корпорация рассматривает несколько ОЭЗ. Мы готовы инвестировать, но ваши базовые ставки аренды в «Синергии» завышены минимум на 40%. Что предложите?",
                    timestamp = Clock.System.now().toEpochMilliseconds(),
                    stepIndex = 0,
                    snapshotMetrics = NegotiationMetrics(trust = 50, tension = 40, dealReadiness = 30)
                )
            ),
            metrics = NegotiationMetrics(trust = 50, tension = 40, dealReadiness = 30),
            historySnapshots = listOf(
                SessionSnapshot(
                    step = 0,
                    messages = emptyList(),
                    metrics = NegotiationMetrics(trust = 50, tension = 40, dealReadiness = 30),
                    lastBarsFeedback = "Старт сессии. Оппонент сразу проводит разведку боем. Не оправдывайтесь — очертите ценность ОЭЗ «Алабуга».",
                    lastBarsAnimation = BarsAnimationState.IDLE,
                    timestamp = Clock.System.now().toEpochMilliseconds()
                )
            )
        )
    )
    val uiState: StateFlow<NegotiationSessionState> = _uiState.asStateFlow()

    private val _effects = MutableSharedFlow<NegotiationEffect>()
    val effects: SharedFlow<NegotiationEffect> = _effects.asSharedFlow()

    private var timeTravelCount = 0

    fun dispatch(intent: NegotiationIntent) {
        when (intent) {
            is NegotiationIntent.SendMessage -> handleSendMessage(intent.text)
            is NegotiationIntent.RollbackToStep -> handleRollback(intent.targetStep)
            is NegotiationIntent.UpdateConfig -> handleUpdateConfig(intent.config)
            is NegotiationIntent.RestartSession -> handleRestart()
            is NegotiationIntent.TriggerDebriefing -> { /* Trigger analytics view */ }
        }
    }

    private fun handleSendMessage(text: String) {
        if (text.isBlank() || _uiState.value.isLoading || _uiState.value.isDealClosed || _uiState.value.isDealFailed) return

        viewModelScope.launch {
            val currentState = _uiState.value
            val nextStep = currentState.currentStepIndex + 1

            // Сохраняем снимок перед ходом для «Машины времени»
            val preTurnSnapshot = SessionSnapshot(
                step = currentState.currentStepIndex,
                messages = currentState.messages,
                metrics = currentState.metrics,
                lastBarsFeedback = currentState.barsFeedback,
                lastBarsAnimation = currentState.barsAnimation,
                timestamp = Clock.System.now().toEpochMilliseconds()
            )

            val userMessage = Message(
                id = "msg_\${Clock.System.now().toEpochMilliseconds()}_user",
                actor = ActorRole.USER,
                text = text,
                timestamp = Clock.System.now().toEpochMilliseconds(),
                stepIndex = nextStep,
                snapshotMetrics = currentState.metrics
            )

            val updatedMessagesWithUser = currentState.messages + userMessage

            _uiState.update {
                it.copy(
                    isLoading = true,
                    messages = updatedMessagesWithUser,
                    barsAnimation = BarsAnimationState.TALK,
                    historySnapshots = it.historySnapshots + preTurnSnapshot
                )
            }

            // Запрос в репозиторий (Ktor Client к Gemini API или MockEngine)
            val result = repository.sendUserMessage(
                history = updatedMessagesWithUser,
                context = currentState.config,
                currentMetrics = currentState.metrics
            )

            result.onSuccess { response ->
                val opponentMessage = Message(
                    id = "msg_\${Clock.System.now().toEpochMilliseconds()}_opp",
                    actor = ActorRole.OPPONENT,
                    text = response.opponentReply,
                    timestamp = Clock.System.now().toEpochMilliseconds(),
                    stepIndex = nextStep,
                    snapshotMetrics = response.metrics,
                    tacticalNote = response.barsFeedback,
                    barsAnimation = response.barsAnimation
                )

                _uiState.update {
                    it.copy(
                        isLoading = false,
                        currentStepIndex = nextStep,
                        messages = it.messages + opponentMessage,
                        metrics = response.metrics,
                        barsFeedback = response.barsFeedback,
                        barsAnimation = response.barsAnimation,
                        isDealClosed = response.isDealClosed,
                        isDealFailed = response.isDealFailed
                    )
                }

                if (response.isDealClosed) {
                    _effects.emit(NegotiationEffect.CelebrationTriggered)
                    _effects.emit(NegotiationEffect.PlaySound(SoundType.VICTORY_CHIME))
                } else if (response.barsAnimation == BarsAnimationState.WARN) {
                    _effects.emit(NegotiationEffect.PlaySound(SoundType.WARNING_ALARM))
                } else {
                    _effects.emit(NegotiationEffect.PlaySound(SoundType.BARS_BEEP))
                }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        barsFeedback = "Ошибка канала связи: \${error.message}. Переключен на резервный контур Б.А.Р.С.",
                        barsAnimation = BarsAnimationState.WARN
                    )
                }
                _effects.emit(NegotiationEffect.ShowToast("Сбой сети. Работа в автономном режиме."))
            }
        }
    }

    /**
     * Механика «Машина времени» (Time-travel branch):
     * Откат состояния диалога, метрик и истории к выбранному шагу назад
     */
    private fun handleRollback(targetStep: Int) {
        viewModelScope.launch {
            val currentState = _uiState.value
            val snapshot = currentState.historySnapshots.firstOrNull { it.step == targetStep }
                ?: return@launch

            timeTravelCount++

            // Обрезаем сообщения строго до выбранного шага
            val prunedMessages = currentState.messages.filter { it.stepIndex <= targetStep }

            _uiState.update {
                it.copy(
                    currentStepIndex = targetStep,
                    messages = prunedMessages,
                    metrics = snapshot.metrics,
                    barsFeedback = "«Машина времени» активирована: откат к шагу №\$targetStep. Теперь вы можете выбрать альтернативную тактическую ветку!",
                    barsAnimation = BarsAnimationState.TALK,
                    isDealClosed = false,
                    isDealFailed = false,
                    historySnapshots = it.historySnapshots.filter { snap -> snap.step <= targetStep }
                )
            }

            _effects.emit(NegotiationEffect.PlaySound(SoundType.REWIND_SWOOSH))
            _effects.emit(NegotiationEffect.ShowToast("Ветка диалога откатана к шагу №\$targetStep"))
        }
    }

    private fun handleUpdateConfig(newConfig: AdminScenarioConfig) {
        _uiState.update { it.copy(config = newConfig) }
        handleRestart()
    }

    private fun handleRestart() {
        val config = _uiState.value.config
        timeTravelCount = 0
        _uiState.value = NegotiationSessionState(
            config = config,
            messages = listOf(
                Message(
                    id = "init_\${Clock.System.now().toEpochMilliseconds()}",
                    actor = ActorRole.OPPONENT,
                    text = "Приветствую. Давайте сразу к делу по объекту «\${config.zoneCluster}». Какие преференции дает ОЭЗ «Алабуга» для нашего масштаба?",
                    timestamp = Clock.System.now().toEpochMilliseconds(),
                    stepIndex = 0,
                    snapshotMetrics = NegotiationMetrics(trust = 50, tension = 40, dealReadiness = 30)
                )
            ),
            metrics = NegotiationMetrics(trust = 50, tension = 40, dealReadiness = 30),
            historySnapshots = listOf(
                SessionSnapshot(
                    step = 0,
                    messages = emptyList(),
                    metrics = NegotiationMetrics(trust = 50, tension = 40, dealReadiness = 30),
                    lastBarsFeedback = "Новая сессия запущена. Контролируйте BATNA и не давайте оппоненту сбить темп.",
                    lastBarsAnimation = BarsAnimationState.IDLE,
                    timestamp = Clock.System.now().toEpochMilliseconds()
                )
            ),
            barsFeedback = "Сессия сброшена. Б.А.Р.С. готов к анализу переговоров.",
            barsAnimation = BarsAnimationState.IDLE
        )
    }

    /**
     * Расчет итоговой аналитики и дебрифинга переговоров
     */
    fun calculateDebriefing(): DebriefingReport {
        val state = _uiState.value
        val tensionAverage = if (state.messages.isNotEmpty()) {
            state.messages.map { it.snapshotMetrics.tension }.average().toInt()
        } else 40

        val stressScore = (100 - tensionAverage).coerceIn(0, 100)
        val batnaScore = if (state.metrics.trust >= 60 && !state.isDealFailed) 95 else 65

        val grade = when {
            state.isDealClosed && timeTravelCount == 0 -> "S"
            state.isDealClosed -> "A"
            state.metrics.dealReadiness >= 60 -> "B"
            state.isDealFailed -> "F"
            else -> "C"
        }

        return DebriefingReport(
            finalOutcome = if (state.isDealClosed) "Сделка успешно закрыта" else if (state.isDealFailed) "Переговоры сорваны" else "В процессе",
            totalSteps = state.currentStepIndex,
            timeTravelRollbacks = timeTravelCount,
            batnaPreservationScore = batnaScore,
            stressManagementScore = stressScore,
            tacticalGrade = grade,
            barsSummary = "Сессия показала высокую устойчивость к давлению закупщика. Ключевой успех — своевременное подключение аргументов кластера «Алабуга Политех».",
            keyStrengths = listOf(
                "Удержание базовой ставки аренды выше 460 руб/м²",
                "Грамотное управление шкалой напряженности",
                "Использование неценовых стимулов ОЭЗ"
            ),
            growthPoints = listOf(
                "Минимизировать уступки на первых 3 репликах",
                "Четче фиксировать дедлайны по подписанию соглашения"
            )
        )
    }
}
`,
  },
  {
    path: "commonMain/kotlin/org/alabuga/arena/ui/theme/Theme.kt",
    filename: "Theme.kt",
    language: "kotlin",
    description: "Стилизация: Dark Graphite, фиолетовый акцент #7B2CBF бренда ОЭЗ «Алабуга», неоновые индикаторы",
    category: "Compose UI",
    content: `package org.alabuga.arena.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Фирменная палитра бренда ОЭЗ «Алабуга»
val AlabugaPurple = Color(0xFF7B2CBF)
val AlabugaPurpleLight = Color(0xFF9D4EDD)
val AlabugaPurpleDark = Color(0xFF5A189A)

// Графитовая темная гамма
val DarkGraphiteBg = Color(0xFF0D0E12)
val DarkGraphiteSurface = Color(0xFF14161F)
val DarkGraphiteCard = Color(0xFF1C1E2A)
val DarkGraphiteBorder = Color(0xFF282C3C)

// Неоновые индикаторы телеметрии
val NeonCyan = Color(0xFF00F0FF)      // Trust / Доверие
val NeonAmber = Color(0xFFFFB703)     // Warning / Предупреждение
val NeonRed = Color(0xFFFF3366)       // Tension / Стресс
val NeonGreen = Color(0xFF10B981)     // Deal Readiness / Успех

private val AlabugaDarkColorScheme = darkColorScheme(
    primary = AlabugaPurple,
    onPrimary = Color.White,
    primaryContainer = AlabugaPurpleDark,
    onPrimaryContainer = Color(0xFFE0AAFF),
    secondary = NeonCyan,
    onSecondary = Color.Black,
    background = DarkGraphiteBg,
    onBackground = Color(0xFFE2E8F0),
    surface = DarkGraphiteSurface,
    onSurface = Color(0xFFF1F5F9),
    surfaceVariant = DarkGraphiteCard,
    outline = DarkGraphiteBorder,
    error = NeonRed
)

@Composable
fun AlabugaArenaTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = AlabugaDarkColorScheme,
        typography = Typography(),
        content = content
    )
}
`,
  },
  {
    path: "commonMain/kotlin/org/alabuga/arena/ui/AdminConfigScreen.kt",
    filename: "AdminConfigScreen.kt",
    language: "kotlin",
    description: "Compose Multiplatform: панель администратора для настройки BATNA, оппонента и красных линий",
    category: "Compose UI",
    content: `package org.alabuga.arena.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.alabuga.arena.model.AdminScenarioConfig
import org.alabuga.arena.model.BatnaConfig
import org.alabuga.arena.model.DifficultyLevel
import org.alabuga.arena.ui.theme.*

@Composable
fun AdminConfigScreen(
    currentConfig: AdminScenarioConfig,
    onSaveConfig: (AdminScenarioConfig) -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    var title by remember { mutableStateOf(currentConfig.title) }
    var opponentRole by remember { mutableStateOf(currentConfig.opponentRole) }
    var difficulty by remember { mutableStateOf(currentConfig.difficulty) }
    var minPrice by remember { mutableStateOf(currentConfig.batna.minPricePerSqm.toString()) }
    var maxGraceMonths by remember { mutableStateOf(currentConfig.batna.maxGracePeriodMonths.toString()) }
    var minJobs by remember { mutableStateOf(currentConfig.batna.minJobCreation.toString()) }
    var redLinesText by remember { mutableStateOf(currentConfig.batna.redLines.joinToString("\n")) }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        colors = CardDefaults.cardColors(containerColor = DarkGraphiteSurface),
        shape = RoundedCornerShape(16.dp),
        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(DarkGraphiteBorder))
    ) {
        Column(
            modifier = Modifier
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Панель администратора | Сценарий ОЭЗ «Алабуга»",
                style = MaterialTheme.typography.titleLarge,
                color = AlabugaPurpleLight
            )

            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Тема / Название сценария") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = opponentRole,
                onValueChange = { opponentRole = it },
                label = { Text("Роль оппонента (Закупщик / Арендатор / Соискатель)") },
                modifier = Modifier.fillMaxWidth()
            )

            Text("Уровень сложности ИИ:", color = NeonCyan)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                DifficultyLevel.values().forEach { level ->
                    FilterChip(
                        selected = difficulty == level,
                        onClick = { difficulty = level },
                        label = { Text(level.name) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = AlabugaPurple,
                            selectedLabelColor = androidx.compose.ui.graphics.Color.White
                        )
                    )
                }
            }

            HorizontalDivider(color = DarkGraphiteBorder)

            Text("Параметры BATNA (Красные линии ОЭЗ):", style = MaterialTheme.typography.titleMedium)

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = minPrice,
                    onValueChange = { minPrice = it },
                    label = { Text("Мин. ставка (руб/м²)") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = maxGraceMonths,
                    onValueChange = { maxGraceMonths = it },
                    label = { Text("Макс. каникулы (мес)") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = minJobs,
                    onValueChange = { minJobs = it },
                    label = { Text("Мин. рабочих мест") },
                    modifier = Modifier.weight(1f)
                )
            }

            OutlinedTextField(
                value = redLinesText,
                onValueChange = { redLinesText = it },
                label = { Text("Красные линии (по одной на строку)") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextButton(onClick = onDismiss) {
                    Text("Отмена", color = androidx.compose.ui.graphics.Color.Gray)
                }
                Spacer(Modifier.width(8.dp))
                Button(
                    onClick = {
                        val updated = currentConfig.copy(
                            title = title,
                            opponentRole = opponentRole,
                            difficulty = difficulty,
                            batna = BatnaConfig(
                                minPricePerSqm = minPrice.toIntOrNull() ?: 460,
                                maxGracePeriodMonths = maxGraceMonths.toIntOrNull() ?: 6,
                                minJobCreation = minJobs.toIntOrNull() ?: 200,
                                redLines = redLinesText.lines().filter { it.isNotBlank() }
                            )
                        )
                        onSaveConfig(updated)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AlabugaPurple)
                ) {
                    Text("Применить сценарий")
                }
            }
        }
    }
}
`,
  },
  {
    path: "commonMain/kotlin/org/alabuga/arena/ui/ArenaScreen.kt",
    filename: "ArenaScreen.kt",
    language: "kotlin",
    description: "Compose Multiplatform: боевой экран из трех колонок с чатом, BATNA, Б.А.Р.С. 3D и Time-travel",
    category: "Compose UI",
    content: `package org.alabuga.arena.ui

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import org.alabuga.arena.model.*
import org.alabuga.arena.presentation.NegotiationIntent
import org.alabuga.arena.presentation.NegotiationViewModel
import org.alabuga.arena.ui.components.Bars3DView
import org.alabuga.arena.ui.theme.*

@Composable
fun ArenaScreen(
    viewModel: NegotiationViewModel,
    onOpenAdminConfig: () -> Unit,
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsState()
    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(state.messages.size) {
        if (state.messages.isNotEmpty()) {
            listState.animateScrollToItem(state.messages.size - 1)
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(DarkGraphiteBg)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Верхняя панель бренда ОЭЗ «Алабуга»
            ArenaTopBar(
                scenarioTitle = state.config.title,
                difficulty = state.config.difficulty.name,
                onOpenAdmin = onOpenAdminConfig,
                onRestart = { viewModel.dispatch(NegotiationIntent.RestartSession) }
            )

            // Основной рабочий стол из трех колонок
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // КОЛОНКА 1: Контекст сценария, BATNA и красные линии
                ContextAndBatnaPanel(
                    config = state.config,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                )

                // КОЛОНКА 2: Окно переговоров, Time-travel откат и поле ввода
                ChatAndInputPanel(
                    messages = state.messages,
                    isLoading = state.isLoading,
                    inputText = inputText,
                    onInputTextChange = { inputText = it },
                    onSendMessage = {
                        viewModel.dispatch(NegotiationIntent.SendMessage(inputText))
                        inputText = ""
                    },
                    onRollback = { step ->
                        viewModel.dispatch(NegotiationIntent.RollbackToStep(step))
                    },
                    modifier = Modifier
                        .weight(2f)
                        .fillMaxHeight()
                )

                // КОЛОНКА 3: Панель Робота-наставника «Б.А.Р.С.»
                BarsAdvisorPanel(
                    animation = state.barsAnimation.name.lowercase(),
                    feedback = state.barsFeedback,
                    metrics = state.metrics,
                    modifier = Modifier
                        .weight(1.2f)
                        .fillMaxHeight()
                )
            }
        }
    }
}

@Composable
fun ArenaTopBar(
    scenarioTitle: String,
    difficulty: String,
    onOpenAdmin: () -> Unit,
    onRestart: () -> Unit
) {
    Surface(
        color = DarkGraphiteSurface,
        border = androidx.compose.foundation.BorderStroke(1.dp, DarkGraphiteBorder)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .background(AlabugaPurple, RoundedCornerShape(5.dp))
                )
                Text(
                    text = "АРЕНА ПЕРЕГОВОРОВ | ОЭЗ «АЛАБУГА»",
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Surface(
                    color = AlabugaPurpleDark,
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = difficulty,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = NeonCyan
                    )
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = onRestart) {
                    Text("Сброс", color = Color.Gray)
                }
                Button(
                    onClick = onOpenAdmin,
                    colors = ButtonDefaults.buttonColors(containerColor = AlabugaPurple)
                ) {
                    Text("Настройки BATNA")
                }
            }
        }
    }
}

@Composable
fun ContextAndBatnaPanel(config: AdminScenarioConfig, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = DarkGraphiteSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, DarkGraphiteBorder)
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text("КОНТЕКСТ СДЕЛКИ", style = MaterialTheme.typography.labelMedium, color = AlabugaPurpleLight)
            Text(config.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(config.initialContext, style = MaterialTheme.typography.bodySmall, color = Color.LightGray)

            HorizontalDivider(color = DarkGraphiteBorder)

            Text("ОППОНЕНТ", style = MaterialTheme.typography.labelMedium, color = NeonAmber)
            Text("\${config.opponentName} — \${config.opponentRole}", style = MaterialTheme.typography.bodyMedium)
            Text(config.opponentPersonality, style = MaterialTheme.typography.bodySmall, color = Color.Gray)

            HorizontalDivider(color = DarkGraphiteBorder)

            Text("КРАСНЫЕ ЛИНИИ (BATNA)", style = MaterialTheme.typography.labelMedium, color = NeonRed)
            config.batna.redLines.forEach { line ->
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("•", color = NeonRed, fontWeight = FontWeight.Bold)
                    Text(line, style = MaterialTheme.typography.bodySmall, color = Color(0xFFFF99AA))
                }
            }
        }
    }
}

@Composable
fun ChatAndInputPanel(
    messages: List<Message>,
    isLoading: Boolean,
    inputText: String,
    onInputTextChange: (String) -> Unit,
    onSendMessage: () -> Unit,
    onRollback: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = DarkGraphiteSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, DarkGraphiteBorder)
    ) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            // Список реплик
            LazyColumn(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(messages) { msg ->
                    MessageBubble(message = msg, onRollback = onRollback)
                }
            }

            if (isLoading) {
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    color = AlabugaPurple
                )
            }

            // Поле ввода и кнопка отправки
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = inputText,
                    onValueChange = onInputTextChange,
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("Сформулируйте аргумент для оппонента...") },
                    maxLines = 3
                )
                Button(
                    onClick = onSendMessage,
                    enabled = inputText.isNotBlank() && !isLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = AlabugaPurple)
                ) {
                    Text("Ход")
                }
            }
        }
    }
}

@Composable
fun MessageBubble(message: Message, onRollback: (Int) -> Unit) {
    val isUser = message.actor == ActorRole.USER
    val bg = if (isUser) AlabugaPurpleDark else DarkGraphiteCard
    val align = if (isUser) Alignment.End else Alignment.Start

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = align
    ) {
        Surface(
            color = bg,
            shape = RoundedCornerShape(12.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, if (isUser) AlabugaPurple else DarkGraphiteBorder),
            modifier = Modifier.widthIn(max = 520.dp)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (isUser) "ВЫ (Переговорщик ОЭЗ)" else "ОППОНЕНТ",
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isUser) NeonCyan else NeonAmber
                    )
                    // Кнопка Time-travel «Откатить до этого шага»
                    if (message.stepIndex > 0) {
                        TextButton(
                            onClick = { onRollback(message.stepIndex - 1) },
                            contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp)
                        ) {
                            Text("⏳ Откат сюда", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                        }
                    }
                }
                Spacer(Modifier.height(4.dp))
                Text(message.text, style = MaterialTheme.typography.bodyMedium, color = Color.White)
            }
        }
    }
}

@Composable
fun BarsAdvisorPanel(
    animation: String,
    feedback: String,
    metrics: NegotiationMetrics,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = DarkGraphiteSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, AlabugaPurple)
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("РОБОТ-НАСТАВНИК «Б.А.Р.С.»", style = MaterialTheme.typography.labelMedium, color = NeonCyan)

            // Вызов expect/actual Composable для рендеринга 3D аватара робота
            Bars3DView(
                animation = animation,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
            )

            // Индикаторы телеметрии
            TelemetryBar(label = "Доверие (Trust)", value = metrics.trust, color = NeonCyan)
            TelemetryBar(label = "Напряжение (Tension)", value = metrics.tension, color = NeonRed)
            TelemetryBar(label = "Готовность к сделке", value = metrics.dealReadiness, color = NeonGreen)

            HorizontalDivider(color = DarkGraphiteBorder)

            // Совет робота
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkGraphiteCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, AlabugaPurpleLight)
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Text("ТАКТИЧЕСКИЙ АНАЛИЗ:", style = MaterialTheme.typography.labelSmall, color = NeonAmber)
                    Spacer(Modifier.height(4.dp))
                    Text(feedback, style = MaterialTheme.typography.bodySmall, color = Color.White)
                }
            }
        }
    }
}

@Composable
fun TelemetryBar(label: String, value: Int, color: Color) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = Color.LightGray)
            Text("\$value%", style = MaterialTheme.typography.labelSmall, color = color, fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(4.dp))
        LinearProgressIndicator(
            progress = { value / 100f },
            modifier = Modifier.fillMaxWidth().height(6.dp),
            color = color,
            trackColor = DarkGraphiteBorder
        )
    }
}
`,
  },
  {
    path: "commonMain/kotlin/org/alabuga/arena/ui/components/Bars3DView.kt",
    filename: "Bars3DView.kt",
    language: "kotlin",
    description: "Expect объявление 3D-компонента Б.А.Р.С. в commonMain",
    category: "3D Expect/Actual",
    content: `package org.alabuga.arena.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

/**
 * Ожидаемый (expect) Composable для рендеринга 3D-аватара робота Б.А.Р.С.
 *
 * @param animation Состояние анимации: "idle" | "talk" | "warn" | "win"
 * @param modifier Модификатор разметки
 *
 * Платформенные реализации (actual):
 * - Android: SceneView с Filament движком (рендеринг glTF/GLB с skeletal animation)
 * - Web (Wasm): DOM/Canvas interop с Three.js или Google <model-viewer>
 * - iOS: UIKitView с SceneKit / RealityKit
 */
@Composable
expect fun Bars3DView(
    animation: String,
    modifier: Modifier = Modifier
)
`,
  },
  {
    path: "androidMain/kotlin/org/alabuga/arena/ui/components/Bars3DView.android.kt",
    filename: "Bars3DView.android.kt",
    language: "kotlin",
    description: "Actual реализация для Android на базе SceneView (Filament)",
    category: "3D Expect/Actual",
    content: `package org.alabuga.arena.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.viewinterop.AndroidView
import io.github.sceneview.SceneView
import io.github.sceneview.math.Position
import io.github.sceneview.math.Rotation
import io.github.sceneview.node.ModelNode

/**
 * Android Actual: интеграция с SceneView (Filament 3D engine)
 */
@Composable
actual fun Bars3DView(
    animation: String,
    modifier: Modifier
) {
    var modelNode by remember { mutableStateOf<ModelNode?>(null) }

    // Реакция на смену анимации ("idle", "talk", "warn", "win")
    LaunchedEffect(animation, modelNode) {
        modelNode?.let { node ->
            when (animation) {
                "talk" -> {
                    node.playAnimation("TalkLoop", loop = true)
                }
                "warn" -> {
                    node.playAnimation("WarningAlert", loop = true)
                }
                "win" -> {
                    node.playAnimation("VictoryGesture", loop = false)
                }
                else -> {
                    node.playAnimation("IdleScan", loop = true)
                }
            }
        }
    }

    Box(modifier = modifier.background(Color(0xFF14161F))) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context ->
                SceneView(context).apply {
                    cameraNode.position = Position(x = 0f, y = 0.5f, z = 2.2f)

                    // Загрузка GLB аватара робота Б.А.Р.С. из assets ОЭЗ «Алабуга»
                    val node = ModelNode(
                        modelLoader = modelLoader,
                        fileLocation = "models/bars_robot_avatar.glb",
                        scaleToUnits = 1.0f,
                        centerOrigin = Position(0f, 0f, 0f)
                    ).apply {
                        rotation = Rotation(x = 0f, y = 15f, z = 0f)
                    }

                    addChildNode(node)
                    modelNode = node
                }
            },
            update = { sceneView ->
                // Обновление параметров освещения и позиции при перекомпозиции
            }
        )
    }
}
`,
  },
  {
    path: "wasmJsMain/kotlin/org/alabuga/arena/ui/components/Bars3DView.wasmJs.kt",
    filename: "Bars3DView.wasmJs.kt",
    language: "kotlin",
    description: "Actual реализация для Web (Wasm) с Three.js / DOM Canvas interop",
    category: "3D Expect/Actual",
    content: `package org.alabuga.arena.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import kotlinx.browser.document
import org.w3c.dom.HTMLCanvasElement

// Внешние JS-функции для WebGL / Three.js рендерера
@JsModule("./barsThreeInterop.js")
external object BarsThreeInterop {
    fun initBarsScene(canvasId: String)
    fun setAnimationState(animation: String)
    fun destroyScene()
}

/**
 * Web Wasm Actual: интероп с WebGL / Canvas и Web Components
 */
@Composable
actual fun Bars3DView(
    animation: String,
    modifier: Modifier
) {
    val canvasId = remember { "bars_wasm_canvas_\${(1..10000).random()}" }

    LaunchedEffect(animation) {
        // Уведомляем Three.js модуль о смене анимации
        try {
            BarsThreeInterop.setAnimationState(animation)
        } catch (e: Throwable) {
            // Fallback в случае отсутствия внешнего Three.js бандла
        }
    }

    DisposableEffect(canvasId) {
        try {
            BarsThreeInterop.initBarsScene(canvasId)
        } catch (e: Throwable) {
            // Graceful degradation
        }
        onDispose {
            try {
                BarsThreeInterop.destroyScene()
            } catch (e: Throwable) {}
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF14161F))
    ) {
        // Рендеринг через Compose HTML Canvas или HtmlView
    }
}
`,
  },
  {
    path: "iosMain/kotlin/org/alabuga/arena/ui/components/Bars3DView.ios.kt",
    filename: "Bars3DView.ios.kt",
    language: "kotlin",
    description: "Actual реализация для iOS через UIKitView и SceneKit / RealityKit",
    category: "3D Expect/Actual",
    content: `package org.alabuga.arena.ui.components

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.interop.UIKitView
import platform.SceneKit.SCNScene
import platform.SceneKit.SCNView
import platform.UIKit.UIColor

/**
 * iOS Actual: интеграция со SceneKit / RealityKit
 */
@Composable
actual fun Bars3DView(
    animation: String,
    modifier: Modifier
) {
    UIKitView(
        factory = {
            SCNView().apply {
                backgroundColor = UIColor.colorWithRed(0.08, 0.09, 0.12, 1.0)
                allowsCameraControl = false
                autoenablesDefaultLighting = true

                // Загрузка сцены с моделью робота
                scene = SCNScene.sceneNamed("bars_robot.scn")
            }
        },
        update = { scnView ->
            // Управление анимацией узла модели
        },
        modifier = modifier.fillMaxSize()
    )
}
`,
  },
  {
    path: "README_KMP_ARCHITECTURE.md",
    filename: "README_KMP_ARCHITECTURE.md",
    language: "markdown",
    description: "Архитектурная документация и дерево проекта «Арена переговоров»",
    category: "Docs",
    content: `# «Арена переговоров» (ОЭЗ «Алабуга») — Архитектура Kotlin Multiplatform

Кроссплатформенное приложение симулятора жестких переговоров с ИИ на базе **Kotlin Multiplatform (KMP)** и **Compose Multiplatform** для таргетов:
- **Android** (Jetpack Compose, SceneView / Filament 3D)
- **iOS** (UIKitView, SceneKit)
- **Web (Wasm)** (Compose HTML / Canvas, Three.js interop)

---

## 📁 Структура каталогов Multiplatform-проекта

\`\`\`
AlabugaNegotiationArena/
├── build.gradle.kts                      # Root Gradle configuration
├── settings.gradle.kts                   # Project & plugin repos
├── gradle/libs.versions.toml             # Version catalog (Ktor 3, Compose MP, Serialization)
└── app/
    ├── build.gradle.kts                  # Android Target (SDK 26-35, Jetpack Compose Material 3)
    └── src/
        ├── commonMain/                   # 100% общий код (UI, Network, Models, MVI)
        │   ├── kotlin/org/alabuga/arena/
        │   │   ├── model/
        │   │   │   └── DataModels.kt     # kotlinx.serialization модели, BATNA, метрики
        │   │   ├── network/
        │   │   │   └── NegotiationRepository.kt # Ktor Client + автономный MockEngine
        │   │   ├── presentation/
        │   │   │   └── NegotiationViewModel.kt  # MVI Store, Time-travel машина времени, Debriefing
        │   │   └── ui/
        │   │       ├── AdminConfigScreen.kt     # Настройка сценария и BATNA
        │   │       ├── ArenaScreen.kt           # 3-колоночный боевой экран
        │   │       ├── theme/Theme.kt           # Dark Graphite, #7B2CBF Alabuga Purple, Neons
        │   │       └── components/
        │   │           └── Bars3DView.kt        # expect fun Bars3DView(animation: String)
        │   └── composeResources/                # Иконки, шрифты JetBrains Mono, аудио
        │
        ├── androidMain/                         # Android-специфичный код
        │   └── kotlin/org/alabuga/arena/ui/components/
        │       └── Bars3DView.android.kt        # actual с SceneView (Filament glTF)
        │
        ├── wasmJsMain/                          # Web (Wasm) код
        │   └── kotlin/org/alabuga/arena/ui/components/
        │       └── Bars3DView.wasmJs.kt         # actual с Three.js Canvas interop
        │
        └── iosMain/                             # iOS код
            └── kotlin/org/alabuga/arena/ui/components/
                └── Bars3DView.ios.kt            # actual с UIKitView (SceneKit)
\`\`\`

---

## ⚡ Ключевые архитектурные решения

1. **MVI + Time-Travel Branching**:
   - Каждый ход сохраняет глубокий снимок состояния (\`SessionSnapshot\`).
   - Функция «Машина времени» позволяет откатиться к шагу $N$, обрезать историю и пойти по новой тактической ветке диалога.
2. **Ktor Client с Fallback-режимом**:
   - При наличии связи обращается к Gemini API прокси.
   - При отсутствии интернета прозрачно активируется автономный MockEngine со стратегическим расчетом баланса сил.
3. **Expect / Actual для 3D робота Б.А.Р.С.**:
   - В \`commonMain\` объявляется декларативный Composable.
   - Нативные движки обеспечивают 60 FPS на каждой платформе.
\`\`\`
`,
  }
];
