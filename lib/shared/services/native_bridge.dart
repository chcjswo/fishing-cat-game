import 'package:flutter/foundation.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

/// 게임(JS) → Flutter 단일 이벤트 통로.
///
/// 게임은 `window.NativeBridge.send(type, payload)`를 존재 가드와 함께
/// 호출한다. 이벤트 종류를 추가할 때 이 통로는 수정할 필요 없이
/// [on]으로 핸들러만 등록하면 된다.
class NativeBridge {
  /// WebView 문서 시작 시점에 주입되어 `window.NativeBridge`를 정의한다.
  /// 플랫폼 채널이 준비되기 전 이벤트는 큐에 쌓았다가 준비되면 보낸다.
  static final UserScript userScript = UserScript(
    source: '''
(function () {
  if (window.NativeBridge) return;
  var queue = [];
  function ready() {
    return window.flutter_inappwebview &&
      typeof window.flutter_inappwebview.callHandler === 'function';
  }
  function post(type, payload) {
    window.flutter_inappwebview.callHandler('nativeEvent', type, payload || {});
  }
  function drain() {
    if (!queue || !ready()) return;
    var pending = queue;
    queue = null;
    pending.forEach(function (m) { post(m[0], m[1]); });
  }
  window.addEventListener('flutterInAppWebViewPlatformReady', drain);
  window.NativeBridge = {
    send: function (type, payload) {
      try {
        drain();
        if (queue) queue.push([type, payload]);
        else post(type, payload);
      } catch (e) {}
    }
  };
})();
''',
    injectionTime: UserScriptInjectionTime.AT_DOCUMENT_START,
  );

  final Map<String, void Function(Map<String, dynamic> payload)> _handlers = {};

  /// [type] 이벤트가 오면 [handler]를 호출하도록 등록한다.
  void on(String type, void Function(Map<String, dynamic> payload) handler) {
    _handlers[type] = handler;
  }

  /// WebView 생성 직후 호출해 JS 핸들러를 연결한다.
  void attach(InAppWebViewController controller) {
    controller.addJavaScriptHandler(
      handlerName: 'nativeEvent',
      callback: dispatch,
    );
  }

  /// JS가 보낸 `[type, payload]` 인자를 등록된 핸들러로 전달한다.
  void dispatch(List<dynamic> arguments) {
    if (arguments.isEmpty) return;
    final type = arguments[0] as String;
    final payload = arguments.length > 1 && arguments[1] is Map
        ? Map<String, dynamic>.from(arguments[1] as Map)
        : <String, dynamic>{};
    debugPrint('[NativeBridge] $type $payload');
    _handlers[type]?.call(payload);
  }
}
