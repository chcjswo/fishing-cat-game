import 'dart:collection';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';

import '../../core/config/admob.dart';
import '../../shared/models/game_scene.dart';
import '../../shared/services/game_server.dart';
import '../../shared/services/haptics.dart';
import '../../shared/services/interstitial_policy.dart';
import '../../shared/services/native_bridge.dart';
import '../../shared/services/score_share.dart';
import 'back_action.dart';

/// 낚시냥 게임을 표시하는 전체 화면 WebView.
class GameScreen extends StatefulWidget {
  const GameScreen({super.key, required this.minimumSplash});

  /// 끝나기 전에는 페이지가 로드돼도 로고 스플래시를 걷지 않는다.
  final Future<void> minimumSplash;

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  final NativeBridge _bridge = NativeBridge();
  InAppWebViewController? _webView;
  late final AppLifecycleListener _lifecycle;
  GameScene _scene = GameScene.title;

  /// 최소 표시 시간이 지난 뒤 네이티브 스플래시를 걷고, 타이틀 화면부터
  /// 음악이 나오도록 게임이 멈춰 둔 음악을 재개한다.
  Future<void> _removeSplash() async {
    await widget.minimumSplash;
    FlutterNativeSplash.remove();
    await _callGameControl('unmuteMusic');
  }

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
    // 보상형 광고가 준비되면 게임오버의 '광고 보고 이어하기' 버튼을 켠다.
    AdmobHandler().setRewardedAdReadyCallback((_) => _sendReviveAdAvailable());
    // 이어하기 버튼 → 보상형 광고. 광고가 닫힌 뒤 같은 요청 ID로 결과를 알린다.
    _bridge.on('reviveAd', (payload) => _showReviveAd(payload['requestId']));
    // 스테이지 클리어 후 다음 스테이지로 넘어가는 사이에 확률로 전면 광고.
    _bridge.on('nextStage', (payload) {
      final clearedStage = payload['clearedStage'];
      if (clearedStage is num && shouldShowInterstitial(clearedStage.toInt())) {
        AdmobHandler().showInterstitialAd();
      }
    });
    // 홈 이동·전화 수신 등으로 앱이 비활성화되면 플레이 중인 게임을 일시정지
    // 화면으로 돌린다. 게임의 visibilitychange 처리가 WebView에서 항상
    // 오지는 않으므로 앱 생명주기로 보완한다 (플레이 중 여부는 게임이 판단).
    _lifecycle = AppLifecycleListener(
      // 전면 광고가 앱을 가려 비활성화된 경우는 이용자가 떠난 것이 아니므로
      // 일시정지하지 않는다 (이어하기 광고 후 바로 3·2·1 카운트다운으로 재개).
      onInactive: () {
        if (!_showingAd) _callGameControl('pause');
      },
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

  /// 화면 위 카메라 구멍·노치 높이(논리 픽셀 = WebView CSS px).
  double _safeTop = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final safeTop = MediaQuery.paddingOf(context).top;
    if (safeTop == _safeTop) return;
    _safeTop = safeTop;
    _sendSafeTop();
  }

  /// 배경은 카메라 구멍 아래까지 그리고 HUD만 그 높이만큼 내리도록 게임에 알린다.
  Future<void> _sendSafeTop() async {
    await _webView?.evaluateJavascript(
      source:
          'window.GameControl && GameControl.setSafeTop && GameControl.setSafeTop($_safeTop);',
    );
  }

  Future<void> _sendReviveAdAvailable() async {
    final ready = AdmobHandler().isRewardedAdReady;
    await _webView?.evaluateJavascript(
      source:
          'window.GameControl && GameControl.setReviveAdAvailable && GameControl.setReviveAdAvailable($ready);',
    );
  }

  /// 전체 화면 광고를 보여 주는 중이면 true.
  bool _showingAd = false;

  Future<void> _showReviveAd(Object? requestId) async {
    if (requestId is! num) return;
    _showingAd = true;
    final rewarded = await AdmobHandler().showRewardedAd();
    _showingAd = false;
    await _webView?.evaluateJavascript(
      source:
          'window.GameControl && GameControl.completeReviveAd && GameControl.completeReviveAd($requestId, $rewarded);',
    );
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
        // 일시정지 화면에서 재개 카운트다운 중일 수도 있으므로 먼저 취소한다.
        await _callGameControl('pause');
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
        // 위쪽은 게임 배경을 카메라 구멍 아래까지 채우고 HUD만 게임이 내린다.
        // 홈 인디케이터 영역은 검은 여백으로 남겨 조작 버튼이 가려지지 않게 한다.
        body: SafeArea(
          top: false,
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
            // 게임 페이지가 다 로드되면(최소 3초 뒤) 스플래시를 걷어내 빈 화면
            // 없이 타이틀로 넘어간다. 로드 실패 시에도 스플래시에 갇히지 않도록
            // 함께 걷어낸다.
            onLoadStop: (_, _) {
              _sendSafeTop();
              _sendReviveAdAvailable();
              _removeSplash();
            },
            onReceivedError: (_, _, _) => _removeSplash(),
          ),
        ),
      ),
    );
  }
}
