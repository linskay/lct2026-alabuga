package ru.alabuga.bars.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import ru.alabuga.bars.model.ChatMessage
import ru.alabuga.bars.model.MessageSender
import ru.alabuga.bars.model.NegotiationState
import ru.alabuga.bars.network.KtorGeminiService

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArenaScreen(
    geminiApiKey: String = "",
    onOpenInfo: () -> Unit = {}
) {
    val coroutineScope = rememberCoroutineScope()
    val geminiService = remember { KtorGeminiService(geminiApiKey) }

    var state by remember {
        mutableStateOf(
            NegotiationState(
                messages = listOf(
                    ChatMessage(
                        id = "m1",
                        sender = MessageSender.OPPONENT,
                        text = "Здравствуйте. Наш совет директоров готов зайти в ОЭЗ «Алабуга», но только на наших условиях: аренда 400 ₽/м² и 6 месяцев каникул. Иначе мы уходим на другую площадку.",
                        timestamp = "10:00",
                        barsFeedback = "Оппонент сразу начинает с жесткого прессинга и блефа. Не соглашайтесь на 400 ₽/м² — это нарушит BATNA.",
                        barsAnimation = "idle"
                    )
                )
            )
        )
    }

    var inputText by remember { mutableStateOf("") }
    var inputError by remember { mutableStateOf<String?>(null) }
    val listState = rememberLazyListState()

    // Плавная интерполяция цвета фона оппонента в зависимости от стресса (0-100)
    // 0-30%: #7B2CBF (Фиолетовый Алабуга) -> 70-100%: #EF4444 (Тревожный Красный)
    val tensionFraction = (state.metrics.tension.coerceIn(0, 100) / 100f)
    val basePurple = Color(0xFF7B2CBF)
    val dangerRed = Color(0xFFEF4444)
    val targetGlowColor = lerp(basePurple, dangerRed, tensionFraction)

    val animatedGlowColor by animateColorAsState(
        targetValue = targetGlowColor,
        animationSpec = tween(durationMillis = 600)
    )

    fun handleSend(textToSend: String) {
        val trimmed = textToSend.trim()
        if (trimmed.isEmpty()) return

        // Анти-кликер валидация: блокировка отправки незаполненных шаблонов
        if (trimmed.contains("[") && trimmed.contains("]")) {
            inputError = "Заполните параметры в квадратных скобках перед отправкой!"
            return
        }
        inputError = null

        val userMsg = ChatMessage(
            id = "user_${state.messages.size + 1}",
            sender = MessageSender.USER,
            text = trimmed,
            timestamp = "10:05"
        )

        state = state.copy(
            messages = state.messages + userMsg,
            isLoading = true
        )
        inputText = ""

        coroutineScope.launch {
            listState.animateScrollToItem(state.messages.size - 1)
            val reply = geminiService.sendMessage(
                history = state.messages,
                userMessage = trimmed,
                config = state.config,
                currentMetrics = state.metrics
            )

            val newTrust = (state.metrics.trust + reply.metricsDelta.trust).coerceIn(0, 100)
            val newTension = (state.metrics.tension + reply.metricsDelta.tension).coerceIn(0, 100)
            val newReadiness = (state.metrics.dealReadiness + reply.metricsDelta.dealReadiness).coerceIn(0, 100)

            val oppMsg = ChatMessage(
                id = "opp_${state.messages.size + 1}",
                sender = MessageSender.OPPONENT,
                text = reply.opponentReply,
                timestamp = "10:06",
                barsFeedback = reply.barsFeedback,
                barsAnimation = reply.barsAnimation,
                isBatnaViolation = reply.isBatnaViolated
            )

            state = state.copy(
                messages = state.messages + oppMsg,
                metrics = state.metrics.copy(
                    trust = newTrust,
                    tension = newTension,
                    dealReadiness = newReadiness
                ),
                dynamicHints = if (reply.dynamicHints.isNotEmpty()) reply.dynamicHints else state.dynamicHints,
                agendaStatus = if (reply.agendaStatus.isNotEmpty()) reply.agendaStatus else state.agendaStatus,
                barsFeedback = reply.barsFeedback,
                barsAnimation = reply.barsAnimation,
                isDealClosed = reply.isDealClosed,
                isDealFailed = reply.isDealFailed,
                isLoading = false
            )
            listState.animateScrollToItem(state.messages.size - 1)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Color(0xFF7B2CBF).copy(alpha = 0.25f),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF9D4EDD))
                        ) {
                            Text(
                                text = "ОЭЗ АЛАБУГА",
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFC084FC)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Б.А.Р.С. // АРЕНА ПЕРЕГОВОРОВ",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = "${state.config.opponentName} • ${state.config.opponentRole}",
                                fontSize = 11.sp,
                                color = Color(0xFF94A3B8)
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = onOpenInfo) {
                        Icon(Icons.Default.Info, contentDescription = "Инфо", tint = Color(0xFF38BDF8))
                    }
                    IconButton(onClick = {
                        state = NegotiationState()
                    }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Сброс", tint = Color.LightGray)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF07080E))
            )
        },
        containerColor = Color(0xFF07080E)
    ) { paddingValues ->
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // ЛЕВАЯ КОЛОНКА (70%): Видео 3D-робота + Чат + Чипсы подсказок
            Column(
                modifier = Modifier
                    .weight(0.68f)
                    .fillMaxHeight()
            ) {
                // 1. Окно видеосвязи с 3D-моделью оппонента и динамическим фоном
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(300.dp)
                        .clip(RoundedCornerShape(24.dp))
                        .background(Color(0xFF090A10))
                        .border(1.dp, animatedGlowColor.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
                ) {
                    // Атмосферный световой ореол за спиной робота
                    Box(
                        modifier = Modifier
                            .size(240.dp)
                            .align(Alignment.Center)
                            .background(
                                Brush.radialGradient(
                                    colors = listOf(
                                        animatedGlowColor.copy(alpha = 0.35f),
                                        Color.Transparent
                                    )
                                )
                            )
                            .blur(40.dp)
                    )

                    // 3D-аватар оппонента (expect/actual)
                    OpponentAvatarView(
                        modifier = Modifier.fillMaxSize(),
                        animationState = state.barsAnimation,
                        tension = state.metrics.tension.toFloat()
                    )

                    // Индикатор тревоги / статуса переговоров в правом верхнем углу
                    Surface(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(12.dp),
                        shape = RoundedCornerShape(16.dp),
                        color = Color(0xCC05070D),
                        border = androidx.compose.foundation.BorderStroke(1.dp, animatedGlowColor.copy(alpha = 0.5f))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(animatedGlowColor)
                            )
                            Text(
                                text = when {
                                    state.metrics.tension < 40 -> "СТАТУС: ШТИЛЬ (${state.metrics.tension}%)"
                                    state.metrics.tension < 75 -> "ДАВЛЕНИЕ РАСТЕТ (${state.metrics.tension}%)"
                                    else -> "КРИТИЧЕСКИЙ СТРЕСС (${state.metrics.tension}%)"
                                },
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = animatedGlowColor
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // 2. Лента сообщений диалога
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color(0xFF0B0D16))
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(state.messages) { msg ->
                        val isUser = msg.sender == MessageSender.USER
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth(0.85f)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(
                                        if (isUser) Color(0xFF1E293B) else Color(0xFF131726)
                                    )
                                    .border(
                                        1.dp,
                                        if (isUser) Color(0xFF38BDF8).copy(alpha = 0.3f) else Color(0xFF7B2CBF).copy(alpha = 0.3f),
                                        RoundedCornerShape(16.dp)
                                    )
                                    .padding(12.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = if (isUser) "ВЫ (ОЭЗ «АЛАБУГА»)" else state.config.opponentName,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isUser) Color(0xFF38BDF8) else Color(0xFFC084FC)
                                    )
                                    Text(
                                        text = msg.timestamp,
                                        fontSize = 10.sp,
                                        color = Color.Gray
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = msg.text,
                                    fontSize = 13.sp,
                                    color = Color.White,
                                    lineHeight = 18.sp
                                )

                                if (msg.barsFeedback != null) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = Color(0xFF0F172A),
                                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF38BDF8).copy(alpha = 0.3f))
                                    ) {
                                        Text(
                                            text = "🤖 Б.А.Р.С.: ${msg.barsFeedback}",
                                            modifier = Modifier.padding(8.dp),
                                            fontSize = 11.sp,
                                            color = Color(0xFF7DD3FC)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // 3. Динамические чипсы-заготовки подсказок (LazyRow)
                LazyRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(state.dynamicHints) { hint ->
                        Surface(
                            modifier = Modifier.clickable {
                                inputText = hint
                            },
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFF131726),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.4f))
                        ) {
                            Text(
                                text = hint,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                fontSize = 11.sp,
                                color = Color(0xFFE2E8F0),
                                maxLines = 1
                            )
                        }
                    }
                }

                if (inputError != null) {
                    Text(
                        text = inputError!!,
                        color = Color(0xFFEF4444),
                        fontSize = 11.sp,
                        modifier = Modifier.padding(top = 4.dp, start = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // 4. Поле ввода сообщения
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = inputText,
                        onValueChange = {
                            inputText = it
                            inputError = null
                        },
                        placeholder = { Text("Введите контраргумент или уточнение...", fontSize = 13.sp, color = Color.Gray) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Color(0xFF0F121E),
                            unfocusedContainerColor = Color(0xFF0F121E),
                            focusedBorderColor = Color(0xFF38BDF8),
                            unfocusedBorderColor = Color(0xFF1E293B),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        ),
                        singleLine = true
                    )

                    Button(
                        onClick = { handleSend(inputText) },
                        enabled = !state.isLoading && inputText.isNotBlank(),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8))
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Отправить", tint = Color.Black)
                    }
                }
            }

            // ПРАВАЯ КОЛОНКА (30%): Тактический центр мониторинга телеметрии и BATNA
            Column(
                modifier = Modifier
                    .weight(0.32f)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color(0xFF0B0D16))
                    .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(20.dp))
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(
                    text = "ТАКТИЧЕСКИЙ ЦЕНТР",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF38BDF8),
                    fontFamily = FontFamily.Monospace
                )

                // Телеметрия: Доверие, Напряжение, Готовность к сделке
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    MetricBar(label = "Доверие оппонента", value = state.metrics.trust, color = Color(0xFF38BDF8))
                    MetricBar(label = "Уровень напряжения", value = state.metrics.tension, color = animatedGlowColor)
                    MetricBar(label = "Готовность к сделке", value = state.metrics.dealReadiness, color = Color(0xFF34D399))
                }

                Divider(color = Color(0xFF1E293B))

                // Красные линии BATNA
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(Icons.Default.Security, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(16.dp))
                    Text(text = "ЗАЩИТА BATNA ОЭЗ", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFF59E0B))
                }

                state.config.batna.redLines.forEach { rule ->
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Color(0xFF131726),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B))
                    ) {
                        Text(
                            text = "• $rule",
                            modifier = Modifier.padding(8.dp),
                            fontSize = 11.sp,
                            color = Color(0xFFCBD5E1),
                            lineHeight = 15.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.weight(1f))

                // Блок рекомендаций Б.А.Р.С.
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFF131726),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF38BDF8).copy(alpha = 0.3f))
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(
                            text = "АНАЛИТИК Б.А.Р.С.",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF38BDF8)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = state.barsFeedback,
                            fontSize = 11.sp,
                            color = Color(0xFF94A3B8),
                            lineHeight = 15.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MetricBar(label: String, value: Int, color: Color) {
    Column {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(text = label, fontSize = 11.sp, color = Color(0xFF94A3B8))
            Text(text = "$value%", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = color)
        }
        Spacer(modifier = Modifier.height(4.dp))
        LinearProgressIndicator(
            progress = { value.coerceIn(0, 100) / 100f },
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(CircleShape),
            color = color,
            trackColor = Color(0xFF1E293B),
        )
    }
}
