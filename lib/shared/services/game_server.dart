import 'package:flutter_inappwebview/flutter_inappwebview.dart';

/// 게임 자산을 서빙하는 로컬 서버 포트. origin의 일부라 바꾸면 localStorage
/// 세이브(최고 점수·사운드 설정)를 잃는다 — 출시 후 변경 금지.
/// 8080 같은 흔한 포트는 다른 앱과 충돌할 수 있어 피했다.
const int gameServerPort = 38219;

/// 서버가 서빙하는 번들 자산 루트 (tool/sync_game_assets.dart 가 생성).
const String gameDocumentRoot = 'assets/game';

const String gameUrl = 'http://localhost:$gameServerPort/index.html';

/// 번들된 게임을 localhost로 서빙한다. file:// 로 직접 열면 iOS WKWebView에서
/// localStorage 지속성이 보장되지 않으므로, 고정 origin을 만들어 세이브를 지킨다.
final InAppLocalhostServer gameServer = InAppLocalhostServer(
  documentRoot: gameDocumentRoot,
  port: gameServerPort,
);
