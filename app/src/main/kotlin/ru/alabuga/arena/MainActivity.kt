package ru.alabuga.arena

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.core.view.WindowCompat
import ru.alabuga.arena.util.AppContextHolder
import java.lang.ref.WeakReference

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        AppContextHolder.appContext = WeakReference(applicationContext)

        // Modern Edge-to-Edge with Compose WindowInsets
        WindowCompat.setDecorFitsSystemWindows(window, false)

        setContent {
            App()
        }
    }
}
