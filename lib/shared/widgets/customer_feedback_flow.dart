import 'dart:io';

import 'package:baseapp/shared/services/discord_webhook.dart';
import 'package:baseapp/shared/widgets/feedback_dialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

/// 설정의 고객문의와 동일: 다이얼로그 표시 후 Discord로 전송
Future<void> openCustomerFeedbackFlow(
  BuildContext context,
  WidgetRef ref,
) async {
  final feedback = await FeedbackDialog.show(context);
  if (feedback == null || !context.mounted) {
    return;
  }

  final packageInfo = await PackageInfo.fromPlatform();
  final title =
      '${feedback['category']} :: ${packageInfo.appName} ${packageInfo.version}';

  final deviceInfo =
      '${Platform.operatingSystem} ${Platform.operatingSystemVersion}';
  String message = '💬 ${feedback['message']}';
  message +=
      '\n\n📨 ${feedback['email']!.isNotEmpty ? feedback['email'] : '제공하지 않음'}';
  message += '\n\n💻 $deviceInfo';

  final priority = switch (feedback['category']) {
    '기능 제안' => Priority.medium,
    '버그 신고' => Priority.high,
    _ => Priority.low,
  };

  await DiscordWebhookClient().sendMessage(
    title: title,
    message: message,
    priority: priority,
  );

  if (!context.mounted) return;

  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(content: Text('문의가 성공적으로 전송되었습니다')),
  );
}
