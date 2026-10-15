# -*- coding: utf-8 -*-
"""낚시냥 앱 아이콘 생성: 타이틀의 생선 문 고양이(cat_happy) + 하늘·바다 배경.

사용법 (저장소 루트에서): python tool/make_icon.py
결과: assets/icons/icon.png (1024 풀블리드), assets/icons/icon_foreground.png
(Android 적응형 아이콘 전경, 투명 배경·중앙 세이프존), assets/icons/splash.png·
splash_android12.png (네이티브 스플래시, 아이콘과 같은 하늘색 배경 위에 표시)
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "games" / "assets" / "cat_happy.png"
OUT_DIR = ROOT / "assets" / "icons"
SIZE = 1024

# 타이틀 화면 하늘·바다 톤
SKY_TOP = (150, 215, 240)
SKY_BOTTOM = (205, 238, 248)
SEA = (64, 196, 196)
SEA_DEEP = (32, 150, 165)


def background():
    image = Image.new("RGB", (SIZE, SIZE))
    draw = ImageDraw.Draw(image)
    for y in range(SIZE):
        t = y / (SIZE - 1)
        color = tuple(int(a + (b - a) * t) for a, b in zip(SKY_TOP, SKY_BOTTOM))
        draw.line([(0, y), (SIZE, y)], fill=color)
    draw.rectangle([0, 700, SIZE, SIZE], fill=SEA)
    draw.rectangle([0, 860, SIZE, SIZE], fill=SEA_DEEP)
    return image


def cat(width):
    image = Image.open(SOURCE).convert("RGBA")
    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.LANCZOS).filter(
        ImageFilter.UnsharpMask(radius=3, percent=60, threshold=2)
    )


def shadow(box):
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse(box, fill=(0, 40, 60, 90))
    return layer.filter(ImageFilter.GaussianBlur(16))


# 풀블리드 아이콘 (iOS·범용)
icon = background().convert("RGBA")
big_cat = cat(760)
icon.alpha_composite(shadow([232, 880, 792, 960]))
icon.alpha_composite(big_cat, ((SIZE - big_cat.width) // 2, 930 - big_cat.height))
icon.convert("RGB").save(OUT_DIR / "icon.png")

# Android 적응형 전경: 원형·사각 마스크 모두에서 잘리지 않게 중앙 66% 세이프존 안에
# 둔다. flutter_launcher_icons가 전경에 16% inset을 더해 68%로 줄이므로 그만큼 크게 그린다.
foreground = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
small_cat = cat(640)
foreground.alpha_composite(
    small_cat, ((SIZE - small_cat.width) // 2, (SIZE - small_cat.height) // 2)
)
foreground.save(OUT_DIR / "icon_foreground.png")

# 스플래시: 투명 배경 고양이 (배경색은 flutter_native_splash 설정)
splash = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
splash_cat = cat(600)
splash.alpha_composite(
    splash_cat, ((SIZE - splash_cat.width) // 2, (SIZE - splash_cat.height) // 2)
)
splash.save(OUT_DIR / "splash.png")

# Android 12+ 스플래시: 1152 캔버스의 중앙 지름 768 원 밖은 잘리므로 그 안에 둔다
ANDROID12_SIZE = 1152
splash12 = Image.new("RGBA", (ANDROID12_SIZE, ANDROID12_SIZE), (0, 0, 0, 0))
splash12_cat = cat(520)
splash12.alpha_composite(
    splash12_cat,
    (
        (ANDROID12_SIZE - splash12_cat.width) // 2,
        (ANDROID12_SIZE - splash12_cat.height) // 2,
    ),
)
splash12.save(OUT_DIR / "splash_android12.png")

print("saved:", sorted(path.name for path in OUT_DIR.iterdir()))
