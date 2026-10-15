import 'package:flutter/material.dart';

import '../../shared/models/game_scene.dart';

/// Android 뒤로가기가 취할 동작.
enum BackAction { confirmExit }

/// 화면별 뒤로가기 동작: 어디서든 종료 확인 창을 띄운다.
BackAction backActionFor(GameScene scene) => BackAction.confirmExit;

/// 종료 확인 창. '종료'를 고르면 true, '취소'나 바깥 탭으로 닫으면 false.
Future<bool> showExitConfirmDialog(BuildContext context) async {
  final shouldExit = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('게임 종료'),
      content: const Text('낚시냥을 종료할까요?'),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('취소'),
        ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(true),
          child: const Text('종료'),
        ),
      ],
    ),
  );
  return shouldExit ?? false;
}
