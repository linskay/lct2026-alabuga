plugins {
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.androidLibrary) apply false
    alias(libs.plugins.kotlinAndroid) apply false
    alias(libs.plugins.kotlinMultiplatform) apply false
    alias(libs.plugins.composeMultiplatform) apply false
    alias(libs.plugins.composeCompiler) apply false
    alias(libs.plugins.kotlinSerialization) apply false
}

tasks.register("devServer") {
    group = "development"
    description = "Launch Kotlin Multiplatform Web Wasm Dev Server"
    dependsOn(":web:wasmJsBrowserDevelopmentRun")
}

