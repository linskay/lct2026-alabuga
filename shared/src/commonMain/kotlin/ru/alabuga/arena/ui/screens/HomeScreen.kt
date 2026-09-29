package ru.alabuga.arena.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
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
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import ru.alabuga.arena.ui.components.BarsRobotView
import kotlin.random.Random

@Composable
fun HomeScreen(
    onEnterArena: () -> Unit,
    onOpenAdmin: () -> Unit,
    modifier: Modifier = Modifier
) {
    var robotAnimation by remember { mutableStateOf("wave") }
    var animIndex by remember { mutableStateOf(0) }
    var currentPhraseIndex by remember { mutableStateOf(-1) }
    var showBubble by remember { mutableStateOf(false) }
    var bubbleVersion by remember { mutableStateOf(0) }

    val gentleAnims = remember { listOf("punch", "warn", "win", "wave", "idle", "punch", "warn", "win", "wave") }

    val robotPhrases = remember {
        listOf(
            "Не трогай меня, иди решай кейсы и договаривайся с инвестором!",
            "Эй, не тыкай в сенсоры! Моя тактическая броня не для щекотки.",
            "Хватит кликать! Направь эту боевую энергию в переговоры по CAPEX.",
            "Калибровка тактических систем... Перестань тыкать, жми «ВОЙТИ В ПЕРЕГОВОРНУЮ»!",
            "Я нейро-наставник Б.А.Р.С. ОЭЗ «Алабуга», а не тамагочи!",
            "Внимание: уровень раздражения процессора 98%. Иди защищать ставку 460 ₽/м²!",
            "Тактический совет №0: Перестань мучить робота и покажи класс на Арене!",
            "Осторожно! Еще один клик, и я повышу жесткость торга оппонента на 20%!",
            "Ты точно готов к переговорам? Твоя техника клика выдает легкое волнение."
        )
    }

    val handleRobotTap: () -> Unit = {
        animIndex = (animIndex + 1) % gentleAnims.size
        robotAnimation = gentleAnims[animIndex]
        currentPhraseIndex = (currentPhraseIndex + 1) % robotPhrases.size
        showBubble = true
        bubbleVersion++
    }

    // Автоматическое скрытие подсказки через 4 секунды
    LaunchedEffect(bubbleVersion) {
        if (showBubble && bubbleVersion > 0) {
            delay(4200)
            showBubble = false
        }
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

    // Анимация клика и наведения для кнопки Входа
    val enterInteractionSource = remember { MutableInteractionSource() }
    val isEnterPressed by enterInteractionSource.collectIsPressedAsState()
    val isEnterHovered by enterInteractionSource.collectIsHoveredAsState()
    val enterScale by animateFloatAsState(
        targetValue = if (isEnterPressed) 0.96f else if (isEnterHovered) 1.02f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "enterScale"
    )
    val playIconOffset by animateDpAsState(
        targetValue = if (isEnterHovered || isEnterPressed) 4.dp else 0.dp,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "playIconOffset"
    )
    val playIconScale by animateFloatAsState(
        targetValue = if (isEnterHovered || isEnterPressed) 1.25f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "playIconScale"
    )

    // Анимация клика и наведения для кнопки Админки
    val adminInteractionSource = remember { MutableInteractionSource() }
    val isAdminPressed by adminInteractionSource.collectIsPressedAsState()
    val isAdminHovered by adminInteractionSource.collectIsHoveredAsState()
    val adminScale by animateFloatAsState(
        targetValue = if (isAdminPressed) 0.96f else if (isAdminHovered) 1.02f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "adminScale"
    )
    val settingsIconRotation by animateFloatAsState(
        targetValue = if (isAdminHovered || isAdminPressed) 90f else 0f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "settingsIconRotation"
    )
    val settingsIconScale by animateFloatAsState(
        targetValue = if (isAdminHovered || isAdminPressed) 1.2f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "settingsIconScale"
    )

    val robotInteractionSource = remember { MutableInteractionSource() }

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
        // 1. ФОН: Инженерная сетка + крупный силуэт логотипа Алабуги (крупнее робота)
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

            // ТОЧНЫЙ СИЛУЭТ ЛОГОТИПА АЛАБУГИ (Масштаб крупнее робота)
            val cx = w / 2f
            val cy = h * 0.46f
            val s = (w.coerceAtMost(h) * 0.88f).coerceIn(480f, 780f)
            val whiteAlpha = 0.055f

            // Верхний шеврон (крыло влево и вправо)
            val chevronPath = Path().apply {
                moveTo(cx, cy - s * 0.45f)
                lineTo(cx + s * 0.44f, cy - s * 0.02f)
                lineTo(cx + s * 0.30f, cy + s * 0.12f)
                lineTo(cx, cy - s * 0.16f)
                lineTo(cx - s * 0.30f, cy + s * 0.12f)
                lineTo(cx - s * 0.44f, cy - s * 0.02f)
                close()
            }
            drawPath(chevronPath, Color.White.copy(alpha = whiteAlpha))

            // Нижний ромб
            val rhombPath = Path().apply {
                moveTo(cx, cy + s * 0.09f)
                lineTo(cx + s * 0.13f, cy + s * 0.22f)
                lineTo(cx, cy + s * 0.35f)
                lineTo(cx - s * 0.13f, cy + s * 0.22f)
                close()
            }
            drawPath(rhombPath, Color.White.copy(alpha = whiteAlpha))

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

        // 2. ЦЕНТРИРОВАННЫЙ БЛОК: Свободное размещение без карточки (в точности как на эталонном фото 2)
        Column(
            modifier = Modifier
                .widthIn(max = 520.dp)
                .fillMaxWidth(0.92f)
                .wrapContentHeight()
                .align(Alignment.Center)
                .padding(vertical = 16.dp, horizontal = 14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // ВЕРХНЯЯ ЧАСТЬ: Брендинг и заголовок
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Surface(
                    shape = RoundedCornerShape(50),
                    color = Color(0xFF121524).copy(alpha = 0.85f),
                    border = BorderStroke(
                        1.dp,
                        Brush.linearGradient(
                            listOf(Color(0xFF00FFCC).copy(alpha = 0.6f), Color(0xFF7B2CBF).copy(alpha = 0.4f))
                        )
                    ),
                    shadowElevation = 8.dp
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                    ) {
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

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "АРЕНА ПЕРЕГОВОРОВ",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                    letterSpacing = 1.5.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "Интерактивный тренажер переговоров. Учись побеждать в B2B-сделках без уступок!",
                    fontSize = 12.5.sp,
                    color = Color(0xFF94A3B8),
                    textAlign = TextAlign.Center,
                    lineHeight = 17.sp
                )
            }

            // ДИАЛОГОВЫЙ БАББЛ Б.А.Р.С. С НЕОНОВОЙ РАМКОЙ (фиксированная высота без дерганья)
            Surface(
                onClick = handleRobotTap,
                shape = RoundedCornerShape(16.dp),
                color = Color(0xFF0F172A).copy(alpha = 0.88f),
                border = BorderStroke(
                    1.5.dp,
                    Brush.linearGradient(
                        listOf(Color(0xFF00F0FF), Color(0xFF00FFCC))
                    )
                ),
                shadowElevation = 12.dp,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(68.dp)
                    .padding(horizontal = 4.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp, vertical = 6.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF00FFCC))
                        )
                        Text(
                            text = "🤖 Б.А.Р.С. [НАСТАВНИК]",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF00F0FF),
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 0.8.sp
                        )
                    }

                    Text(
                        text = if (currentPhraseIndex in robotPhrases.indices) {
                            robotPhrases[currentPhraseIndex]
                        } else {
                            "Калибровка систем... Перестань тыкать, жми «ВОЙТИ В ПЕРЕГОВОРНУЮ»!"
                        },
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color.White,
                        textAlign = TextAlign.Center,
                        lineHeight = 15.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // ЦЕНТРАЛЬНАЯ ЧАСТЬ: Робот + Мягкая неоновая аура + Тень (без лишних квадратов)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(340.dp),
                contentAlignment = Alignment.Center
            ) {
                // МЯГКОЕ НЕОНОВОЕ СВЕЧЕНИЕ (CYAN & PURPLE AURA)
                Box(
                    modifier = Modifier
                        .size(240.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.radialGradient(
                                listOf(
                                    Color(0xFF00F0FF).copy(alpha = glowAlpha * 0.70f),
                                    Color(0xFF7B2CBF).copy(alpha = glowAlpha * 0.40f),
                                    Color.Transparent
                                )
                            )
                        )
                )

                // 3D-модель робота (высота 340dp)
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clickable(
                            interactionSource = robotInteractionSource,
                            indication = null
                        ) { handleRobotTap() },
                    contentAlignment = Alignment.Center
                ) {
                    BarsRobotView(
                        animation = robotAnimation,
                        modifier = Modifier.fillMaxSize(),
                        height = 340.dp,
                        onClick = handleRobotTap
                    )
                }

                // МЯГКАЯ ТЕНЬ В ОСНОВАНИИ РОБОТА
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .offset(y = (-6).dp)
                        .size(width = 130.dp, height = 12.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.radialGradient(
                                colors = listOf(
                                    Color.Black.copy(alpha = 0.30f),
                                    Color.Transparent
                                )
                            )
                        )
                )
            }

            // НИЖНЯЯ ЧАСТЬ: Премиальные кнопки с анимацией клика и интерактивными иконками
            Column(
                modifier = Modifier.fillMaxWidth().padding(bottom = 2.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // 1. Кнопка «▶ ВОЙТИ В ПЕРЕГОВОРНУЮ»
                Button(
                    onClick = onEnterArena,
                    interactionSource = enterInteractionSource,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp)
                        .scale(enterScale)
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
                                        Color(0xFF9D4EDD),
                                        Color(0xFF00F0FF)
                                    )
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(1.dp)
                                .align(Alignment.TopCenter)
                                .background(Color.White.copy(alpha = 0.35f))
                        )

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.PlayArrow,
                                contentDescription = null,
                                tint = Color(0xFF07080D),
                                modifier = Modifier
                                    .offset(x = playIconOffset)
                                    .scale(playIconScale)
                                    .size(22.dp)
                            )
                            Text(
                                text = "ВОЙТИ В ПЕРЕГОВОРНУЮ",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFF07080D),
                                letterSpacing = 1.2.sp
                            )
                        }
                    }
                }

                // 2. Кнопка «⚙ ПАНЕЛЬ АДМИНИСТРАТОРА»
                OutlinedButton(
                    onClick = onOpenAdmin,
                    interactionSource = adminInteractionSource,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .scale(adminScale),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(
                        1.dp,
                        Brush.linearGradient(
                            listOf(Color.White.copy(alpha = 0.20f), Color(0xFF7B2CBF).copy(alpha = 0.45f))
                        )
                    ),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = Color(0xFF141624).copy(alpha = 0.65f),
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
                            tint = Color(0xFF00F0FF),
                            modifier = Modifier
                                .rotate(settingsIconRotation)
                                .scale(settingsIconScale)
                                .size(18.dp)
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
                    text = "NO PHP - NO PROBLEMS - 2026",
                    fontSize = 10.sp,
                    color = Color(0xFF64748B),
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.sp,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}
