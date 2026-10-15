import 'package:flutter/services.dart';

/// 게임 진동 패턴을 기기 햅틱 세기로 구분한다.
enum HapticStrength { light, medium, heavy }

/// 게임의 진동 패턴(숫자 또는 ms 배열)을 [진동, 쉼, 진동, ...] ms 목록으로
/// 정규화한다.
List<int> hapticTimingsFor(dynamic pattern) => switch (pattern) {
  num n => [n.toInt()],
  List l => [for (final n in l.whereType<num>()) n.toInt()],
  _ => const [],
};

/// 패턴을 총 지속시간 기준으로 세 단계 세기로 분류한다.
/// 유효하지 않은 패턴은 null.
HapticStrength? hapticStrengthFor(dynamic pattern) {
  final total = hapticTimingsFor(pattern).fold<int>(0, (a, b) => a + b);
  if (total <= 0) return null;
  if (total <= _lightMaxMilliseconds) return HapticStrength.light;
  if (total <= _mediumMaxMilliseconds) return HapticStrength.medium;
  return HapticStrength.heavy;
}

const int _lightMaxMilliseconds = 12;
const int _mediumMaxMilliseconds = 60;

/// 세기별 진동 강도 (Android VibrationEffect amplitude, 1~255).
int amplitudeFor(HapticStrength strength) => switch (strength) {
  HapticStrength.light => 110,
  HapticStrength.medium => 180,
  HapticStrength.heavy => 255,
};

/// Android는 Vibrator API로 원본 ms 패턴을 그대로 재생한다.
/// HapticFeedback(performHapticFeedback)은 시스템 "터치 피드백" 설정이 꺼진
/// 기기에서 조용히 무시되고, 일부 삼성 기기는 mediumImpact를 지원하지 않아
/// 게임 진동 용도로는 신뢰할 수 없다.
const MethodChannel _haptics = MethodChannel('catfishing/haptics');

/// 분류된 세기로 실제 햅틱을 재생한다.
Future<void> playHaptic(dynamic pattern) async {
  final strength = hapticStrengthFor(pattern);
  if (strength == null) return;
  try {
    await _haptics.invokeMethod('vibrate', {
      'timings': hapticTimingsFor(pattern),
      'amplitude': amplitudeFor(strength),
    });
  } on MissingPluginException {
    // 채널이 없는 플랫폼(iOS)은 표준 햅틱으로 재생한다.
    switch (strength) {
      case HapticStrength.light:
        await HapticFeedback.lightImpact();
      case HapticStrength.medium:
        await HapticFeedback.mediumImpact();
      case HapticStrength.heavy:
        await HapticFeedback.heavyImpact();
    }
  }
}
