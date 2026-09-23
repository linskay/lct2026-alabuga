package com.bars.simulator

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Material 3 Dark Colors (Neon-Industrial Theme)
val DarkBackground = Color(0xFF141218)
val DarkSurface = Color(0xFF1D1B20)
val DarkSurfaceVariant = Color(0xFF2B2930)
val CyberCyan = Color(0xFF00F0FF)
val PrimaryPurple = Color(0xFFD0BCFF)
val ErrorRed = Color(0xFFF2B8B5)
val OnSurface = Color(0xFFE6E0E9)
val OutlineVariant = Color(0xFF49454F)

private val AppDarkColorScheme = darkColorScheme(
    primary = PrimaryPurple,
    secondary = CyberCyan,
    background = DarkBackground,
    surface = DarkSurface,
    surfaceVariant = DarkSurfaceVariant,
    error = ErrorRed,
    onPrimary = Color(0xFF381E72),
    onSecondary = Color(0xFF00363D),
    onBackground = OnSurface,
    onSurface = OnSurface,
    outline = OutlineVariant
)

@Composable
fun BarsTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = AppDarkColorScheme,
        content = content
    )
}
