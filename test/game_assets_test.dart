// 게임 자산이 앱 번들에 올바르게 포함되는지 검증한다.
// (assets/game 은 tool/sync_game_assets.dart 실행으로 생성된다)
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

const String gameRoot = 'assets/game';
const List<String> gameSourceFiles = [
  'index.html',
  'game.js',
  'pixel.js',
  'game.css',
];

// 게임 소스에서 참조하는 이미지 경로(게임 루트 기준)를 모은다.
// 정적 경로(`assets/xxx.png`, 앱용으로 압축된 배경 `.jpg`), 아이템 헬퍼 `img('name')`이 만드는
// `assets/i_name.png`, 결과 화면이 `'assets/'+catImg+'.png'`로 조립하는
// 고양이 이름(`'cat_xxx'`)을 모두 포함한다.
Set<String> referencedImages(Iterable<String> sources) {
  final staticPath = RegExp(r'assets/[\w./-]+\.(png|jpg)');
  final itemImage = RegExp(r"img\('(\w+)'\)");
  final catName = RegExp(r"'(cat_\w+)'");
  return {
    for (final source in sources) ...[
      for (final match in staticPath.allMatches(source)) match.group(0)!,
      for (final match in itemImage.allMatches(source))
        'assets/i_${match.group(1)}.png',
      for (final match in catName.allMatches(source))
        'assets/${match.group(1)}.png',
    ],
  };
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('게임 실행 파일이 assets에 번들된다', () async {
    final html = await rootBundle.loadString('$gameRoot/index.html');
    expect(html, contains('낚시냥'));
    for (final file in gameSourceFiles.skip(1)) {
      expect(html, contains(file));
      await rootBundle.loadString('$gameRoot/$file');
    }
  });

  test('게임이 참조하는 이미지가 모두 번들된다', () async {
    final sources = [
      for (final file in gameSourceFiles)
        await rootBundle.loadString('$gameRoot/$file'),
    ];
    final images = referencedImages(sources);
    // 1~30스테이지 배경 + 아이템·고양이·펭귄 스프라이트
    expect(
      images.where((path) => path.contains('backgrounds/')),
      hasLength(30),
    );

    final manifest = await AssetManifest.loadFromAssetBundle(rootBundle);
    final bundled = manifest.listAssets().toSet();
    final missing = images.where(
      (path) => !bundled.contains('$gameRoot/$path'),
    );
    expect(missing, isEmpty);
  });

  test('게임은 외부 네트워크 자원을 참조하지 않는다 (오프라인 완결)', () async {
    // 주석 속 라이선스 URL 같은 텍스트는 요청이 아니므로, 실제로 자원을
    // 불러오는 속성·CSS url()·JS 문자열 리터럴의 외부 URL만 찾는다.
    final externalLoad = RegExp(
      r'''(src|href)\s*=\s*["']https?://|url\(\s*["']?https?://|["'`]https?://''',
    );
    for (final file in [...gameSourceFiles, 'fonts/galmuri.css']) {
      final source = await rootBundle.loadString('$gameRoot/$file');
      expect(externalLoad.hasMatch(source), isFalse, reason: file);
    }
  });

  test('게임 글꼴(Galmuri) 파일이 번들된다', () async {
    final css = await rootBundle.loadString('$gameRoot/fonts/galmuri.css');
    final fontFiles = RegExp(
      r"url\('\./([\w-]+\.woff2)'\)",
    ).allMatches(css).map((match) => 'fonts/${match.group(1)}');
    expect(fontFiles, isNotEmpty);

    final manifest = await AssetManifest.loadFromAssetBundle(rootBundle);
    final bundled = manifest.listAssets().toSet();
    for (final font in fontFiles) {
      expect(bundled, contains('$gameRoot/$font'));
    }
    expect(bundled, contains('$gameRoot/fonts/ofl.md'));
  });
}
