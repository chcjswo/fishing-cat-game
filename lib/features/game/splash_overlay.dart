import 'dart:async';

import 'package:flutter/material.dart';

/// 게임 위를 덮는 스플래시. 로고를 페이드인하고 최소 [displayDuration] 동안
/// 보여 준 뒤, 게임 페이지까지 준비([ready])되면 걷힌다.
class SplashOverlay extends StatefulWidget {
  const SplashOverlay({super.key, required this.ready, required this.child});

  static const Duration displayDuration = Duration(seconds: 3);
  static const Duration fadeInDuration = Duration(milliseconds: 800);
  static const String logoAsset = 'assets/icons/splash.png';
  static const double logoWidth = 240;

  /// 게임 페이지 로드가 끝났거나(성공·실패 모두) 더 기다릴 필요가 없는지.
  final bool ready;
  final Widget child;

  @override
  State<SplashOverlay> createState() => _SplashOverlayState();
}

class _SplashOverlayState extends State<SplashOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _fadeIn = AnimationController(
    vsync: this,
    duration: SplashOverlay.fadeInDuration,
  )..forward();
  late final Timer _displayTimer;
  bool _displayElapsed = false;

  @override
  void initState() {
    super.initState();
    _displayTimer = Timer(
      SplashOverlay.displayDuration,
      () => setState(() => _displayElapsed = true),
    );
  }

  @override
  void dispose() {
    _displayTimer.cancel();
    _fadeIn.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final visible = !(_displayElapsed && widget.ready);
    return Stack(
      fit: StackFit.expand,
      children: [
        widget.child,
        if (visible)
          ColoredBox(
            color: Colors.black,
            child: Center(
              child: FadeTransition(
                opacity: _fadeIn,
                child: Image.asset(
                  SplashOverlay.logoAsset,
                  width: SplashOverlay.logoWidth,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
