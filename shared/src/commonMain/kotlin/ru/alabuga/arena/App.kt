package ru.alabuga.arena

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import ru.alabuga.arena.model.ScenarioConfig
import ru.alabuga.arena.model.ScenarioPresets
import ru.alabuga.arena.ui.screens.AdminScreen
import ru.alabuga.arena.ui.screens.ArenaScreen
import ru.alabuga.arena.ui.screens.HomeScreen

enum class AppScreen {
    HOME, ARENA, ADMIN
}

@Composable
fun App() {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFF00F0FF),
            secondary = Color(0xFF7B2CBF),
            background = Color(0xFF07080D),
            surface = Color(0xFF101424)
        )
    ) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            var currentScreen by remember { mutableStateOf(AppScreen.HOME) }
            var currentConfig by remember { mutableStateOf(ScenarioPresets.list.getOrElse(1) { ScenarioConfig() }) }

            when (currentScreen) {
                AppScreen.HOME -> HomeScreen(
                    onEnterArena = { currentScreen = AppScreen.ARENA },
                    onOpenAdmin = { currentScreen = AppScreen.ADMIN }
                )
                AppScreen.ADMIN -> AdminScreen(
                    currentConfig = currentConfig,
                    onBack = { currentScreen = AppScreen.HOME },
                    onStartSimulation = { newConfig ->
                        currentConfig = newConfig
                        currentScreen = AppScreen.ARENA
                    }
                )
                AppScreen.ARENA -> ArenaScreen(
                    config = currentConfig,
                    onBack = { currentScreen = AppScreen.HOME }
                )
            }
        }
    }
}
