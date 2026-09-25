package ru.alabuga.arena.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
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

@Composable
fun BarsRobotCanvasView(
    animationState: String = "idle", // idle, talk, warn, win
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "robotAnim")
    val time by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 6.28318f,
        animationSpec = infiniteRepeatable(
            animation = tween(2500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "time"
    )

    val (glowColor, visorColor, statusText) = when (animationState) {
        "talk" -> Triple(Color(0xFF9D4EDD), Color(0xFF00F0FF), "SYNTHESIZING ADVICE")
        "warn" -> Triple(Color(0xFFFF3366), Color(0xFFFF3366), "BATNA COMPROMISED!")
        "win"  -> Triple(Color(0xFF10B981), Color(0xFF10B981), "DEAL SECURED")
        else   -> Triple(Color(0xFF7B2CBF), Color(0xFF00F0FF), "SCANNING • IDLE")
    }

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Canvas(modifier = Modifier.fillMaxWidth().height(160.dp)) {
            val cx = size.width / 2f
            val hover = sin(time.toDouble() * 2.0).toFloat() * 6f
            val cy = size.height / 2f + hover

            // 1. Ambient Glow
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(glowColor.copy(alpha = 0.45f), Color.Transparent),
                    center = Offset(cx, cy),
                    radius = 90.dp.toPx()
                ),
                radius = 90.dp.toPx(),
                center = Offset(cx, cy)
            )

            // 2. Holographic orbit ring
            drawCircle(
                color = if (animationState == "warn") Color(0xFFFF3366).copy(alpha = 0.4f) else Color(0xFF7B2CBF).copy(alpha = 0.35f),
                radius = 65.dp.toPx(),
                center = Offset(cx, cy),
                style = Stroke(width = 1.5.dp.toPx())
            )

            // 3. Titanium Hexagon Armor Head
            val path = Path().apply {
                moveTo(cx - 45.dp.toPx(), cy - 25.dp.toPx())
                lineTo(cx, cy - 50.dp.toPx())
                lineTo(cx + 45.dp.toPx(), cy - 25.dp.toPx())
                lineTo(cx + 38.dp.toPx(), cy + 30.dp.toPx())
                lineTo(cx, cy + 45.dp.toPx())
                lineTo(cx - 38.dp.toPx(), cy + 30.dp.toPx())
                close()
            }
            drawPath(path, color = Color(0xFF181A24))
            drawPath(
                path,
                color = if (animationState == "warn") Color(0xFFFF3366) else Color(0xFF7B2CBF),
                style = Stroke(width = 2.dp.toPx())
            )

            // 4. Side Ears/Antennas
            drawRect(
                color = Color(0xFF252837),
                topLeft = Offset(cx - 56.dp.toPx(), cy - 12.dp.toPx()),
                size = Size(9.dp.toPx(), 24.dp.toPx())
            )
            drawRect(
                color = visorColor,
                topLeft = Offset(cx - 54.dp.toPx(), cy - 8.dp.toPx() + sin(time.toDouble() * 3).toFloat() * 3f),
                size = Size(3.dp.toPx(), 7.dp.toPx())
            )

            drawRect(
                color = Color(0xFF252837),
                topLeft = Offset(cx + 47.dp.toPx(), cy - 12.dp.toPx()),
                size = Size(9.dp.toPx(), 24.dp.toPx())
            )
            drawRect(
                color = visorColor,
                topLeft = Offset(cx + 51.dp.toPx(), cy - 8.dp.toPx() + cos(time.toDouble() * 3).toFloat() * 3f),
                size = Size(3.dp.toPx(), 7.dp.toPx())
            )

            // 5. Central Visor
            drawRoundRect(
                color = Color(0xFF0C0D12),
                topLeft = Offset(cx - 30.dp.toPx(), cy - 12.dp.toPx()),
                size = Size(60.dp.toPx(), 24.dp.toPx()),
                cornerRadius = CornerRadius(6.dp.toPx(), 6.dp.toPx())
            )
            drawRoundRect(
                color = Color(0xFF2B2F42),
                topLeft = Offset(cx - 30.dp.toPx(), cy - 12.dp.toPx()),
                size = Size(60.dp.toPx(), 24.dp.toPx()),
                cornerRadius = CornerRadius(6.dp.toPx(), 6.dp.toPx()),
                style = Stroke(width = 1.dp.toPx())
            )

            // 6. Visor content (Scanning beam or equalizer)
            if (animationState == "talk") {
                val waveCount = 7
                val step = 50.dp.toPx() / waveCount
                for (i in 0 until waveCount) {
                    val waveH = (sin((time * 5 + i * 0.8).toDouble()).toFloat().coerceAtLeast(0f) * 14.dp.toPx()) + 3.dp.toPx()
                    val px = cx - 24.dp.toPx() + i * step + step / 2
                    drawLine(
                        color = visorColor,
                        start = Offset(px, cy - waveH / 2),
                        end = Offset(px, cy + waveH / 2),
                        strokeWidth = 2.dp.toPx()
                    )
                }
            } else {
                val scanOffset = sin(time.toDouble() * 2.5).toFloat() * 18.dp.toPx()
                drawCircle(
                    color = visorColor,
                    radius = 4.dp.toPx(),
                    center = Offset(cx + scanOffset, cy)
                )
                drawCircle(
                    color = Color.White,
                    radius = 2.dp.toPx(),
                    center = Offset(cx + scanOffset, cy)
                )
            }

            // 7. Chin grill
            for (i in 0..2) {
                val y = cy + 18.dp.toPx() + i * 4.dp.toPx()
                drawLine(
                    color = Color(0xFF383D54),
                    start = Offset(cx - 12.dp.toPx(), y),
                    end = Offset(cx + 12.dp.toPx(), y),
                    strokeWidth = 1.5.dp.toPx()
                )
            }
        }

        Text(
            text = "[$statusText]",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = visorColor,
            fontFamily = FontFamily.Monospace
        )
    }
}
