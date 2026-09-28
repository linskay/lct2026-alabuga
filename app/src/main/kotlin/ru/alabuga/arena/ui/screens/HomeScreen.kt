package ru.alabuga.arena.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import ru.alabuga.arena.ui.components.BarsRobotCanvasView
import ru.alabuga.arena.ui.components.BarsRobot3DView
import androidx.compose.foundation.clickable

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
            "Помни правило: защищай ставку 460 ₽/м² и выявляй скрытые дедлайны оппонента!",
            "Не поддавайся на блеф с Калугой: у них дефицит мощностей 110 кВ!",
            "Наставник Б.А.Р.С. на связи! Твой главный щит на арене — BATNA и выдержка."
        )
    }

    val handleRobotClick = {
        speechText = speeches[speechIndex % speeches.size]
        speechIndex++
        robotAnimation = if (speechIndex % 2 == 1) "talk" else "win"
    }

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.7f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glowAlpha"
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF07080D))
            .padding(horizontal = 20.dp, vertical = 24.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // ВЕРХНЯЯ ЧАСТЬ: Логотип 033 и Заголовок
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(50),
                    color = Color(0xFF121524),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.6f)),
                    shadowElevation = 8.dp
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF00F0FF))
                        )
                        Text(
                            text = "ОЭЗ «АЛАБУГА»",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF00F0FF),
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 0.5.sp
                        )
                        Text(text = "•", color = Color.Gray, fontSize = 9.sp)
                        Text(
                            text = "033",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Normal,
                            color = Color(0xFFD8B4FE),
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "АРЕНА ПЕРЕГОВОРОВ",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                    letterSpacing = 2.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "Интерактивный AI-тренажер",
                    fontSize = 13.sp,
                    color = Color(0xFF94A3B8),
                    textAlign = TextAlign.Center
                )
            }

            // ЦЕНТРАЛЬНАЯ ЧАСТЬ: Подиум с роботом Б.А.Р.С.
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(vertical = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                // Радиальный светящийся контур
                Box(
                    modifier = Modifier
                        .size(260.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.radialGradient(
                                colors = listOf(
                                    Color(0xFF7B2CBF).copy(alpha = glowAlpha),
                                    Color.Transparent
                                )
                            )
                        )
                )

                // Неоновый подиум
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 24.dp)
                        .width(180.dp)
                        .height(16.dp)
                        .border(
                            width = 2.dp,
                            color = Color(0xFF00F0FF).copy(alpha = 0.8f),
                            shape = RoundedCornerShape(50)
                        )
                )

                // 3D-аватар робота-наставника Б.А.Р.С. (Mike)
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    if (speechText != null) {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color(0xFF0F121F).copy(alpha = 0.95f),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF00F0FF).copy(alpha = 0.7f)),
                            modifier = Modifier.padding(bottom = 8.dp).fillMaxWidth(0.9f)
                        ) {
                            Text(
                                text = "«${speechText}»",
                                fontSize = 11.sp,
                                color = Color.White,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                    }

                    BarsRobot3DView(
                        animation = robotAnimation,
                        modifier = Modifier.fillMaxWidth().clickable { handleRobotClick() },
                        height = 190.dp
                    )
                }
            }

            // НИЖНЯЯ ЧАСТЬ: Кнопки Neo-B2B Cyber-Apple (h-14 / 56.dp & h-12 / 48.dp, gap-3.5 / 14.dp)
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // 1. Главная кнопка («▶ ВОЙТИ В ПЕРЕГОВОРНУЮ»)
                Button(
                    onClick = onEnterArena,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(18.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    contentPadding = PaddingValues(0.dp),
                    elevation = ButtonDefaults.buttonElevation(
                        defaultElevation = 10.dp,
                        pressedElevation = 4.dp
                    )
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.horizontalGradient(
                                    colors = listOf(
                                        Color(0xFF7B2CBF),
                                        Color(0xFF480CA8)
                                    )
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color.White.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.PlayArrow,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Text(
                                text = "ВОЙТИ В ПЕРЕГОВОРНУЮ",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                letterSpacing = 1.sp
                            )
                        }
                    }
                }

                // 2. Второстепенная кнопка (⚙ ПАНЕЛЬ АДМИНИСТРАТОРА): Glassmorphism
                OutlinedButton(
                    onClick = onOpenAdmin,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(16.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = Color(0xFF161926).copy(alpha = 0.6f),
                        contentColor = Color(0xFFCBD5E1)
                    )
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF9D4EDD).copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Settings,
                                contentDescription = null,
                                tint = Color(0xFFC084FC), // фиолетовая иконка шестеренки
                                modifier = Modifier.size(16.dp)
                            )
                        }
                        Text(
                            text = "ПАНЕЛЬ АДМИНИСТРАТОРА",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFFCBD5E1) // text-slate-300
                        )
                    }
                }

                Text(
                    text = "No PHP — No Problems • 2026",
                    fontSize = 11.sp,
                    color = Color(0xFF94A3B8),
                    fontFamily = FontFamily.Monospace,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().padding(top = 2.dp)
                )
            }
        }
    }
}
