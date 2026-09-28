package ru.alabuga.arena.ui.screens

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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
    var barsAnimation by remember { mutableStateOf("talk") }
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

    val messages = remember {
        mutableStateListOf(
            Message(
                id = "init_bars",
                actor = MessageActor.BARS,
                text = config.initialBarsAdvice,
                stepIndex = 0,
                snapshotMetrics = NegotiationMetrics(trust = 55, tension = 35, dealReadiness = 40)
            ),
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

    // Dynamic background color based on tension (0-100: purple -> neon red)
    val atmosphereColor by animateColorAsState(
        targetValue = when {
            metrics.tension >= 70 -> Color(0xFFEF4444)
            metrics.tension >= 45 -> Color(0xFFC026D3)
            else -> Color(0xFF7B2CBF)
        },
        animationSpec = tween(600),
        label = "atmosphereColor"
    )

    // Validation: checks placeholders and exact unmodified template
    val trimmed = inputText.trim()
    val hasPlaceholders = remember(trimmed) {
        trimmed.contains("[") || trimmed.contains("]") || trimmed.contains("...")
    }
    val isExactTemplate = remember(trimmed, lastInsertedTemplate) {
        lastInsertedTemplate.isNotEmpty() && trimmed == lastInsertedTemplate.trim()
    }
    val canSend = trimmed.isNotEmpty() && !hasPlaceholders && !isExactTemplate

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
                                fontSize = 14.sp,
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
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Назад", tint = Color(0xFF00F0FF))
                    }
                },
                actions = {
                    // Time travel button
                    IconButton(onClick = { showTimeTravel = true }) {
                        Icon(imageVector = Icons.Default.History, contentDescription = "Машина времени", tint = Color(0xFF00F0FF))
                    }
                    // Debriefing button
                    IconButton(onClick = { showDebriefing = true }) {
                        Icon(imageVector = Icons.Default.EmojiEvents, contentDescription = "Дебрифинг", tint = Color(0xFFD8B4FE))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0A0D18))
            )
        },
        containerColor = Color(0xFF07080D)
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // ЛЕВАЯ КОЛОНКА (Интерактивный чат + подсказки + ввод)
                Column(
                    modifier = Modifier.weight(1.3f).fillMaxHeight(),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // Чат сообщений
                    LazyColumn(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(messages) { msg ->
                            val isUser = msg.actor == MessageActor.USER
                            val isBars = msg.actor == MessageActor.BARS

                            Box(
                                modifier = Modifier.fillMaxWidth(),
                                contentAlignment = if (isUser) Alignment.CenterEnd else Alignment.CenterStart
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(16.dp),
                                    color = when {
                                        isUser -> Color(0xFF1E2640)
                                        isBars -> Color(0xFF24153B)
                                        else -> Color(0xFF121524)
                                    },
                                    border = androidx.compose.foundation.BorderStroke(
                                        1.dp,
                                        when {
                                            isUser -> Color(0xFF00F0FF).copy(alpha = 0.3f)
                                            isBars -> Color(0xFF7B2CBF).copy(alpha = 0.6f)
                                            else -> Color.White.copy(alpha = 0.08f)
                                        }
                                    ),
                                    modifier = Modifier.widthIn(max = 520.dp)
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text(
                                            text = when {
                                                isUser -> "Вы (ОЭЗ «Алабуга»)"
                                                isBars -> "Б.А.Р.С. (Тактический наставник)"
                                                else -> config.opponentName
                                            },
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (isUser) Color(0xFF00F0FF) else if (isBars) Color(0xFFD8B4FE) else Color(0xFFFF9E80),
                                            fontFamily = FontFamily.Monospace
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = msg.text,
                                            fontSize = 13.sp,
                                            color = Color(0xFFE2E8F0),
                                            lineHeight = 18.sp
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Подсказки (аргументы)
                    val hints = messages.lastOrNull { it.contextHints.isNotEmpty() }?.contextHints ?: emptyList()
                    if (hints.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(6.dp))
                        LazyRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(hints) { hint ->
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = Color(0xFF13182C),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.5f)),
                                    modifier = Modifier.clickable {
                                        inputText = hint
                                        lastInsertedTemplate = hint
                                    }
                                ) {
                                    Text(
                                        text = hint,
                                        fontSize = 11.sp,
                                        color = Color(0xFFD8B4FE),
                                        maxLines = 1,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                    )
                                }
                            }
                        }
                    }

                    // Предупреждение о необходимости изменить шаблон
                    if (hasPlaceholders || isExactTemplate) {
                        Text(
                            text = "Заполните параметры [в скобках] перед отправкой!",
                            fontSize = 11.sp,
                            color = Color(0xFFFBBF24),
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    }

                    // Поле ввода сообщения
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = inputText,
                            onValueChange = { inputText = it },
                            placeholder = { Text("Введите встречный аргумент...", fontSize = 13.sp) },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(16.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFF00F0FF),
                                unfocusedBorderColor = Color(0xFF1E2640),
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedContainerColor = Color(0xFF0F121F),
                                unfocusedContainerColor = Color(0xFF0F121F)
                            )
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

                                    // Робот наставник
                                    val animations = listOf("talk", "wave", "thinking", "win", "punch", "bluff", "hit")
                                    barsAnimation = animations.random()
                                    messages.add(
                                        Message(
                                            id = "bars_${currentStep}_${Random.nextInt(100000)}",
                                            actor = MessageActor.BARS,
                                            text = "Хороший аргумент. Оппонент начинает прислушиваться к встречным требованиям. Удерживай планку!",
                                            stepIndex = currentStep,
                                            snapshotMetrics = metrics
                                        )
                                    )

                                    // Ответ оппонента
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
                            enabled = canSend,
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(14.dp))
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

                // ПРАВАЯ КОЛОНКА (Телеметрия + 2D Canvas Б.А.Р.С. + Карта ZOPA)
                Column(
                    modifier = Modifier.weight(0.9f).fillMaxHeight(),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Плашка Б.А.Р.С. и атмосферы
                    Surface(
                        modifier = Modifier.fillMaxWidth().height(230.dp),
                        shape = RoundedCornerShape(20.dp),
                        color = Color(0xFF090A10),
                        border = androidx.compose.foundation.BorderStroke(1.5.dp, atmosphereColor.copy(alpha = 0.8f))
                    ) {
                        Column(
                            modifier = Modifier.fillMaxSize().padding(8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            BarsRobotView(
                                animation = barsAnimation,
                                modifier = Modifier.fillMaxWidth(),
                                height = 165.dp
                            )

                            Spacer(modifier = Modifier.height(4.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceEvenly
                            ) {
                                Text("ДОВЕРИЕ: ${metrics.trust}%", fontSize = 11.sp, color = Color(0xFF00F0FF), fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                Text("СТРЕСС: ${metrics.tension}%", fontSize = 11.sp, color = atmosphereColor, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                Text("ГОТОВНОСТЬ: ${metrics.dealReadiness}%", fontSize = 11.sp, color = Color(0xFF10B981), fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            }
                        }
                    }

                    // Интерактивная карта ZOPA
                    ZopaMapCard(zopa = zopaState)

                    // Повестка переговоров (Agenda topics)
                    Surface(
                        modifier = Modifier.fillMaxWidth().weight(1f),
                        shape = RoundedCornerShape(16.dp),
                        color = Color(0xFF101322),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF282F48))
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
                                        .background(Color(0xFF161A2B), RoundedCornerShape(8.dp))
                                        .padding(horizontal = 10.dp, vertical = 6.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(topic.title, fontSize = 12.sp, color = Color.White, fontWeight = FontWeight.SemiBold)
                                        Text(topic.detail, fontSize = 10.sp, color = Color(0xFF94A3B8))
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
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = when (topic.status) {
                                                "agreed" -> "Согласовано"
                                                "disputed" -> "Спор"
                                                else -> "В работе"
                                            },
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = when (topic.status) {
                                                "agreed" -> Color(0xFF34D399)
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
                                Message("init_bars", MessageActor.BARS, config.initialBarsAdvice, stepIndex = 0),
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
