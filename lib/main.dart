import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/config/admob.dart';
import 'features/game/game_screen.dart';
import 'shared/services/game_server.dart';

/// 페이지가 일찍 로드돼도 로고 스플래시를 이 시간만큼은 보여 준다.
const Duration _minimumSplashDuration = Duration(seconds: 3);

void main() async {
  // 앱 초기화 시간도 로고 표시 시간에 포함되도록 가장 먼저 잰다.
  final minimumSplash = Future<void>.delayed(_minimumSplashDuration);
  WidgetsBinding widgetsBinding = WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: '.env');

  // 스플래시 화면 유지
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  // 게임 기준 해상도(640×1024)에 맞춰 세로 고정 + 상태바/내비바를 숨기는
  // 몰입 전체화면. Android 15+에서는 이 호출이 무시되므로
  // MainActivity.hideSystemBarsOnAndroid15Plus()가 네이티브로 처리한다.
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

  await gameServer.start();

  // 광고 SDK 초기화·프리로드가 앱 기동을 막지 않도록 기다리지 않는다.
  unawaited(AdmobHandler().initialize());

  // 스플래시는 게임 페이지가 다 로드된 뒤 GameScreen이 걷어낸다 (빈 화면 방지).
  runApp(ProviderScope(child: MyApp(minimumSplash: minimumSplash)));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key, required this.minimumSplash});

  final Future<void> minimumSplash;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '낚시냥',
      home: GameScreen(minimumSplash: minimumSplash),
      debugShowCheckedModeBanner: false,
    );
  }
}
