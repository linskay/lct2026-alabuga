package ru.alabuga.arena.ui.components

import android.content.Context
import android.graphics.BitmapFactory
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Android кэш и загрузчик 3D-кадров каноничного робота-наставника Б.А.Р.С.
 * Кадры загружаются из Android Assets с прозрачным альфа-каналом.
 */
object AndroidBarsRobotAssets {
    private val cache = mutableMapOf<String, ImageBitmap?>()

    fun getFrame(context: Context, prefix: String, index: Int): ImageBitmap? {
        val key = "${prefix}_$index"
        if (cache.containsKey(key)) {
            return cache[key]
        }

        val assetPath = "robot/$key.png"
        val bitmap = try {
            context.assets.open(assetPath).use { inputStream ->
                BitmapFactory.decodeStream(inputStream)?.asImageBitmap()
            }
        } catch (_: Throwable) {
            try {
                // Фолбэк на загрузку из classloader ресурсов
                val resStream = AndroidBarsRobotAssets::class.java.getResourceAsStream("/robot/$key.png")
                    ?: AndroidBarsRobotAssets::class.java.classLoader?.getResourceAsStream("robot/$key.png")
                    ?: Thread.currentThread().contextClassLoader?.getResourceAsStream("robot/$key.png")
                resStream?.use { BitmapFactory.decodeStream(it)?.asImageBitmap() }
            } catch (_: Throwable) {
                null
            }
        }

        cache[key] = bitmap
        return bitmap
    }

    const val WAVE_COUNT = 16
    const val IDLE_COUNT = 12
    const val PUNCH_COUNT = 10
    const val WARN_COUNT = 10
    const val WIN_COUNT = 10
}

@Composable
actual fun BarsRobotView(
    animation: String,
    modifier: Modifier,
    height: Dp,
    onClick: (() -> Unit)?
) {
    val context = LocalContext.current
    val interactionSource = remember { MutableInteractionSource() }

    // Конфигурация анимации
    val (prefix, frameCount, durationMs) = remember(animation) {
        when (animation.lowercase()) {
            "wave" -> Triple("wave", AndroidBarsRobotAssets.WAVE_COUNT, 1400)
            "punch", "hit", "bluff" -> Triple("punch", AndroidBarsRobotAssets.PUNCH_COUNT, 900)
            "warn", "no" -> Triple("warn", AndroidBarsRobotAssets.WARN_COUNT, 1100)
            "win", "jump", "dance" -> Triple("win", AndroidBarsRobotAssets.WIN_COUNT, 1100)
            "idle", "talk", "nod", "yes", "tilt", "sitting", "thinking" -> Triple("wave", AndroidBarsRobotAssets.WAVE_COUNT, 1600)
            else -> Triple("wave", AndroidBarsRobotAssets.WAVE_COUNT, 1500)
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "androidBarsRobotLoop")
    val frameIndex by infiniteTransition.animateValue(
        initialValue = 0,
        targetValue = frameCount - 1,
        typeConverter = Int.VectorConverter,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = durationMs, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "androidBarsFrameIndex"
    )

    val currentBitmap = remember(prefix, frameIndex) {
        AndroidBarsRobotAssets.getFrame(context, prefix, frameIndex)
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .clickable(
                interactionSource = interactionSource,
                indication = null
            ) { onClick?.invoke() },
        contentAlignment = Alignment.Center
    ) {
        if (currentBitmap != null) {
            Image(
                bitmap = currentBitmap,
                contentDescription = "3D Робот-наставник Б.А.Р.С.",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Fit
            )
        } else {
            // Резервный режим на Canvas в случае отсутствия ассетов
            BarsRobotCanvasView(
                animationState = animation,
                modifier = Modifier.fillMaxSize(),
                onClick = onClick
            )
        }
    }
}
