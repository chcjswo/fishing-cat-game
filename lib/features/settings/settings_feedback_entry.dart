import 'package:baseapp/features/settings/settings_screen.dart';
import 'package:baseapp/shared/widgets/customer_feedback_flow.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// 앱 아이콘 바로가기 등에서 진입 시 설정 화면과 함께 문의 다이얼로그를 연다.
class SettingsFeedbackEntry extends ConsumerStatefulWidget {
  const SettingsFeedbackEntry({super.key});

  @override
  ConsumerState<SettingsFeedbackEntry> createState() =>
      _SettingsFeedbackEntryState();
}

class _SettingsFeedbackEntryState extends ConsumerState<SettingsFeedbackEntry> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      await openCustomerFeedbackFlow(context, ref);
    });
  }

  @override
  Widget build(BuildContext context) {
    return const SettingsScreen();
  }
}
