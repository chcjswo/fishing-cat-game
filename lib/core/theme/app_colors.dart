import 'package:flutter/material.dart';

/// 컬러 팔레트
///
/// 활기차고 현대적인 색상 조합으로 사용자의 마음을 사로잡습니다.
class AppColors {
  // Private constructor
  AppColors._();

  // Primary Colors
  static const Color primary = Color(0xFF6C5CE7); // 바이브 퍼플
  static const Color primaryLight = Color(0xFFA29BFE); // 라이트 퍼플
  static const Color primaryDark = Color(0xFF5649B9); // 다크 퍼플

  // Secondary Colors
  static const Color secondary = Color(0xFF00CEC9); // 민트
  static const Color secondaryLight = Color(0xFF55EFC4); // 라이트 민트
  static const Color secondaryDark = Color(0xFF00B2A9); // 다크 민트

  // Accent Colors
  static const Color accent = Color(0xFFFFD32D); // 옐로우
  static const Color accentLight = Color(0xFFFFF176); // 라이트 옐로우
  static const Color accentDark = Color(0xFFFFC107); // 다크 옐로우

  // State Colors
  static const Color success = Color(0xFF00B894); // 그린
  static const Color warning = Color(0xFFE17055); // 오렌지
  static const Color error = Color(0xFFD63031); // 레드
  static const Color info = Color(0xFF74B9FF); // 블루

  // Neutral Colors
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color grey100 = Color(0xFFF5F6FA);
  static const Color grey200 = Color(0xFFE9ECEF);
  static const Color grey300 = Color(0xFFDFE6E9);
  static const Color grey400 = Color(0xFFB2BEC3);
  static const Color grey500 = Color(0xFF636E72);
  static const Color grey600 = Color(0xFF4A5459);
  static const Color grey700 = Color(0xFF2D3436);
  static const Color grey800 = Color(0xFF1E272E);
  static const Color grey900 = Color(0xFF0F1419);

  // Additional Colors
  static const Color grey50 = Color(0xFFFAFAFA);
  static const Color kakao = Color(0xFFFEE500);

  // Background Colors
  static const Color background = Color(0xFFF8F9FA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF5F6FA);

  // Text Colors
  static const Color textPrimary = Color(0xFF2D3436);
  static const Color textSecondary = Color(0xFF636E72);
  static const Color textTertiary = Color(0xFFB2BEC3);
  static const Color textInverse = Color(0xFFFFFFFF);

  // Gradient Colors
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient secondaryGradient = LinearGradient(
    colors: [secondary, secondaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [accent, accentLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient vibeGradient = LinearGradient(
    colors: [primary, secondary, accent],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Material Color Swatch
  static const MaterialColor primarySwatch =
      MaterialColor(0xFF6C5CE7, <int, Color>{
        50: Color(0xFFEDE9FD),
        100: Color(0xFFD3C9FA),
        200: Color(0xFFB5A5F7),
        300: Color(0xFF9781F3),
        400: Color(0xFF8166F0),
        500: Color(0xFF6C5CE7),
        600: Color(0xFF5E4DD4),
        700: Color(0xFF4B3BB8),
        800: Color(0xFF392B9C),
        900: Color(0xFF1D156B),
      });

  // Border Colors
  static const Color border = Color(0xFFE9ECEF);

  // Shadow Colors
  static const Color shadow = Color(0x1A000000); // 10% opacity black
  static Color shadowLight = Colors.black.withValues(alpha: 0.1);
  static Color shadowMedium = Colors.black.withValues(alpha: 0.15);
  static Color shadowDark = Colors.black.withValues(alpha: 0.2);

  // ========== Dark Mode Primary (Orange) ==========
  static const Color primaryOrange = Color(0xFFFF9E5C);
  static const Color primaryOrangeDark = Color(0xFFFF7F2A);
  static const Color primaryOrangeLight = Color(0xFFFFB380);

  // ========== Dark Mode Secondary (Yellow) ==========
  static const Color secondaryYellow = Color(0xFFFFD93D);
  static const Color secondaryYellowDark = Color(0xFFFFC107);
  static const Color secondaryYellowLight = Color(0xFFFFE57F);

  // ========== Dark Mode Colors ==========
  static const Color darkBackground = Color(0xFF121212);
  static const Color darkSurface = Color(0xFF1E1E1E);
  static const Color darkCard = Color(0xFF2D2D2D);
  static const Color darkElevated = Color(0xFF383838);

  static const Color darkTextPrimary = Color(0xFFFFFFFF);
  static const Color darkTextSecondary = Color(0xFFB3B3B3);

  /// Legacy support
  static const Color darkSurfaceVariant = darkCard;
}
