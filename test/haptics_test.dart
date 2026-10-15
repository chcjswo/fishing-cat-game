import 'package:catfishing/shared/services/haptics.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  // 게임(games/game.js)의 HAPTIC 패턴 기준
  test('위험 생물 피격([55])은 중간 진동', () {
    expect(hapticStrengthFor([55]), HapticStrength.medium);
  });

  test('폭탄([70,40,90])은 강한 진동', () {
    expect(hapticStrengthFor([70, 40, 90]), HapticStrength.heavy);
  });

  test('숫자 하나도 패턴으로 받는다', () {
    expect(hapticStrengthFor(10), HapticStrength.light);
    expect(hapticTimingsFor(10), [10]);
  });

  test('세기별 진동 강도는 약할수록 작다', () {
    expect(
      amplitudeFor(HapticStrength.light),
      lessThan(amplitudeFor(HapticStrength.medium)),
    );
    expect(
      amplitudeFor(HapticStrength.medium),
      lessThan(amplitudeFor(HapticStrength.heavy)),
    );
  });

  test('빈/이상 패턴은 무시', () {
    expect(hapticStrengthFor(null), isNull);
    expect(hapticStrengthFor(0), isNull);
    expect(hapticStrengthFor([]), isNull);
    expect(hapticStrengthFor('x'), isNull);
  });
}
