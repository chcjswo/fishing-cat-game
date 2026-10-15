package com.mocadev.catfishing

import android.os.Build
import android.view.WindowInsets
import android.view.WindowInsetsController
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    // Android 15+(targetSdk 35+)는 엣지-투-엣지가 강제되어 Flutter의
    // SystemUiMode.immersiveSticky(레거시 setSystemUiVisibility 기반)가 무시된다.
    // 그 버전대에서만 WindowInsetsController로 직접 시스템 바를 숨긴다.
    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBarsOnAndroid15Plus()
    }

    private fun hideSystemBarsOnAndroid15Plus() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) return
        val controller = window.insetsController ?: return
        // 가장자리 스와이프 시 반투명 바가 잠깐 나타났다 다시 숨는 sticky 동작
        controller.systemBarsBehavior =
            WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        controller.hide(WindowInsets.Type.systemBars())
    }
}
