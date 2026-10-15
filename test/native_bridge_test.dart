import 'package:catfishing/shared/models/game_scene.dart';
import 'package:catfishing/shared/services/native_bridge.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('NativeBridge.dispatch', () {
    test('이벤트 종류에 등록된 핸들러로 페이로드를 전달한다', () {
      final bridge = NativeBridge();
      Map<String, dynamic>? received;
      bridge.on('screen', (payload) => received = payload);

      bridge.dispatch([
        'screen',
        {'screen': 'play'},
      ]);

      expect(received, {'screen': 'play'});
    });

    test('페이로드가 없거나 맵이 아니면 빈 맵을 전달한다', () {
      final bridge = NativeBridge();
      final received = <Map<String, dynamic>>[];
      bridge.on('haptic', received.add);

      bridge.dispatch(['haptic']);
      bridge.dispatch(['haptic', 'oops']);

      expect(received, [<String, dynamic>{}, <String, dynamic>{}]);
    });

    test('등록되지 않은 이벤트나 빈 인자는 무시한다', () {
      final bridge = NativeBridge();
      expect(() => bridge.dispatch(['unknown', {}]), returnsNormally);
      expect(() => bridge.dispatch([]), returnsNormally);
    });
  });

  group('GameScene.fromName', () {
    test('게임이 보내는 화면 이름을 열거형으로 바꾼다', () {
      for (final name in [
        'title',
        'credits',
        'intro',
        'play',
        'pause',
        'result',
      ]) {
        expect(GameScene.fromName(name)?.name, name);
      }
    });

    test('모르는 이름이나 null은 null', () {
      expect(GameScene.fromName('allclear'), isNull);
      expect(GameScene.fromName(null), isNull);
    });
  });
}
