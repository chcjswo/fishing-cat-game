// 게임 원본(games/)을 앱 assets로 동기화한다.
//
// 사용법 (저장소 루트에서):
//   dart run tool/sync_game_assets.dart
//
// games/ 가 앱 쪽 게임의 유일 원본이다. 이 스크립트는 대상 폴더를
// 비우고 원본 전체를 다시 복사하므로, 원본에서 삭제된 파일도 assets에서
// 함께 사라진다.
import 'dart:io';

void main() {
  final scriptDir = File(Platform.script.toFilePath()).parent;
  final projectRoot = scriptDir.parent;

  final source = Directory('${projectRoot.path}${Platform.pathSeparator}games');
  final destination = Directory(
    '${projectRoot.path}${Platform.pathSeparator}assets'
    '${Platform.pathSeparator}game',
  );

  if (!source.existsSync()) {
    stderr.writeln('원본 폴더를 찾을 수 없습니다: ${source.path}');
    exit(1);
  }

  if (destination.existsSync()) {
    destination.deleteSync(recursive: true);
  }
  destination.createSync(recursive: true);

  var copied = 0;
  for (final entity in source.listSync(recursive: true)) {
    if (entity is! File) continue;
    final relative = entity.path.substring(source.path.length + 1);
    final target = File(
      '${destination.path}${Platform.pathSeparator}$relative',
    );
    target.parent.createSync(recursive: true);
    entity.copySync(target.path);
    copied++;
  }

  stdout.writeln('동기화 완료: $copied개 파일 → ${destination.path}');
}
