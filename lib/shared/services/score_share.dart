import 'dart:ui';

import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';

final NumberFormat _points = NumberFormat.decimalPattern('ko');

/// 게임의 'share' 이벤트 페이로드({score, stage, best})로 공유 문구를 만든다.
String scoreShareText(Map<String, dynamic> payload) {
  final score = (payload['score'] as num? ?? 0).toInt();
  final stage = (payload['stage'] as num? ?? 1).toInt();
  final best = (payload['best'] as num? ?? score).toInt();
  return '🐱 낚시냥! $stage스테이지에서 ${_points.format(score)}점을 기록했어요! '
      '(최고 기록 ${_points.format(best)}점) 나랑 같이 물고기 받으러 갈래?';
}

/// OS 공유 시트로 점수를 공유한다. iPad는 공유 시트가 popover라
/// 기준 영역([origin])이 없으면 예외가 나므로 화면 영역을 넘긴다.
Future<void> shareScore(Map<String, dynamic> payload, {Rect? origin}) async {
  await SharePlus.instance.share(
    ShareParams(text: scoreShareText(payload), sharePositionOrigin: origin),
  );
}
