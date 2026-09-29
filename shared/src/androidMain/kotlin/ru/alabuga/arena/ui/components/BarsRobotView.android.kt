package ru.alabuga.arena.ui.components

import android.annotation.SuppressLint
import android.graphics.Color as AndroidColor
import android.view.View
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.viewinterop.AndroidView

private const val BARS_HTML = """<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            outline: none !important;
            -webkit-tap-highlight-color: transparent !important;
        }
        html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: transparent;
            user-select: none;
            -webkit-user-select: none;
        }
        model-viewer {
            width: 100%;
            height: 100%;
            background-color: transparent;
            --poster-color: transparent;
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
        }
        model-viewer:focus, model-viewer:focus-visible, model-viewer:hover, model-viewer:active {
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
        }
    </style>
    <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>
</head>
<body>
    <model-viewer id="mv"
        src="mike.glb"
        alt="3D Робот Майк (Б.А.Р.С. ОЭЗ Алабуга)"
        autoplay
        interaction-prompt="none"
        shadow-intensity="1.5"
        shadow-softness="0.75"
        exposure="1.0"
        environment-image="neutral"
        camera-orbit="0deg 80deg 52%"
        camera-target="0m 0.78m 0m">
    </model-viewer>
    <script>
        const mv = document.getElementById('mv');
        if (mv) {
            mv.addEventListener('error', function() {
                if (mv.getAttribute('src') !== 'bars.glb') {
                    mv.setAttribute('src', 'bars.glb');
                }
            });
        }
        const ANIM_MAP = {
            "idle": "SK_ZMikeAnim_ZMIKE_Idle",
            "talk": "SK_ZMikeAnim_ZMIKE_WaveLoop",
            "warn": "SK_ZMikeAnim_ZMIKE_IdleAggro",
            "win": "SK_ZMikeAnim_ZMIKE_WaveLoop",
            "wave": "SK_ZMikeAnim_ZMIKE_WaveLoop",
            "nod": "SK_ZMikeAnim_ZMIKE_Blinking",
            "tilt": "SK_ZMikeAnim_ZMIKE_Idle",
            "punch": "SK_ZMikeAnim_ZMIKE_WaveLoop",
            "hit": "SK_ZMikeAnim_ZMIKE_Idle",
            "death": "SK_ZMikeAnim_ZMIKE_Idle",
            "thinking": "SK_ZMikeAnim_ZMIKE_Blinking",
            "bluff": "SK_ZMikeAnim_ZMIKE_Chomp",
            "chomp": "SK_ZMikeAnim_ZMIKE_Chomp"
        };

        let angleDeg = 0;
        let direction = 1;
        function animateFrontalGaze() {
            if (mv) {
                angleDeg += direction * 0.15;
                if (angleDeg > 18) {
                    angleDeg = 18;
                    direction = -1;
                } else if (angleDeg < -18) {
                    angleDeg = -18;
                    direction = 1;
                }
                mv.setAttribute("camera-orbit", angleDeg.toFixed(1) + "deg 80deg 52%");
            }
            requestAnimationFrame(animateFrontalGaze);
        }
        requestAnimationFrame(animateFrontalGaze);

        window.setBarsAnim = function(animKey) {
            if (!mv) return;
            const targetAnim = ANIM_MAP[animKey] || "SK_ZMikeAnim_ZMIKE_Idle";
            const updateAnim = () => {
                const avail = mv.availableAnimations || [];
                if (avail.includes(targetAnim)) {
                    mv.animationName = targetAnim;
                } else if (avail.length > 0) {
                    mv.animationName = avail[0];
                } else {
                    mv.setAttribute("animation-name", targetAnim);
                }
                if (mv.play) mv.play();
            };

            if (mv.availableAnimations && mv.availableAnimations.length > 0) {
                updateAnim();
            } else {
                mv.addEventListener("load", updateAnim, { once: true });
            }
        };
    </script>
</body>
</html>"""

@SuppressLint("SetJavaScriptEnabled")
@Composable
actual fun BarsRobotView(
    animation: String,
    modifier: Modifier,
    height: Dp,
    onClick: (() -> Unit)?
) {
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }
    var hasError by remember { mutableStateOf(false) }

    LaunchedEffect(animation, webViewInstance) {
        webViewInstance?.evaluateJavascript(
            "if (typeof window.setBarsAnim === 'function') { window.setBarsAnim('$animation'); }",
            null
        )
    }

    if (hasError) {
        BarsRobotCanvasView(
            animationState = animation,
            modifier = modifier,
            onClick = onClick
        )
    } else {
        Box(
            modifier = modifier
                .fillMaxWidth()
                .height(height)
        ) {
            AndroidView<WebView>(
                modifier = Modifier.matchParentSize(),
                factory = { context ->
                    WebView(context).apply {
                        layoutParams = ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                        setBackgroundColor(AndroidColor.TRANSPARENT)
                        setLayerType(View.LAYER_TYPE_HARDWARE, null)
                        settings.apply {
                            javaScriptEnabled = true
                            domStorageEnabled = true
                            allowFileAccess = true
                            allowContentAccess = true
                            allowFileAccessFromFileURLs = true
                            allowUniversalAccessFromFileURLs = true
                            useWideViewPort = true
                            loadWithOverviewMode = true
                            mediaPlaybackRequiresUserGesture = false
                        }
                        webChromeClient = WebChromeClient()
                        webViewClient = object : WebViewClient() {
                            override fun onPageFinished(view: WebView?, url: String?) {
                                super.onPageFinished(view, url)
                                view?.evaluateJavascript(
                                    "if (typeof window.setBarsAnim === 'function') { window.setBarsAnim('$animation'); }",
                                    null
                                )
                            }
                        }
                        loadDataWithBaseURL("file:///android_asset/", BARS_HTML, "text/html", "UTF-8", null)
                        webViewInstance = this
                    }
                },
                update = { webView ->
                    webView.evaluateJavascript(
                        "if (typeof window.setBarsAnim === 'function') { window.setBarsAnim('$animation'); }",
                        null
                    )
                }
            )
        }
    }
}
