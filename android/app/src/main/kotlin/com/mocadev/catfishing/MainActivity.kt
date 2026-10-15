package com.mocadev.catfishing

import android.content.Context
import android.os.Build
import android.os.VibrationAttributes
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.WindowInsets
import android.view.WindowInsetsController
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

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

    // 게임 진동은 시스템 "터치 피드백" 설정이 꺼져 있어도 울려야 하므로
    // performHapticFeedback 대신 Vibrator API를 쓴다.
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "catfishing/haptics")
            .setMethodCallHandler { call, result ->
                if (call.method != "vibrate") {
                    result.notImplemented()
                    return@setMethodCallHandler
                }
                // 세그먼트를 걸러내면 [진동, 쉼, 진동]의 짝이 밀리므로
                // 순서는 유지하고 음수만 0으로 보정한다.
                val timings = (call.argument<List<Number>>("timings") ?: emptyList())
                    .map { it.toLong().coerceAtLeast(0L) }
                val amplitude = (call.argument<Number>("amplitude") ?: 255).toInt()
                if (timings.none { it > 0 }) {
                    result.success(null)
                    return@setMethodCallHandler
                }
                vibrate(timings.toLongArray(), amplitude.coerceIn(1, 255))
                result.success(null)
            }
    }

    private fun vibrator(): Vibrator =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager)
                .defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

    // timings는 navigator.vibrate와 같은 [진동, 쉼, 진동, ...] ms 배열.
    private fun vibrate(timings: LongArray, amplitude: Int) {
        val vibrator = vibrator()
        if (!vibrator.hasVibrator()) return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // 세기 배열을 함께 넘기면 각 구간이 자기 세기로 재생된다:
            // 짝수 칸(진동)만 세기를 주고 홀수 칸(쉼)은 0으로 둔다.
            val amplitudes = IntArray(timings.size) { i -> if (i % 2 == 0) amplitude else 0 }
            val effect = VibrationEffect.createWaveform(timings, amplitudes, -1)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // MEDIA 용도는 터치 피드백·무음 모드 정책에 가려지지 않는다.
                vibrator.vibrate(
                    effect,
                    VibrationAttributes.createForUsage(VibrationAttributes.USAGE_MEDIA),
                )
            } else {
                vibrator.vibrate(effect)
            }
        } else {
            // 레거시 API의 패턴은 [쉼, 진동, ...]으로 시작하므로 앞에 0을 붙인다.
            @Suppress("DEPRECATION")
            vibrator.vibrate(longArrayOf(0L) + timings, -1)
        }
    }
}
