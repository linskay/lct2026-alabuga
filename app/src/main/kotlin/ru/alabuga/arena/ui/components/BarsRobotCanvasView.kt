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
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.cos
import kotlin.math.sin

/**
 * High-fidelity 3D-styled animated tactical robot mentor avatar (Б.А.Р.С. / Mike)
 * Renders full cybernetic chassis: head, dual-tier neon visor, chest reactor core,
 * articulated shoulders and hydraulic arms with dynamic states: idle, talk, warn, win.
 */
@Composable
fun BarsRobotCanvasView(
    animationState: String = "idle", // idle, talk, warn, win
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

    val (glowColor, visorColor, statusText, statusBadge) = when (animationState) {
        "talk" -> Quadruple(Color(0xFF9D4EDD), Color(0xFF00F0FF), "СИНТЕЗ ТАКТИКИ", "Б.А.Р.С. ИНСТРУКТИРУЕТ")
        "warn" -> Quadruple(Color(0xFFFF3366), Color(0xFFFF3366), "УГРОЗА BATNA!", "АТАКА ПОЗИЦИЙ")
        "win"  -> Quadruple(Color(0xFF10B981), Color(0xFF10B981), "УСЛОВИЯ ПРИНЯТЫ", "СДЕЛКА СОГЛАСОВАНА")
        else   -> Quadruple(Color(0xFF7B2CBF), Color(0xFF00F0FF), "СКАНЕР АКТИВЕН", "3D НАСТАВНИК ONLINE")
    }

    val clickableModifier = if (onClick != null) {
        modifier.clickable { onClick() }
    } else {
        modifier
    }

    Column(
        modifier = clickableModifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Canvas(modifier = Modifier.fillMaxWidth().height(185.dp)) {
            val cx = size.width / 2f
            val hover = sin(time.toDouble() * 2.0).toFloat() * 7f
            val cy = size.height * 0.44f + hover

            // 1. Holographic Ambient Aura
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(glowColor.copy(alpha = 0.42f), glowColor.copy(alpha = 0.12f), Color.Transparent),
                    center = Offset(cx, cy),
                    radius = 110.dp.toPx()
                ),
                radius = 110.dp.toPx(),
                center = Offset(cx, cy)
            )

            // 2. Rotating Telemetry Radar Rings
            val ringRadius = 78.dp.toPx()
            drawCircle(
                color = if (animationState == "warn") Color(0xFFFF3366).copy(alpha = 0.45f) else Color(0xFF7B2CBF).copy(alpha = 0.35f),
                radius = ringRadius,
                center = Offset(cx, cy),
                style = Stroke(width = 1.5.dp.toPx())
            )
            // Orbital pulse tick marks
            for (i in 0 until 6) {
                val angle = time.toDouble() + (i * Math.PI / 3)
                val tickX = cx + (cos(angle) * ringRadius).toFloat()
                val tickY = cy + (sin(angle) * ringRadius).toFloat()
                drawCircle(
                    color = visorColor.copy(alpha = 0.7f),
                    radius = 2.5.dp.toPx(),
                    center = Offset(tickX, tickY)
                )
            }

            // 3. Cybernetic Torso & Shoulder Armor (Chassis)
            val torsoTopY = cy + 34.dp.toPx()
            val torsoPath = Path().apply {
                moveTo(cx - 36.dp.toPx(), torsoTopY)
                lineTo(cx + 36.dp.toPx(), torsoTopY)
                lineTo(cx + 46.dp.toPx(), torsoTopY + 38.dp.toPx())
                lineTo(cx + 24.dp.toPx(), torsoTopY + 54.dp.toPx())
                lineTo(cx - 24.dp.toPx(), torsoTopY + 54.dp.toPx())
                lineTo(cx - 46.dp.toPx(), torsoTopY + 38.dp.toPx())
                close()
            }
            drawPath(torsoPath, color = Color(0xFF12141F))
            drawPath(
                torsoPath,
                color = Color(0xFF282F4A),
                style = Stroke(width = 2.dp.toPx())
            )

            // Left Shoulder Plate
            drawRoundRect(
                color = Color(0xFF1A1D2E),
                topLeft = Offset(cx - 58.dp.toPx(), torsoTopY + 2.dp.toPx()),
                size = Size(18.dp.toPx(), 26.dp.toPx()),
                cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx())
            )
            drawRoundRect(
                color = glowColor.copy(alpha = 0.6f),
                topLeft = Offset(cx - 58.dp.toPx(), torsoTopY + 2.dp.toPx()),
                size = Size(18.dp.toPx(), 26.dp.toPx()),
                cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx()),
                style = Stroke(width = 1.2.dp.toPx())
            )

            // Right Shoulder Plate
            drawRoundRect(
                color = Color(0xFF1A1D2E),
                topLeft = Offset(cx + 40.dp.toPx(), torsoTopY + 2.dp.toPx()),
                size = Size(18.dp.toPx(), 26.dp.toPx()),
                cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx())
            )
            drawRoundRect(
                color = glowColor.copy(alpha = 0.6f),
                topLeft = Offset(cx + 40.dp.toPx(), torsoTopY + 2.dp.toPx()),
                size = Size(18.dp.toPx(), 26.dp.toPx()),
                cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx()),
                style = Stroke(width = 1.2.dp.toPx())
            )

            // Dynamic Chest Arc Reactor Core
            val reactorY = torsoTopY + 20.dp.toPx()
            val reactorPulse = (sin(time.toDouble() * 3.5).toFloat() * 1.5.dp.toPx()) + 7.dp.toPx()
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

            // 4. Titanium Hexagon Armor Head
            val headPath = Path().apply {
                moveTo(cx - 46.dp.toPx(), cy - 24.dp.toPx())
                lineTo(cx, cy - 52.dp.toPx())
                lineTo(cx + 46.dp.toPx(), cy - 24.dp.toPx())
                lineTo(cx + 40.dp.toPx(), cy + 28.dp.toPx())
                lineTo(cx, cy + 44.dp.toPx())
                lineTo(cx - 40.dp.toPx(), cy + 28.dp.toPx())
                close()
            }
            drawPath(headPath, color = Color(0xFF141622))
            drawPath(
                headPath,
                color = if (animationState == "warn") Color(0xFFFF3366) else Color(0xFF7B2CBF),
                style = Stroke(width = 2.dp.toPx())
            )

            // Crest Antenna / Comm Horn
            val crestPath = Path().apply {
                moveTo(cx - 6.dp.toPx(), cy - 51.dp.toPx())
                lineTo(cx, cy - 64.dp.toPx() + sin(time.toDouble() * 4).toFloat() * 2f)
                lineTo(cx + 6.dp.toPx(), cy - 51.dp.toPx())
                close()
            }
            drawPath(crestPath, color = visorColor)

            // 5. Side Ears / Antenna Fins
            drawRect(
                color = Color(0xFF222638),
                topLeft = Offset(cx - 56.dp.toPx(), cy - 14.dp.toPx()),
                size = Size(10.dp.toPx(), 26.dp.toPx())
            )
            drawRect(
                color = visorColor,
                topLeft = Offset(cx - 54.dp.toPx(), cy - 8.dp.toPx() + sin(time.toDouble() * 3).toFloat() * 3f),
                size = Size(4.dp.toPx(), 8.dp.toPx())
            )

            drawRect(
                color = Color(0xFF222638),
                topLeft = Offset(cx + 46.dp.toPx(), cy - 14.dp.toPx()),
                size = Size(10.dp.toPx(), 26.dp.toPx())
            )
            drawRect(
                color = visorColor,
                topLeft = Offset(cx + 50.dp.toPx(), cy - 8.dp.toPx() + cos(time.toDouble() * 3).toFloat() * 3f),
                size = Size(4.dp.toPx(), 8.dp.toPx())
            )

            // 6. Central Visor Housing
            drawRoundRect(
                color = Color(0xFF090A10),
                topLeft = Offset(cx - 32.dp.toPx(), cy - 12.dp.toPx()),
                size = Size(64.dp.toPx(), 26.dp.toPx()),
                cornerRadius = CornerRadius(7.dp.toPx(), 7.dp.toPx())
            )
            drawRoundRect(
                color = Color(0xFF2B324D),
                topLeft = Offset(cx - 32.dp.toPx(), cy - 12.dp.toPx()),
                size = Size(64.dp.toPx(), 26.dp.toPx()),
                cornerRadius = CornerRadius(7.dp.toPx(), 7.dp.toPx()),
                style = Stroke(width = 1.2.dp.toPx())
            )

            // 7. Visor Interactive Wave / Scanning Beam
            if (animationState == "talk") {
                val waveCount = 8
                val step = 54.dp.toPx() / waveCount
                for (i in 0 until waveCount) {
                    val waveH = (sin((time * 5 + i * 0.75).toDouble()).toFloat().coerceAtLeast(0f) * 16.dp.toPx()) + 3.dp.toPx()
                    val px = cx - 27.dp.toPx() + i * step + step / 2
                    drawLine(
                        color = visorColor,
                        start = Offset(px, cy + 1.dp.toPx() - waveH / 2),
                        end = Offset(px, cy + 1.dp.toPx() + waveH / 2),
                        strokeWidth = 2.2.dp.toPx()
                    )
                }
            } else if (animationState == "win") {
                // Happy twin chevron eyes
                val leftEyeX = cx - 14.dp.toPx()
                val rightEyeX = cx + 14.dp.toPx()
                val eyeY = cy + 1.dp.toPx()
                // Left chevron ^
                drawLine(visorColor, Offset(leftEyeX - 6.dp.toPx(), eyeY + 2.dp.toPx()), Offset(leftEyeX, eyeY - 4.dp.toPx()), strokeWidth = 2.5.dp.toPx())
                drawLine(visorColor, Offset(leftEyeX, eyeY - 4.dp.toPx()), Offset(leftEyeX + 6.dp.toPx(), eyeY + 2.dp.toPx()), strokeWidth = 2.5.dp.toPx())
                // Right chevron ^
                drawLine(visorColor, Offset(rightEyeX - 6.dp.toPx(), eyeY + 2.dp.toPx()), Offset(rightEyeX, eyeY - 4.dp.toPx()), strokeWidth = 2.5.dp.toPx())
                drawLine(visorColor, Offset(rightEyeX, eyeY - 4.dp.toPx()), Offset(rightEyeX + 6.dp.toPx(), eyeY + 2.dp.toPx()), strokeWidth = 2.5.dp.toPx())
            } else {
                val scanOffset = sin(time.toDouble() * 2.5).toFloat() * 20.dp.toPx()
                drawCircle(
                    color = visorColor,
                    radius = 4.5.dp.toPx(),
                    center = Offset(cx + scanOffset, cy + 1.dp.toPx())
                )
                drawCircle(
                    color = Color.White,
                    radius = 2.dp.toPx(),
                    center = Offset(cx + scanOffset, cy + 1.dp.toPx())
                )
            }

            // 8. Chin Grill / Cooling Vents
            for (i in 0..2) {
                val y = cy + 20.dp.toPx() + i * 4.dp.toPx()
                drawLine(
                    color = Color(0xFF38405E),
                    start = Offset(cx - 14.dp.toPx(), y),
                    end = Offset(cx + 14.dp.toPx(), y),
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

private data class Quadruple<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
