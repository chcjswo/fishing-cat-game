import 'dart:collection';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';

import '../../shared/models/game_scene.dart';
import '../../shared/services/game_server.dart';
import '../../shared/services/haptics.dart';
import '../../shared/services/native_bridge.dart';
import '../../shared/services/score_share.dart';
import 'back_action.dart';

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
    // 게임의 진동 패턴을 기기 햅틱으로 재생한다.
    _bridge.on('haptic', (payload) => playHaptic(payload['pattern']));
    // 결과 화면의 공유 버튼 → OS 공유 시트
    _bridge.on(
      'share',
      (payload) => shareScore(payload, origin: _screenRect()),
    );
    // 홈 이동·전화 수신 등으로 앱이 비활성화되면 플레이 중인 게임을 일시정지
    // 화면으로 돌린다. 게임의 visibilitychange 처리가 WebView에서 항상
    // 오지는 않으므로 앱 생명주기로 보완한다 (플레이 중 여부는 게임이 판단).
    _lifecycle = AppLifecycleListener(
      onInactive: () => _callGameControl('pause'),
      // 앱이 보이지 않는 동안에는 타이틀 음악 등 배경 음악이 새지 않게 멈춘다.
      onHide: () => _callGameControl('muteMusic'),
      onShow: () => _callGameControl('unmuteMusic'),
    );
  }

  @override
  void dispose() {
    _lifecycle.dispose();
    super.dispose();
  }

  Rect? _screenRect() {
    final box = context.findRenderObject() as RenderBox?;
    return box == null ? null : box.localToGlobal(Offset.zero) & box.size;
  }

  /// 게임의 GameControl 메서드를 존재 가드와 함께 호출한다.
  Future<void> _callGameControl(String method) async {
    await _webView?.evaluateJavascript(
      source:
          'window.GameControl && GameControl.$method && GameControl.$method();',
    );
  }

  /// 종료 확인이 떠 있는 동안 뒤로가기 연타로 확인 창이 겹쳐 쌓이지 않게 한다.
  bool _handlingBack = false;

  Future<void> _handleBack() async {
    if (_handlingBack) return;
    _handlingBack = true;
    try {
      await _dispatchBack();
    } finally {
      _handlingBack = false;
    }
  }

  Future<void> _dispatchBack() async {
    switch (backActionFor(_scene)) {
      case BackAction.confirmExitPausingGame:
        // 일시정지 화면 대신 화면 전환 없이 멈춰서, 취소하면 바로 이어한다.
        await _callGameControl('freeze');
        final exiting = await _confirmExit();
        if (!exiting) await _callGameControl('resume');
      case BackAction.confirmExit:
        await _confirmExit();
    }
  }

  /// 종료 확인 후 종료를 고르면 앱을 닫는다. 앱을 닫는 중이면 true.
  Future<bool> _confirmExit() async {
    final shouldExit = await showExitConfirmDialog(context);
    if (shouldExit) await SystemNavigator.pop();
    return shouldExit;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _handleBack();
      },
      child: Scaffold(
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
            // 게임 페이지가 다 로드되면 스플래시를 걷어내 빈 화면 없이 타이틀로
            // 넘어간다. 로드 실패 시에도 스플래시에 갇히지 않도록 함께 걷어낸다.
            onLoadStop: (_, _) => FlutterNativeSplash.remove(),
            onReceivedError: (_, _, _) => FlutterNativeSplash.remove(),
          ),
        ),
      ),
    );
  }
}
