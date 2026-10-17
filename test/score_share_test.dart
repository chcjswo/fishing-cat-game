import 'package:fishing_cat_game/shared/services/score_share.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('점수·스테이지·최고 기록을 넣은 공유 문구를 만든다', () {
    final text = scoreShareText({'score': 12345, 'stage': 4, 'best': 20000});
    expect(text, contains('12,345점'));
    expect(text, contains('4스테이지'));
    expect(text, contains('최고 기록 20,000점'));
    expect(text, contains('낚시냥'));
  });

  test('값이 빠지면 0점·1스테이지, 최고 기록은 점수로 채운다', () {
    final text = scoreShareText({'score': 900});
    expect(text, contains('1스테이지'));
    expect(text, contains('900점'));
    expect(text, contains('최고 기록 900점'));
    expect(scoreShareText({}), contains('0점'));
  });
}
