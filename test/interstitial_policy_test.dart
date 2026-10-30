import 'dart:math';

import 'package:fishing_cat_game/shared/services/interstitial_policy.dart';
import 'package:flutter_test/flutter_test.dart';

/// nextDouble()이 항상 같은 값을 돌려주는 난수.
class _FixedRandom implements Random {
  _FixedRandom(this.value);

  final double value;

  @override
  double nextDouble() => value;

  @override
  bool nextBool() => throw UnimplementedError();

  @override
  int nextInt(int max) => throw UnimplementedError();
}

void main() {
  group('interstitialChanceAfterClearing', () {
    test('5스테이지 클리어까지는 전면 광고가 없다', () {
      for (var stage = 1; stage <= 5; stage++) {
        expect(interstitialChanceAfterClearing(stage), 0);
      }
    });

    test('6~20스테이지 클리어 후에는 1/4 확률이다', () {
      expect(interstitialChanceAfterClearing(6), 1 / 4);
      expect(interstitialChanceAfterClearing(20), 1 / 4);
    });

    test('21스테이지 이상 클리어 후에는 1/3 확률이다', () {
      expect(interstitialChanceAfterClearing(21), 1 / 3);
      expect(interstitialChanceAfterClearing(29), 1 / 3);
    });
  });

  group('shouldShowInterstitial', () {
    test('난수가 확률보다 작을 때만 보여 준다', () {
      expect(shouldShowInterstitial(6, _FixedRandom(0.24)), isTrue);
      expect(shouldShowInterstitial(6, _FixedRandom(0.25)), isFalse);
      expect(shouldShowInterstitial(21, _FixedRandom(0.33)), isTrue);
      expect(shouldShowInterstitial(21, _FixedRandom(0.34)), isFalse);
    });

    test('5스테이지 이하는 난수와 관계없이 보여 주지 않는다', () {
      expect(shouldShowInterstitial(5, _FixedRandom(0)), isFalse);
    });
  });
}
