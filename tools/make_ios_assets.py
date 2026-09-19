# -*- coding: utf-8 -*-
"""make_ios_assets.py — 生成 iOS / Capacitor 的 assets 源图

产物（写进仓库根的 resources/，由 `npx @capacitor/assets generate` 消费）：
  resources/icon.png    1024×1024   App 图标源图
  resources/splash.png  2732×2732   启动图源图（App 底色 + 居中图标）

说明：源图从 src/assets/icons/icon-480.png 放大得到。
图标是大面积纯色的几何图形，2 倍放大后缩到各档尺寸（最大 180pt）完全够用。

用法：python tools/make_ios_assets.py
"""
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_ICON = os.path.join(ROOT, 'src', 'assets', 'icons', 'icon-480.png')
OUT_DIR = os.path.join(ROOT, 'resources')

# 与 css/tokens.css 的 --bg 保持一致（顺带兜底深色模式下的观感）
BG_LIGHT = (248, 245, 240, 255)


def main():
    if not os.path.exists(SRC_ICON):
        print('缺少源图标:', SRC_ICON)
        sys.exit(1)

    os.makedirs(OUT_DIR, exist_ok=True)
    base = Image.open(SRC_ICON).convert('RGBA')
    print('源图标', base.size)

    icon = base.resize((1024, 1024), Image.LANCZOS)
    p1 = os.path.join(OUT_DIR, 'icon.png')
    icon.save(p1, 'PNG', optimize=True)
    print(f'  icon.png   1024x1024  {os.path.getsize(p1) / 1024:.1f}KB')

    splash = Image.new('RGBA', (2732, 2732), BG_LIGHT)
    mark = base.resize((560, 560), Image.LANCZOS)
    splash.alpha_composite(mark, ((2732 - 560) // 2, (2732 - 560) // 2))
    p2 = os.path.join(OUT_DIR, 'splash.png')
    splash.convert('RGB').save(p2, 'PNG', optimize=True)
    print(f'  splash.png 2732x2732 {os.path.getsize(p2) / 1024:.1f}KB')

    print('完成，产物在 resources/')


if __name__ == '__main__':
    main()
