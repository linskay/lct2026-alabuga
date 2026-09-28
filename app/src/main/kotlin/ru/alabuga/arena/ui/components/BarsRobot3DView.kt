package ru.alabuga.arena.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.romainguy.kotlin.math.Float3
import io.github.sceneview.Scene
import io.github.sceneview.node.ModelNode
import io.github.sceneview.rememberCameraNode
import io.github.sceneview.rememberEngine
import io.github.sceneview.rememberModelLoader

@Composable
fun BarsRobot3DView(
    animation: String = "idle",
    modifier: Modifier = Modifier,
    height: Dp = 300.dp
) {
    val engine = rememberEngine()
    val modelLoader = rememberModelLoader(engine)

    var loadFailed by remember { mutableStateOf(false) }

    val modelNode = remember(modelLoader) {
        try {
            val instance = modelLoader.createModelInstance("bars.glb")
            if (instance != null) {
                ModelNode(
                    modelInstance = instance,
                    scaleToUnits = 1.0f
                )
            } else {
                loadFailed = true
                null
            }
        } catch (e: Exception) {
            loadFailed = true
            null
        }
    }

    val cameraNode = rememberCameraNode(engine) {
        position = Float3(0f, 0.5f, 2.5f)
    }

    val targetAnimationName = when (animation) {
        "idle" -> "SK_ZMikeAnim_ZMIKE_Idle"
        "talk" -> "SK_ZMikeAnim_ZMIKE_WaveLoop"
        "warn" -> "SK_ZMikeAnim_ZMIKE_IdleAggro"
        "win" -> "SK_ZMikeAnim_ZMIKE_Jump"
        "wave" -> "SK_ZMikeAnim_ZMIKE_WaveLoop"
        "punch" -> "SK_ZMikeAnim_ZMIKE_PunchR"
        "hit" -> "SK_ZMikeAnim_ZMIKE_HitRegisterFront"
        "death" -> "SK_ZMikeAnim_ZMIKE_HitRegisterFront_Death"
        "thinking" -> "SK_ZMikeAnim_ZMIKE_Blinking"
        "bluff" -> "SK_ZMikeAnim_ZMIKE_Chomp"
        else -> "SK_ZMikeAnim_ZMIKE_Idle"
    }

    LaunchedEffect(animation, modelNode) {
        modelNode?.let { node ->
            try {
                node.playAnimation(targetAnimationName)
            } catch (_: Exception) {
                try {
                    if (node.animationCount > 0) {
                        node.playAnimation(0)
                    }
                } catch (_: Exception) {}
            }
        }
    }

    // Status text logic based on animation
    val (statusText, statusBadge, visorColor) = when (animation) {
        "talk" -> Triple("СИНТЕЗ ТАКТИКИ", "Б.А.Р.С. ИНСТРУКТИРУЕТ", Color(0xFF00F0FF))
        "warn", "punch", "hit", "death" -> Triple("УГРОЗА BATNA!", "АТАКА ПОЗИЦИЙ", Color(0xFFFF3366))
        "win" -> Triple("УСЛОВИЯ ПРИНЯТЫ", "СДЕЛКА СОГЛАСОВАНА", Color(0xFF10B981))
        "thinking", "bluff" -> Triple("АНАЛИЗ ОППОНЕНТА", "РАСЧЕТ ВЕРОЯТНОСТЕЙ", Color(0xFFF59E0B))
        else -> Triple("СКАНЕР АКТИВЕН", "3D НАСТАВНИК ONLINE", Color(0xFF00F0FF))
    }

    if (loadFailed || modelNode == null) {
        BarsRobotCanvasView(
            animationState = animation,
            modifier = modifier
        )
        return
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(Color(0xFF1A1A24), Color(0xFF4A1075), Color(0xFF120822))
                )
            ),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
            var lastFrameTime by remember { mutableStateOf(0L) }
            Scene(
                modifier = Modifier.fillMaxSize(),
                engine = engine,
                modelLoader = modelLoader,
                cameraNode = cameraNode,
                childNodes = listOf(modelNode),
                onFrame = { frameTimeNs ->
                    if (lastFrameTime != 0L) {
                        val deltaSeconds = (frameTimeNs - lastFrameTime) / 1_000_000_000f
                        modelNode.rotation = Float3(
                            x = modelNode.rotation.x,
                            y = modelNode.rotation.y + (10f * deltaSeconds),
                            z = modelNode.rotation.z
                        )
                    }
                    lastFrameTime = frameTimeNs
                }
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "[$statusText • $statusBadge]",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = visorColor,
            fontFamily = FontFamily.Monospace,
            letterSpacing = 0.5.sp,
            modifier = Modifier.padding(bottom = 8.dp)
        )
    }
}
