import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:image/image.dart' as img;

import '../tool/game_asset_optimizer.dart';

Uint8List pngOf(int width, int height, {bool alpha = true}) => img.encodePng(
  img.Image(width: width, height: height, numChannels: alpha ? 4 : 3),
);

void main() {
  group('isBackground', () {
    test('스테이지 배경 PNG만 배경으로 본다', () {
      expect(
        isBackground('assets/backgrounds/stage-01-a-watercolor.png'),
        isTrue,
      );
      expect(isBackground('assets/i_fish.png'), isFalse);
      expect(isBackground('assets/backgrounds/readme.txt'), isFalse);
    });
  });

  group('backgroundJpegPath', () {
    test('배경 PNG 경로를 JPG 경로로 바꾼다', () {
      expect(
        backgroundJpegPath('assets/backgrounds/stage-01-a-watercolor.png'),
        'assets/backgrounds/stage-01-a-watercolor.jpg',
      );
    });
  });

  group('rewriteBackgroundReferences', () {
    test('소스 안의 배경 PNG 참조만 JPG로 바꾼다', () {
      const source =
          "background:'assets/backgrounds/stage-01-a-watercolor.png', "
          "art:()=>img('fish'), src='assets/cat_idle.png'";
      expect(
        rewriteBackgroundReferences(source),
        "background:'assets/backgrounds/stage-01-a-watercolor.jpg', "
        "art:()=>img('fish'), src='assets/cat_idle.png'",
      );
    });
  });

  group('optimizeSprite', () {
    test('긴 변이 한도를 넘으면 비율을 유지해 줄이고 투명도를 지킨다', () {
      final result = img.decodePng(
        optimizeSprite(pngOf(1600, 1000), maxSide: 512),
      )!;
      expect(result.width, 512);
      expect(result.height, 320);
      expect(result.numChannels, 4);
    });

    test('한도 이하 스프라이트는 원본 바이트를 그대로 둔다', () {
      final original = pngOf(300, 200);
      expect(optimizeSprite(original, maxSide: 512), same(original));
    });
  });

  group('backgroundToJpeg', () {
    test('해상도를 유지한 JPG로 인코딩한다', () {
      final jpeg = backgroundToJpeg(pngOf(120, 160, alpha: false));
      final decoded = img.decodeJpg(jpeg)!;
      expect(decoded.width, 120);
      expect(decoded.height, 160);
    });
  });
}
