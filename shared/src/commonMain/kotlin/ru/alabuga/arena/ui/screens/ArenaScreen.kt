package ru.alabuga.arena.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.FileDownload
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ru.alabuga.arena.model.*
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
                buyerMin = 300,
                buyerMax = 420,
                sellerMin = config.batna.minPricePerSqm,
                sellerMax = 500,
                isOverlap = false,
                currentOffer = 300,
                status = "narrowing",
                changeReason = "Оппонент удерживает заниженную планку (300 ₽/м²), коридор сделки пока закрыт."
            )
        )
    }

    var latestBarsAdvice by remember { mutableStateOf(config.initialBarsAdvice) }

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

    // Dynamic background color based on tension (0: deep violet #7B2CBF -> 100: scarlet red #EF4444)
    val atmosphereColor by animateColorAsState(
        targetValue = when {
            metrics.tension >= 70 -> Color(0xFFEF4444)
            metrics.tension >= 45 -> Color(0xFFDC2626)
            metrics.tension >= 25 -> Color(0xFF9333EA)
            else -> Color(0xFF7B2CBF)
        },
        animationSpec = tween(600),
        label = "atmosphereColor"
    )

    // Validation
    val trimmed = inputText.trim()
    val hasPlaceholders = remember(trimmed) {
        trimmed.contains("[") || trimmed.contains("]") || trimmed.contains("...")
    }
    val isExactTemplate = remember(trimmed, lastInsertedTemplate) {
        lastInsertedTemplate.isNotEmpty() && trimmed == lastInsertedTemplate.trim()
    }
    val canSend = trimmed.isNotEmpty() && !hasPlaceholders && !isExactTemplate

    val sendInteractionSource = remember { MutableInteractionSource() }
    val isSendPressed by sendInteractionSource.collectIsPressedAsState()
    val sendScale by animateFloatAsState(
        targetValue = if (isSendPressed) 0.92f else 1f,
        label = "sendScale"
    )

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
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = "${config.opponentCompany} • ${config.opponentRole}",
                                fontSize = 12.sp,
                                color = Color(0xFF94A3B8)
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Назад", tint = Color(0xFF00F0FF))
                    }
                },
                actions = {
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
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0A0D18))
            )
        },
        containerColor = Color(0xFF06070B)
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            // Центрированный рабочий контейнер с жестким ограничением ширины max = 1180.dp
            Row(
                modifier = modifier
                    .fillMaxHeight()
                    .widthIn(max = 1180.dp)
                    .padding(horizontal = 24.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // ЛЕВАЯ ЧАСТЬ (65%): Окно оппонента с роботом-аватаром и стресс-индикатором + Чат диалогов + Ввод
                Column(
                    modifier = Modifier
                        .weight(0.65f)
                        .fillMaxHeight(),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // 1. Окно прямого эфира оппонента (с интерактивным роботом Б.А.Р.С. и стресс-баром)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(0.38f)
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color(0xFF0F1016).copy(alpha = 0.85f))
                            .border(BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)), RoundedCornerShape(20.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        // Фон
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.radialGradient(
                                        listOf(
                                            atmosphereColor.copy(alpha = 0.15f),
                                            Color.Transparent
                                        )
                                    )
                                )
                        )

                        // 3D Робот Б.А.Р.С. прямо в кейсе
                        BarsRobotView(
                            animation = if (metrics.tension >= 60) "warn" else if (metrics.dealReadiness >= 65) "win" else "talk",
                            modifier = Modifier.fillMaxSize(),
                            height = 240.dp
                        )

                        // ИНДИКАТОР СТРЕССА: от фиолетового (0%) до ало-красного (100%)
                        Surface(
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 8.dp),
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFF0A0C16).copy(alpha = 0.92f),
                            border = BorderStroke(1.dp, atmosphereColor.copy(alpha = 0.4f))
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 14.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "НАПРЯЖЕНИЕ [ ${metrics.tension}% ]",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = atmosphereColor,
                                    fontFamily = FontFamily.Monospace
                                )
                                Box(
                                    modifier = Modifier
                                        .width(150.dp)
                                        .height(7.dp)
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(Color(0xFF1E2640))
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxHeight()
                                            .fillMaxWidth((metrics.tension / 100f).coerceIn(0.05f, 1f))
                                            .background(
                                                Brush.horizontalGradient(
                                                    listOf(Color(0xFF7B2CBF), Color(0xFFEF4444))
                                                )
                                            )
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // 2. Чат сообщений (крупные контрастные шрифты 16sp / 24sp)
                    LazyColumn(
                        modifier = Modifier
                            .weight(0.42f)
                            .fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(messages) { msg ->
                            val isUser = msg.actor == MessageActor.USER

                            AnimatedVisibility(
                                visible = true,
                                enter = fadeIn(animationSpec = tween(400)) + slideInVertically(initialOffsetY = { 20 })
                            ) {
                                Box(
                                    modifier = Modifier.fillMaxWidth(),
                                    contentAlignment = if (isUser) Alignment.CenterEnd else Alignment.CenterStart
                                ) {
                                    Surface(
                                        shape = RoundedCornerShape(20.dp),
                                        color = if (isUser) Color(0xFF1B233D) else Color(0xFF0F1016).copy(alpha = 0.85f),
                                        border = BorderStroke(1.dp, Color.White.copy(alpha = if (isUser) 0.15f else 0.08f)),
                                        modifier = Modifier.widthIn(max = 620.dp)
                                    ) {
                                        Column(modifier = Modifier.padding(16.dp)) {
                                            Text(
                                                text = if (isUser) "Вы (ОЭЗ «Алабуга»)" else config.opponentName,
                                                fontSize = 17.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (isUser) Color(0xFF00F0FF) else Color(0xFFFF9E80),
                                                fontFamily = FontFamily.Monospace
                                            )
                                            Spacer(modifier = Modifier.height(6.dp))
                                            Text(
                                                text = msg.text,
                                                fontSize = 16.sp,
                                                color = Color(0xFFF1F5F9),
                                                lineHeight = 24.sp
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 3. Подсказки и крупное окно ввода (стиль Google AI Studio)
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                    ) {
                        // Лаконичные чипсы с подсказками
                        val hints = messages.lastOrNull { it.contextHints.isNotEmpty() }?.contextHints ?: emptyList()
                        if (hints.isNotEmpty()) {
                            LazyRow(
                                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(hints) { hint ->
                                    Surface(
                                        shape = RoundedCornerShape(12.dp),
                                        color = Color(0xFF131728),
                                        border = BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.4f)),
                                        modifier = Modifier.clickable {
                                            inputText = hint
                                            lastInsertedTemplate = hint
                                        }
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Lightbulb,
                                                contentDescription = null,
                                                tint = Color(0xFF00FFCC),
                                                modifier = Modifier.size(13.dp)
                                            )
                                            Text(
                                                text = hint,
                                                fontSize = 12.sp,
                                                color = Color(0xFFE2E8F0),
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

                        // Крупное окно ввода (стиль Google AI Studio, высота и шрифт 16sp)
                        Surface(
                            shape = RoundedCornerShape(18.dp),
                            color = Color(0xFF0F121F),
                            border = BorderStroke(1.dp, if (canSend) Color(0xFF00F0FF).copy(alpha = 0.6f) else Color(0xFF282F48)),
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
                                        if (canSend) {
                                            val userText = trimmed
                                            inputText = ""
                                            lastInsertedTemplate = ""

                                            currentStep++
                                            val newTrust = (metrics.trust + 5).coerceAtMost(100)
                                            val newTension = (metrics.tension - 4).coerceAtLeast(10)
                                            val newReadiness = (metrics.dealReadiness + 8).coerceAtMost(100)
                                            metrics = NegotiationMetrics(newTrust, newTension, newReadiness)

                                            messages.add(
                                                Message(
                                                    id = "user_${currentStep}_${Random.nextInt(100000)}",
                                                    actor = MessageActor.USER,
                                                    text = userText,
                                                    stepIndex = currentStep,
                                                    snapshotMetrics = metrics
                                                )
                                            )

                                            latestBarsAdvice = "Отличная контратака! Оппонент начинает двигаться по ставке. Удерживай планку и защищай BATNA."

                                            val oppOffer = (zopaState.currentOffer + 30).coerceAtMost(460)
                                            val isOverlapNow = oppOffer >= config.batna.minPricePerSqm
                                            zopaState = zopaState.copy(
                                                buyerMax = oppOffer,
                                                currentOffer = oppOffer,
                                                isOverlap = isOverlapNow,
                                                overlapMin = if (isOverlapNow) config.batna.minPricePerSqm else null,
                                                overlapMax = if (isOverlapNow) oppOffer else null,
                                                changeReason = if (isOverlapNow) "Коридор сделки открыт! Стороны сошлись в цене от 460 ₽/м²." else "Оппонент повысил предложение до $oppOffer ₽/м² взамен на встречные условия."
                                            )

                                            messages.add(
                                                Message(
                                                    id = "opp_${currentStep}_${Random.nextInt(100000)}",
                                                    actor = MessageActor.OPPONENT,
                                                    text = "Ваши доводы имеют смысл. Если вы подтверждаете мощности в срок, мы готовы скорректировать предложение до $oppOffer ₽/м².",
                                                    stepIndex = currentStep,
                                                    snapshotMetrics = metrics,
                                                    emotionEmoji = "🤝",
                                                    emotionLabel = "Сближение позиций",
                                                    contextHints = listOf(
                                                        "Мы фиксируем ставку $oppOffer ₽/м² при встречном условии [гарантия]...",
                                                        "Давайте зафиксируем график поэтапного ввода мощностей..."
                                                    )
                                                )
                                            )
                                        }
                                    },
                                    interactionSource = sendInteractionSource,
                                    enabled = canSend,
                                    modifier = Modifier
                                        .size(46.dp)
                                        .scale(sendScale)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(if (canSend) Color(0xFF00F0FF) else Color(0xFF1E2640))
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Send,
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
                    // 1. Карточка «Б.А.Р.С. СОВЕТ»
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        color = Color(0xFF1B112C).copy(alpha = 0.85f),
                        border = BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.5f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
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
                                    text = "Б.А.Р.С. • ТАКТИЧЕСКИЙ СОВЕТ",
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

                    // 2. Метрики переговоров
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(18.dp),
                        color = Color(0xFF0F1016).copy(alpha = 0.85f),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f))
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("ДОВЕРИЕ", fontSize = 10.sp, color = Color(0xFF94A3B8), fontFamily = FontFamily.Monospace)
                                Text("${metrics.trust}%", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF00F0FF), fontFamily = FontFamily.Monospace)
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("СТРЕСС", fontSize = 10.sp, color = Color(0xFF94A3B8), fontFamily = FontFamily.Monospace)
                                Text("${metrics.tension}%", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = atmosphereColor, fontFamily = FontFamily.Monospace)
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("ГОТОВНОСТЬ", fontSize = 10.sp, color = Color(0xFF94A3B8), fontFamily = FontFamily.Monospace)
                                Text("${metrics.dealReadiness}%", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981), fontFamily = FontFamily.Monospace)
                            }
                        }
                    }

                    // 3. Интерактивная карта ZOPA / BATNA
                    ZopaMapCard(zopa = zopaState)

                    // 4. Повестка переговоров (Agenda topics)
                    Surface(
                        modifier = Modifier.fillMaxWidth().weight(1f),
                        shape = RoundedCornerShape(18.dp),
                        color = Color(0xFF0F1016).copy(alpha = 0.85f),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f))
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
                                        .background(Color(0xFF161A2B), RoundedCornerShape(10.dp))
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
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(
                                                when (topic.status) {
                                                    "agreed" -> Color(0xFF10B981).copy(alpha = 0.2f)
                                                    "disputed" -> Color(0xFFFF3366).copy(alpha = 0.2f)
                                                    else -> Color(0xFFFBBF24).copy(alpha = 0.2f)
                                                }
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
