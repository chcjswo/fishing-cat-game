import 'package:baseapp/features/home/home_screen.dart';
import 'package:baseapp/features/menu1/menu1_screen.dart';
import 'package:baseapp/features/menu2/menu2_screen.dart';
import 'package:baseapp/features/settings/recommended_apps_screen.dart';
import 'package:baseapp/features/settings/settings_feedback_entry.dart';
import 'package:baseapp/features/settings/settings_screen.dart';
import 'package:baseapp/shared/widgets/bottom_navigation.dart';
import 'package:go_router/go_router.dart';

final router = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) {
        int currentIndex = 0;
        final path = state.uri.path;
        if (path.startsWith('/menu1')) {
          currentIndex = 1;
        } else if (path.startsWith('/menu2')) {
          currentIndex = 2;
        } else if (path.startsWith('/settings')) {
          currentIndex = 3;
        }
        return BottomNavigation(currentIndex: currentIndex, child: child);
      },
      routes: [
        GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
        GoRoute(
          path: '/menu1',
          builder: (context, state) => const Menu1Screen(),
        ),
        GoRoute(
          path: '/menu2',
          builder: (context, state) => const Menu2Screen(),
        ),
        GoRoute(
          path: '/settings',
          builder: (context, state) => const SettingsScreen(),
          routes: [
            GoRoute(
              path: 'recommended-apps',
              builder: (context, state) => const RecommendedAppsScreen(),
            ),
            GoRoute(
              path: 'feedback',
              builder: (context, state) => const SettingsFeedbackEntry(),
            ),
          ],
        ),
      ],
    ),
  ],
);
