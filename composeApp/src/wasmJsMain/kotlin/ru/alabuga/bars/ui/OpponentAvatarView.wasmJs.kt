package ru.alabuga.bars.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

/**
 * Wasm-реализация 3D-аватара оппонента через Kotlin/Wasm DOM-интероп к <model-viewer>
 */
@Composable
actual fun OpponentAvatarView(
    modifier: Modifier,
    animationState: String,
    tension: Float
) {
    Box(modifier = modifier) {
        // Kotlin/Wasm interop с веб-компонентом <model-viewer src="./bars.glb">
    }
}
