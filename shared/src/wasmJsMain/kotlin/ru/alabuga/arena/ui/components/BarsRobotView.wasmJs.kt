package ru.alabuga.arena.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp

@Composable
actual fun BarsRobotView(
    animation: String,
    modifier: Modifier,
    height: Dp,
    onClick: (() -> Unit)?
) {
    BarsRobotCanvasView(
        animationState = animation,
        modifier = modifier,
        onClick = onClick
    )
}


