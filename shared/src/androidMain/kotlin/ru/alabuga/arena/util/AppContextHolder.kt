package ru.alabuga.arena.util

import android.content.Context
import java.lang.ref.WeakReference

object AppContextHolder {
    var appContext: WeakReference<Context>? = null
}
