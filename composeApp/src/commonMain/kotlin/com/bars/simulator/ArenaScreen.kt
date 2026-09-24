package com.bars.simulator

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArenaScreen(
    onExitClick: () -> Unit = {}
) {
    var metrics by remember { mutableStateOf(NegotiationMetrics(trust = 50, tension = 35, dealReadiness = 20)) }
    var currentEmotion by remember { mutableStateOf(RobotEmotion.PRESSURING) }
    var showTelemetryDialog by remember { mutableStateOf(false) }
    var inputText by remember { mutableStateOf("") }
    val coroutineScope = rememberCoroutineScope()
    val listState = rememberLazyListState()

    val messages = remember {
        mutableStateListOf(
            Message(
                id = "sys-1",
                role = SpeakerRole.SYSTEM,
                content = "Встреча открыта. В переговорную вошел Михаил Сергеевич (Б.А.Р.С.). Готовит контраргументы."
            ),
            Message(
                id = "bot-1",
                role = SpeakerRole.ROBOT,
                content = "Добрый день. Сразу к цифрам: 400 ₽ за квадрат и 6 месяцев каникул, плюс модернизация подстанции полностью за вами. Либо мы подписываемся с индустриальным парком «Север». Ваше слово.",
                emotion = RobotEmotion.PRESSURING
            )
        )
    }

    val quickArguments = listOf(
        "Предлагаем 460 ₽/м² и компенсацию электрики взамен",
        "Каникулы 4 месяца при условии встречных инвестиций",
        "У нас готовый ЖД-тупик, что сэкономит вам 18 млн в год"
    )

    fun sendMessage(text: String) {
        if (text.isBlank()) return
        val userMsg = Message(
            id = "user-${messages.size}",
            role = SpeakerRole.USER,
            content = text
        )
        messages.add(userMsg)
        inputText = ""

        // Process counter-reaction
        coroutineScope.launch {
            listState.animateScrollToItem(messages.size - 1)
            
            // Adjust metrics dynamically
            val newTrust = (metrics.trust + (if (text.contains("тупик") || text.contains("инвестиц")) 8 else -3)).coerceIn(0, 100)
            val newTension = (metrics.tension + (if (text.contains("460")) 5 else -4)).coerceIn(0, 100)
            val newReadiness = (metrics.dealReadiness + 6).coerceIn(0, 100)
            metrics = NegotiationMetrics(trust = newTrust, tension = newTension, dealReadiness = newReadiness)

            // Simulate tactical AI tenant reply
            val botReply = when {
                text.contains("тупик", ignoreCase = true) -> {
                    currentEmotion = RobotEmotion.ANALYTICAL
                    "ЖД-ветка — весомый аргумент, мы действительно сократим плечо доставки. Но 460 ₽ всё ещё выше нашей финмодели. Давайте сойдёмся на 440 ₽ и 4 месяцах каникул."
                }
                text.contains("инвестиц", ignoreCase = true) -> {
                    currentEmotion = RobotEmotion.SATISFIED
                    "Встречные инвестиции в инженерные сети обсуждаемы. Если вы гарантируете 3 МВт по первой категории надёжности к ноябрю — мы готовы пересмотреть срок каникул."
                }
                else -> {
                    currentEmotion = RobotEmotion.PRESSURING
                    "Это не решает наш базовый вопрос по окупаемости склада. Индустриальный парк «Север» даёт нам 410 ₽ с готовым бетоном. Чем компенсируете разницу?"
                }
            }

            messages.add(
                Message(
                    id = "bot-${messages.size}",
                    role = SpeakerRole.ROBOT,
                    content = botReply,
                    emotion = currentEmotion
                )
            )
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "Б.А.Р.С. Переговоры",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = OnSurface
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = DarkSurfaceVariant,
                            border = androidx.compose.foundation.BorderStroke(1.dp, OutlineVariant)
                        ) {
                            Text(
                                text = "АРЕНДАТОР-СКЛАД",
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                fontSize = 10.sp,
                                color = CyberCyan
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = onExitClick) {
                        Text("✕", color = Color.White, fontSize = 18.sp)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DarkSurface
                )
            )
        },
        containerColor = DarkBackground
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // =========================================================================
            // 1. PERSISTENT TELEMETRY HUD RIBBON (Fixed at top, never jumps to bottom)
            // =========================================================================
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = DarkSurface,
                border = androidx.compose.foundation.BorderStroke(1.dp, OutlineVariant.copy(alpha = 0.5f))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Trust Meter
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("Доверие: ", fontSize = 11.sp, color = Color(0xFFCAC4D0))
                                Text("${metrics.trust}%", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PrimaryPurple)
                            }
                            LinearProgressIndicator(
                                progress = { metrics.trust / 100f },
                                modifier = Modifier
                                    .width(70.dp)
                                    .height(4.dp)
                                    .clip(CircleShape),
                                color = PrimaryPurple,
                                trackColor = Color(0xFF36343B)
                            )
                        }

                        // Tension Meter
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("Стресс: ", fontSize = 11.sp, color = Color(0xFFCAC4D0))
                                Text("${metrics.tension}%", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                            }
                            LinearProgressIndicator(
                                progress = { metrics.tension / 100f },
                                modifier = Modifier
                                    .width(70.dp)
                                    .height(4.dp)
                                    .clip(CircleShape),
                                color = ErrorRed,
                                trackColor = Color(0xFF36343B)
                            )
                        }

                        // Deal Readiness
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("Готовность: ", fontSize = 11.sp, color = Color(0xFFCAC4D0))
                                Text("${metrics.dealReadiness}%", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = CyberCyan)
                            }
                            LinearProgressIndicator(
                                progress = { metrics.dealReadiness / 100f },
                                modifier = Modifier
                                    .width(70.dp)
                                    .height(4.dp)
                                    .clip(CircleShape),
                                color = CyberCyan,
                                trackColor = Color(0xFF36343B)
                            )
                        }
                    }

                    // Tactical Hub Button
                    Button(
                        onClick = { showTelemetryDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = DarkSurfaceVariant),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("BATNA и Анализ", fontSize = 11.sp, color = PrimaryPurple)
                    }
                }
            }

            // =========================================================================
            // 2. CHAT FEED & TACTICAL DIALOG
            // =========================================================================
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(messages, key = { it.id }) { msg ->
                    when (msg.role) {
                        SpeakerRole.USER -> {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End
                            ) {
                                Card(
                                    shape = RoundedCornerShape(16.dp, 16.dp, 4.dp, 16.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFF004F58)),
                                    modifier = Modifier.widthIn(max = 320.dp)
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text(
                                            text = "Вы (Арендодатель)",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = CyberCyan
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(text = msg.content, fontSize = 14.sp, color = Color.White)
                                    }
                                }
                            }
                        }
                        SpeakerRole.ROBOT -> {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Start
                            ) {
                                Card(
                                    shape = RoundedCornerShape(16.dp, 16.dp, 16.dp, 4.dp),
                                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceVariant),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, OutlineVariant.copy(alpha = 0.5f)),
                                    modifier = Modifier.widthIn(max = 320.dp)
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Text(
                                                text = "Михаил Сергеевич (Б.А.Р.С.)",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = PrimaryPurple
                                            )
                                            Text(
                                                text = "[${msg.emotion?.name ?: "NEUTRAL"}]",
                                                fontSize = 9.sp,
                                                color = if (msg.emotion == RobotEmotion.PRESSURING) ErrorRed else CyberCyan
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(text = msg.content, fontSize = 14.sp, color = OnSurface)
                                    }
                                }
                            }
                        }
                        SpeakerRole.SYSTEM -> {
                            Box(
                                modifier = Modifier.fillMaxWidth(),
                                contentAlignment = Alignment.Center
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = DarkSurfaceVariant.copy(alpha = 0.6f),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, OutlineVariant.copy(alpha = 0.3f))
                                ) {
                                    Text(
                                        text = msg.content,
                                        fontSize = 12.sp,
                                        color = Color(0xFFCAC4D0),
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // =========================================================================
            // 3. QUICK CHIPS FOR FAST ARGUMENTATION
            // =========================================================================
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                for (arg in quickArguments) {
                    SuggestionChip(
                        onClick = { sendMessage(arg) },
                        label = { Text(arg, fontSize = 11.sp, maxLines = 1) },
                        colors = SuggestionChipDefaults.suggestionChipColors(
                            containerColor = DarkSurfaceVariant,
                            labelColor = Color(0xFFCAC4D0)
                        ),
                        border = androidx.compose.foundation.BorderStroke(1.dp, OutlineVariant)
                    )
                }
            }

            // =========================================================================
            // 4. INPUT ROW
            // =========================================================================
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DarkSurface)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    placeholder = { Text("Введите коммерческий аргумент...", fontSize = 13.sp, color = Color(0xFF938F99)) },
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = DarkSurfaceVariant,
                        unfocusedContainerColor = DarkSurfaceVariant,
                        focusedBorderColor = CyberCyan,
                        unfocusedBorderColor = OutlineVariant,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true
                )

                Button(
                    onClick = { sendMessage(inputText) },
                    colors = ButtonDefaults.buttonColors(containerColor = CyberCyan),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    Text("Отправить", color = Color(0xFF00363D), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
        }
    }

    // =========================================================================
    // 5. CENTERED TELEMETRY & BATNA DIALOG
    // =========================================================================
    if (showTelemetryDialog) {
        AlertDialog(
            onDismissRequest = { showTelemetryDialog = false },
            title = {
                Text(
                    text = "Тактическая телеметрия и BATNA",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = OnSurface
                )
            },
            text = {
                Column(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "• Позиция арендатора: жесткая ориентация на альтернативу (парк «Север»).\n" +
                               "• Ваша BATNA: альтернативный логистический оператор на 430 ₽ без ремонта сетей.\n" +
                               "• Точка согласия (ZOPA): 450-460 ₽/м² при встречных каникулах до 4 месяцев.",
                        fontSize = 13.sp,
                        color = Color(0xFFCAC4D0),
                        lineHeight = 18.sp
                    )

                    Divider(color = OutlineVariant)

                    Text(
                        text = "Текущий эмоциональный статус: ${currentEmotion.name}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (currentEmotion == RobotEmotion.PRESSURING) ErrorRed else CyberCyan
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { showTelemetryDialog = false }) {
                    Text("Закрыть", color = CyberCyan)
                }
            },
            containerColor = Color(0xFF211F26),
            shape = RoundedCornerShape(24.dp)
        )
    }
}
