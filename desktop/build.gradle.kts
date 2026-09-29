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
                implementation(project(":shared"))
                implementation(compose.desktop.currentOs)
                implementation(compose.material3)
                implementation(compose.materialIconsExtended)
                implementation(libs.kotlinx.coroutines.core)
                implementation(libs.kotlinx.serialization.json)
                implementation(libs.ktor.client.core)
                implementation(libs.ktor.client.okhttp)
                implementation(libs.ktor.client.content.negotiation)
                implementation(libs.ktor.serialization.kotlinx.json)

                // 3D JMonkeyEngine (GLB/glTF rendering)
                val jmeVersion = "3.9.0-stable"
                implementation("org.jmonkeyengine:jme3-core:$jmeVersion")
                implementation("org.jmonkeyengine:jme3-desktop:$jmeVersion")
                implementation("org.jmonkeyengine:jme3-lwjgl3:$jmeVersion")
                implementation("org.jmonkeyengine:jme3-plugins:$jmeVersion") // glTF/GLB loader
            }
        }
    }
}

compose.desktop {
    application {
        mainClass = "ru.alabuga.arena.desktop.MainKt"
        nativeDistributions {
            targetFormats(org.jetbrains.compose.desktop.application.dsl.TargetFormat.Msi)
            packageName = "AlabugaArena"
            packageVersion = "1.0.1"
            description = "Alabuga B2B Negotiation Arena Simulator"
            copyright = "Copyright (c) 2026 SEZ Alabuga"
            vendor = "SEZ Alabuga"

            modules(
                "java.base",
                "java.desktop",
                "java.logging",
                "java.prefs",
                "java.xml",
                "java.management",
                "java.instrument",
                "java.naming",
                "jdk.unsupported",
                "jdk.crypto.ec"
            )

            windows {
                menu = true
                shortcut = true
                dirChooser = true
                menuGroup = "Alabuga Arena"
                upgradeUuid = "d7c805eb-642d-45db-9c3f-c3093ec86b51"
                iconFile.set(project.file("src/desktopMain/resources/icon.ico"))
            }
        }
    }
}
