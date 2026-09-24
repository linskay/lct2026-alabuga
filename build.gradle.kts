plugins {
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.kotlinAndroid) apply false
    alias(libs.plugins.kotlinMultiplatform) apply false
    alias(libs.plugins.composeMultiplatform) apply false
    alias(libs.plugins.composeCompiler) apply false
    alias(libs.plugins.kotlinSerialization) apply false
}

tasks.register<Exec>("devServer") {
    group = "development"
    description = "Launch AI Studio Web Preview Dev Server"
    commandLine("npm", "run", "dev")
}

