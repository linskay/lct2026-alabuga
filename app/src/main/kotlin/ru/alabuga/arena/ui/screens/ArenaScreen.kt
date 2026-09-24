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

    val messages = remember {
        mutableStateListOf(
            Message(
                id = "init_bars",
                actor = MessageActor.BARS,
                text = "Приветствую на Арене! Я Б.А.Р.С. — твой тактический наставник. Оппонент уже вошел в переговорную. Держи ставку от 460 ₽/м² и парируй его первый выпад!"
            ),
            Message(
                id = "init_opp",
                actor = MessageActor.OPPONENT,
                text = "Добрый день. Мы готовы зайти в «Синергию» на 12 000 м², но требуем скидку до 300 руб/м² и 12 месяцев каникул на пусконаладку. Что скажете?",
                emotionEmoji = "😠",
                emotionLabel = "Давление / Выпад",
                contextHints = listOf(
                    "Валерий, спешка в таких инвестициях рискованна. Мы готовы рассмотреть [ставка], если вы гарантируете...",
                    "Условие ОЭЗ — не менее 1.2 млрд CAPEX в обмен на [объем мощностей]...",
                    "Давайте зафиксируем 460 ₽/м², но предусмотрим льготу [компромисс]..."
                )
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
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Назад",
                            tint = Color(0xFF00F0FF)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0A0D18)
                )
            )
        },
        containerColor = Color(0xFF07080D)
    ) { paddingValues ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // 1. Верхняя плашка с 3D-собеседником и динамическим фоном tension
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(170.dp)
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                shape = RoundedCornerShape(20.dp),
                color = Color(0xFF090A10),
                border = androidx.compose.foundation.BorderStroke(1.5.dp, atmosphereColor.copy(alpha = 0.8f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(atmosphereColor.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Surface(
                            modifier = Modifier.size(64.dp),
                            shape = CircleShape,
                            color = Color(0xFF13182C),
                            border = androidx.compose.foundation.BorderStroke(2.dp, atmosphereColor)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = config.opponentName.take(2).uppercase(),
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "НАПРЯЖЕНИЕ: ${metrics.tension}% • ДОВЕРИЕ: ${metrics.trust}%",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = atmosphereColor,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }

            // 2. Чат переговоров без лишних синих плашек
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
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
                            modifier = Modifier.widthIn(max = 320.dp)
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

            // 3. Динамические подсказки (LazyRow) с запретом отправки неизмененных шаблонов
            val hints = messages.lastOrNull { it.contextHints.isNotEmpty() }?.contextHints ?: emptyList()
            if (hints.isNotEmpty()) {
                LazyRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp),
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
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 2.dp)
                )
            }

            // 4. Поле ввода сообщения
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
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
                            messages.add(
                                Message(
                                    id = "msg_${System.currentTimeMillis()}",
                                    actor = MessageActor.USER,
                                    text = trimmed
                                )
                            )
                            inputText = ""
                            lastInsertedTemplate = ""
                            metrics = metrics.copy(tension = (metrics.tension + 10).coerceAtMost(100))
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
    }
}
