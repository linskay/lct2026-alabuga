package ru.alabuga.arena.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ru.alabuga.arena.ui.components.BarsRobotView
import kotlin.random.Random

@Composable
fun HomeScreen(
    onEnterArena: () -> Unit,
    onOpenAdmin: () -> Unit,
    modifier: Modifier = Modifier
) {
    var robotAnimation by remember { mutableStateOf("idle") }
    var speechText by remember { mutableStateOf<String?>(null) }
    var speechIndex by remember { mutableStateOf(0) }

    val speeches = remember {
        listOf(
            "Приветствую в ОЭЗ «Алабуга»! Готовы проверить стойкость перед жесткими закупщиками?",
            "Помни золотое правило: защищай ставку 460 ₽/м² и выявляй скрытые дедлайны оппонента!",
            "Не поддавайся на блеф с Калугой: у них дефицит высоковольтных мощностей 110 кВ.",
            "Жми «Войти в переговорную» — разберем встречные аргументы в реальном времени!",
            "Наставник Б.А.Р.С. на связи! Твой главный щит на арене — хладнокровие и BATNA."
        )
    }

    val handleRobotClick = {
        val nextIndex = speechIndex + 1
        speechIndex = nextIndex
        speechText = speeches[nextIndex % speeches.size]
        robotAnimation = if (nextIndex % 2 == 1) "talk" else "win"
    }

    // ВАУ-ЭФФЕКТ: Анимация парящих космических частиц
    val infiniteTransition = rememberInfiniteTransition()
    val particlePhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(12000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        )
    )

    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.2f,
        targetValue = 0.55f,
        animationSpec = infiniteRepeatable(
            animation = tween(2400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    val particles = remember {
        List(25) {
            Triple(Random.nextFloat(), Random.nextFloat(), Random.nextFloat() * 0.25f + 0.1f)
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(Color(0xFF161030), Color(0xFF07080D)),
                    radius = 2000f
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        // ВАУ-ЭФФЕКТ: Инженерная сетка + парящие неоновые частицы
        Canvas(modifier = Modifier.fillMaxSize()) {
            val step = 28.dp.toPx()
            val w = size.width
            val h = size.height

            // 1. Сетка
            var x = 0f
            while (x < w) {
                drawLine(
                    color = Color(0xFF00F0FF).copy(alpha = 0.035f),
                    start = Offset(x, 0f),
                    end = Offset(x, h),
                    strokeWidth = 1f
                )
                x += step
            }
            var y = 0f
            while (y < h) {
                drawLine(
                    color = Color(0xFF00F0FF).copy(alpha = 0.035f),
                    start = Offset(0f, y),
                    end = Offset(w, y),
                    strokeWidth = 1f
                )
                y += step
            }

            // 2. Частицы
            particles.forEach { (px, py, pAlpha) ->
                val currentY = (py - particlePhase + 1f) % 1f * h
                val currentX = px * w
                drawCircle(
                    color = Color(0xFF9D4EDD).copy(alpha = pAlpha),
                    radius = 3.dp.toPx(),
                    center = Offset(currentX, currentY)
                )
            }
        }

        // ЖЕСТКИЙ ЛИМИТ: Приложение собирается в аккуратный блок по центру
        Column(
            modifier = Modifier
                .fillMaxHeight()
                .widthIn(max = 480.dp)
                .align(Alignment.Center)
                .padding(vertical = 32.dp, horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // ВЕРХНЯЯ ЧАСТЬ: Заголовок
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Surface(
                    shape = RoundedCornerShape(50),
                    color = Color(0xFF121524).copy(alpha = 0.95f),
                    border = BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.6f)),
                    shadowElevation = 8.dp
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 5.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF00FFCC))
                        )
                        Text(
                            text = "033 • ОЭЗ «АЛАБУГА»",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF00FFCC),
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 0.5.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "АРЕНА ПЕРЕГОВОРОВ",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                    letterSpacing = 1.2.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "Интерактивный AI-тренажер жестких B2B-сделок",
                    fontSize = 13.sp,
                    color = Color(0xFF94A3B8),
                    textAlign = TextAlign.Center
                )
            }

            // ЦЕНТРАЛЬНАЯ ЧАСТЬ: Робот в светящейся подложке
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                // ВАУ-ЭФФЕКТ: Светящаяся радиальная пульсирующая подложка
                Box(
                    modifier = Modifier
                        .size(320.dp)
                        .background(
                            Brush.radialGradient(
                                listOf(
                                    Color(0xFF7B2CBF).copy(alpha = glowAlpha),
                                    Color(0xFF00F0FF).copy(alpha = glowAlpha * 0.3f),
                                    Color.Transparent
                                )
                            )
                        )
                )

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier.fillMaxSize()
                ) {
                    // Речевой баллон наставника при клике
                    if (speechText != null) {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color(0xFF090A14).copy(alpha = 0.95f),
                            border = BorderStroke(1.dp, Color(0xFF00F0FF).copy(alpha = 0.7f)),
                            shadowElevation = 12.dp,
                            modifier = Modifier
                                .padding(bottom = 10.dp)
                                .fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "СОВЕТ НАСТАВНИКА Б.А.Р.С.",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF00F0FF),
                                    fontFamily = FontFamily.Monospace,
                                    letterSpacing = 0.5.sp
                                )
                                Spacer(modifier = Modifier.height(3.dp))
                                Text(
                                    text = "«$speechText»",
                                    fontSize = 13.sp,
                                    color = Color.White,
                                    textAlign = TextAlign.Center,
                                    lineHeight = 18.sp
                                )
                            }
                        }
                    }

                    // Сама 3D модель крупным планом
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(310.dp)
                            .clickable { handleRobotClick() },
                        contentAlignment = Alignment.Center
                    ) {
                        BarsRobotView(
                            animation = robotAnimation,
                            modifier = Modifier.fillMaxSize(),
                            height = 310.dp
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Surface(
                        shape = RoundedCornerShape(50),
                        color = Color(0xFF0A0C16).copy(alpha = 0.85f),
                        border = BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.4f)),
                        modifier = Modifier.clickable { handleRobotClick() }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF00F0FF))
                            )
                            Text(
                                text = "Б.А.Р.С. ONLINE • НАЖМИТЕ ДЛЯ СОВЕТА",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFFCBD5E1),
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }

            // НИЖНЯЯ ЧАСТЬ: Кнопки
            Column(
                modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Button(
                    onClick = onEnterArena,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                        .shadow(16.dp, shape = RoundedCornerShape(16.dp)),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    contentPadding = PaddingValues(0.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.horizontalGradient(
                                    colors = listOf(
                                        Color(0xFF7B2CBF),
                                        Color(0xFF9D4EDD),
                                        Color(0xFF00F0FF)
                                    )
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.PlayArrow,
                                contentDescription = null,
                                tint = Color(0xFF07080D),
                                modifier = Modifier.size(24.dp)
                            )
                            Text(
                                text = "ВОЙТИ В ПЕРЕГОВОРНУЮ",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFF07080D),
                                letterSpacing = 1.sp
                            )
                        }
                    }
                }

                OutlinedButton(
                    onClick = onOpenAdmin,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.15f)),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = Color(0xFF121524).copy(alpha = 0.7f),
                        contentColor = Color(0xFFCBD5E1)
                    )
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = null,
                            tint = Color(0xFF00F0FF),
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "ПАНЕЛЬ АДМИНИСТРАТОРА",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFCBD5E1)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(2.dp))

                Text(
                    text = "KOTLIN MULTIPLATFORM • COMPOSE UI & WEBASSEMBLY",
                    fontSize = 10.sp,
                    color = Color(0xFF64748B),
                    fontFamily = FontFamily.Monospace,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}
