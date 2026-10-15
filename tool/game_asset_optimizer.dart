// 앱 번들용 게임 이미지 사본을 줄인다. 원본(games/)은 건드리지 않는다.
//
// - 스테이지 배경: 투명도가 없는 수채화라 같은 해상도의 JPG로 바꾸고,
//   게임 소스의 배경 경로도 .jpg로 고친다.
// - 스프라이트: 투명도가 필요하므로 PNG를 유지하고 긴 변만 줄인다.
import 'dart:typed_data';

import 'package:image/image.dart' as img;

/// 스프라이트 긴 변 한도. 가장 크게 그려지는 펭귄(246px)을 1440px 폭 폰
/// 배율(약 2.25배)로 그려도 확대 보간이 일어나지 않는 크기다.
const int spriteMaxSide = 640;

const int backgroundJpegQuality = 85;

final RegExp _backgroundPng = RegExp(r'assets/backgrounds/([\w-]+)\.png');

bool isBackground(String relativePath) => _backgroundPng.hasMatch(relativePath);

String backgroundJpegPath(String relativePath) =>
    relativePath.replaceFirst(RegExp(r'\.png$'), '.jpg');

String rewriteBackgroundReferences(String source) => source.replaceAllMapped(
  _backgroundPng,
  (match) => backgroundJpegPath(match.group(0)!),
);

Uint8List backgroundToJpeg(Uint8List pngBytes) =>
    img.encodeJpg(img.decodePng(pngBytes)!, quality: backgroundJpegQuality);

Uint8List optimizeSprite(Uint8List pngBytes, {int maxSide = spriteMaxSide}) {
  final image = img.decodePng(pngBytes)!;
  if (image.width <= maxSide && image.height <= maxSide) return pngBytes;
  final isLandscape = image.width >= image.height;
  final resized = img.copyResize(
    image,
    width: isLandscape ? maxSide : null,
    height: isLandscape ? null : maxSide,
    interpolation: img.Interpolation.average,
  );
  return img.encodePng(resized, level: 9);
}
