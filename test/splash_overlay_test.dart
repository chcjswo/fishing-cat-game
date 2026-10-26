import 'package:fishing_cat_game/features/game/splash_overlay.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

Widget _app({required bool ready}) => MaterialApp(
  home: SplashOverlay(ready: ready, child: const Text('game')),
);

final _logo = find.byType(Image);

double _logoOpacity(WidgetTester tester) => tester
    .widget<FadeTransition>(
      find.ancestor(of: _logo, matching: find.byType(FadeTransition)).first,
    )
    .opacity
    .value;

void main() {
  testWidgets('로고는 투명하게 시작해 페이드인된다', (tester) async {
    await tester.pumpWidget(_app(ready: true));
    expect(_logoOpacity(tester), 0);

    await tester.pump(SplashOverlay.fadeInDuration);
    expect(_logoOpacity(tester), 1);
  });

  testWidgets('페이지가 먼저 준비돼도 3초 동안은 스플래시를 보여 준다', (tester) async {
    await tester.pumpWidget(_app(ready: true));

    await tester.pump(
      SplashOverlay.displayDuration - const Duration(milliseconds: 1),
    );
    expect(_logo, findsOneWidget);

    await tester.pump(const Duration(milliseconds: 1));
    expect(_logo, findsNothing);
    expect(find.text('game'), findsOneWidget);
  });

  testWidgets('3초가 지나도 페이지가 준비될 때까지 스플래시를 유지한다', (tester) async {
    await tester.pumpWidget(_app(ready: false));
    await tester.pump(SplashOverlay.displayDuration);
    expect(_logo, findsOneWidget);

    await tester.pumpWidget(_app(ready: true));
    expect(_logo, findsNothing);
  });
}
