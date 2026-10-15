// 앱 번들용 게임 이미지 사본을 줄인다. 원본(games/)은 건드리지 않는다.
//
// - 스테이지 배경: 투명도가 없는 수채화라 같은 해상도의 JPG로 바꾸고,
//   게임 소스의 배경 경로도 .jpg로 고친다.
// - 스프라이트: 투명도가 필요하므로 PNG를 유지하고 긴 변만 줄인다.
import 'dart:typed_data';

import 'package:image/image.dart' as img;

/// 스프라이트 긴 변 한도. 게임 좌표 최대 표시 크기(약 220px)의 2배 이상이라
/// 고해상도 화면에서도 원본 대비 열화가 보이지 않는다.
const int spriteMaxSide = 512;

const int backgroundJpegQuality = 85;

final RegExp _backgroundPng = RegExp(r'assets/backgrounds/([\w-]+)\.png');

bool isBackground(String relativePath) => _backgroundPng.hasMatch(relativePath);

String backgroundJpegPath(String relativePath) =>
    relativePath.replaceFirst(RegExp(r'\.png$'), '.jpg');

String rewriteBackgroundReferences(String source) => source.replaceAllMapped(
  _backgroundPng,
  (match) => 'assets/backgrounds/${match.group(1)}.jpg',
);

Uint8List backgroundToJpeg(Uint8List pngBytes) =>
    img.encodeJpg(img.decodePng(pngBytes)!, quality: backgroundJpegQuality);

Uint8List optimizeSprite(Uint8List pngBytes, {int maxSide = spriteMaxSide}) {
  final image = img.decodePng(pngBytes)!;
  if (image.width <= maxSide && image.height <= maxSide) return pngBytes;
  final resized = image.width >= image.height
      ? img.copyResize(
          image,
          width: maxSide,
          interpolation: img.Interpolation.average,
        )
      : img.copyResize(
          image,
          height: maxSide,
          interpolation: img.Interpolation.average,
        );
  return img.encodePng(resized, level: 9);
}
