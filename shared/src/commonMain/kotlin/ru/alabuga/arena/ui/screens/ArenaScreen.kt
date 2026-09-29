package ru.alabuga.arena.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.scrollBy
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.FileDownload
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import ru.alabuga.arena.model.*
import ru.alabuga.arena.network.KtorGeminiService
import ru.alabuga.arena.ui.components.BarsRobotView
import ru.alabuga.arena.ui.components.DebriefingModal
import ru.alabuga.arena.ui.components.TimeTravelModal
import ru.alabuga.arena.ui.components.ZopaMapCard
import ru.alabuga.arena.telemetry.TelemetryService
import kotlin.random.Random

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArenaScreen(
    config: ScenarioConfig,
    onBack: () -> Unit,
    onOpenConfig: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var metrics by remember { mutableStateOf(NegotiationMetrics(trust = 55, tension = 35, dealReadiness = 40)) }
    var inputText by remember { mutableStateOf("") }
    var lastInsertedTemplate by remember { mutableStateOf("") }
    var currentStep by remember { mutableStateOf(1) }

    var showTimeTravel by remember { mutableStateOf(false) }
    var showDebriefing by remember { mutableStateOf(false) }
    var mobileSelectedTab by remember { mutableStateOf(0) } // 0: Чат / 3D, 1: Тактика / ZOPA

    var zopaState by remember {
        mutableStateOf(
            ZopaState(
                sellerMin = config.batna.minPricePerSqm,
                sellerMax = 520,
                buyerMin = 300,
                buyerMax = 380,
                currentOffer = 350,
                isOverlap = false,
                overlapMin = null,
                overlapMax = null,
                status = "narrowing",
                changeReason = "Оппонент удерживает заниженную планку (350 ₽/м²), коридор сделки пока закрыт."
            )
        )
    }

    var latestBarsAdvice by remember { mutableStateOf(config.initialBarsAdvice) }
    var robotAnimation by remember { mutableStateOf("idle") }
    var isGeneratingReply by remember { mutableStateOf(false) }

    val geminiService = remember { KtorGeminiService() }
    val coroutineScope = rememberCoroutineScope()
    val listState = rememberLazyListState()

    val messages = remember {
        mutableStateListOf(
            Message(
                id = "init_opp",
                actor = MessageActor.OPPONENT,
                text = config.initialOpponentUtterance,
                stepIndex = 0,
                snapshotMetrics = NegotiationMetrics(trust = 55, tension = 35, dealReadiness = 40),
                emotionEmoji = "😠",
                emotionLabel = "Давление / Выпад",
                contextHints = config.initialDynamicHints
            )
        )
    }

    LaunchedEffect(config.id) {
        TelemetryService.recordNegotiationStart(config.id)
    }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    LaunchedEffect(robotAnimation) {
        if (robotAnimation != "idle") {
            delay(4000L)
            robotAnimation = "idle"
        }
    }

    // Динамический цвет атмосферы (0%: фиолетовый -> 50%: пурпур -> 100%: алый)
    val atmosphereColor by animateColorAsState(
        targetValue = when {
            metrics.tension >= 75 -> Color(0xFFFF1E56)
            metrics.tension >= 50 -> Color(0xFFEF4444)
            metrics.tension >= 25 -> Color(0xFF9333EA)
            else -> Color(0xFF7B2CBF)
        },
        animationSpec = tween(600),
        label = "atmosphereColor"
    )

    // Анимация фоновых космических частиц
    val infiniteTransition = rememberInfiniteTransition(label = "arenaFx")
    val particlePhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(18000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "particles"
    )

    val particles = remember {
        List(24) {
            Triple(Random.nextFloat(), Random.nextFloat(), Random.nextFloat() * 0.15f + 0.05f)
        }
    }

    // Validation & B2B Censor
    val trimmed = inputText.trim()
    val words = remember(trimmed) { trimmed.split(Regex("\\s+")).filter { it.isNotBlank() } }
    val hasPlaceholders = remember(trimmed) {
        trimmed.contains("[") || trimmed.contains("]")
    }

    // ИИ-Цензор ввода: запрет на «базарные» цифры и фразы короче 4 слов без аргументов
    val isBazaarInput = remember(trimmed, words) {
        if (trimmed.isEmpty()) false
        else {
            val isJustNumber = trimmed.matches(Regex("^[+\\-~]?\\s*\\d+(?:[.,]\\d+)?\\s*(?:[рp₽]|руб(?:лей|ля|ль)?(?:\\s*\\/\\s*м[²2]?)?)?\\.?$", RegexOption.IGNORE_CASE))
            val hasB2BKeywords = trimmed.contains("если", ignoreCase = true) ||
                    trimmed.contains("взамен", ignoreCase = true) ||
                    trimmed.contains("при условии", ignoreCase = true) ||
                    trimmed.contains("гарант", ignoreCase = true) ||
                    trimmed.contains("готовы", ignoreCase = true) ||
                    trimmed.contains("предлагаем", ignoreCase = true) ||
                    trimmed.contains("capex", ignoreCase = true) ||
                    trimmed.contains("каникул", ignoreCase = true) ||
                    trimmed.contains("тариф", ignoreCase = true) ||
                    trimmed.contains("мощност", ignoreCase = true) ||
                    trimmed.contains("срок", ignoreCase = true)
            val isTooShortWithoutArgs = words.size < 4 && !hasB2BKeywords
            isJustNumber || isTooShortWithoutArgs
        }
    }

    val canSend = trimmed.isNotEmpty() && !hasPlaceholders && !isBazaarInput && !isGeneratingReply

    val sendInteractionSource = remember { MutableInteractionSource() }
    val isSendPressed by sendInteractionSource.collectIsPressedAsState()
    val sendScale by animateFloatAsState(
        targetValue = if (isSendPressed) 0.92f else 1f,
        label = "sendScale"
    )

    var elapsedSeconds by remember { mutableStateOf(0) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(1000L)
            elapsedSeconds++
        }
    }

    Scaffold(
        topBar = {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0A0C16).copy(alpha = 0.85f)),
                contentAlignment = Alignment.Center
            ) {
                Box(modifier = Modifier.widthIn(max = 1180.dp).fillMaxWidth()) {
                    TopAppBar(
                        title = {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(10.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF00F0FF))
                                )
                                Column {
                                    Text(
                                        text = config.opponentName,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    Text(
                                        text = "${config.opponentCompany} • ${config.opponentRole}",
                                        fontSize = 11.sp,
                                        color = Color(0xFF94A3B8)
                                    )
                                }
                            }
                        },
                        navigationIcon = {
                            IconButton(onClick = onBack) {
                                Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад", tint = Color(0xFF00F0FF))
                            }
                        },
                        actions = {
                            // Парящий Cyber-Glass таймер переговоров
                            val timerMinutes = elapsedSeconds / 60
                            val timerSeconds = elapsedSeconds % 60
                            Surface(
                                shape = RoundedCornerShape(50),
                                color = Color(0xFF0F172A).copy(alpha = 0.85f),
                                border = BorderStroke(
                                    1.dp,
                                    Brush.linearGradient(
                                        listOf(Color(0xFF00F0FF).copy(alpha = 0.45f), Color(0xFF7B2CBF).copy(alpha = 0.35f))
                                    )
                                ),
                                modifier = Modifier.padding(end = 6.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Timer,
                                        contentDescription = "Таймер переговоров",
                                        tint = Color(0xFF00F0FF),
                                        modifier = Modifier.size(15.dp)
                                    )
                                    Text(
                                        text = "${timerMinutes.toString().padStart(2, '0')}:${timerSeconds.toString().padStart(2, '0')}",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF00F0FF),
                                        fontFamily = FontFamily.Monospace,
                                        letterSpacing = 1.sp
                                    )
                                }
                            }

                            // Кнопка "🎛 Конфигуратор" (Cyber-Glass pill с неоновым бордером)
                            Surface(
                                onClick = onOpenConfig,
                                shape = RoundedCornerShape(50),
                                color = Color(0xFF1E1035).copy(alpha = 0.85f),
                                border = BorderStroke(
                                    1.dp,
                                    Brush.linearGradient(
                                        listOf(Color(0xFF7B2CBF), Color(0xFF00F0FF).copy(alpha = 0.5f))
                                    )
                                ),
                                modifier = Modifier.padding(end = 4.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = "🎛",
                                        fontSize = 13.sp
                                    )
                                    Text(
                                        text = "Конфигуратор",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color(0xFFE2E8F0)
                                    )
                                }
                            }

                            IconButton(onClick = { showDebriefing = true }) {
                                Icon(imageVector = Icons.Default.FileDownload, contentDescription = "Скачать PDF результатов", tint = Color(0xFF00FFCC))
                            }
                            IconButton(onClick = { showTimeTravel = true }) {
                                Icon(imageVector = Icons.Default.History, contentDescription = "Машина времени", tint = Color(0xFF00F0FF))
                            }
                            IconButton(onClick = { showDebriefing = true }) {
                                Icon(imageVector = Icons.Default.EmojiEvents, contentDescription = "Дебрифинг", tint = Color(0xFFD8B4FE))
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
                    )
                }
            }
        },
        containerColor = Color(0xFF06070B)
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(
                    Brush.radialGradient(
                        colors = listOf(Color(0xFF140D2B), Color(0xFF06070B)),
                        radius = 2400f
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            // ФОН: Инженерная сетка + частицы
            Canvas(modifier = Modifier.fillMaxSize()) {
                val step = 32.dp.toPx()
                val w = size.width
                val h = size.height

                // Сетка
                var x = 0f
                while (x < w) {
                    drawLine(
                        color = Color(0xFF00F0FF).copy(alpha = 0.025f),
                        start = Offset(x, 0f),
                        end = Offset(x, h),
                        strokeWidth = 1f
                    )
                    x += step
                }
                var y = 0f
                while (y < h) {
                    drawLine(
                        color = Color(0xFF00F0FF).copy(alpha = 0.025f),
                        start = Offset(0f, y),
                        end = Offset(w, y),
                        strokeWidth = 1f
                    )
                    y += step
                }

                // Частицы
                particles.forEach { (px, py, pAlpha) ->
                    val currentY = (py - particlePhase + 1f) % 1f * h
                    val currentX = px * w
                    drawCircle(
                        color = Color(0xFF9D4EDD).copy(alpha = pAlpha),
                        radius = 2.5.dp.toPx(),
                        center = Offset(currentX, currentY)
                    )
                }
            }

            val onSendMessage: () -> Unit = {
                if (canSend && !isGeneratingReply) {
                    val userText = trimmed
                    inputText = ""
                    lastInsertedTemplate = ""

                    currentStep++

                    val userMsg = Message(
                        id = "user_${currentStep}_${Random.nextInt(100000)}",
                        actor = MessageActor.USER,
                        text = userText,
                        stepIndex = currentStep,
                        snapshotMetrics = metrics
                    )
                    messages.add(userMsg)

                    isGeneratingReply = true
                    coroutineScope.launch {
                        try {
                            val replyDto = geminiService.sendMessage(
                                history = messages.toList(),
                                userMessage = userText,
                                config = config,
                                currentMetrics = metrics
                            )

                            val updatedTrust = (metrics.trust + replyDto.metricsDelta.trust).coerceIn(0, 100)
                            val updatedTension = (metrics.tension + replyDto.metricsDelta.tension).coerceIn(0, 100)
                            val updatedReadiness = (metrics.dealReadiness + replyDto.metricsDelta.dealReadiness).coerceIn(0, 100)
                            val newMetrics = NegotiationMetrics(updatedTrust, updatedTension, updatedReadiness)
                            metrics = newMetrics

                            latestBarsAdvice = replyDto.barsFeedback
                            robotAnimation = replyDto.barsAnimation

                            val (emoEmoji, emoLabel) = when {
                                replyDto.barsAnimation == "warn" -> "😠" to "Недовольство / Напряжение"
                                replyDto.barsAnimation == "win" -> "🤝" to "Сближение позиций"
                                replyDto.metricsDelta.tension > 10 -> "⚡" to "Обострение"
                                replyDto.metricsDelta.dealReadiness > 5 -> "💡" to "Интерес"
                                else -> "💼" to "Деловой анализ"
                            }

                            val deltaOffer = if (replyDto.metricsDelta.dealReadiness > 0) {
                                (replyDto.metricsDelta.dealReadiness * 2).coerceIn(5, 40)
                            } else if (replyDto.metricsDelta.dealReadiness < 0) {
                                (-10).coerceAtLeast(-30)
                            } else {
                                0
                            }
                            val oppOffer = (zopaState.currentOffer + deltaOffer).coerceIn(300, 520)
                            val isOverlapNow = oppOffer >= config.batna.minPricePerSqm
                            zopaState = zopaState.copy(
                                buyerMax = oppOffer,
                                currentOffer = oppOffer,
                                isOverlap = isOverlapNow,
                                overlapMin = if (isOverlapNow) config.batna.minPricePerSqm else null,
                                overlapMax = if (isOverlapNow) oppOffer else null,
                                changeReason = if (isOverlapNow) {
                                    "Коридор сделки открыт! Стороны сошлись в цене от ${config.batna.minPricePerSqm} ₽/м²."
                                } else if (deltaOffer > 0) {
                                    "Оппонент скорректировал позицию до $oppOffer ₽/м² на основе встречных аргументов."
                                } else if (deltaOffer < 0) {
                                    "Оппонент ужесточил позицию ($oppOffer ₽/м²) из-за слабого обоснования цены."
                                } else {
                                    zopaState.changeReason
                                }
                            )

                            messages.add(
                                Message(
                                    id = "opp_${currentStep}_${Random.nextInt(100000)}",
                                    actor = MessageActor.OPPONENT,
                                    text = replyDto.getResolvedReply(),
                                    stepIndex = currentStep,
                                    snapshotMetrics = newMetrics,
                                    emotionEmoji = emoEmoji,
                                    emotionLabel = emoLabel,
                                    contextHints = replyDto.dynamicHints
                                )
                            )

                            TelemetryService.recordRound(
                                scenarioId = config.id,
                                roundIndex = currentStep,
                                playerTextLength = userText.length,
                                dealReadiness = updatedReadiness,
                                trust = updatedTrust,
                                stress = updatedTension,
                                currentOffer = oppOffer,
                                censorBlocked = false
                            )
                        } catch (_: Throwable) {
                            // Fallback handled inside KtorGeminiService
                        } finally {
                            isGeneratingReply = false
                        }
                    }
                }
            }

            // Центрированный адаптивный контейнер: защищен от растяжения на ультрашироких экранах (макс. 1240dp)
            Box(
                modifier = modifier
                    .fillMaxHeight()
                    .widthIn(max = 1240.dp)
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 6.dp),
                contentAlignment = Alignment.Center
            ) {
                BoxWithConstraints(
                    modifier = Modifier.fillMaxSize()
                ) {
                    val isMobile = maxWidth < 840.dp

                    if (isMobile) {
                        Column(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Cyber-Glass Segmented Switch
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(Color(0xFF0F172A).copy(alpha = 0.85f))
                                    .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(14.dp))
                                    .padding(3.dp),
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(11.dp))
                                        .background(
                                            if (mobileSelectedTab == 0) Brush.linearGradient(listOf(Color(0xFF00F0FF).copy(alpha = 0.25f), Color(0xFF7B2CBF).copy(alpha = 0.35f)))
                                            else SolidColor(Color.Transparent)
                                        )
                                        .clickable { mobileSelectedTab = 0 }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "💬 ДИАЛОГ",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (mobileSelectedTab == 0) Color(0xFF00F0FF) else Color(0xFF94A3B8),
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(11.dp))
                                        .background(
                                            if (mobileSelectedTab == 1) Brush.linearGradient(listOf(Color(0xFF00F0FF).copy(alpha = 0.25f), Color(0xFF7B2CBF).copy(alpha = 0.35f)))
                                            else SolidColor(Color.Transparent)
                                        )
                                        .clickable { mobileSelectedTab = 1 }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "📊 ТАКТИКА И ZOPA",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (mobileSelectedTab == 1) Color(0xFF00F0FF) else Color(0xFF94A3B8),
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                            }

                            if (mobileSelectedTab == 0) {
                                ArenaChatContent(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .imePadding(),
                                    isMobile = true,
                                    config = config,
                                    messages = messages,
                                    listState = listState,
                                    isGeneratingReply = isGeneratingReply,
                                    robotAnimation = robotAnimation,
                                    showDebriefing = showDebriefing,
                                    showTimeTravel = showTimeTravel,
                                    inputText = inputText,
                                    onInputTextChanged = { inputText = it },
                                    onSend = onSendMessage,
                                    canSend = canSend,
                                    hasPlaceholders = hasPlaceholders,
                                    isBazaarInput = isBazaarInput,
                                    onHintSelected = { hint ->
                                        inputText = hint
                                        lastInsertedTemplate = hint
                                    },
                                    sendInteractionSource = sendInteractionSource,
                                    sendScale = sendScale,
                                    atmosphereColor = atmosphereColor
                                )
                            } else {
                                ArenaTacticalContent(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .verticalScroll(rememberScrollState())
                                        .padding(vertical = 4.dp),
                                    latestBarsAdvice = latestBarsAdvice,
                                    metrics = metrics,
                                    atmosphereColor = atmosphereColor,
                                    zopaState = zopaState,
                                    config = config,
                                    isMobile = true
                                )
                            }
                        }
                    } else {
                        Row(
                            modifier = Modifier.fillMaxSize(),
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            ArenaChatContent(
                                modifier = Modifier
                                    .weight(0.60f)
                                    .fillMaxHeight(),
                                isMobile = false,
                                config = config,
                                messages = messages,
                                listState = listState,
                                isGeneratingReply = isGeneratingReply,
                                robotAnimation = robotAnimation,
                                showDebriefing = showDebriefing,
                                showTimeTravel = showTimeTravel,
                                inputText = inputText,
                                onInputTextChanged = { inputText = it },
                                onSend = onSendMessage,
                                canSend = canSend,
                                hasPlaceholders = hasPlaceholders,
                                isBazaarInput = isBazaarInput,
                                onHintSelected = { hint ->
                                    inputText = hint
                                    lastInsertedTemplate = hint
                                },
                                sendInteractionSource = sendInteractionSource,
                                sendScale = sendScale,
                                atmosphereColor = atmosphereColor
                            )

                            ArenaTacticalContent(
                                modifier = Modifier
                                    .weight(0.40f)
                                    .fillMaxHeight(),
                                latestBarsAdvice = latestBarsAdvice,
                                metrics = metrics,
                                atmosphereColor = atmosphereColor,
                                zopaState = zopaState,
                                config = config,
                                isMobile = false
                            )
                        }
                    }
                }
            }

            // Модалка Машины времени
            if (showTimeTravel) {
                TimeTravelModal(
                    messages = messages,
                    currentStep = currentStep,
                    onRollback = { step ->
                        val targetMessages = messages.filter { it.stepIndex <= step }
                        messages.clear()
                        messages.addAll(targetMessages)
                        currentStep = step
                        messages.lastOrNull()?.snapshotMetrics?.let { metrics = it }
                    },
                    onClose = { showTimeTravel = false }
                )
            }

            // Модалка Дебрифинга
            if (showDebriefing) {
                val isRateAgreed = config.agendaTopics.any { it.id == "rate" && it.status == "agreed" } || zopaState.currentOffer >= config.batna.minPricePerSqm
                val isPowerCapexAgreed = config.agendaTopics.any { (it.id == "power_capex" || it.id == "capex") && it.status == "agreed" } || metrics.dealReadiness >= 70
                val rating = if (metrics.dealReadiness >= 75) "S" else if (metrics.dealReadiness >= 50) "A" else "B"

                val achievementsList = remember(config.id, isRateAgreed, isPowerCapexAgreed, currentStep, metrics, rating) {
                    getScenarioAchievements(
                        scenarioId = config.id,
                        batnaMin = config.batna.minPricePerSqm,
                        currentOffer = zopaState.currentOffer,
                        metrics = metrics,
                        currentStep = currentStep,
                        rating = rating,
                        isRateAgreed = isRateAgreed,
                        isPowerCapexAgreed = isPowerCapexAgreed
                    )
                }

                LaunchedEffect(showDebriefing) {
                    if (showDebriefing) {
                        TelemetryService.recordOutcome(
                            scenarioId = config.id,
                            isSuccess = metrics.dealReadiness >= 65,
                            finalPrice = zopaState.currentOffer,
                            roundsTotal = currentStep,
                            finalTrust = metrics.trust,
                            finalStress = metrics.tension
                        )
                    }
                }

                DebriefingModal(
                    report = DebriefingReport(
                        finalOutcome = if (metrics.dealReadiness >= 65) "WON" else "IN_PROGRESS",
                        totalSteps = currentStep,
                        timeTravelUsedCount = 0,
                        batnaScore = if (isRateAgreed) 92 else 75,
                        stressManagementScore = (100 - metrics.tension).coerceIn(0, 100),
                        overallRating = rating,
                        barsExecutiveSummary = "Вы успешно применили встречную аргументацию, удержали красную линию BATNA и открыли переговорный коридор ZOPA.",
                        manipulationsHandledCount = 2,
                        hiddenNeedsDiscovered = true,
                        mutualTradeOffsEnforced = true,
                        achievements = achievementsList
                    ),
                    scenario = config,
                    onRestart = {
                        messages.clear()
                        messages.addAll(
                            listOf(
                                Message("init_opp", MessageActor.OPPONENT, config.initialOpponentUtterance, stepIndex = 0, contextHints = config.initialDynamicHints)
                            )
                        )
                        metrics = NegotiationMetrics(trust = 55, tension = 35, dealReadiness = 40)
                        currentStep = 1
                    },
                    onClose = { showDebriefing = false }
                )
            }
        }
    }
}

fun getDefaultHintsForScenario(config: ScenarioConfig): List<String> {
    return when (config.id) {
        "valeriy_stroganov_anchor" -> listOf(
            "Мы готовы согласовать ставку ${config.batna.minPricePerSqm} ₽/м², если вы подтвердите объем инвестиций от 800 млн ₽ в первый год.",
            "Ставка ${config.batna.minPricePerSqm + 20} ₽/м² включает полную подводку сетей и нулевой налог на имущество на 10 лет.",
            "Давайте зафиксируем 3 месяца арендных каникул в обмен на график создания 150 рабочих мест до конца года.",
            "Мы можем предоставить приоритет на расширение 2-й очереди при условии подписания твердого договора аренды сейчас."
        )
        "chinese_equipment_consortium" -> listOf(
            "Мы гарантируем сертификацию по ГОСТ и технадзор, если вы зафиксируете срок шеф-монтажа до 45 дней.",
            "Предоплата 40% возможна только под безотзывный аккредитив топ-3 банков и фиксированную рублевую гарантию.",
            "Готовы предоставить складскую площадку в ОЭЗ на льготных условиях при гарантии локализации 30% сервиса.",
            "Давайте включим штраф 0.1% в день за срыв пусконаладки взамен на ускоренную приемку первой партии оборудования."
        )
        "hr_top_engineer_retention" -> listOf(
            "Мы готовы повысить базовый оклад на 18% с опционом бонуса за запуск цеха композитов в 3-м квартале.",
            "Предлагаем позицию главного инженера направления с прямым подчинением гендиректору и собственной лабораторией.",
            "Готовы компенсировать аренду жилья в Альметьевске и предоставить служебный автомобиль при контракте на 3 года.",
            "Давайте согласуем полугодовую аттестацию с возможностью пересмотра грейда по результатам ввода линии."
        )
        "investor_infrastructure_subsidies" -> listOf(
            "Мы подключаем 8 МВт по льготному тарифу при условии подписания инвестсоглашения на 1.2 млрд ₽.",
            "Строительство подъездных ж/д путей берет на себя ОЭЗ в обмен на встречное обязательство по грузообороту.",
            "Предлагаем поэтапное субсидирование энергозатрат: 100% компенсации в первый год и 50% во второй.",
            "Готовы ускорить выдачу ТУ на газ до 2 недель при фиксации даты старта строительства в мае."
        )
        "ai_datacenter_lease" -> listOf(
            "Мы гарантируем резервирование по схеме 2N и PUE до 1.25 при базовой ставке ${config.batna.minPricePerSqm} ₽/кВт⋅ч.",
            "Готовы зафиксировать коридор расширения до 25 МВт на 3 года при подписании 5-летнего контракта.",
            "Предлагаем переложить часть затрат на кабельные трассы на ОЭЗ взамен на SLA 99.982% по доступности.",
            "Можем предоставить 2 месяца каникул на монтаж суперкомпьютерных стоек при авансировании квартала."
        )
        else -> listOf(
            "Мы готовы зафиксировать базовую ставку ${config.batna.minPricePerSqm} ₽ при встречных гарантиях объемов ввода.",
            "Наше предложение учитывает инфраструктурные преференции ОЭЗ: налоговые льготы и готовые инженерные сети.",
            "Предлагаем закрепить поэтапный график инвестиций с жесткими SLA и взаимными гарантиями сроков.",
            "Давайте найдем компромисс в коридоре ZOPA: встречная уступка по срокам взамен на твердую ставку."
        )
    }
}

fun getScenarioAchievements(
    scenarioId: String,
    batnaMin: Int,
    currentOffer: Int,
    metrics: NegotiationMetrics,
    currentStep: Int,
    rating: String,
    isRateAgreed: Boolean,
    isPowerCapexAgreed: Boolean
): List<Achievement> {
    return when (scenarioId) {
        "hr_top_engineer_retention" -> listOf(
            Achievement(
                id = "batna_shield",
                title = "Железная BATNA",
                subtitle = "Удержание ФОТ",
                description = "Сохранил баланс ФОТ ОЭЗ, удержав индексацию оклада в пределах плановых +18-20% без переплат.",
                isUnlocked = isRateAgreed || metrics.dealReadiness >= 60,
                tier = AchievementTier.EPIC,
                conditionText = "Не превысить плановый лимит оклада (+20%)"
            ),
            Achievement(
                id = "bluff_buster",
                title = "Детектор лжи",
                subtitle = "Оффер из Сколково",
                description = "Разобрался в деталях внешнего оффера и показал реальные преимущества стабильности лаборатории «Алабуги».",
                isUnlocked = currentStep >= 2,
                tier = AchievementTier.RARE,
                conditionText = "Отразить ультиматум и провести объективный анализ альтернатив"
            ),
            Achievement(
                id = "hidden_pain",
                title = "Рентген потребностей",
                subtitle = "Научная самостоятельность",
                description = "Выявил истинную мотивацию инженера: не просто оклад, а статус R&D-лидера и авторство разработок.",
                isUnlocked = metrics.trust >= 60,
                tier = AchievementTier.RARE,
                conditionText = "Найти нематериальный драйвер и потребность в автономии"
            ),
            Achievement(
                id = "power_capex",
                title = "Золотой фонд кадров",
                subtitle = "Служебное жилье и опцион",
                description = "Предложил встречный пакет: лаборатория, служебное жилье и бонус за запуск цеха взамен на 3-летний контракт.",
                isUnlocked = isPowerCapexAgreed || metrics.dealReadiness >= 70,
                tier = AchievementTier.EPIC,
                conditionText = "Согласовать комплексный мотивационный пакет на 3 года"
            ),
            Achievement(
                id = "grandmaster_s",
                title = "Гроссмейстер Алабуги",
                subtitle = "Сохранение таланта",
                description = "Провел образцовые переговоры, удержал ключевого специалиста и укрепил лояльность к ОЭЗ.",
                isUnlocked = rating == "S" && currentStep >= 4,
                tier = AchievementTier.LEGENDARY,
                conditionText = "Получить высший ранг S (4+ раунда без спешки)"
            )
        )
        "chinese_equipment_consortium" -> listOf(
            Achievement(
                id = "batna_shield",
                title = "Железная BATNA",
                subtitle = "Защита бюджета",
                description = "Не допустил 100% авансирования и зафиксировал расчеты в рублях под банковский аккредитив.",
                isUnlocked = isRateAgreed || currentOffer >= batnaMin,
                tier = AchievementTier.EPIC,
                conditionText = "Зафиксировать расчеты в рублях/аккредитиве (BATNA ОЭЗ)"
            ),
            Achievement(
                id = "bluff_buster",
                title = "Детектор лжи",
                subtitle = "Задержки на таможне",
                description = "Парировал попытки переложить логистические риски на ОЭЗ, указав на прямые обязанности поставщика.",
                isUnlocked = currentStep >= 2,
                tier = AchievementTier.RARE,
                conditionText = "Отразить манипуляции сроками и логистикой"
            ),
            Achievement(
                id = "hidden_pain",
                title = "Рентген потребностей",
                subtitle = "Вход на рынок РФ",
                description = "Понял, что китайскому консорциуму критически важно референс-внедрение в ОЭЗ для масштабирования в СНГ.",
                isUnlocked = metrics.trust >= 60,
                tier = AchievementTier.RARE,
                conditionText = "Выявить ключевой стратегический интерес консорциума"
            ),
            Achievement(
                id = "power_capex",
                title = "Локализация и ГОСТ",
                subtitle = "Шеф-монтаж под ключ",
                description = "Добился жестких гарантий сертификации по стандартам РФ и локализации 30% сервиса в ОЭЗ.",
                isUnlocked = isPowerCapexAgreed || metrics.dealReadiness >= 70,
                tier = AchievementTier.EPIC,
                conditionText = "Закрепить шеф-монтаж и сертификацию по ГОСТ"
            ),
            Achievement(
                id = "grandmaster_s",
                title = "Гроссмейстер Алабуги",
                subtitle = "Международный альянс",
                description = "Сформировал сбалансированный контракт без рисков простоя производства при ранге S.",
                isUnlocked = rating == "S" && currentStep >= 4,
                tier = AchievementTier.LEGENDARY,
                conditionText = "Закрыть сделку на высший ранг S (4+ раунда)"
            )
        )
        "ai_datacenter_lease" -> listOf(
            Achievement(
                id = "batna_shield",
                title = "Железная BATNA",
                subtitle = "Тариф 4.80 ₽/кВт⋅ч",
                description = "Удержал базовую планку тарифа не ниже 4.80 ₽/кВт⋅ч с учетом энергобаланса кластера ОЭЗ.",
                isUnlocked = isRateAgreed || currentOffer >= batnaMin,
                tier = AchievementTier.EPIC,
                conditionText = "Удержать ставку от 4.80 ₽/кВт⋅ч (BATNA ОЭЗ)"
            ),
            Achievement(
                id = "bluff_buster",
                title = "Детектор лжи",
                subtitle = "Сравнение с Сибирью",
                description = "Опроверг сравнение с дешевой сибирской ГЭС аргументами о прямом доступе к магистралям связи и надежности 2N.",
                isUnlocked = currentStep >= 2,
                tier = AchievementTier.RARE,
                conditionText = "Отразить ценовой демпинг удаленных регионов"
            ),
            Achievement(
                id = "hidden_pain",
                title = "Рентген потребностей",
                subtitle = "Дефицит мегаватт",
                description = "Вскрыл жесткий дедлайн запуска кластера нейросетей к ноябрю и отсутствие альтернативных 20 МВт в регионе.",
                isUnlocked = metrics.trust >= 60,
                tier = AchievementTier.RARE,
                conditionText = "Вскрыть дедлайн запуска кластера нейросетей"
            ),
            Achievement(
                id = "power_capex",
                title = "Энергетический барон",
                subtitle = "20 МВт и PUE 1.25",
                description = "Связал бронь 20 МВт с обязательством оператора ЦОД инвестировать в современную систему энергоэффективности.",
                isUnlocked = isPowerCapexAgreed || metrics.dealReadiness >= 70,
                tier = AchievementTier.EPIC,
                conditionText = "Связать 20 МВт с SLA и энергоэффективностью PUE <= 1.25"
            ),
            Achievement(
                id = "grandmaster_s",
                title = "Гроссмейстер Алабуги",
                subtitle = "Цифровой флагман",
                description = "Привлек стратегического ИИ-резидента на выгодных условиях с безупречным результатом ранга S.",
                isUnlocked = rating == "S" && currentStep >= 4,
                tier = AchievementTier.LEGENDARY,
                conditionText = "Получить высший ранг S (4+ раунда без спешки)"
            )
        )
        else -> listOf(
            Achievement(
                id = "batna_shield",
                title = "Железная BATNA",
                subtitle = "Несокрушимая защита ОЭЗ",
                description = "Удержал базовую ставку не ниже ${batnaMin} ₽/м² и лимит каникул, не сдав красные линии ОЭЗ «Алабуга».",
                isUnlocked = isRateAgreed || currentOffer >= batnaMin,
                tier = AchievementTier.EPIC,
                conditionText = "Зафиксировать ставку от ${batnaMin} ₽/м² (BATNA)"
            ),
            Achievement(
                id = "bluff_buster",
                title = "Детектор лжи",
                subtitle = "Калужский блеф-бастер",
                description = "Хладнокровно парировал блеф оппонента о конкурентах, используя факты о дефиците мощностей 110 кВ.",
                isUnlocked = currentStep >= 2,
                tier = AchievementTier.RARE,
                conditionText = "Отразить минимум 1 манипуляцию или блеф"
            ),
            Achievement(
                id = "hidden_pain",
                title = "Рентген потребностей",
                subtitle = "Истинная цель раскрыта",
                description = "Вскрыл скрытую боль инвестора: критическую зависимость от сроков ввода оборудования к 3-му кварталу.",
                isUnlocked = metrics.trust >= 60,
                tier = AchievementTier.RARE,
                conditionText = "Выявить скрытую боль и истинный дедлайн"
            ),
            Achievement(
                id = "power_capex",
                title = "Энергетический барон",
                subtitle = "8 МВт под 1.2 млрд ₽",
                description = "Не уступил бесплатные энергомощности, а разменял подключение 8 МВт на встречные инвестиции 1.2 млрд ₽.",
                isUnlocked = isPowerCapexAgreed || metrics.dealReadiness >= 70,
                tier = AchievementTier.EPIC,
                conditionText = "Связать 8 МВт с обязательством CAPEX 1.2 млрд ₽"
            ),
            Achievement(
                id = "grandmaster_s",
                title = "Гроссмейстер Алабуги",
                subtitle = "Безупречный ранг S",
                description = "Провел глубокие жесткие переговоры (4+ раунда), раскрыл боли, парировал атаки и закрыл идеальную сделку.",
                isUnlocked = rating == "S" && currentStep >= 4,
                tier = AchievementTier.LEGENDARY,
                conditionText = "Получить высший ранг S (4+ раунда без спешки)"
            )
        )
    }
}

@Composable
private fun ArenaChatContent(
    modifier: Modifier,
    isMobile: Boolean,
    config: ScenarioConfig,
    messages: List<Message>,
    listState: LazyListState,
    isGeneratingReply: Boolean,
    robotAnimation: String,
    showDebriefing: Boolean,
    showTimeTravel: Boolean,
    inputText: String,
    onInputTextChanged: (String) -> Unit,
    onSend: () -> Unit,
    canSend: Boolean,
    hasPlaceholders: Boolean,
    isBazaarInput: Boolean,
    onHintSelected: (String) -> Unit,
    sendInteractionSource: MutableInteractionSource,
    sendScale: Float,
    atmosphereColor: Color = Color(0xFF7B2CBF)
) {
    val coroutineScope = rememberCoroutineScope()

    val arenaRobotPhrases = remember {
        listOf(
            "Оппонент с порога атакует ставку аренды! Не оправдывайся и держи BATNA (460 ₽/м²).",
            "Хитрый ход инвестора! Предложи каникулы 10 месяцев взамен на долгосрочный контракт.",
            "Напомни о готовых энергомощностях 8 МВт и льготах ОЭЗ — это наш главный козырь!",
            "Оппонент начинает давить. Не уступай по CAPEX, держи переговоры в зоне ZOPA!",
            "Блеф оппонента очевиден. Альтернативных площадок с таким подводом коммуникаций в ПФО нет!",
            "Уверенная позиция! Закрепи договоренность по графику пусконаладки.",
            "Следи за индикатором напряжения! Если накал превысит 80%, инвестор возьмет паузу.",
            "Отличный аргумент! Оппонент снижает требования, дожимай финальные условия!"
        )
    }
    var arenaPhraseIndex by remember { mutableStateOf(0) }
    val arenaAnims = remember { listOf("wave", "talk", "nod", "bluff", "tilt", "jump") }
    var arenaAnimIndex by remember { mutableStateOf(0) }
    var currentArenaAnim by remember { mutableStateOf(robotAnimation) }

    LaunchedEffect(robotAnimation) {
        currentArenaAnim = robotAnimation
    }

    val handleArenaRobotTap: () -> Unit = {
        arenaAnimIndex = (arenaAnimIndex + 1) % arenaAnims.size
        currentArenaAnim = arenaAnims[arenaAnimIndex]
        arenaPhraseIndex = (arenaPhraseIndex + 1) % arenaRobotPhrases.size
    }

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // 1. Окно прямого эфира оппонента (3D Робот Майк / Б.А.Р.С.) с динамической рамкой и фоном стресса
        if (!showDebriefing && !showTimeTravel) {
            val avatarHeight = if (isMobile) 115.dp else 220.dp
            Surface(
                modifier = if (isMobile) {
                    Modifier
                        .fillMaxWidth()
                        .wrapContentHeight()
                } else {
                    Modifier
                        .fillMaxWidth()
                        .weight(0.40f)
                },
                shape = RoundedCornerShape(18.dp),
                color = Color(0xFF0C0F1D).copy(alpha = 0.85f),
                border = BorderStroke(
                    1.dp,
                    Brush.linearGradient(
                        listOf(
                            Color(0xFF00F0FF).copy(alpha = 0.45f),
                            atmosphereColor.copy(alpha = 0.65f)
                        )
                    )
                ),
                shadowElevation = 8.dp
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .then(if (isMobile) Modifier.wrapContentHeight() else Modifier.fillMaxSize())
                        .background(
                            Brush.radialGradient(
                                colors = listOf(
                                    atmosphereColor.copy(alpha = 0.22f),
                                    Color.Transparent
                                )
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .then(if (isMobile) Modifier.wrapContentHeight() else Modifier.fillMaxSize())
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = if (isMobile) Arrangement.spacedBy(4.dp) else Arrangement.SpaceBetween
                    ) {
                        // ТАКТИЧЕСКИЙ БАББЛ РОБОТА В ПЕРЕГОВОРНОЙ
                        Surface(
                            onClick = handleArenaRobotTap,
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFF0F172A).copy(alpha = 0.90f),
                            border = BorderStroke(
                                1.dp,
                                Brush.linearGradient(
                                    listOf(Color(0xFF00F0FF).copy(alpha = 0.60f), atmosphereColor.copy(alpha = 0.60f))
                                )
                            ),
                            shadowElevation = 4.dp,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 4.dp, vertical = 2.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(7.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF00FFCC))
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "🤖 Б.А.Р.С. • НАЖМИТЕ ДЛЯ СОВЕТА",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF00F0FF),
                                        fontFamily = FontFamily.Monospace,
                                        letterSpacing = 0.6.sp
                                    )
                                    Text(
                                        text = arenaRobotPhrases[arenaPhraseIndex % arenaRobotPhrases.size],
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = Color.White,
                                        lineHeight = 15.sp,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }

                        // 3D Робот Майк
                        Box(
                            modifier = if (isMobile) {
                                Modifier
                                    .fillMaxWidth()
                                    .height(avatarHeight)
                            } else {
                                Modifier
                                    .fillMaxWidth()
                                    .weight(1f)
                            },
                            contentAlignment = Alignment.Center
                        ) {
                            BarsRobotView(
                                animation = currentArenaAnim,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clickable(
                                        interactionSource = remember { MutableInteractionSource() },
                                        indication = null
                                    ) { handleArenaRobotTap() },
                                height = avatarHeight,
                                onClick = handleArenaRobotTap
                            )
                        }
                    }
                }
            }
        }

        if (!isMobile) {
            Spacer(modifier = Modifier.height(10.dp))
        }

        // 2. Чат сообщений (Стеклянная подложка Cyber-Glass)
        Surface(
            modifier = if (isMobile) {
                Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
            } else {
                Modifier
                    .weight(0.42f)
                    .fillMaxWidth()
            },
            shape = RoundedCornerShape(18.dp),
            color = Color(0xFF101322).copy(alpha = 0.75f),
            border = BorderStroke(
                1.dp,
                Brush.linearGradient(
                    listOf(Color(0xFF00F0FF).copy(alpha = 0.30f), Color(0xFF7B2CBF).copy(alpha = 0.40f))
                )
            )
        ) {
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(messages) { message ->
                    val isOpponent = message.actor == MessageActor.OPPONENT
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = if (isOpponent) Alignment.CenterStart else Alignment.CenterEnd
                    ) {
                        Box(
                            modifier = Modifier
                                .widthIn(max = if (isMobile) 320.dp else 540.dp)
                                .clip(
                                    if (isOpponent) RoundedCornerShape(topStart = 4.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 16.dp)
                                    else RoundedCornerShape(topStart = 16.dp, topEnd = 4.dp, bottomStart = 16.dp, bottomEnd = 16.dp)
                                )
                                .background(
                                    if (isOpponent) Color(0xFF161926)
                                    else Color(0xFF32145A)
                                )
                                .border(
                                    1.dp,
                                    Color.White.copy(alpha = 0.05f),
                                    if (isOpponent) RoundedCornerShape(topStart = 4.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 16.dp)
                                    else RoundedCornerShape(topStart = 16.dp, topEnd = 4.dp, bottomStart = 16.dp, bottomEnd = 16.dp)
                                )
                                .padding(12.dp)
                        ) {
                            Column(
                                modifier = Modifier.wrapContentSize(),
                                horizontalAlignment = if (isOpponent) Alignment.Start else Alignment.End,
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    if (isOpponent) {
                                        Text(
                                            text = config.opponentName.ifBlank { "Валерий Строганов" },
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = Color(0xFF00FFCC),
                                            fontFamily = FontFamily.Monospace,
                                            textAlign = TextAlign.Start
                                        )
                                        if (message.emotionEmoji.isNotBlank()) {
                                            Text(
                                                text = "${message.emotionEmoji} ${message.emotionLabel}",
                                                fontSize = 11.sp,
                                                color = Color(0xFF94A3B8)
                                            )
                                        }
                                    } else {
                                        Text(
                                            text = "ВЫ (ОЭЗ «АЛАБУГА»)",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = Color(0xFFD8B4FE),
                                            fontFamily = FontFamily.Monospace,
                                            textAlign = TextAlign.End
                                        )
                                    }
                                }

                                Text(
                                    text = message.text,
                                    fontSize = 14.sp,
                                    color = Color(0xFFF1F5F9),
                                    lineHeight = 20.sp,
                                    textAlign = TextAlign.Start
                                )
                            }
                        }
                    }
                }

                if (isGeneratingReply) {
                    item {
                        Box(
                            modifier = Modifier.fillMaxWidth(),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 16.dp))
                                    .background(Color(0xFF161926))
                                    .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(topStart = 4.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 16.dp))
                                    .padding(horizontal = 16.dp, vertical = 10.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(14.dp),
                                        color = Color(0xFF00FFCC),
                                        strokeWidth = 2.dp
                                    )
                                    Text(
                                        text = "${config.opponentName.ifBlank { "Валерий Строганов" }} формулирует ответ...",
                                        fontSize = 12.sp,
                                        color = Color(0xFF94A3B8),
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // 3. Переговорные подсказки и Ввод
        Column(
            modifier = Modifier.fillMaxWidth().padding(top = 4.dp)
        ) {
            val hintsScrollState = rememberScrollState()
            val rawHints = messages.lastOrNull { it.contextHints.isNotEmpty() }?.contextHints
            val hints = if (!rawHints.isNullOrEmpty()) rawHints else getDefaultHintsForScenario(config)

            if (hints.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 6.dp)
                        .horizontalScroll(hintsScrollState)
                        .pointerInput(Unit) {
                            detectHorizontalDragGestures { change, dragAmount ->
                                change.consume()
                                coroutineScope.launch {
                                    hintsScrollState.scrollBy(-dragAmount)
                                }
                            }
                        },
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    hints.forEach { hint ->
                        val chipInteractionSource = remember { MutableInteractionSource() }
                        val isChipHovered by chipInteractionSource.collectIsHoveredAsState()
                        val isChipPressed by chipInteractionSource.collectIsPressedAsState()

                        val chipOffsetY by animateDpAsState(
                            targetValue = if (isChipHovered) (-2).dp else 0.dp,
                            label = "chipOffsetY"
                        )
                        val chipScale by animateFloatAsState(
                            targetValue = if (isChipPressed) 0.96f else if (isChipHovered) 1.02f else 1f,
                            label = "chipScale"
                        )

                        Box(
                            modifier = Modifier
                                .offset(y = chipOffsetY)
                                .scale(chipScale)
                                .clip(RoundedCornerShape(16.dp))
                                .background(
                                    if (isChipHovered) Brush.linearGradient(
                                        listOf(Color(0xFF1E2B52).copy(alpha = 0.95f), Color(0xFF2C1952).copy(alpha = 0.95f))
                                    ) else Brush.linearGradient(
                                        listOf(Color(0xFF0F172A).copy(alpha = 0.85f), Color(0xFF191233).copy(alpha = 0.80f))
                                    )
                                )
                                .border(
                                    1.dp,
                                    if (isChipHovered) Brush.linearGradient(listOf(Color(0xFF00FFCC), Color(0xFFC084FC)))
                                    else Brush.linearGradient(listOf(Color(0xFF00FFCC).copy(alpha = 0.40f), Color(0xFF7B2CBF).copy(alpha = 0.35f))),
                                    RoundedCornerShape(16.dp)
                                )
                                .clickable(
                                    interactionSource = chipInteractionSource,
                                    indication = null
                                ) {
                                    onHintSelected(hint)
                                }
                                .padding(horizontal = 14.dp, vertical = 9.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Lightbulb,
                                    contentDescription = null,
                                    tint = if (isChipHovered) Color(0xFF00FFCC) else Color(0xFF00FFCC).copy(alpha = 0.75f),
                                    modifier = Modifier.size(14.dp)
                                )
                                Text(
                                    text = hint,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = if (isChipHovered) Color.White else Color(0xFFE2E8F0),
                                    maxLines = 1
                                )
                            }
                        }
                    }
                }
            }

            // ИИ-Цензор: предупреждение о базарных цифрах
            if (isBazaarInput) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFF451A03).copy(alpha = 0.90f),
                    border = BorderStroke(1.dp, Color(0xFFF59E0B).copy(alpha = 0.70f)),
                    modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "⚠️ B2B-переговоры — это не базар. Обоснуйте цифру встречной уступкой или условием.",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFFFDE68A),
                            lineHeight = 15.sp
                        )
                    }
                }
            }

            if (hasPlaceholders) {
                Text(
                    text = "Заполните параметры [в скобках] перед отправкой!",
                    fontSize = 11.sp,
                    color = Color(0xFFFBBF24),
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
            }

            // 4. Окно ввода Cyber-Glass
            Surface(
                shape = RoundedCornerShape(18.dp),
                color = Color(0xFF0D101B).copy(alpha = 0.85f),
                border = BorderStroke(
                    1.dp,
                    if (canSend) Brush.linearGradient(listOf(Color(0xFF00F0FF).copy(alpha = 0.7f), Color(0xFF7B2CBF).copy(alpha = 0.5f)))
                    else Brush.linearGradient(listOf(Color(0xFF282F48).copy(alpha = 0.6f), Color(0xFF1E2235).copy(alpha = 0.4f)))
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    TextField(
                        value = inputText,
                        onValueChange = onInputTextChanged,
                        placeholder = { Text("Введите встречный аргумент или выберите подсказку...", fontSize = 14.sp, color = Color(0xFF64748B)) },
                        modifier = Modifier.weight(1f),
                        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 15.sp, color = Color.White, lineHeight = 20.sp),
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Color.Transparent,
                            unfocusedContainerColor = Color.Transparent,
                            disabledContainerColor = Color.Transparent,
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent,
                            disabledIndicatorColor = Color.Transparent,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        ),
                        maxLines = 3
                    )

                    IconButton(
                        onClick = onSend,
                        interactionSource = sendInteractionSource,
                        enabled = canSend,
                        modifier = Modifier
                            .size(42.dp)
                            .scale(sendScale)
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (canSend) Color(0xFF00F0FF) else Color(0xFF1E2640))
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Send,
                            contentDescription = "Отправить",
                            tint = if (canSend) Color(0xFF07080D) else Color.Gray,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ArenaTacticalContent(
    modifier: Modifier,
    latestBarsAdvice: String,
    metrics: NegotiationMetrics,
    atmosphereColor: Color,
    zopaState: ZopaState,
    config: ScenarioConfig,
    isMobile: Boolean = false
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // 1. Карточка «Б.А.Р.С. СОВЕТ» (с тонкой неоновой градиентной рамкой)
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            color = Color(0xFF131520),
            border = BorderStroke(
                1.dp,
                Brush.linearGradient(
                    listOf(Color(0xFF00FFCC).copy(alpha = 0.40f), Color(0xFF7B2CBF).copy(alpha = 0.45f))
                )
            )
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF00FFCC))
                    )
                    Text(
                        text = "🤖 Б.А.Р.С. • ТАКТИЧЕСКИЙ СОВЕТ",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF00FFCC),
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 0.8.sp
                    )
                }
                Text(
                    text = latestBarsAdvice,
                    fontSize = 13.sp,
                    color = Color(0xFFF1F5F9),
                    lineHeight = 19.sp
                )
            }
        }

        // 2. Метрики переговоров и Шкала напряженности (с тонкой градиентной рамкой)
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            color = Color(0xFF131520),
            border = BorderStroke(
                1.dp,
                Brush.linearGradient(
                    listOf(Color(0xFF7B2CBF).copy(alpha = 0.35f), Color(0xFF00F0FF).copy(alpha = 0.25f))
                )
            )
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("ДОВЕРИЕ", fontSize = 10.sp, color = Color(0xFF94A3B8), fontFamily = FontFamily.Monospace)
                        Text("${metrics.trust}%", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF00F0FF), fontFamily = FontFamily.Monospace)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("НАПРЯЖЕНИЕ", fontSize = 10.sp, color = Color(0xFF94A3B8), fontFamily = FontFamily.Monospace)
                        Text("${metrics.tension}%", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = atmosphereColor, fontFamily = FontFamily.Monospace)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("ГОТОВНОСТЬ", fontSize = 10.sp, color = Color(0xFF94A3B8), fontFamily = FontFamily.Monospace)
                        Text("${metrics.dealReadiness}%", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981), fontFamily = FontFamily.Monospace)
                    }
                }

                Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "УРОВЕНЬ НАПРЯЖЕННОСТИ",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF94A3B8),
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 0.6.sp
                        )
                        Text(
                            text = "${metrics.tension}%",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = atmosphereColor,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(50))
                            .background(Color(0xFF161928))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxHeight()
                                .fillMaxWidth((metrics.tension / 100f).coerceIn(0.05f, 1f))
                                .clip(RoundedCornerShape(50))
                                .background(
                                    Brush.horizontalGradient(
                                        listOf(Color(0xFF7B2CBF), Color(0xFFE11D48), Color(0xFFFF1E56))
                                    )
                                )
                        )
                    }
                }
            }
        }

        // 3. Интерактивная карта ZOPA / BATNA
        ZopaMapCard(zopa = zopaState)

        // 4. Повестка переговоров (Agenda topics с тонкой градиентной рамкой)
        Surface(
            modifier = if (isMobile) Modifier.fillMaxWidth() else Modifier.fillMaxWidth().weight(1f),
            shape = RoundedCornerShape(18.dp),
            color = Color(0xFF131520),
            border = BorderStroke(
                1.dp,
                Brush.linearGradient(
                    listOf(Color(0xFF7B2CBF).copy(alpha = 0.35f), Color(0xFF00F0FF).copy(alpha = 0.25f))
                )
            )
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "ПОВЕСТКА ПЕРЕГОВОРОВ (AGENDA)",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF94A3B8),
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.sp
                )

                config.agendaTopics.forEach { topic ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF141829).copy(alpha = 0.65f), RoundedCornerShape(12.dp))
                            .border(1.dp, Color.White.copy(alpha = 0.04f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f).padding(end = 4.dp)) {
                            Text(topic.title, fontSize = 13.sp, color = Color.White, fontWeight = FontWeight.SemiBold)
                            Text(topic.detail, fontSize = 11.sp, color = Color(0xFF94A3B8), maxLines = 1)
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(50))
                                .background(
                                    when (topic.status) {
                                        "agreed" -> Color(0xFF10B981).copy(alpha = 0.18f)
                                        "disputed" -> Color(0xFFFF3366).copy(alpha = 0.18f)
                                        else -> Color(0xFFFBBF24).copy(alpha = 0.18f)
                                    }
                                )
                                .border(
                                    1.dp,
                                    when (topic.status) {
                                        "agreed" -> Color(0xFF10B981).copy(alpha = 0.45f)
                                        "disputed" -> Color(0xFFFF3366).copy(alpha = 0.45f)
                                        else -> Color(0xFFFBBF24).copy(alpha = 0.45f)
                                    },
                                    RoundedCornerShape(50)
                                )
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = when (topic.status) {
                                    "agreed" -> "СОГЛАСОВАНО"
                                    "disputed" -> "СПОРНО"
                                    else -> "ОБСУЖДАЕТСЯ"
                                },
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = when (topic.status) {
                                    "agreed" -> Color(0xFF10B981)
                                    "disputed" -> Color(0xFFFF3366)
                                    else -> Color(0xFFFBBF24)
                                },
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }
        }
    }
}
