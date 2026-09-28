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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
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
import kotlin.random.Random

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArenaScreen(
    config: ScenarioConfig,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    var metrics by remember { mutableStateOf(NegotiationMetrics(trust = 55, tension = 35, dealReadiness = 40)) }
    var inputText by remember { mutableStateOf("") }
    var lastInsertedTemplate by remember { mutableStateOf("") }
    var currentStep by remember { mutableStateOf(1) }

    var showTimeTravel by remember { mutableStateOf(false) }
    var showDebriefing by remember { mutableStateOf(false) }

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

    // Validation
    val trimmed = inputText.trim()
    val hasPlaceholders = remember(trimmed) {
        trimmed.contains("[") || trimmed.contains("]") || trimmed.contains("...")
    }
    val isExactTemplate = remember(trimmed, lastInsertedTemplate) {
        lastInsertedTemplate.isNotEmpty() && trimmed == lastInsertedTemplate.trim()
    }
    val canSend = trimmed.isNotEmpty() && !hasPlaceholders && !isExactTemplate && !isGeneratingReply

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
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0A0C16).copy(alpha = 0.85f))
            )
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

            // Центрированный рабочий контейнер с ограничением ширины max = 1180.dp
            Row(
                modifier = modifier
                    .fillMaxHeight()
                    .widthIn(max = 1180.dp)
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // ЛЕВАЯ ЧАСТЬ (65%): Окно 3D-аватара + Чат сообщений + Ввод
                Column(
                    modifier = Modifier
                        .weight(0.65f)
                        .fillMaxHeight(),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // 1. Окно прямого эфира оппонента (Cyber-Glass: объемный свет + парящий стеклянный HUD)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(0.38f)
                            .clip(RoundedCornerShape(22.dp))
                            .background(Color(0xFF0B0D18).copy(alpha = 0.50f))
                            .border(
                                BorderStroke(
                                    1.dp,
                                    Brush.linearGradient(
                                        listOf(
                                            atmosphereColor.copy(alpha = 0.35f),
                                            Color(0xFF00FFCC).copy(alpha = 0.15f)
                                        )
                                    )
                                ),
                                RoundedCornerShape(22.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        // Верхний отблеск стекла
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(1.dp)
                                .align(Alignment.TopCenter)
                                .background(Color.White.copy(alpha = 0.08f))
                        )

                        // Объемный свет внутри прямоугольника (от фиолетового до алого)
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.radialGradient(
                                        colors = listOf(
                                            atmosphereColor.copy(alpha = (0.24f + (metrics.tension / 100f) * 0.32f)),
                                            Color(0xFF160E2A).copy(alpha = 0.20f),
                                            Color.Transparent
                                        ),
                                        radius = 600f
                                    )
                                )
                        )

                        // 3D Робот Б.А.Р.С.
                        if (!showDebriefing && !showTimeTravel) {
                            BarsRobotView(
                                animation = robotAnimation,
                                modifier = Modifier.fillMaxSize(),
                                height = 240.dp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // 2. Чат сообщений (Стеклянная подложка Cyber-Glass)
                    Surface(
                        modifier = Modifier
                            .weight(0.42f)
                            .fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        color = Color(0xFF0D101B).copy(alpha = 0.55f),
                        border = BorderStroke(
                            1.dp,
                            Brush.linearGradient(
                                listOf(
                                    Color(0xFF7B2CBF).copy(alpha = 0.30f),
                                    Color(0xFF00FFCC).copy(alpha = 0.15f)
                                )
                            )
                        )
                    ) {
                        LazyColumn(
                            state = listState,
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            items(messages) { message ->
                                val isOpponent = message.actor == MessageActor.OPPONENT
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = if (isOpponent) Arrangement.Start else Arrangement.End
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .widthIn(max = 540.dp)
                                            .clip(
                                                if (isOpponent) RoundedCornerShape(topStart = 4.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 16.dp)
                                                else RoundedCornerShape(topStart = 16.dp, topEnd = 4.dp, bottomStart = 16.dp, bottomEnd = 16.dp)
                                            )
                                            .background(
                                                if (isOpponent) Brush.linearGradient(listOf(Color(0xFF131520).copy(alpha = 0.85f), Color(0xFF101322).copy(alpha = 0.85f)))
                                                else Brush.linearGradient(listOf(Color(0xFF32145A).copy(alpha = 0.85f), Color(0xFF1E0E38).copy(alpha = 0.85f)))
                                            )
                                            .border(
                                                1.dp,
                                                if (isOpponent) Color(0xFF2E3856) else Color(0xFF9D4EDD).copy(alpha = 0.45f),
                                                if (isOpponent) RoundedCornerShape(topStart = 4.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 16.dp)
                                                else RoundedCornerShape(topStart = 16.dp, topEnd = 4.dp, bottomStart = 16.dp, bottomEnd = 16.dp)
                                            )
                                            .padding(14.dp)
                                    ) {
                                        Column(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalAlignment = if (isOpponent) Alignment.Start else Alignment.End,
                                            verticalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = if (isOpponent) Arrangement.SpaceBetween else Arrangement.End,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                if (isOpponent) {
                                                    Text(
                                                        text = config.opponentName,
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = Color(0xFF00FFCC),
                                                        fontFamily = FontFamily.Monospace,
                                                        textAlign = TextAlign.Start
                                                    )
                                                    if (message.emotionEmoji != null) {
                                                        Text(
                                                            text = "${message.emotionEmoji} ${message.emotionLabel ?: ""}",
                                                            fontSize = 11.sp,
                                                            color = Color(0xFF94A3B8)
                                                        )
                                                    }
                                                } else {
                                                    Text(
                                                        text = "ВЫ (ОЭЗ «АЛАБУГА»)",
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = Color(0xFFD8B4FE),
                                                        fontFamily = FontFamily.Monospace,
                                                        textAlign = TextAlign.End
                                                    )
                                                }
                                            }

                                            Text(
                                                text = message.text,
                                                fontSize = 15.sp,
                                                color = Color(0xFFF1F5F9),
                                                lineHeight = 22.sp,
                                                textAlign = if (isOpponent) TextAlign.Start else TextAlign.End
                                            )
                                        }
                                    }
                                }
                            }

                            if (isGeneratingReply) {
                                item {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.Start
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 16.dp))
                                                .background(Color(0xFF131520).copy(alpha = 0.85f))
                                                .border(1.dp, Color(0xFF2E3856), RoundedCornerShape(topStart = 4.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 16.dp))
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
                                                    text = "${config.opponentName} формулирует ответ...",
                                                    fontSize = 13.sp,
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

                    // 3. Переговорные чипсы-подсказки (Парящие капсулы Cyber-Glass с микро-анимацией наведения)
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                    ) {
                        val hintsScrollState = rememberScrollState()

                        val rawHints = messages.lastOrNull { it.contextHints.isNotEmpty() }?.contextHints
                        val hints = if (!rawHints.isNullOrEmpty()) rawHints else listOf(
                            "Мы фиксируем ставку 480 ₽/м² при условии предоплаты за 1 квартал.",
                            "Налоговые преференции ОЭЗ (0% на имущество) нивелируют разницу в ставке.",
                            "Срок ввода 110 кВ фиксируется в соглашении с финансовыми гарантиями ОЭЗ.",
                            "Предоставим 4 месяца каникул взамен на обязательства по CAPEX 1.2 млрд ₽.",
                            "Альтернативные площадки региона испытывают острый дефицит мощностей 110 кВ."
                        )

                        if (hints.isNotEmpty()) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 8.dp)
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
                                        targetValue = if (isChipPressed) 0.96f else if (isChipHovered) 1.03f else 1f,
                                        label = "chipScale"
                                    )

                                    Box(
                                        modifier = Modifier
                                            .offset(y = chipOffsetY)
                                            .scale(chipScale)
                                            .clip(RoundedCornerShape(18.dp))
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
                                                RoundedCornerShape(18.dp)
                                            )
                                            .clickable(
                                                interactionSource = chipInteractionSource,
                                                indication = null
                                            ) {
                                                inputText = hint
                                                lastInsertedTemplate = hint
                                            }
                                            .padding(horizontal = 16.dp, vertical = 11.dp)
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Lightbulb,
                                                contentDescription = null,
                                                tint = if (isChipHovered) Color(0xFF00FFCC) else Color(0xFF00FFCC).copy(alpha = 0.75f),
                                                modifier = Modifier.size(15.dp)
                                            )
                                            Text(
                                                text = hint,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Medium,
                                                color = if (isChipHovered) Color.White else Color(0xFFE2E8F0),
                                                maxLines = 1
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        if (hasPlaceholders || isExactTemplate) {
                            Text(
                                text = "Заполните параметры [в скобках] перед отправкой!",
                                fontSize = 11.sp,
                                color = Color(0xFFFBBF24),
                                fontFamily = FontFamily.Monospace,
                                modifier = Modifier.padding(bottom = 4.dp)
                            )
                        }

                        // 4. Крупное окно ввода (стиль Google AI Studio, Cyber-Glass)
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = Color(0xFF0D101B).copy(alpha = 0.75f),
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
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                TextField(
                                    value = inputText,
                                    onValueChange = { inputText = it },
                                    placeholder = { Text("Введите встречный аргумент или выберите тактическую подсказку...", fontSize = 15.sp, color = Color(0xFF64748B)) },
                                    modifier = Modifier.weight(1f),
                                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 16.sp, color = Color.White, lineHeight = 22.sp),
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
                                    onClick = {
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

                                                    val oppOffer = (zopaState.currentOffer + (replyDto.metricsDelta.dealReadiness * 2).coerceAtLeast(10)).coerceAtMost(520)
                                                    val isOverlapNow = oppOffer >= config.batna.minPricePerSqm
                                                    zopaState = zopaState.copy(
                                                        buyerMax = oppOffer,
                                                        currentOffer = oppOffer,
                                                        isOverlap = isOverlapNow,
                                                        overlapMin = if (isOverlapNow) config.batna.minPricePerSqm else null,
                                                        overlapMax = if (isOverlapNow) oppOffer else null,
                                                        changeReason = if (isOverlapNow) "Коридор сделки открыт! Стороны сошлись в цене от ${config.batna.minPricePerSqm} ₽/м²." else "Оппонент скорректировал позицию до $oppOffer ₽/м² на основе встречных аргументов."
                                                    )

                                                    messages.add(
                                                        Message(
                                                            id = "opp_${currentStep}_${Random.nextInt(100000)}",
                                                            actor = MessageActor.OPPONENT,
                                                            text = replyDto.opponentReply,
                                                            stepIndex = currentStep,
                                                            snapshotMetrics = newMetrics,
                                                            emotionEmoji = emoEmoji,
                                                            emotionLabel = emoLabel,
                                                            contextHints = replyDto.dynamicHints
                                                        )
                                                    )
                                                } catch (_: Throwable) {
                                                    // Fallback handled inside KtorGeminiService
                                                } finally {
                                                    isGeneratingReply = false
                                                }
                                            }
                                        }
                                    },
                                    interactionSource = sendInteractionSource,
                                    enabled = canSend,
                                    modifier = Modifier
                                        .size(46.dp)
                                        .scale(sendScale)
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(if (canSend) Color(0xFF00F0FF) else Color(0xFF1E2640))
                                ) {
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.Send,
                                        contentDescription = "Отправить",
                                        tint = if (canSend) Color(0xFF07080D) else Color.Gray
                                    )
                                }
                            }
                        }
                    }
                }

                // ПРАВАЯ ЧАСТЬ (35%): Тактический центр (Карточка «Б.А.Р.С. СОВЕТ», Метрики, ZOPA, Повестка)
                Column(
                    modifier = Modifier
                        .weight(0.35f)
                        .fillMaxHeight(),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // 1. Карточка «Б.А.Р.С. СОВЕТ» (Визуальный центр сайдбара с фиолетовым неоновым градиентом)
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        color = Color(0xFF140E2A).copy(alpha = 0.65f),
                        border = BorderStroke(
                            1.dp,
                            Brush.linearGradient(
                                listOf(
                                    Color(0xFF9D4EDD).copy(alpha = 0.45f),
                                    Color(0xFF00FFCC).copy(alpha = 0.30f)
                                )
                            )
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            // Верхний отблеск стекла
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(1.dp)
                                    .background(Color.White.copy(alpha = 0.08f))
                            )

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

                    // 2. Метрики переговоров и Шкала напряженности (Cyber-Glass)
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        color = Color(0xFF0D101B).copy(alpha = 0.55f),
                        border = BorderStroke(
                            1.dp,
                            Brush.linearGradient(
                                listOf(
                                    Color(0xFF7B2CBF).copy(alpha = 0.30f),
                                    Color(0xFF00FFCC).copy(alpha = 0.15f)
                                )
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

                            // Неоновый индикатор шкалы напряженности (перенесен из карточки робота)
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

                    // 4. Повестка переговоров (Agenda topics)
                    Surface(
                        modifier = Modifier.fillMaxWidth().weight(1f),
                        shape = RoundedCornerShape(20.dp),
                        color = Color(0xFF0D101B).copy(alpha = 0.55f),
                        border = BorderStroke(
                            1.dp,
                            Brush.linearGradient(
                                listOf(
                                    Color(0xFF7B2CBF).copy(alpha = 0.30f),
                                    Color(0xFF00FFCC).copy(alpha = 0.15f)
                                )
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
                val isRateAgreed = config.agendaTopics.any { it.id == "rate" && it.status == "agreed" } || zopaState.currentOffer >= 460
                val isPowerCapexAgreed = config.agendaTopics.any { it.id == "power_capex" && it.status == "agreed" } || metrics.dealReadiness >= 70
                val rating = if (metrics.dealReadiness >= 75) "S" else if (metrics.dealReadiness >= 50) "A" else "B"

                val achievementsList = listOf(
                    ru.alabuga.arena.model.Achievement(
                        id = "batna_shield",
                        title = "Железная BATNA",
                        subtitle = "Несокрушимая защита ОЭЗ",
                        description = "Удержал базовую ставку не ниже 460 ₽/м² и лимит каникул, не сдав красные линии ОЭЗ «Алабуга».",
                        isUnlocked = isRateAgreed,
                        tier = ru.alabuga.arena.model.AchievementTier.EPIC,
                        conditionText = "Зафиксировать ставку от 460 ₽/м² (BATNA)"
                    ),
                    ru.alabuga.arena.model.Achievement(
                        id = "bluff_buster",
                        title = "Детектор лжи",
                        subtitle = "Калужский блеф-бастер",
                        description = "Хладнокровно парировал блеф оппонента о конкурентах, используя факты о дефиците мощностей 110 кВ.",
                        isUnlocked = currentStep >= 2,
                        tier = ru.alabuga.arena.model.AchievementTier.RARE,
                        conditionText = "Отразить минимум 1 манипуляцию или блеф"
                    ),
                    ru.alabuga.arena.model.Achievement(
                        id = "hidden_pain",
                        title = "Рентген потребностей",
                        subtitle = "Истинная цель раскрыта",
                        description = "Вскрыл скрытую боль инвестора: критическую зависимость от сроков ввода оборудования к 3-му кварталу.",
                        isUnlocked = metrics.trust >= 60,
                        tier = ru.alabuga.arena.model.AchievementTier.RARE,
                        conditionText = "Выявить скрытую боль и истинный дедлайн"
                    ),
                    ru.alabuga.arena.model.Achievement(
                        id = "power_capex",
                        title = "Энергетический барон",
                        subtitle = "8 МВт под 1.2 млрд ₽",
                        description = "Не уступил бесплатные энергомощности, а разменял подключение 8 МВт на встречные инвестиции 1.2 млрд ₽.",
                        isUnlocked = isPowerCapexAgreed,
                        tier = ru.alabuga.arena.model.AchievementTier.EPIC,
                        conditionText = "Связать 8 МВт с обязательством CAPEX 1.2 млрд ₽"
                    ),
                    ru.alabuga.arena.model.Achievement(
                        id = "grandmaster_s",
                        title = "Гроссмейстер Алабуги",
                        subtitle = "Безупречный ранг S",
                        description = "Провел глубокие жесткие переговоры (6+ раундов), раскрыл боли, парировал атаки и закрыл идеальную сделку.",
                        isUnlocked = rating == "S" && currentStep >= 4,
                        tier = ru.alabuga.arena.model.AchievementTier.LEGENDARY,
                        conditionText = "Получить высший ранг S (6+ раундов без спешки)"
                    )
                )

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
