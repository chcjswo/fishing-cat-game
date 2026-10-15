import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val keyStoreProperties = Properties().apply {
    val keyStoreFile = rootProject.file("key.properties")
    if (keyStoreFile.exists()) {
        load(FileInputStream(keyStoreFile))
    }
}

android {
    namespace = "com.mocadev.catfishing"
    compileSdk = 37
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_25
        targetCompatibility = JavaVersion.VERSION_25
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.mocadev.catfishing"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    // key.properties 가 없는 환경(새 클론·디버그 빌드)에서도 구성이 실패하지 않도록
    // 키가 있을 때만 release 서명을 만든다.
    val hasReleaseKey = keyStoreProperties.getProperty("storeFile") != null

    signingConfigs {
        if (hasReleaseKey) {
            create("release") {
                storeFile = file(keyStoreProperties.getProperty("storeFile"))
                storePassword = keyStoreProperties.getProperty("storePassword")
                keyAlias = keyStoreProperties.getProperty("keyAlias")
                keyPassword = keyStoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            if (hasReleaseKey) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }
}

kotlin {
    // Gradle 데몬 JDK(예: Android Studio 번들 JBR 21)와 무관하게 JDK 25 툴체인으로 컴파일합니다.
    jvmToolchain(25)
}

flutter {
    source = "../.."
}
