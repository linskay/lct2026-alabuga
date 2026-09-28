package ru.alabuga.arena.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ru.alabuga.arena.ui.components.BarsRobotView

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

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF07080D)),
        contentAlignment = Alignment.Center
    ) {
        // 1. ИНЖЕНЕРНАЯ КЛЕТЧАТАЯ МИКРОСЕТКА + РАЗМЫТИЕ КРАЕВ И РАДИАЛЬНЫЙ НЕОН
        Canvas(modifier = Modifier.fillMaxSize()) {
            val step = 28.dp.toPx()
            val w = size.width
            val h = size.height

            // Вертикальные линии сетки
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

            // Горизонтальные линии сетки
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
        }

        // Мягкое радиальное свечение по центру (размытие к краям)
        Box(
            modifier = Modifier
                .size(540.dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            Color(0xFF7B2CBF).copy(alpha = 0.28f),
                            Color(0xFF00F0FF).copy(alpha = 0.06f),
                            Color.Transparent
                        )
                    )
                )
        )

        // 2. ЦЕНТРИРОВАННЫЙ КОНТЕЙНЕР (Не растягивается на широких экранах)
        Column(
            modifier = Modifier
                .fillMaxHeight()
                .widthIn(max = 440.dp)
                .padding(horizontal = 20.dp, vertical = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // ВЕРХНЯЯ ЧАСТЬ: Заголовок и Полигон #033
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth().padding(top = 4.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(50),
                    color = Color(0xFF121524).copy(alpha = 0.95f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.6f)),
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
                                .background(Color(0xFF00F0FF))
                        )
                        Text(
                            text = "ОЭЗ «АЛАБУГА»",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF00F0FF),
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 0.5.sp
                        )
                        Text(text = "|", color = Color(0xFF64748B), fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        Text(
                            text = "ПОЛИГОН #033",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFFD8B4FE),
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "АРЕНА ПЕРЕГОВОРОВ",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                    letterSpacing = 1.5.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "Интерактивный AI-тренажер жестких B2B-сделок",
                    fontSize = 12.sp,
                    color = Color(0xFF94A3B8),
                    textAlign = TextAlign.Center
                )
            }

            // ЦЕНТРАЛЬНАЯ ЧАСТЬ: Увеличенный 3D-робот Б.А.Р.С. (без лишних рамок)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(vertical = 4.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Голографический речевой баллон наставника Б.А.Р.С. при клике
                if (speechText != null) {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = Color(0xFF090A14).copy(alpha = 0.95f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF00F0FF).copy(alpha = 0.7f)),
                        shadowElevation = 12.dp,
                        modifier = Modifier
                            .padding(bottom = 8.dp)
                            .fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "СОВЕТ НАСТАВНИКА Б.А.Р.С.",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF00F0FF),
                                fontFamily = FontFamily.Monospace,
                                letterSpacing = 0.5.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "«${speechText}»",
                                fontSize = 12.sp,
                                color = Color.White,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }

                // Интерактивный кликабельный контейнер робота
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(290.dp)
                        .clickable { handleRobotClick() },
                    contentAlignment = Alignment.Center
                ) {
                    BarsRobotView(
                        animation = robotAnimation,
                        modifier = Modifier.fillMaxSize(),
                        height = 290.dp
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                // Компактный бейдж статуса под роботом
                Surface(
                    shape = RoundedCornerShape(50),
                    color = Color(0xFF0A0C16).copy(alpha = 0.85f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.4f)),
                    modifier = Modifier.clickable { handleRobotClick() }
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 5.dp)
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

            // НИЖНЯЯ ЧАСТЬ: Две крупные удобные кнопки и Футер
            Column(
                modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // 1. Главная кнопка («▶ ВОЙТИ В ПЕРЕГОВОРНУЮ»)
                Button(
                    onClick = onEnterArena,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
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
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = "ВОЙТИ В ПЕРЕГОВОРНУЮ",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFF07080D),
                                letterSpacing = 1.sp
                            )
                        }
                    }
                }

                // 2. Второстепенная кнопка (⚙ ПАНЕЛЬ АДМИНИСТРАТОРА)
                OutlinedButton(
                    onClick = onOpenAdmin,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp),
                    shape = RoundedCornerShape(16.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.15f)),
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
                            modifier = Modifier.size(16.dp)
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


