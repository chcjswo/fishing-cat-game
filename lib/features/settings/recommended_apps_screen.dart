import 'dart:io';

import 'package:baseapp/shared/models/recommended_app.dart';
import 'package:baseapp/shared/providers/recommended_apps_provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

class RecommendedAppsScreen extends ConsumerWidget {
  const RecommendedAppsScreen({super.key});

  /// 안드로이드에서는 android_url, iOS에서는 ios_url 사용. 없으면 web_url 폴백.
  static String _storeOrWebUrl(RecommendedAppItem item) {
    if (Platform.isAndroid) {
      if (item.androidUrl.isNotEmpty) return item.androidUrl;
      if (item.webUrl.isNotEmpty) return item.webUrl;
      return '';
    }
    if (Platform.isIOS) {
      if (item.iosUrl.isNotEmpty) return item.iosUrl;
      if (item.webUrl.isNotEmpty) return item.webUrl;
      return '';
    }
    return item.webUrl.isNotEmpty ? item.webUrl : '';
  }

  static Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncItems = ref.watch(recommendedAppsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('추천앱')),
      body: asyncItems.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 48,
                color: Theme.of(context).colorScheme.error,
              ),
              const SizedBox(height: 16),
              Text(
                '목록을 불러오지 못했습니다.',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ],
          ),
        ),
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child: Text(
                '추천 앱이 없습니다.',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final item = items[index];
              final url = _storeOrWebUrl(item);
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: InkWell(
                  onTap: url.isEmpty ? null : () => _openUrl(url),
                  borderRadius: BorderRadius.circular(16),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: CachedNetworkImage(
                            imageUrl: item.imageUrl,
                            width: 64,
                            height: 64,
                            memCacheWidth: 128,
                            memCacheHeight: 128,
                            fit: BoxFit.cover,
                            placeholder: (_, _) => Container(
                              width: 64,
                              height: 64,
                              color: Theme.of(
                                context,
                              ).colorScheme.surfaceContainerHighest,
                              child: const Center(
                                child: SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                ),
                              ),
                            ),
                            errorWidget: (_, _, _) => Container(
                              width: 64,
                              height: 64,
                              color: Theme.of(
                                context,
                              ).colorScheme.surfaceContainerHighest,
                              child: const Icon(Icons.apps),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.title,
                                style: Theme.of(context).textTheme.titleMedium
                                    ?.copyWith(fontWeight: FontWeight.w600),
                              ),
                              if (item.subtitle.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  item.subtitle,
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(
                                        color: Theme.of(
                                          context,
                                        ).colorScheme.onSurfaceVariant,
                                      ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ],
                          ),
                        ),
                        if (url.isNotEmpty)
                          const Icon(Icons.chevron_right),
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
