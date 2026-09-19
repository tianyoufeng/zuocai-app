# -*- coding: utf-8 -*-
"""make_pwa_icons.py — 从 icon-480.png 生成 PWA / iOS 主屏图标
产物（都写进 src/assets/icons/）：
  icon-180.png  iOS「添加到主屏幕」用的 apple-touch-icon（iOS 认这个尺寸）
  icon-192.png  Android/Chrome manifest 常用尺寸
  icon-512.png  PWA 安装/启动画面用的大图
用法：python tools/make_pwa_icons.py
"""
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS = os.path.join(ROOT, 'src', 'assets', 'icons')
SRC = os.path.join(ICONS, 'icon-480.png')


def main():
    if not os.path.exists(SRC):
        print('缺少源图:', SRC)
        sys.exit(1)
    base = Image.open(SRC).convert('RGBA')
    print('源图', base.size)

    for size in (180, 192, 512):
        img = base.resize((size, size), Image.LANCZOS)
        out = os.path.join(ICONS, f'icon-{size}.png')
        img.save(out, 'PNG', optimize=True)
        print(f'  {os.path.basename(out)}  {size}x{size}  {os.path.getsize(out) / 1024:.1f}KB')

    print('完成')


if __name__ == '__main__':
    main()
