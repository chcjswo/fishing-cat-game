import 'package:baseapp/shared/models/recommended_app.dart';
import 'package:baseapp/shared/services/recommended_apps_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// 추천앱 목록. 스플래시 시 prefetch된 Future로 override 가능.
final recommendedAppsProvider = FutureProvider<List<RecommendedAppItem>>((ref) {
  return RecommendedAppsApi().fetchFiltered();
});
