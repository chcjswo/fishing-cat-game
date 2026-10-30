import 'dart:math';

/// 이 스테이지까지 클리어하는 동안은 전면 광고를 보여 주지 않는다.
const int _adFreeStages = 5;

/// 이 스테이지를 넘겨 클리어하면 전면 광고 확률을 올린다.
const int _higherChanceAfterStage = 20;

/// [clearedStage](1부터)를 클리어하고 다음 스테이지로 넘어갈 때
/// 전면 광고를 보여 줄 확률.
double interstitialChanceAfterClearing(int clearedStage) {
  if (clearedStage <= _adFreeStages) return 0;
  if (clearedStage <= _higherChanceAfterStage) return 1 / 4;
  return 1 / 3;
}

/// 다음 스테이지로 넘어갈 때 전면 광고를 보여 줄지 확률로 정한다.
bool shouldShowInterstitial(int clearedStage, [Random? random]) =>
    (random ?? Random()).nextDouble() <
    interstitialChanceAfterClearing(clearedStage);
