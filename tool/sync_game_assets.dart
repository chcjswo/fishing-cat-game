// 게임 원본(games/)을 앱 assets로 동기화한다.
//
// 사용법 (저장소 루트에서):
//   dart run tool/sync_game_assets.dart
//
// games/ 가 앱 쪽 게임의 유일 원본이다. 이 스크립트는 대상 폴더를
// 비우고 원본 전체를 다시 복사하므로, 원본에서 삭제된 파일도 assets에서
// 함께 사라진다. 복사하면서 이미지 사본은 앱 용량을 위해 줄인다
// (tool/game_asset_optimizer.dart 참조). 원본은 건드리지 않는다.
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'game_asset_optimizer.dart';

const Set<String> _textExtensions = {'.html', '.js', '.css'};

void main() {
  final scriptDir = File(Platform.script.toFilePath()).parent;
  final projectRoot = scriptDir.parent;

  final source = Directory('${projectRoot.path}/games');
  final destination = Directory('${projectRoot.path}/assets/game');

  if (!source.existsSync()) {
    stderr.writeln('원본 폴더를 찾을 수 없습니다: ${source.path}');
    exit(1);
  }

  if (destination.existsSync()) {
    destination.deleteSync(recursive: true);
  }
  destination.createSync(recursive: true);

  var copied = 0;
  var sourceBytes = 0;
  var outputBytes = 0;
  for (final entity in source.listSync(recursive: true)) {
    if (entity is! File) continue;
    final relative = entity.path
        .substring(source.path.length + 1)
        .replaceAll(Platform.pathSeparator, '/');
    final bytes = entity.readAsBytesSync();
    final (targetPath, output) = _bundledCopy(relative, bytes);

    final target = File('${destination.path}/$targetPath');
    target.parent.createSync(recursive: true);
    target.writeAsBytesSync(output);
    sourceBytes += bytes.length;
    outputBytes += output.length;
    copied++;
  }

  stdout.writeln(
    '동기화 완료: $copied개 파일 → ${destination.path}\n'
    '용량: ${_megabytes(sourceBytes)} → ${_megabytes(outputBytes)}',
  );
}

// 앱 번들에 넣을 경로와 내용. 배경은 JPG로, 스프라이트는 축소 PNG로,
// 게임 소스는 배경 경로를 JPG로 고친 사본으로 바꾼다.
(String, Uint8List) _bundledCopy(String relative, Uint8List bytes) {
  if (isBackground(relative)) {
    return (backgroundJpegPath(relative), backgroundToJpeg(bytes));
  }
  if (relative.endsWith('.png')) return (relative, optimizeSprite(bytes));
  if (_textExtensions.any(relative.endsWith)) {
    final text = rewriteBackgroundReferences(utf8.decode(bytes));
    return (relative, utf8.encode(text));
  }
  return (relative, bytes);
}

String _megabytes(int bytes) => '${(bytes / 1024 / 1024).toStringAsFixed(1)}MB';
