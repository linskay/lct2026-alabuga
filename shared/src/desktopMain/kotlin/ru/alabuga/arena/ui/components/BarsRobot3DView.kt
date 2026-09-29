package ru.alabuga.arena.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.awt.SwingPanel
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jme3.animation.*
import com.jme3.app.SimpleApplication
import com.jme3.asset.plugins.ClasspathLocator
import com.jme3.light.AmbientLight
import com.jme3.light.DirectionalLight
import com.jme3.math.ColorRGBA
import com.jme3.math.FastMath
import com.jme3.math.Quaternion
import com.jme3.math.Vector3f
import com.jme3.scene.Spatial
import com.jme3.system.AppSettings
import com.jme3.system.JmeCanvasContext
import java.awt.Canvas
import java.awt.Dimension
import javax.swing.JPanel
import java.awt.BorderLayout

/**
 * Полноценный 3D-робот Б.А.Р.С. (Mike) для Compose Desktop.
 * Использует JMonkeyEngine для рендеринга GLB-модели со скелетными анимациями.
 * Встраивается в Compose через SwingPanel → JmeCanvasContext.
 *
 * 10 состояний анимации, авто-вращение, динамическое освещение.
 * При ошибке загрузки — fallback на Canvas2D BarsRobotCanvasView.
 */
@Composable
fun BarsRobot3DView(
    animation: String = "idle",
    modifier: Modifier = Modifier,
    height: Dp = 300.dp
) {
    var loadFailed by remember { mutableStateOf(false) }
    val jmeApp = remember { mutableStateOf<BarsRobotJmeApp?>(null) }

    // Маппинг состояний переговоров → анимаций модели Mike
    val targetAnimationName = when (animation) {
        "idle"     -> "SK_ZMikeAnim_ZMIKE_Idle"
        "talk"     -> "SK_ZMikeAnim_ZMIKE_WaveLoop"
        "warn"     -> "SK_ZMikeAnim_ZMIKE_IdleAggro"
        "win"      -> "SK_ZMikeAnim_ZMIKE_WaveLoop"
        "wave"     -> "SK_ZMikeAnim_ZMIKE_WaveLoop"
        "punch"    -> "SK_ZMikeAnim_ZMIKE_PunchR"
        "hit"      -> "SK_ZMikeAnim_ZMIKE_HitRegisterFront"
        "death"    -> "SK_ZMikeAnim_ZMIKE_HitRegisterFront_Death"
        "thinking" -> "SK_ZMikeAnim_ZMIKE_Blinking"
        "bluff"    -> "SK_ZMikeAnim_ZMIKE_Chomp"
        else       -> "SK_ZMikeAnim_ZMIKE_Idle"
    }

    // Отправляем смену анимации в JME-поток
    LaunchedEffect(animation) {
        jmeApp.value?.requestAnimation(targetAnimationName)
    }

    // Статусный текст
    val (statusText, statusBadge, visorColor) = when (animation) {
        "talk"     -> Triple("СИНТЕЗ ТАКТИКИ", "Б.А.Р.С. ИНСТРУКТИРУЕТ", Color(0xFF00F0FF))
        "warn", "punch", "hit", "death" -> Triple("УГРОЗА BATNA!", "АТАКА ПОЗИЦИЙ", Color(0xFFFF3366))
        "win"      -> Triple("УСЛОВИЯ ПРИНЯТЫ", "СДЕЛКА СОГЛАСОВАНА", Color(0xFF10B981))
        "thinking", "bluff" -> Triple("АНАЛИЗ ОППОНЕНТА", "РАСЧЕТ ВЕРОЯТНОСТЕЙ", Color(0xFFF59E0B))
        "wave"     -> Triple("ПРИВЕТСТВИЕ", "КОНТАКТ УСТАНОВЛЕН", Color(0xFF60A5FA))
        else       -> Triple("СКАНЕР АКТИВЕН", "3D НАСТАВНИК ONLINE", Color(0xFF00F0FF))
    }

    if (loadFailed) {
        // Fallback на Canvas2D
        BarsRobotCanvasView(animationState = animation, modifier = modifier)
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
            SwingPanel(
                modifier = Modifier.fillMaxSize(),
                factory = {
                    val panel = JPanel(BorderLayout())
                    try {
                        val settings = AppSettings(true).apply {
                            setRenderer(AppSettings.LWJGL_OPENGL33)
                            isFullscreen = false
                            setResolution(640, 480)
                            frameRate = 60
                            isVSync = true
                            setSamples(4)
                            isGammaCorrection = true
                        }

                        val app = BarsRobotJmeApp()
                        app.setSettings(settings)
                        app.setPauseOnLostFocus(false)
                        app.setShowSettings(false)
                        app.createCanvas()

                        val context = app.context as JmeCanvasContext
                        val canvas: Canvas = context.canvas
                        canvas.preferredSize = Dimension(640, 480)

                        panel.add(canvas, BorderLayout.CENTER)
                        app.startCanvas()

                        jmeApp.value = app
                    } catch (e: Exception) {
                        e.printStackTrace()
                        loadFailed = true
                    }
                    panel
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

    // Cleanup on dispose
    DisposableEffect(Unit) {
        onDispose {
            jmeApp.value?.stop()
        }
    }
}

/**
 * JMonkeyEngine 3 приложение для рендеринга GLB-робота Mike.
 * - Загружает bars.glb из classpath-ресурсов
 * - Поддерживает динамическую смену анимаций
 * - Авто-вращение модели (10°/сек)
 * - Кибер-освещение (фиолетовый ambient + направленный белый свет)
 */
class BarsRobotJmeApp : SimpleApplication() {

    private var robotModel: Spatial? = null
    private var animControl: AnimControl? = null
    private var animChannel: AnimChannel? = null
    private var pendingAnimation: String? = null
    private var autoRotateAngle = 0f

    /** Запрос смены анимации из Compose-потока (потокобезопасно) */
    @Synchronized
    fun requestAnimation(animName: String) {
        pendingAnimation = animName
    }

    @Synchronized
    private fun consumePendingAnimation(): String? {
        val anim = pendingAnimation
        pendingAnimation = null
        return anim
    }

    override fun simpleInitApp() {
        // Отключаем стандартный HUD и FlyCamera
        setDisplayStatView(false)
        setDisplayFps(false)
        flyCam.isEnabled = false

        // Настраиваем камеру
        cam.location = Vector3f(0f, 1.0f, 3.0f)
        cam.lookAt(Vector3f(0f, 0.8f, 0f), Vector3f.UNIT_Y)

        // Фон — тёмный фиолетовый (Alabuga cyberpunk)
        viewPort.backgroundColor = ColorRGBA(0.07f, 0.04f, 0.12f, 1.0f)

        // Освещение
        val ambientLight = AmbientLight().apply {
            color = ColorRGBA(0.48f, 0.17f, 0.75f, 1f).mult(0.6f) // Alabuga purple ambient
        }
        rootNode.addLight(ambientLight)

        val directionalLight = DirectionalLight().apply {
            direction = Vector3f(-1f, -1f, -1f).normalizeLocal()
            color = ColorRGBA.White.mult(1.2f)
        }
        rootNode.addLight(directionalLight)

        val fillLight = DirectionalLight().apply {
            direction = Vector3f(1f, 0.5f, 1f).normalizeLocal()
            color = ColorRGBA(0.3f, 0.8f, 1.0f, 1f).mult(0.5f) // Cyan fill
        }
        rootNode.addLight(fillLight)

        // Загрузка GLB-модели из classpath ресурсов
        try {
            assetManager.registerLocator("/", ClasspathLocator::class.java)
            robotModel = try {
                assetManager.loadModel("mike.glb")
            } catch (_: Exception) {
                try {
                    assetManager.loadModel("bars.glb")
                } catch (_: Exception) {
                    null
                }
            }
            robotModel?.let { model ->
                // Масштабируем и позиционируем
                model.setLocalScale(1.0f)
                model.setLocalTranslation(0f, 0f, 0f)
                rootNode.attachChild(model)

                // Ищем AnimControl для скелетных анимаций
                animControl = model.getControl(AnimControl::class.java)
                    ?: findAnimControl(model)

                animControl?.let { ctrl ->
                    animChannel = ctrl.createChannel()
                    // Начальная анимация — Приветственное помахивание (WaveLoop) как на эталонном экране
                    val waveAnim = "SK_ZMikeAnim_ZMIKE_WaveLoop"
                    val exitWave = "SK_ZMikeAnim_ZMIKE_ExitWave"
                    val idleAnim = "SK_ZMikeAnim_ZMIKE_Idle"
                    when {
                        ctrl.animationNames.contains(waveAnim) -> {
                            animChannel?.setAnim(waveAnim)
                            animChannel?.setLoopMode(LoopMode.Loop)
                        }
                        ctrl.animationNames.contains(exitWave) -> {
                            animChannel?.setAnim(exitWave)
                            animChannel?.setLoopMode(LoopMode.Loop)
                        }
                        ctrl.animationNames.contains(idleAnim) -> {
                            animChannel?.setAnim(idleAnim)
                            animChannel?.setLoopMode(LoopMode.Loop)
                        }
                        ctrl.animationNames.isNotEmpty() -> {
                            animChannel?.setAnim(ctrl.animationNames.first())
                            animChannel?.setLoopMode(LoopMode.Loop)
                        }
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /** Рекурсивно ищет AnimControl в дочерних нодах */
    private fun findAnimControl(spatial: Spatial): AnimControl? {
        if (spatial is com.jme3.scene.Node) {
            for (child in spatial.children) {
                val ctrl = child.getControl(AnimControl::class.java)
                if (ctrl != null) return ctrl
                val found = findAnimControl(child)
                if (found != null) return found
            }
        }
        return null
    }

    override fun simpleUpdate(tpf: Float) {
        // Робот смотрит прямо на пользователя без неконтролируемого вращения боком
        robotModel?.localRotation = Quaternion.IDENTITY

        // Применяем отложенную смену анимации с маппингом из общих имен в GLB-анимации Майка
        val rawAnim = consumePendingAnimation()
        if (rawAnim != null) {
            animControl?.let { ctrl ->
                val mappedAnim = when (rawAnim.lowercase()) {
                    "wave" -> "SK_ZMikeAnim_ZMIKE_WaveLoop"
                    "idle" -> "SK_ZMikeAnim_ZMIKE_WaveLoop"
                    "talk" -> "SK_ZMikeAnim_ZMIKE_IdleBreaker"
                    "nod" -> "SK_ZMikeAnim_ZMIKE_ExitWave"
                    "tilt" -> "SK_ZMikeAnim_ZMIKE_Blinking"
                    "bluff" -> "SK_ZMikeAnim_ZMIKE_IdleAggro"
                    "jump" -> "SK_ZMikeAnim_ZMIKE_Jump"
                    else -> rawAnim
                }
                val targetAnim = if (ctrl.animationNames.contains(mappedAnim)) {
                    mappedAnim
                } else if (ctrl.animationNames.contains(rawAnim)) {
                    rawAnim
                } else {
                    null
                }
                if (targetAnim != null) {
                    animChannel?.setAnim(targetAnim, 0.3f) // 0.3s blend
                    animChannel?.setLoopMode(
                        if (targetAnim.contains("Death") || targetAnim.contains("Hit") || targetAnim.contains("Jump")) {
                            LoopMode.DontLoop
                        } else {
                            LoopMode.Loop
                        }
                    )
                }
            }
        }
    }
}
