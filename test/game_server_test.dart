import 'package:catfishing/shared/services/game_server.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('게임 URL은 고정 포트 localhost의 index.html을 가리킨다', () {
    expect(gameUrl, 'http://localhost:$gameServerPort/index.html');
  });

  test('서버 문서 루트에 게임 index.html이 번들되어 있다', () async {
    final html = await rootBundle.loadString('$gameDocumentRoot/index.html');
    expect(html, contains('낚시냥'));
  });
}
