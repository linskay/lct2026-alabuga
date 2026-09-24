package ru.alabuga.bars

import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState
import ru.alabuga.bars.ui.ArenaScreen

fun main() = application {
    val windowState = rememberWindowState(width = 1280.dp, height = 800.dp)
    Window(
        onCloseRequest = ::exitApplication,
        state = windowState,
        title = "Б.А.Р.С. — Арена жестких переговоров (ОЭЗ «Алабуга»)"
    ) {
        ArenaScreen()
    }
}
