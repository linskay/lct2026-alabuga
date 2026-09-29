package ru.alabuga.arena.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.awt.SwingPanel
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.jme3.animation.*
import com.jme3.app.SimpleApplication
import com.jme3.asset.plugins.ClasspathLocator
import com.jme3.light.AmbientLight
import com.jme3.light.DirectionalLight
import com.jme3.math.ColorRGBA
import com.jme3.math.Quaternion
import com.jme3.math.Vector3f
import com.jme3.scene.Spatial
import com.jme3.system.AppSettings
import com.jme3.system.JmeCanvasContext
import java.awt.BorderLayout
import java.awt.Canvas
import java.awt.Dimension
import java.awt.event.MouseAdapter
import java.awt.event.MouseEvent
import javax.swing.JPanel

/**
 * Глобальный синглтон-менеджер 3D-движка JMonkeyEngine для десктопной версии.
 * Позволяет бесшовно перемещать AWT Canvas между экранами (HomeScreen ↔ ArenaScreen)
 * без уничтожения и повторного создания контекста OpenGL (что предотвращает сбои LWJGL3).
 */
object BarsRobot3DManager {
    @Volatile
    var app: BarsRobotJmeApp? = null
        private set

    @Volatile
    var canvas: Canvas? = null
        private set

    @Volatile
    var isFailed: Boolean = false
        private set

    private var initAttempted = false
    private var clickCallback: (() -> Unit)? = null

    fun setOnClick(callback: (() -> Unit)?) {
        clickCallback = callback
    }

    @Synchronized
    fun getOrCreateCanvas(): Canvas? {
        if (isFailed) return null
        if (canvas != null) return canvas
        if (initAttempted) return null
        initAttempted = true

        // Попытка 1: Запуск с современным LWJGL OpenGL 3
        try {
            val c = initJme(AppSettings.LWJGL_OPENGL3)
            if (c != null) return c
        } catch (e: Throwable) {
            println("[BarsRobot3D] OpenGL 3 init failed, falling back to OpenGL 2: ${e.message}")
        }

        // Попытка 2: Fallback на совместимый OpenGL 2
        try {
            val c = initJme(AppSettings.LWJGL_OPENGL2)
            if (c != null) return c
        } catch (e: Throwable) {
            println("[BarsRobot3D] OpenGL 2 init failed: ${e.message}")
        }

        isFailed = true
        return null
    }

    private fun initJme(renderer: String): Canvas? {
        val settings = AppSettings(true).apply {
            setRenderer(renderer)
            isFullscreen = false
            setResolution(640, 480)
            frameRate = 60
            isVSync = true
            setAudioRenderer(null) // Аудио не требуется
        }

        val jmeApp = BarsRobotJmeApp()
        jmeApp.setSettings(settings)
        jmeApp.setPauseOnLostFocus(false)
        jmeApp.setShowSettings(false)
        jmeApp.createCanvas()

        val context = jmeApp.context as JmeCanvasContext
        val c = context.canvas
        c.preferredSize = Dimension(640, 480)
        c.minimumSize = Dimension(120, 120)

        // Обработчик клика мыши напрямую по AWT-холсту
        c.addMouseListener(object : MouseAdapter() {
            override fun mouseClicked(e: MouseEvent) {
                clickCallback?.invoke()
            }
        })

        jmeApp.startCanvas()

        app = jmeApp
        canvas = c
        return c
    }

    fun requestAnimation(anim: String) {
        app?.requestAnimation(anim)
    }
}

/**
 * Полноценный 3D-робот Б.А.Р.С. для Compose Desktop.
 * Рендерит каноничную 3D-модель Б.А.Р.С. (bars.glb) с аутентичными анимациями (Wave, Idle, ThumbsUp, No, Punch и др.).
 * Встраивается в Compose через SwingPanel с долгоживущим AWT Canvas.
 */
@Composable
fun BarsRobot3DView(
    animation: String = "idle",
    modifier: Modifier = Modifier,
    height: Dp = 300.dp,
    onClick: (() -> Unit)? = null
) {
    var loadFailed by remember { mutableStateOf(BarsRobot3DManager.isFailed) }
    val interactionSource = remember { MutableInteractionSource() }

    LaunchedEffect(onClick) {
        BarsRobot3DManager.setOnClick(onClick)
    }

    LaunchedEffect(animation) {
        BarsRobot3DManager.requestAnimation(animation)
    }

    if (loadFailed) {
        // Fallback на Canvas2D в случае отсутствия поддержки аппаратного 3D
        BarsRobotCanvasView(animationState = animation, modifier = modifier)
        return
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .clickable(
                interactionSource = interactionSource,
                indication = null
            ) { onClick?.invoke() },
        contentAlignment = Alignment.Center
    ) {
        SwingPanel(
            modifier = Modifier.fillMaxSize(),
            factory = {
                val panel = JPanel(BorderLayout()).apply {
                    isOpaque = true
                    background = java.awt.Color(11, 14, 27) // #0B0E1B - глубокий киберпанк-фон
                }
                val c = BarsRobot3DManager.getOrCreateCanvas()
                if (c != null) {
                    val prevParent = c.parent
                    if (prevParent != null && prevParent != panel) {
                        (prevParent as? java.awt.Container)?.remove(c)
                        prevParent.revalidate()
                        prevParent.repaint()
                    }
                    panel.add(c, BorderLayout.CENTER)
                    panel.revalidate()
                    panel.repaint()
                    BarsRobot3DManager.requestAnimation(animation)
                } else {
                    loadFailed = true
                }
                panel
            },
            update = { panel ->
                val c = BarsRobot3DManager.canvas
                if (c != null && c.parent != panel) {
                    val prevParent = c.parent
                    if (prevParent != null) {
                        (prevParent as? java.awt.Container)?.remove(c)
                        prevParent.revalidate()
                        prevParent.repaint()
                    }
                    panel.removeAll()
                    panel.add(c, BorderLayout.CENTER)
                    panel.revalidate()
                    panel.repaint()
                }
                BarsRobot3DManager.requestAnimation(animation)
            }
        )
    }
}

/**
 * JMonkeyEngine 3 приложение для рендеринга каноничной 3D-модели Б.А.Р.С.
 * - Загружает оригинальную модель Б.А.Р.С. (bars.glb)
 * - Поддерживает жесты: Wave, Idle, ThumbsUp, No, Punch, Jump, Dance, Yes, Death
 * - Камера сфокусирована на наставнике (фокус на торс и голову с антенной)
 * - Киберпанк-освещение ОЭЗ «Алабуга» (неоновый металлик, синий и фиолетовый акценты)
 */
class BarsRobotJmeApp : SimpleApplication() {

    private var robotModel: Spatial? = null
    private var animControl: AnimControl? = null
    private var animChannel: AnimChannel? = null
    private var pendingAnimation: String? = null
    private var isBarsModel = true

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
        // Отключаем стандартный HUD и свободную камеру
        setDisplayStatView(false)
        setDisplayFps(false)
        flyCam.isEnabled = false

        // Настройка камеры под каноничный ракурс наставника Б.А.Р.С.
        cam.location = Vector3f(0f, 1.15f, 3.2f)
        cam.lookAt(Vector3f(0f, 1.05f, 0f), Vector3f.UNIT_Y)

        // Глубокий темно-синий/фиолетовый фон (#0B0E1B), идеально сливающийся с интерфейсом
        viewPort.backgroundColor = ColorRGBA(0.043f, 0.055f, 0.106f, 1.0f)

        // Освещение для металлического неонового блеска
        val ambientLight = AmbientLight().apply {
            color = ColorRGBA(0.18f, 0.22f, 0.35f, 1f)
        }
        rootNode.addLight(ambientLight)

        // Основной белый направленный свет спереди-сверху
        val mainLight = DirectionalLight().apply {
            direction = Vector3f(-0.4f, -1.0f, -0.9f).normalizeLocal()
            color = ColorRGBA.White.mult(1.5f)
        }
        rootNode.addLight(mainLight)

        // Голубой неоновый свет (Alabuga Cyan)
        val cyanFillLight = DirectionalLight().apply {
            direction = Vector3f(0.8f, 0.3f, 0.8f).normalizeLocal()
            color = ColorRGBA(0.0f, 0.94f, 1.0f, 1.0f).mult(0.9f)
        }
        rootNode.addLight(cyanFillLight)

        // Фиолетовый контурный свет (Alabuga Purple Rim)
        val purpleRimLight = DirectionalLight().apply {
            direction = Vector3f(-0.8f, 0.5f, 1.0f).normalizeLocal()
            color = ColorRGBA(0.48f, 0.17f, 0.75f, 1.0f).mult(0.85f)
        }
        rootNode.addLight(purpleRimLight)

        // Загрузка 3D-модели Б.А.Р.С.
        try {
            assetManager.registerLocator("/", ClasspathLocator::class.java)

            // Загружаем в первую очередь аутентичного робота Б.А.Р.С.
            robotModel = try {
                assetManager.loadModel("bars.glb")
            } catch (_: Exception) {
                try {
                    assetManager.loadModel("mike.glb")
                } catch (_: Exception) {
                    null
                }
            }

            robotModel?.let { model ->
                model.setLocalScale(1.0f)
                model.setLocalTranslation(0f, 0f, 0f)
                model.localRotation = Quaternion.IDENTITY
                rootNode.attachChild(model)

                animControl = model.getControl(AnimControl::class.java) ?: findAnimControl(model)

                animControl?.let { ctrl ->
                    animChannel = ctrl.createChannel()
                    isBarsModel = ctrl.animationNames.contains("Wave") || ctrl.animationNames.contains("Idle")

                    // По умолчанию запускаем фирменный приветственный жест рукой (Wave)
                    val defaultAnim = when {
                        isBarsModel && ctrl.animationNames.contains("Wave") -> "Wave"
                        isBarsModel && ctrl.animationNames.contains("Idle") -> "Idle"
                        ctrl.animationNames.contains("SK_ZMikeAnim_ZMIKE_WaveLoop") -> "SK_ZMikeAnim_ZMIKE_WaveLoop"
                        ctrl.animationNames.isNotEmpty() -> ctrl.animationNames.first()
                        else -> null
                    }

                    defaultAnim?.let {
                        animChannel?.setAnim(it)
                        animChannel?.setLoopMode(LoopMode.Loop)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

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
        // Робот смотрит прямо на пользователя
        robotModel?.localRotation = Quaternion.IDENTITY

        val rawAnim = consumePendingAnimation()
        if (rawAnim != null) {
            animControl?.let { ctrl ->
                val targetAnim = if (isBarsModel) {
                    when (rawAnim.lowercase()) {
                        "wave" -> "Wave"
                        "idle" -> if (ctrl.animationNames.contains("Wave")) "Wave" else "Idle"
                        "talk" -> if (ctrl.animationNames.contains("Wave")) "Wave" else "Idle"
                        "nod", "yes" -> "Yes"
                        "tilt", "sitting", "thinking" -> if (ctrl.animationNames.contains("Sitting")) "Sitting" else "Idle"
                        "warn", "no" -> "No"
                        "win", "thumbsup" -> "ThumbsUp"
                        "punch", "hit", "bluff" -> "Punch"
                        "death" -> "Death"
                        "jump" -> "Jump"
                        "dance" -> "Dance"
                        else -> if (ctrl.animationNames.contains(rawAnim)) rawAnim else "Wave"
                    }
                } else {
                    when (rawAnim.lowercase()) {
                        "wave", "idle" -> "SK_ZMikeAnim_ZMIKE_WaveLoop"
                        "talk" -> "SK_ZMikeAnim_ZMIKE_IdleBreaker"
                        "nod" -> "SK_ZMikeAnim_ZMIKE_ExitWave"
                        "tilt", "thinking" -> "SK_ZMikeAnim_ZMIKE_Blinking"
                        "warn", "bluff" -> "SK_ZMikeAnim_ZMIKE_IdleAggro"
                        "jump" -> "SK_ZMikeAnim_ZMIKE_Jump"
                        "win" -> "SK_ZMikeAnim_ZMIKE_WaveLoop"
                        "punch" -> "SK_ZMikeAnim_ZMIKE_PunchR"
                        "hit" -> "SK_ZMikeAnim_ZMIKE_HitRegisterFront"
                        "death" -> "SK_ZMikeAnim_ZMIKE_HitRegisterFront_Death"
                        else -> rawAnim
                    }
                }

                if (ctrl.animationNames.contains(targetAnim)) {
                    animChannel?.setAnim(targetAnim, 0.25f)
                    val isOneShot = targetAnim == "Death" || targetAnim == "Punch" || targetAnim == "Jump" ||
                            targetAnim.contains("Death") || targetAnim.contains("Hit")
                    animChannel?.setLoopMode(if (isOneShot) LoopMode.DontLoop else LoopMode.Loop)
                }
            }
        }
    }
}
