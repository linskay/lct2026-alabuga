package ru.alabuga.arena.desktop

import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState
import ru.alabuga.arena.App

fun main() = application {
    val windowState = rememberWindowState(width = 1200.dp, height = 820.dp)

    Window(
        onCloseRequest = ::exitApplication,
        state = windowState,
        title = "Арена переговоров | ОЭЗ «Алабуга» — 3D Б.А.Р.С."
    ) {
        App()
    }
}
