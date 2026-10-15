import 'package:baseapp/core/config/router.dart';
import 'package:baseapp/core/theme/app_theme.dart';
import 'package:baseapp/shared/providers/recommended_apps_provider.dart';
import 'package:baseapp/shared/providers/theme_provider.dart';
import 'package:baseapp/shared/services/recommended_apps_api.dart';
import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform;
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quick_actions/quick_actions.dart';

/// 앱 아이콘 길게 누르기 메뉴(Quick Actions) — 홈으로 이동
const String kOpenAppQuickActionType = 'open_app_home';

/// 앱 아이콘 길게 누르기 메뉴(Quick Actions)에서 문의로 이동할 때 사용하는 id
const String kFeedbackQuickActionType = 'feedback_bug';

void main() async {
  WidgetsBinding widgetsBinding = WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: '.env');

  // 스플래시 화면 유지
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  // 스플래시 동안 추천앱 API 호출을 병렬로 시작
  final recommendedAppsFuture = RecommendedAppsApi().fetchFiltered();

  runApp(
    ProviderScope(
      overrides: [
        recommendedAppsProvider.overrideWith((ref) => recommendedAppsFuture),
      ],
      child: const MyApp(),
    ),
  );

  // 최소 스플래시 표시 후 제거(불필요한 장시간 대기 완화, 추천앱 API는 병렬 호출 중)
  await Future.delayed(const Duration(milliseconds: 800));
  FlutterNativeSplash.remove();
}

class MyApp extends ConsumerStatefulWidget {
  const MyApp({super.key});

  @override
  ConsumerState<MyApp> createState() => _MyAppState();
}

class _MyAppState extends ConsumerState<MyApp> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initFeedbackQuickActions();
    });
  }

  /// 런처에서 앱 아이콘 길게 누를 때 표시되는 바로가기(삭제 메뉴와 함께 보이는 영역에 항목 추가)
  ///
  /// OS는 앱 바로가기를 '홈 화면 편집' 등 시스템 항목보다 위에만 둘 수 있다.
  /// 앱 전용 목록 안에서 문의를 아래에 두려면 위에 다른 항목(앱 열기)이 필요하다.
  Future<void> _initFeedbackQuickActions() async {
    final quickActions = QuickActions();
    await quickActions.initialize((shortcutType) {
      if (shortcutType == kFeedbackQuickActionType) {
        router.go('/settings/feedback');
      } else if (shortcutType == kOpenAppQuickActionType) {
        router.go('/');
      }
    });
    final isIos = defaultTargetPlatform == TargetPlatform.iOS;
    // 목록 순서: 앞쪽이 메뉴 위쪽, 뒤쪽이 메뉴 아래쪽(앱 바로가기 구역 기준).
    await quickActions.setShortcutItems([
      ShortcutItem(
        type: kOpenAppQuickActionType,
        localizedTitle: '앱 열기',
        icon: isIos ? 'sf:house' : 'ic_quick_home',
      ),
      ShortcutItem(
        type: kFeedbackQuickActionType,
        localizedTitle: '문의사항이 있어요',
        icon: isIos ? 'sf:envelope' : 'ic_quick_feedback',
      ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(materialThemeModeProvider);

    return MaterialApp.router(
      title: 'BaseApp',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
