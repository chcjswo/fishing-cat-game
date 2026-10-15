/// 추천앱 API 응답 스키마 (schema_version, generated_at, ttl_seconds, items)
class RecommendedAppsResponse {
  const RecommendedAppsResponse({
    required this.schemaVersion,
    required this.generatedAt,
    required this.ttlSeconds,
    required this.items,
  });

  factory RecommendedAppsResponse.fromJson(Map<String, dynamic> json) {
    final itemsList = json['items'] as List<dynamic>? ?? [];
    return RecommendedAppsResponse(
      schemaVersion: json['schema_version'] as int? ?? 1,
      generatedAt: json['generated_at'] as String? ?? '',
      ttlSeconds: json['ttl_seconds'] as int? ?? 86400,
      items: itemsList
          .map((e) => RecommendedAppItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  final int schemaVersion;
  final String generatedAt;
  final int ttlSeconds;
  final List<RecommendedAppItem> items;
}

/// 추천앱 한 항목 (id, title, subtitle, image_url, android_url, ios_url, web_url, languages, source_app_ids)
class RecommendedAppItem {
  const RecommendedAppItem({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.imageUrl,
    required this.androidUrl,
    required this.iosUrl,
    required this.webUrl,
    required this.languages,
    required this.sourceAppIds,
  });

  factory RecommendedAppItem.fromJson(Map<String, dynamic> json) {
    final languagesList = json['languages'] as List<dynamic>? ?? [];
    final sourceList = json['source_app_ids'] as List<dynamic>? ?? [];
    return RecommendedAppItem(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String? ?? '',
      imageUrl: json['image_url'] as String? ?? '',
      androidUrl: json['android_url'] as String? ?? '',
      iosUrl: json['ios_url'] as String? ?? '',
      webUrl: json['web_url'] as String? ?? '',
      languages:
          languagesList.map((e) => e.toString()).toList(),
      sourceAppIds:
          sourceList.map((e) => e.toString()).toList(),
    );
  }

  final String id;
  final String title;
  final String subtitle;
  final String imageUrl;
  final String androidUrl;
  final String iosUrl;
  final String webUrl;
  final List<String> languages;
  final List<String> sourceAppIds;
}
