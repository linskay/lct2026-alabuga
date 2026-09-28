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
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Fill
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
    var animIndex by remember { mutableStateOf(0) }

    val gentleAnims = remember { listOf("wave", "nod", "tilt", "talk", "idle") }

    val handleRobotTap = {
        animIndex = (animIndex + 1) % gentleAnims.size
        robotAnimation = gentleAnims[animIndex]
    }

    // ВАУ-ЭФФЕКТ: Парящие космические частицы
    val infiniteTransition = rememberInfiniteTransition(label = "homeFx")
    val particlePhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(14000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "particles"
    )

    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.25f,
        targetValue = 0.55f,
        animationSpec = infiniteRepeatable(
            animation = tween(2600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glow"
    )

    val particles = remember {
        List(28) {
            Triple(Random.nextFloat(), Random.nextFloat(), Random.nextFloat() * 0.25f + 0.1f)
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(Color(0xFF161030), Color(0xFF07080D)),
                    radius = 2200f
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        // 1. ФОН: Инженерная сетка + гигантский полупрозрачный силуэт логотипа «Алабуга / 033» + частицы
        Canvas(modifier = Modifier.fillMaxSize()) {
            val step = 28.dp.toPx()
            val w = size.width
            val h = size.height

            // Инженерная сетка
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

            // Гигантский фоновый герб ОЭЗ «Алабуга» по центру (alpha = 0.035f)
            val cx = w / 2f
            val cy = h / 2f
            val logoRadius = (w.coerceAtMost(h) * 0.42f).coerceIn(120f, 320f)
            
            // Центральный ромб
            val rhombPath = Path().apply {
                moveTo(cx, cy - logoRadius * 0.4f)
                lineTo(cx + logoRadius * 0.35f, cy)
                lineTo(cx, cy + logoRadius * 0.4f)
                lineTo(cx - logoRadius * 0.35f, cy)
                close()
            }
            drawPath(rhombPath, Color(0xFF00FFCC).copy(alpha = 0.025f))

            // Внешние концентрические орбиты
            drawCircle(
                color = Color(0xFF7B2CBF).copy(alpha = 0.035f),
                radius = logoRadius * 0.85f,
                center = Offset(cx, cy),
                style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2.dp.toPx())
            )
            drawCircle(
                color = Color(0xFF00F0FF).copy(alpha = 0.025f),
                radius = logoRadius * 1.15f,
                center = Offset(cx, cy),
                style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1.dp.toPx())
            )

            // Парящие космические частицы
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

        // 2. ЦЕНТРИРОВАННЫЙ БЛОК (Лимит max = 480.dp)
        Column(
            modifier = Modifier
                .fillMaxHeight()
                .widthIn(max = 480.dp)
                .align(Alignment.Center)
                .padding(vertical = 36.dp, horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // ВЕРХНЯЯ ЧАСТЬ: Брендинг и заголовок
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Surface(
                    shape = RoundedCornerShape(50),
                    color = Color(0xFF121524).copy(alpha = 0.9f),
                    border = BorderStroke(1.dp, Color(0xFF00FFCC).copy(alpha = 0.4f)),
                    shadowElevation = 8.dp
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        // Ромбовидная иконка логотипа Алабуги
                        Canvas(modifier = Modifier.size(10.dp)) {
                            val path = Path().apply {
                                moveTo(size.width / 2f, 0f)
                                lineTo(size.width, size.height / 2f)
                                lineTo(size.width / 2f, size.height)
                                lineTo(0f, size.height / 2f)
                                close()
                            }
                            drawPath(path, Color(0xFF00FFCC), style = Fill)
                        }
                        Text(
                            text = "033 • ОЭЗ «АЛАБУГА»",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF00FFCC),
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 0.8.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "АРЕНА ПЕРЕГОВОРОВ",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                    letterSpacing = 1.5.sp,
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

            // ЦЕНТРАЛЬНАЯ ЧАСТЬ: Крупный 3D-робот Б.А.Р.С. с тенью и светящейся подложкой
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                // Радиальное неоновое свечение за роботом
                Box(
                    modifier = Modifier
                        .size(340.dp)
                        .background(
                            Brush.radialGradient(
                                listOf(
                                    Color(0xFF7B2CBF).copy(alpha = glowAlpha),
                                    Color(0xFF00F0FF).copy(alpha = glowAlpha * 0.25f),
                                    Color.Transparent
                                )
                            )
                        )
                )

                // 3D-модель робота (высота 340dp)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(340.dp)
                        .clickable { handleRobotTap() },
                    contentAlignment = Alignment.Center
                ) {
                    BarsRobotView(
                        animation = robotAnimation,
                        modifier = Modifier.fillMaxSize(),
                        height = 340.dp,
                        onClick = handleRobotTap
                    )
                }

                // Мягкая эллиптическая тень под ногами робота на виртуальный пол
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .offset(y = (-4).dp)
                        .size(width = 170.dp, height = 22.dp)
                        .background(
                            Brush.radialGradient(
                                colors = listOf(
                                    Color.Black.copy(alpha = 0.55f),
                                    Color.Black.copy(alpha = 0.2f),
                                    Color.Transparent
                                )
                            )
                        )
                )
            }

            // НИЖНЯЯ ЧАСТЬ: Премиальные кнопки
            Column(
                modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // 1. Кнопка «▶ ВОЙТИ В ПЕРЕГОВОРНУЮ» (Благородный фиолетово-индиго градиент #7B2CBF → #480CA8)
                Button(
                    onClick = onEnterArena,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                        .shadow(
                            elevation = 14.dp,
                            shape = RoundedCornerShape(16.dp),
                            ambientColor = Color(0xFF7B2CBF),
                            spotColor = Color(0xFF7B2CBF)
                        ),
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
                                        Color(0xFF5A189A),
                                        Color(0xFF480CA8)
                                    )
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        // Верхний глянцевый отблеск
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(1.dp)
                                .align(Alignment.TopCenter)
                                .background(Color.White.copy(alpha = 0.25f))
                        )

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.PlayArrow,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(22.dp)
                            )
                            Text(
                                text = "ВОЙТИ В ПЕРЕГОВОРНУЮ",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                letterSpacing = 1.5.sp
                            )
                        }
                    }
                }

                // 2. Кнопка «⚙ ПАНЕЛЬ АДМИНИСТРАТОРА» (Glassmorphism #161926/40%)
                OutlinedButton(
                    onClick = onOpenAdmin,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.12f)),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = Color(0xFF161926).copy(alpha = 0.45f),
                        contentColor = Color(0xFFE2E8F0)
                    )
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = null,
                            tint = Color(0xFFD8B4FE),
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "ПАНЕЛЬ АДМИНИСТРАТОРА",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
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
