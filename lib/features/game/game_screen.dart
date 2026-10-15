import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

import '../../shared/services/game_server.dart';

/// 낚시냥 게임을 표시하는 전체 화면 WebView.
class GameScreen extends StatelessWidget {
  const GameScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      // 노치·홈 인디케이터 영역은 검은 레터박스로 남겨 HUD가 가려지지 않게 한다.
      body: SafeArea(
        child: InAppWebView(
          initialUrlRequest: URLRequest(url: WebUri(gameUrl)),
          initialSettings: InAppWebViewSettings(
            // 게임이 START 터치에서 AudioContext를 깨우므로 사용자 제스처 요구를
            // 꺼서 첫 터치 이후 효과음이 바로 나오게 한다.
            mediaPlaybackRequiresUserGesture: false,
            allowsInlineMediaPlayback: true,
            supportZoom: false,
            disableHorizontalScroll: true,
            disableVerticalScroll: true,
            overScrollMode: OverScrollMode.NEVER,
            transparentBackground: false,
          ),
        ),
      ),
    );
  }
}
