package ru.alabuga.bars.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

/**
 * Android-реализация 3D-аватара оппонента (SceneView / Filament GLTF)
 */
@Composable
actual fun OpponentAvatarView(
    modifier: Modifier,
    animationState: String,
    tension: Float
) {
    Box(modifier = modifier) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context ->
                // Нативный SceneView / ModelSurfaceView для Android
                android.widget.FrameLayout(context).apply {
                    // Инициализация SceneView с bars.glb и воспроизведение animationState
                }
            },
            update = { view ->
                // Обновление состояния анимации (idle, talk, warn, win)
            }
        )
    }
}
