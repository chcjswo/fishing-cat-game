import 'dart:collection';

import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

import '../../shared/models/game_scene.dart';
import '../../shared/services/game_server.dart';
import '../../shared/services/native_bridge.dart';

/// 낚시냥 게임을 표시하는 전체 화면 WebView.
class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  final NativeBridge _bridge = NativeBridge();
  InAppWebViewController? _webView;
  late final AppLifecycleListener _lifecycle;
  GameScene _scene = GameScene.title;

  @override
  void initState() {
    super.initState();
    _bridge.on('screen', (payload) {
      _scene = GameScene.fromName(payload['screen'] as String?) ?? _scene;
    });
    // 홈 이동·전화 수신 등으로 앱이 비활성화되면 플레이 중인 게임을 일시정지
    // 화면으로 돌린다. 게임의 visibilitychange 처리가 WebView에서 항상
    // 오지는 않으므로 앱 생명주기로 보완한다 (플레이 중 여부는 게임이 판단).
    _lifecycle = AppLifecycleListener(
      onInactive: () => _callGameControl('pause'),
    );
  }

  @override
  void dispose() {
    _lifecycle.dispose();
    super.dispose();
  }

  /// 게임의 GameControl 메서드를 존재 가드와 함께 호출한다.
  Future<void> _callGameControl(String method) async {
    await _webView?.evaluateJavascript(
      source:
          'window.GameControl && GameControl.$method && GameControl.$method();',
    );
  }

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
          initialUserScripts: UnmodifiableListView([NativeBridge.userScript]),
          onWebViewCreated: (controller) {
            _webView = controller;
            _bridge.attach(controller);
          },
        ),
      ),
    );
  }
}
