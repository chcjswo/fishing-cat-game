import 'package:catfishing/features/game/back_action.dart';
import 'package:catfishing/shared/models/game_scene.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('플레이가 아닌 화면에서는 바로 종료 확인', () {
    for (final scene in GameScene.values.where((s) => s != GameScene.play)) {
      expect(backActionFor(scene), BackAction.confirmExit, reason: scene.name);
    }
  });

  group('showExitConfirmDialog', () {
    // 종료 확인 창을 열고, 닫히면 결과를 돌려주는 Future를 반환한다.
    Future<Future<bool>> openDialog(WidgetTester tester) async {
      late Future<bool> result;
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) => TextButton(
              onPressed: () => result = showExitConfirmDialog(context),
              child: const Text('open'),
            ),
          ),
        ),
      );
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();
      expect(find.text('낚시냥을 종료할까요?'), findsOneWidget);
      return result;
    }

    testWidgets('종료를 누르면 true', (tester) async {
      final result = await openDialog(tester);
      await tester.tap(find.text('종료'));
      await tester.pumpAndSettle();
      expect(await result, isTrue);
      expect(find.byType(AlertDialog), findsNothing);
    });

    testWidgets('취소를 누르면 false', (tester) async {
      final result = await openDialog(tester);
      await tester.tap(find.text('취소'));
      await tester.pumpAndSettle();
      expect(await result, isFalse);
      expect(find.byType(AlertDialog), findsNothing);
    });
  });
}
