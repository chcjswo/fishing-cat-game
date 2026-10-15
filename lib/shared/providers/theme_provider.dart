import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum ThemeModeOption {
  system,
  light,
  dark,
}

/// ThemeMode 상태를 관리하는 Notifier (Riverpod 3)
class ThemeNotifier extends Notifier<ThemeModeOption> {
  @override
  ThemeModeOption build() => ThemeModeOption.light;

  ThemeMode get materialThemeMode {
    switch (state) {
      case ThemeModeOption.system:
        return ThemeMode.system;
      case ThemeModeOption.light:
        return ThemeMode.light;
      case ThemeModeOption.dark:
        return ThemeMode.dark;
    }
  }

  String get themeModeDisplayName {
    switch (state) {
      case ThemeModeOption.system:
        return '시스템 설정';
      case ThemeModeOption.light:
        return '라이트 모드';
      case ThemeModeOption.dark:
        return '다크 모드';
    }
  }

  void setThemeMode(ThemeModeOption mode) {
    if (state != mode) {
      state = mode;
    }
  }
}

/// ThemeNotifier Provider
final themeProvider =
    NotifierProvider<ThemeNotifier, ThemeModeOption>(ThemeNotifier.new);

/// MaterialThemeMode을 반환하는 Provider
final materialThemeModeProvider = Provider<ThemeMode>((ref) {
  final themeMode = ref.watch(themeProvider);
  switch (themeMode) {
    case ThemeModeOption.system:
      return ThemeMode.system;
    case ThemeModeOption.light:
      return ThemeMode.light;
    case ThemeModeOption.dark:
      return ThemeMode.dark;
  }
});

/// ThemeMode 표시 이름을 반환하는 Provider
final themeModeDisplayNameProvider = Provider<String>((ref) {
  final themeMode = ref.watch(themeProvider);
  switch (themeMode) {
    case ThemeModeOption.system:
      return '시스템 설정';
    case ThemeModeOption.light:
      return '라이트 모드';
    case ThemeModeOption.dark:
      return '다크 모드';
  }
});
