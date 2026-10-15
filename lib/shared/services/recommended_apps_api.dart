import 'dart:convert';
import 'dart:ui';

import 'package:baseapp/shared/models/recommended_app.dart';
import 'package:flutter/foundation.dart'
    show TargetPlatform, compute, defaultTargetPlatform;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

/// 이 크기를 넘는 응답은 메인 아이솔레이트 부담을 줄이기 위해 isolate에서 jsonDecode
const int _kJsonDecodeIsolateThresholdBytes = 16 * 1024;

Map<String, dynamic>? _decodeRecommendedAppsJson(String body) {
  return jsonDecode(body) as Map<String, dynamic>?;
}

/// 추천앱 API 호출 및 현재 앱 제외 필터. 응답의 ttl_seconds 동안 로컬 캐시 사용.
class RecommendedAppsApi {
  RecommendedAppsApi();

  static String get _baseUrl {
    final apiUrl = (dotenv.env['API_URL'] ?? '').replaceAll(RegExp(r'/$'), '');
    final path = dotenv.env['RECOMMENDED_APPS_API_URL'] ?? '/api/v1/apps';
    final p = path.startsWith('/') ? path : '/$path';
    return '$apiUrl$p';
  }

  static String get _langType {
    final languageCode = PlatformDispatcher.instance.locale.languageCode
        .toLowerCase();
    return languageCode;
  }

  static String get _deviceType {
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
        return 'IOS';
      case TargetPlatform.android:
        return 'ANDROID';
      default:
        return 'ANDROID';
    }
  }

  /// 현재 앱 id (자기 앱은 리스트에서 제외). .env RECOMMENDED_APP_SOURCE_ID
  static String? get _currentAppId => dotenv.env['RECOMMENDED_APP_SOURCE_ID'];

  static List<RecommendedAppItem>? _cachedItems;
  static int? _cachedTtlSeconds;
  static DateTime? _cachedAt;

  /// 캐시가 유효하면 true. ttl_seconds 동안만 유효.
  static bool get _isCacheValid {
    if (_cachedItems == null ||
        _cachedTtlSeconds == null ||
        _cachedAt == null) {
      return false;
    }
    final elapsed = DateTime.now().difference(_cachedAt!).inSeconds;
    return elapsed < _cachedTtlSeconds!;
  }

  static List<RecommendedAppItem> _applyFilter(List<RecommendedAppItem> items) {
    final currentId = _currentAppId;
    if (currentId == null || currentId.isEmpty) return items;
    return items.where((e) => e.id != currentId).toList();
  }

  /// API에서 목록 조회 후 현재 앱 항목 제외. ttl_seconds 동안 캐시된 데이터 반환.
  Future<List<RecommendedAppItem>> fetchFiltered() async {
    if (_isCacheValid && _cachedItems != null) {
      return _applyFilter(_cachedItems!);
    }

    final uri = Uri.parse(_baseUrl).replace(
      queryParameters: {'langType': _langType, 'deviceType': _deviceType},
    );
    final response = await http.get(uri);
    if (response.statusCode != 200) {
      return _cachedItems != null ? _applyFilter(_cachedItems!) : [];
    }
    final raw = response.body;
    final Map<String, dynamic>? map;
    if (raw.length > _kJsonDecodeIsolateThresholdBytes) {
      map = await compute(_decodeRecommendedAppsJson, raw);
    } else {
      map = jsonDecode(raw) as Map<String, dynamic>?;
    }
    if (map == null) {
      return _cachedItems != null ? _applyFilter(_cachedItems!) : [];
    }
    final data = RecommendedAppsResponse.fromJson(map);
    _cachedItems = data.items;
    _cachedTtlSeconds = data.ttlSeconds;
    _cachedAt = DateTime.now();
    return _applyFilter(data.items);
  }
}
