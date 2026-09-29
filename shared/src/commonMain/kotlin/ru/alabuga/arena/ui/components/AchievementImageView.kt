package ru.alabuga.arena.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
expect fun AchievementImageView(
    achievementId: String,
    modifier: Modifier = Modifier
)

@Composable
fun DefaultAchievementFallback(
    achievementId: String,
    modifier: Modifier = Modifier
) {
    val (icon, bgColors, tintColor) = when (achievementId) {
        "batna_shield" -> Triple(
            Icons.Default.Security,
            listOf(Color(0xFF1E1B4B), Color(0xFF312E81)),
            Color(0xFF818CF8)
        )
        "bluff_buster" -> Triple(
            Icons.Default.Radar,
            listOf(Color(0xFF451A03), Color(0xFF78350F)),
            Color(0xFFFBBF24)
        )
        "hidden_pain" -> Triple(
            Icons.Default.ManageSearch,
            listOf(Color(0xFF042F2E), Color(0xFF115E59)),
            Color(0xFF2DD4BF)
        )
        "power_capex" -> Triple(
            Icons.Default.Bolt,
            listOf(Color(0xFF2E1065), Color(0xFF581C87)),
            Color(0xFFC084FC)
        )
        "grandmaster_s" -> Triple(
            Icons.Default.EmojiEvents,
            listOf(Color(0xFF3F2C06), Color(0xFF854D0E)),
            Color(0xFFFDE047)
        )
        else -> Triple(
            Icons.Default.Stars,
            listOf(Color(0xFF1E293B), Color(0xFF0F172A)),
            Color(0xFF94A3B8)
        )
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Brush.linearGradient(bgColors))
            .border(1.dp, tintColor.copy(alpha = 0.5f), RoundedCornerShape(12.dp)),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = achievementId,
            tint = tintColor,
            modifier = Modifier.size(28.dp)
        )
    }
}
