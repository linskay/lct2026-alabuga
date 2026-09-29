package ru.alabuga.arena.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

/**
 * High-fidelity 3D-styled animated tactical robot mentor avatar (Б.А.Р.С. / Mike)
 * Renders full cybernetic chassis: head, dual-tier neon visor, chest reactor core,
 * articulated shoulders and hydraulic arms with 10 dynamic states.
 */
@Composable
fun BarsRobotCanvasView(
    animationState: String = "idle",
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    val infiniteTransition = rememberInfiniteTransition(label = "robotAnim")
    val time by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 6.28318f,
        animationSpec = infiniteRepeatable(
            animation = tween(2800, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "time"
    )
    
    val fastTime by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 6.28318f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "fastTime"
    )

    val (glowColor, visorColor, statusText, statusBadge) = when (animationState) {
        "talk" -> Quadruple(Color(0xFF9D4EDD), Color(0xFF00F0FF), "СИНТЕЗ ТАКТИКИ", "Б.А.Р.С. ИНСТРУКТИРУЕТ")
        "warn" -> Quadruple(Color(0xFFFF3366), Color(0xFFFF3366), "УГРОЗА BATNA!", "АТАКА ПОЗИЦИЙ")
        "win"  -> Quadruple(Color(0xFF10B981), Color(0xFF10B981), "УСЛОВИЯ ПРИНЯТЫ", "СДЕЛКА СОГЛАСОВАНА")
        "wave" -> Quadruple(Color(0xFF3B82F6), Color(0xFF60A5FA), "ПРИВЕТСТВИЕ", "КОНТАКТ УСТАНОВЛЕН")
        "punch" -> Quadruple(Color(0xFFEF4444), Color(0xFFFCA5A5), "ЖЕСТКАЯ ПОЗИЦИЯ", "КРИТИЧЕСКИЙ УДАР")
        "hit" -> Quadruple(Color(0xFFF59E0B), Color(0xFFFCD34D), "СИСТЕМНЫЙ СБОЙ", "ПОЛУЧЕН УРОН")
        "death" -> Quadruple(Color(0xFF1F2937), Color(0xFF4B5563), "ОТКЛЮЧЕНИЕ", "СИСТЕМА В ДАУНЕ")
        "thinking" -> Quadruple(Color(0xFF8B5CF6), Color(0xFFC4B5FD), "АНАЛИЗ ДАННЫХ", "РАСЧЕТ ВАРИАНТОВ")
        "bluff" -> Quadruple(Color(0xFFEC4899), Color(0xFFF9A8D4), "ПОКЕР ФЕЙС", "ВЕРОЯТНОСТЬ БЛЕФА")
        else   -> Quadruple(Color(0xFF7B2CBF), Color(0xFF00F0FF), "СКАНЕР АКТИВЕН", "3D НАСТАВНИК ONLINE") // idle
    }

    val clickableModifier = if (onClick != null) modifier.clickable { onClick() } else modifier

    Column(
        modifier = clickableModifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Canvas(modifier = Modifier.fillMaxWidth().height(185.dp)) {
            val cx = size.width / 2f
            
            // Dynamic body movements
            val bodyHover = when (animationState) {
                "punch" -> sin(fastTime.toDouble() * 4.0).toFloat() * 10f
                "hit" -> (Random.nextFloat() - 0.5f) * 15f
                "death" -> 15f
                "walk", "run" -> sin(fastTime.toDouble() * 2.0).toFloat() * 12f
                "jump" -> -abs(sin(fastTime.toDouble() * 2.0).toFloat()) * 30f
                else -> sin(time.toDouble() * 2.0).toFloat() * 7f
            }
            
            val cy = size.height * 0.44f + bodyHover
            
            val shoulderTilt = when (animationState) {
                "wave" -> sin(fastTime.toDouble() * 2.0).toFloat() * 10f
                "punch" -> 15f
                "walk", "run" -> sin(fastTime.toDouble() * 2.0).toFloat() * 8f
                else -> 0f
            }

            // 1. Holographic Ambient Aura (Multi-layer glow)
            if (animationState != "death") {
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(glowColor.copy(alpha = 0.5f), glowColor.copy(alpha = 0.2f), glowColor.copy(alpha = 0.05f), Color.Transparent),
                        center = Offset(cx, cy),
                        radius = 130.dp.toPx()
                    ),
                    radius = 130.dp.toPx(),
                    center = Offset(cx, cy)
                )
            }

            // Floating hexagonal particles
            if (animationState != "death") {
                val particleCount = if (animationState == "punch" || animationState == "warn") 12 else 6
                for (i in 0 until particleCount) {
                    val pAngle = time.toDouble() * (if(i%2==0) 1 else -1) + (i * PI * 2.0 / particleCount)
                    val pRadius = 80.dp.toPx() + sin(time.toDouble() * 3 + i).toFloat() * 15.dp.toPx()
                    val px = cx + (cos(pAngle) * pRadius).toFloat()
                    val py = cy + (sin(pAngle) * pRadius).toFloat()
                    drawPath(createHexagonPath(px, py, 4.dp.toPx()), color = visorColor.copy(alpha = 0.6f))
                }
            }

            // 2. Rotating Telemetry Radar Rings
            val ringRadius = 78.dp.toPx()
            if (animationState != "death") {
                drawCircle(
                    color = glowColor.copy(alpha = 0.4f),
                    radius = ringRadius,
                    center = Offset(cx, cy),
                    style = Stroke(width = 1.5.dp.toPx())
                )
                // Orbital pulse tick marks
                for (i in 0 until 6) {
                    val angle = (if(animationState == "thinking") fastTime else time).toDouble() + (i * PI / 3.0)
                    val tickX = cx + (cos(angle) * ringRadius).toFloat()
                    val tickY = cy + (sin(angle) * ringRadius).toFloat()
                    drawCircle(
                        color = visorColor.copy(alpha = 0.7f),
                        radius = 2.5.dp.toPx(),
                        center = Offset(tickX, tickY)
                    )
                }
            }

            // 3. Cybernetic Torso & Shoulder Armor (Chassis)
            val torsoTopY = cy + 34.dp.toPx()
            val torsoPath = Path().apply {
                moveTo(cx - 36.dp.toPx(), torsoTopY + shoulderTilt)
                lineTo(cx + 36.dp.toPx(), torsoTopY - shoulderTilt)
                lineTo(cx + 46.dp.toPx(), torsoTopY + 38.dp.toPx() - shoulderTilt)
                lineTo(cx + 24.dp.toPx(), torsoTopY + 54.dp.toPx())
                lineTo(cx - 24.dp.toPx(), torsoTopY + 54.dp.toPx())
                lineTo(cx - 46.dp.toPx(), torsoTopY + 38.dp.toPx() + shoulderTilt)
                close()
            }
            drawPath(torsoPath, color = Color(0xFF12141F))
            drawPath(
                torsoPath,
                color = if (animationState == "death") Color(0xFF1A1C29) else Color(0xFF282F4A),
                style = Stroke(width = 2.dp.toPx())
            )

            // Left Shoulder Plate
            drawRoundRect(
                color = Color(0xFF1A1D2E),
                topLeft = Offset(cx - 58.dp.toPx(), torsoTopY + 2.dp.toPx() + shoulderTilt),
                size = Size(18.dp.toPx(), 26.dp.toPx()),
                cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx())
            )
            drawRoundRect(
                color = if (animationState == "death") Color.DarkGray else glowColor.copy(alpha = 0.6f),
                topLeft = Offset(cx - 58.dp.toPx(), torsoTopY + 2.dp.toPx() + shoulderTilt),
                size = Size(18.dp.toPx(), 26.dp.toPx()),
                cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx()),
                style = Stroke(width = 1.2.dp.toPx())
            )

            // Right Shoulder Plate
            drawRoundRect(
                color = Color(0xFF1A1D2E),
                topLeft = Offset(cx + 40.dp.toPx(), torsoTopY + 2.dp.toPx() - shoulderTilt),
                size = Size(18.dp.toPx(), 26.dp.toPx()),
                cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx())
            )
            drawRoundRect(
                color = if (animationState == "death") Color.DarkGray else glowColor.copy(alpha = 0.6f),
                topLeft = Offset(cx + 40.dp.toPx(), torsoTopY + 2.dp.toPx() - shoulderTilt),
                size = Size(18.dp.toPx(), 26.dp.toPx()),
                cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx()),
                style = Stroke(width = 1.2.dp.toPx())
            )

            // Dynamic Chest Arc Reactor Core
            val reactorY = torsoTopY + 20.dp.toPx()
            if (animationState != "death") {
                val reactorPulse = if (animationState == "punch") {
                    (sin(fastTime.toDouble() * 8.0).toFloat() * 3.dp.toPx()) + 8.dp.toPx()
                } else {
                    (sin(time.toDouble() * 3.5).toFloat() * 1.5.dp.toPx()) + 7.dp.toPx()
                }
                drawCircle(
                    color = visorColor.copy(alpha = 0.25f),
                    radius = reactorPulse + 3.dp.toPx(),
                    center = Offset(cx, reactorY)
                )
                drawCircle(
                    color = visorColor,
                    radius = 6.dp.toPx(),
                    center = Offset(cx, reactorY)
                )
                drawCircle(
                    color = Color.White,
                    radius = 2.5.dp.toPx(),
                    center = Offset(cx, reactorY)
                )
            } else {
                drawCircle(color = Color.DarkGray, radius = 6.dp.toPx(), center = Offset(cx, reactorY))
            }

            // 4. Titanium Hexagon Armor Head
            val headTiltX = if (animationState == "hit") (Random.nextFloat() - 0.5f) * 10f else 0f
            val headTiltY = if (animationState == "death") 15.dp.toPx() else 0f
            
            val headPath = Path().apply {
                moveTo(cx - 46.dp.toPx() + headTiltX, cy - 24.dp.toPx() + headTiltY)
                lineTo(cx + headTiltX, cy - 52.dp.toPx() + headTiltY)
                lineTo(cx + 46.dp.toPx() + headTiltX, cy - 24.dp.toPx() + headTiltY)
                lineTo(cx + 40.dp.toPx() + headTiltX, cy + 28.dp.toPx() + headTiltY)
                lineTo(cx + headTiltX, cy + 44.dp.toPx() + headTiltY)
                lineTo(cx - 40.dp.toPx() + headTiltX, cy + 28.dp.toPx() + headTiltY)
                close()
            }
            drawPath(headPath, color = Color(0xFF141622))
            drawPath(
                headPath,
                color = if (animationState == "death") Color.DarkGray else glowColor,
                style = Stroke(width = 2.dp.toPx())
            )

            // Crest Antenna / Comm Horn
            val crestPath = Path().apply {
                moveTo(cx - 6.dp.toPx() + headTiltX, cy - 51.dp.toPx() + headTiltY)
                lineTo(cx + headTiltX, cy - 64.dp.toPx() + headTiltY + if (animationState != "death") sin(time.toDouble() * 4).toFloat() * 2f else 0f)
                lineTo(cx + 6.dp.toPx() + headTiltX, cy - 51.dp.toPx() + headTiltY)
                close()
            }
            drawPath(crestPath, color = if (animationState == "death") Color.DarkGray else visorColor)

            // 5. Side Ears / Antenna Fins
            drawRect(
                color = Color(0xFF222638),
                topLeft = Offset(cx - 56.dp.toPx() + headTiltX, cy - 14.dp.toPx() + headTiltY),
                size = Size(10.dp.toPx(), 26.dp.toPx())
            )
            if (animationState != "death") {
                drawRect(
                    color = visorColor,
                    topLeft = Offset(cx - 54.dp.toPx() + headTiltX, cy - 8.dp.toPx() + headTiltY + sin(time.toDouble() * 3).toFloat() * 3f),
                    size = Size(4.dp.toPx(), 8.dp.toPx())
                )
            }

            drawRect(
                color = Color(0xFF222638),
                topLeft = Offset(cx + 46.dp.toPx() + headTiltX, cy - 14.dp.toPx() + headTiltY),
                size = Size(10.dp.toPx(), 26.dp.toPx())
            )
            if (animationState != "death") {
                drawRect(
                    color = visorColor,
                    topLeft = Offset(cx + 50.dp.toPx() + headTiltX, cy - 8.dp.toPx() + headTiltY + cos(time.toDouble() * 3).toFloat() * 3f),
                    size = Size(4.dp.toPx(), 8.dp.toPx())
                )
            }

            // 6. Central Visor Housing
            drawRoundRect(
                color = Color(0xFF090A10),
                topLeft = Offset(cx - 32.dp.toPx() + headTiltX, cy - 12.dp.toPx() + headTiltY),
                size = Size(64.dp.toPx(), 26.dp.toPx()),
                cornerRadius = CornerRadius(7.dp.toPx(), 7.dp.toPx())
            )
            drawRoundRect(
                color = Color(0xFF2B324D),
                topLeft = Offset(cx - 32.dp.toPx() + headTiltX, cy - 12.dp.toPx() + headTiltY),
                size = Size(64.dp.toPx(), 26.dp.toPx()),
                cornerRadius = CornerRadius(7.dp.toPx(), 7.dp.toPx()),
                style = Stroke(width = 1.2.dp.toPx())
            )

            // 7. Visor Animations
            val vX = cx + headTiltX
            val vY = cy + 1.dp.toPx() + headTiltY
            
            when (animationState) {
                "talk" -> {
                    val waveCount = 8
                    val step = 54.dp.toPx() / waveCount
                    for (i in 0 until waveCount) {
                        val waveH = (sin((time * 5 + i * 0.75).toDouble()).toFloat().coerceAtLeast(0f) * 16.dp.toPx()) + 3.dp.toPx()
                        val px = vX - 27.dp.toPx() + i * step + step / 2
                        drawLine(
                            color = visorColor,
                            start = Offset(px, vY - waveH / 2),
                            end = Offset(px, vY + waveH / 2),
                            strokeWidth = 2.2.dp.toPx()
                        )
                    }
                }
                "win" -> {
                    // Happy twin chevron eyes
                    val leftEyeX = vX - 14.dp.toPx()
                    val rightEyeX = vX + 14.dp.toPx()
                    drawLine(visorColor, Offset(leftEyeX - 6.dp.toPx(), vY + 2.dp.toPx()), Offset(leftEyeX, vY - 4.dp.toPx()), strokeWidth = 2.5.dp.toPx())
                    drawLine(visorColor, Offset(leftEyeX, vY - 4.dp.toPx()), Offset(leftEyeX + 6.dp.toPx(), vY + 2.dp.toPx()), strokeWidth = 2.5.dp.toPx())
                    drawLine(visorColor, Offset(rightEyeX - 6.dp.toPx(), vY + 2.dp.toPx()), Offset(rightEyeX, vY - 4.dp.toPx()), strokeWidth = 2.5.dp.toPx())
                    drawLine(visorColor, Offset(rightEyeX, vY - 4.dp.toPx()), Offset(rightEyeX + 6.dp.toPx(), vY + 2.dp.toPx()), strokeWidth = 2.5.dp.toPx())
                }
                "wave" -> {
                    // Waving hand on visor
                    val waveAngle = sin(fastTime.toDouble() * 3.0).toFloat() * 15f
                    val handX = vX
                    val handY = vY + 4.dp.toPx()
                    drawCircle(visorColor, radius = 4.dp.toPx(), center = Offset(handX, handY - 4.dp.toPx()))
                    drawLine(visorColor, Offset(handX - 5.dp.toPx(), handY), Offset(handX + 5.dp.toPx(), handY), strokeWidth = 2.dp.toPx())
                    drawLine(visorColor, Offset(handX - 4.dp.toPx(), handY), Offset(handX - 6.dp.toPx() - waveAngle/5, handY - 6.dp.toPx()), strokeWidth = 1.5.dp.toPx())
                    drawLine(visorColor, Offset(handX + 4.dp.toPx(), handY), Offset(handX + 6.dp.toPx() + waveAngle/5, handY - 6.dp.toPx()), strokeWidth = 1.5.dp.toPx())
                }
                "punch" -> {
                    // Aggressive slash
                    drawLine(visorColor, Offset(vX - 20.dp.toPx(), vY - 8.dp.toPx()), Offset(vX + 20.dp.toPx(), vY + 8.dp.toPx()), strokeWidth = 3.dp.toPx())
                    drawLine(visorColor, Offset(vX - 20.dp.toPx(), vY + 8.dp.toPx()), Offset(vX + 20.dp.toPx(), vY - 8.dp.toPx()), strokeWidth = 3.dp.toPx())
                }
                "hit" -> {
                    // Flicker static
                    if (Random.nextFloat() > 0.3f) {
                        for (i in 0..10) {
                            val px = vX - 25.dp.toPx() + Random.nextFloat() * 50.dp.toPx()
                            val py = vY - 10.dp.toPx() + Random.nextFloat() * 20.dp.toPx()
                            drawRect(visorColor, topLeft = Offset(px, py), size = Size(4.dp.toPx(), 2.dp.toPx()))
                        }
                    }
                }
                "death" -> {
                    // X_X
                    val leftEyeX = vX - 12.dp.toPx()
                    val rightEyeX = vX + 12.dp.toPx()
                    val size = 5.dp.toPx()
                    drawLine(visorColor, Offset(leftEyeX - size, vY - size), Offset(leftEyeX + size, vY + size), strokeWidth = 2.dp.toPx())
                    drawLine(visorColor, Offset(leftEyeX - size, vY + size), Offset(leftEyeX + size, vY - size), strokeWidth = 2.dp.toPx())
                    drawLine(visorColor, Offset(rightEyeX - size, vY - size), Offset(rightEyeX + size, vY + size), strokeWidth = 2.dp.toPx())
                    drawLine(visorColor, Offset(rightEyeX - size, vY + size), Offset(rightEyeX + size, vY - size), strokeWidth = 2.dp.toPx())
                }
                "thinking" -> {
                    // Rotating dots
                    val dotCount = 3
                    val rotTime = fastTime.toDouble()
                    for (i in 0 until dotCount) {
                        val angle = rotTime + (i * PI * 2.0 / dotCount)
                        val dx = vX + (cos(angle) * 12.dp.toPx()).toFloat()
                        val dy = vY + (sin(angle) * 12.dp.toPx()).toFloat()
                        drawCircle(visorColor, radius = 3.dp.toPx(), center = Offset(dx, dy))
                    }
                }
                "bluff" -> {
                    // Sunglasses (Poker face)
                    drawRoundRect(
                        color = Color.Black,
                        topLeft = Offset(vX - 22.dp.toPx(), vY - 6.dp.toPx()),
                        size = Size(18.dp.toPx(), 12.dp.toPx()),
                        cornerRadius = CornerRadius(2.dp.toPx(), 6.dp.toPx())
                    )
                    drawRoundRect(
                        color = Color.Black,
                        topLeft = Offset(vX + 4.dp.toPx(), vY - 6.dp.toPx()),
                        size = Size(18.dp.toPx(), 12.dp.toPx()),
                        cornerRadius = CornerRadius(2.dp.toPx(), 6.dp.toPx())
                    )
                    drawLine(Color.Black, Offset(vX - 4.dp.toPx(), vY - 3.dp.toPx()), Offset(vX + 4.dp.toPx(), vY - 3.dp.toPx()), strokeWidth = 2.dp.toPx())
                    // Glow lines on glasses
                    drawLine(visorColor.copy(alpha = 0.5f), Offset(vX - 18.dp.toPx(), vY - 2.dp.toPx()), Offset(vX - 8.dp.toPx(), vY - 2.dp.toPx()), strokeWidth = 1.dp.toPx())
                    drawLine(visorColor.copy(alpha = 0.5f), Offset(vX + 8.dp.toPx(), vY - 2.dp.toPx()), Offset(vX + 18.dp.toPx(), vY - 2.dp.toPx()), strokeWidth = 1.dp.toPx())
                }
                else -> {
                    // Default scan (idle, warn, walk, run, jump)
                    val scanOffset = sin((if(animationState == "run" || animationState == "jump") fastTime else time).toDouble() * 2.5).toFloat() * 20.dp.toPx()
                    drawCircle(
                        color = visorColor,
                        radius = 4.5.dp.toPx(),
                        center = Offset(vX + scanOffset, vY)
                    )
                    drawCircle(
                        color = Color.White,
                        radius = 2.dp.toPx(),
                        center = Offset(vX + scanOffset, vY)
                    )
                }
            }

            // 8. Chin Grill / Cooling Vents
            for (i in 0..2) {
                val y = cy + 20.dp.toPx() + i * 4.dp.toPx() + headTiltY
                drawLine(
                    color = Color(0xFF38405E),
                    start = Offset(cx - 14.dp.toPx() + headTiltX, y),
                    end = Offset(cx + 14.dp.toPx() + headTiltX, y),
                    strokeWidth = 1.5.dp.toPx()
                )
            }
        }

        Spacer(modifier = Modifier.height(2.dp))

        Text(
            text = "[$statusText • $statusBadge]",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = visorColor,
            fontFamily = FontFamily.Monospace,
            letterSpacing = 0.5.sp
        )
    }
}

private fun createHexagonPath(cx: Float, cy: Float, radius: Float): Path {
    val path = Path()
    for (i in 0 until 6) {
        val angle = (PI / 3.0) * i
        val x = cx + (cos(angle) * radius).toFloat()
        val y = cy + (sin(angle) * radius).toFloat()
        if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
    }
    path.close()
    return path
}

private data class Quadruple<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
