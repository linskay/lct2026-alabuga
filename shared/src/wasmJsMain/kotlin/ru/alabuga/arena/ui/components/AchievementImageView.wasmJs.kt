package ru.alabuga.arena.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
actual fun AchievementImageView(
    achievementId: String,
    modifier: Modifier
) {
    DefaultAchievementFallback(achievementId = achievementId, modifier = modifier)
}
