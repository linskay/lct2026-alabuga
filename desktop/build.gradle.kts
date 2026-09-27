plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.composeMultiplatform)
    alias(libs.plugins.composeCompiler)
    alias(libs.plugins.kotlinSerialization)
}

kotlin {
    jvm("desktop")

    sourceSets {
        val desktopMain by getting {
            dependencies {
                implementation(compose.desktop.currentOs)
                implementation(compose.material3)
                implementation(compose.materialIconsExtended)
                implementation(libs.kotlinx.coroutines.core)
                implementation(libs.kotlinx.serialization.json)
                implementation(libs.ktor.client.core)
                implementation(libs.ktor.client.okhttp)
                implementation(libs.ktor.client.content.negotiation)
                implementation(libs.ktor.serialization.kotlinx.json)
            }
        }
    }
}

compose.desktop {
    application {
        mainClass = "ru.alabuga.arena.desktop.MainKt"
        nativeDistributions {
            // EXE через WiX исключён — нестабилен на CI с кастомными .wxl.
            // MSI собирается нативно через jpackage и работает надёжно.
            targetFormats(org.jetbrains.compose.desktop.application.dsl.TargetFormat.Msi)
            packageName = "AlabugaArena"
            packageVersion = "1.0.0"
            description = "Арена Переговоров ОЭЗ «Алабуга»"
            copyright = "© 2026 ОЭЗ «Алабуга»"
            vendor = "ОЭЗ «Алабуга»"

            appResourcesRootDir.set(project.layout.projectDirectory.dir("resources"))

            windows {
                menu = true
                shortcut = true
                dirChooser = true
                menuGroup = "Алабуга"
                upgradeUuid = "d7c805eb-642d-45db-9c3f-c3093ec86b51"
            }
        }
    }
}
