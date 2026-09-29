package ru.alabuga.arena.ui.components

import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.toComposeImageBitmap
import androidx.compose.ui.layout.ContentScale
import java.io.InputStream
import javax.imageio.ImageIO

private val desktopAchievementImageCache = mutableMapOf<String, ImageBitmap?>()

@Composable
actual fun AchievementImageView(
    achievementId: String,
    modifier: Modifier
) {
    val bitmap = remember(achievementId) {
        desktopAchievementImageCache.getOrPut(achievementId) {
            try {
                val stream: InputStream? = object {}.javaClass.getResourceAsStream("/achievements/$achievementId.jpg")
                    ?: object {}.javaClass.getResourceAsStream("/achievements/${achievementId}.png")
                stream?.use { ImageIO.read(it)?.toComposeImageBitmap() }
            } catch (_: Throwable) {
                null
            }
        }
    }

    if (bitmap != null) {
        Image(
            bitmap = bitmap,
            contentDescription = achievementId,
            modifier = modifier,
            contentScale = ContentScale.Crop
        )
    } else {
        DefaultAchievementFallback(achievementId = achievementId, modifier = modifier)
    }
}
