import 'package:baseapp/core/theme/app_colors.dart';
import 'package:baseapp/shared/providers/theme_provider.dart';
import 'package:baseapp/shared/widgets/customer_feedback_flow.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  /// 리빌드마다 새 Future가 만들어지지 않도록 한 번만 로드한다.
  static final Future<PackageInfo> _packageInfoFuture =
      PackageInfo.fromPlatform();

  /// 이미지 스타일: 연한 회색 필 트랙, 흰색 원형 썸에 부드러운 그림자.
  /// 다크 모드 ON일 때는 트랙을 진한 색으로 해서 구분되게 함.
  Widget _buildDarkModeToggle({
    required BuildContext context,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    const double trackWidth = 52;
    const double trackHeight = 28;
    const double thumbSize = 24;
    const double padding = (trackHeight - thumbSize) / 2; // 2
    final double thumbLeft = value ? trackWidth - padding - thumbSize : padding;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final trackColor = (isDark && value)
        ? AppColors.grey800
        : AppColors.grey200;

    return GestureDetector(
      onTap: () => onChanged(!value),
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: trackWidth,
        height: trackHeight,
        child: Stack(
          children: [
            // 트랙: 라이트는 연한 회색, 다크 ON일 때는 진한 색
            Container(
              width: trackWidth,
              height: trackHeight,
              decoration: BoxDecoration(
                color: trackColor,
                borderRadius: BorderRadius.circular(trackHeight / 2),
              ),
            ),
            // 썸: 흰색 원 + 부드러운 그림자
            AnimatedPositioned(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeInOut,
              left: thumbLeft,
              top: padding,
              child: Container(
                width: thumbSize,
                height: thumbSize,
                decoration: BoxDecoration(
                  color: AppColors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.grey400.withValues(alpha: 0.25),
                      blurRadius: 3,
                      offset: const Offset(0, 1.5),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8, top: 4),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleSmall?.copyWith(
          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  void _showServiceInfoDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('서비스 소개'),
        backgroundColor: Theme.of(context).colorScheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: BorderSide(
            color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5),
            width: 1,
          ),
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: 8),
            Text("서비스 한 줄 소개를 입력해주세요."),
            SizedBox(height: 12),
            Text("이 서비스의 목적을 입력해주세요."),
            SizedBox(height: 12),
            Text("사용자의 다음 행동을 제안해주세요."),
            SizedBox(height: 8),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              context.pop();
            },
            style: TextButton.styleFrom(
              textStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                inherit: false,
              ),
            ),
            child: const Text("확인"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('설정')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 앱 정보 섹션
            _buildSectionTitle(context, '앱 정보'),
            Card(
              margin: const EdgeInsets.only(bottom: 24),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.info_outline),
                    title: const Text('앱 버전'),
                    subtitle: FutureBuilder(
                      future: _packageInfoFuture,
                      builder: (context, snapshot) {
                        return Text(snapshot.data?.version ?? '불러오는 중...');
                      },
                    ),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.description_outlined),
                    title: const Text('서비스 소개'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _showServiceInfoDialog(context),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.person_outline),
                    title: const Text('개발자 정보'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () async {
                      final uri = Uri.parse('https://mocadev.vercel.app/');
                      try {
                        await launchUrl(
                          uri,
                          mode: LaunchMode.externalApplication,
                        );
                      } catch (e) {
                        // iOS에서 채널 연결 실패 시 무시
                      }
                    },
                  ),
                ],
              ),
            ),
            // 일반 섹션
            _buildSectionTitle(context, '일반'),
            Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.brightness_6),
                    title: const Text('다크 모드'),
                    trailing: _buildDarkModeToggle(
                      context: context,
                      value: ref.watch(themeProvider) == ThemeModeOption.dark,
                      onChanged: (value) {
                        final themeNotifier = ref.read(themeProvider.notifier);
                        themeNotifier.setThemeMode(
                          value ? ThemeModeOption.dark : ThemeModeOption.light,
                        );
                      },
                    ),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.mail_outline),
                    title: const Text('고객문의'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => openCustomerFeedbackFlow(context, ref),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.apps_outlined),
                    title: const Text('추천앱'),
                    subtitle: const Text('더 유용한 앱을 만나보세요'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/settings/recommended-apps'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
