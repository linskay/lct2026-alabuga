package ru.alabuga.bars.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

/**
 * Кроссплатформенный 3D-компонент отображения аватара оппонента (робота Б.А.Р.С.)
 * - На Android: рендерится через SceneView / Filament
 * - На Wasm: рендерится через Canvas / WebGL или <model-viewer> interop
 */
@Composable
expect fun OpponentAvatarView(
    modifier: Modifier = Modifier,
    animationState: String = "idle",
    tension: Float = 0f
)
