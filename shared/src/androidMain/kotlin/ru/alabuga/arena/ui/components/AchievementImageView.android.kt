package ru.alabuga.arena.ui.components

import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext

private val androidAchievementImageCache = mutableMapOf<String, ImageBitmap?>()

@Composable
actual fun AchievementImageView(
    achievementId: String,
    modifier: Modifier
) {
    val context = LocalContext.current
    val bitmap = remember(achievementId) {
        androidAchievementImageCache.getOrPut(achievementId) {
            try {
                context.assets.open("achievements/$achievementId.jpg").use { inputStream ->
                    BitmapFactory.decodeStream(inputStream)?.asImageBitmap()
                }
            } catch (_: Throwable) {
                try {
                    context.assets.open("achievements/$achievementId.png").use { inputStream ->
                        BitmapFactory.decodeStream(inputStream)?.asImageBitmap()
                    }
                } catch (_: Throwable) {
                    null
                }
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
