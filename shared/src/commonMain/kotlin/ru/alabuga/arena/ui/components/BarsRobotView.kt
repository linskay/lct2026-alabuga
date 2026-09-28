package ru.alabuga.arena.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Composable
expect fun BarsRobotView(
    animation: String = "idle",
    modifier: Modifier = Modifier,
    height: Dp = 260.dp,
    onClick: (() -> Unit)? = null
)
