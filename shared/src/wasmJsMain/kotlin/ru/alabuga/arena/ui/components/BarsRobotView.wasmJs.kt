package ru.alabuga.arena.ui.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp

@JsFun("(visible, x, y, width, height, anim) => { if (typeof window.setBars3D === 'function') { window.setBars3D(visible, x, y, width, height, anim); } }")
private external fun jsSetBars3D(visible: Boolean, x: Double, y: Double, width: Double, height: Double, anim: String)

@JsFun("() => { if (typeof window.hideBars3D === 'function') { window.hideBars3D(); } else if (typeof window.setBars3D === 'function') { window.setBars3D(false, 0, 0, 0, 0, ''); } }")
private external fun jsHideBars3D()

@JsFun("(callback) => { window.onBarsRobotClick = callback; }")
private external fun jsSetRobotClickHandler(callback: () -> Unit)

@JsFun("() => { window.onBarsRobotClick = null; }")
private external fun jsClearRobotClickHandler()

@Composable
actual fun BarsRobotView(
    animation: String,
    modifier: Modifier,
    height: Dp,
    onClick: (() -> Unit)?
) {
    val density = LocalDensity.current
    var posX by remember { mutableStateOf(0.0) }
    var posY by remember { mutableStateOf(0.0) }
    var widthPx by remember { mutableStateOf(0.0) }
    var heightPx by remember { mutableStateOf(0.0) }
    var isPlaced by remember { mutableStateOf(false) }

    DisposableEffect(onClick) {
        if (onClick != null) {
            jsSetRobotClickHandler {
                onClick()
            }
        }
        onDispose {
            jsClearRobotClickHandler()
        }
    }

    LaunchedEffect(animation, posX, posY, widthPx, heightPx, isPlaced) {
        if (isPlaced && widthPx > 0 && heightPx > 0) {
            jsSetBars3D(true, posX, posY, widthPx, heightPx, animation)
        } else {
            jsHideBars3D()
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            jsHideBars3D()
        }
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .onGloballyPositioned { coordinates ->
                val pos = coordinates.positionInWindow()
                val size = coordinates.size
                posX = (pos.x / density.density).toDouble()
                posY = (pos.y / density.density).toDouble()
                widthPx = (size.width / density.density).toDouble()
                heightPx = (size.height / density.density).toDouble()
                isPlaced = true
            }
    ) {
        BarsRobotCanvasView(
            animationState = animation,
            modifier = Modifier.fillMaxWidth().height(height),
            onClick = onClick
        )
    }
}
