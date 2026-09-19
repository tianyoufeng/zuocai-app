# -*- coding: utf-8 -*-
"""make_icons.py — 生成 App 图标（扁平化 / 暖橙圆角底 / 白瓷碗+筷子）
输出：src/assets/icons/icon-{480,96,64,40}.png + _android/res/mipmap-*/ic_launcher.png"""
import math
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS = os.path.join(ROOT, 'src', 'assets', 'icons')
MIPMAP = os.path.join(ROOT, '_android', 'res')

S = 480  # 母版尺寸


def rounded_bg(size, radius_ratio=0.22):
    """番茄橙渐变圆角底"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(size * radius_ratio)
    # 垂直渐变：#F08A5C -> #E8703A -> #C9552A
    top, mid, bot = (240, 138, 92), (232, 112, 58), (201, 85, 42)
    grad = Image.new('RGBA', (size, size))
    gd = ImageDraw.Draw(grad)
    for y in range(size):
        t = y / size
        if t < 0.5:
            k = t / 0.5
            c = tuple(round(top[i] + (mid[i] - top[i]) * k) for i in range(3))
        else:
            k = (t - 0.5) / 0.5
            c = tuple(round(mid[i] + (bot[i] - mid[i]) * k) for i in range(3))
        gd.line([(0, y), (size, y)], fill=c + (255,))
    mask = Image.new('L', (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=255)
    img.paste(grad, (0, 0), mask)
    return img


def draw_bowl(img, size):
    """白瓷碗 + 筷子 + 热气（几何简化，扁平风格）"""
    d = ImageDraw.Draw(img)
    u = size / 480.0  # 缩放单位
    white = (255, 255, 255, 255)
    warm = (255, 238, 224, 255)

    # 碗体：下半圆（宽 250，高 130），碗口 y=270
    bx0, bx1 = 115 * u, 365 * u
    by = 270 * u
    d.pieslice([bx0, by - 130 * u, bx1, by + 130 * u], 0, 180, fill=white)
    # 碗口沿（椭圆，暖白色做出瓷面层次）
    d.ellipse([bx0, by - 18 * u, bx1, by + 18 * u], fill=white)
    d.ellipse([bx0 + 14 * u, by - 10 * u, bx1 - 14 * u, by + 10 * u], fill=warm)
    # 碗足
    d.rounded_rectangle([200 * u, by + 118 * u, 280 * u, by + 138 * u], radius=8 * u, fill=white)

    # 碗里的饭：三个小圆弧代表米饭隆起
    rice_y = by - 2 * u
    d.ellipse([150 * u, rice_y - 44 * u, 230 * u, rice_y + 8 * u], fill=warm)
    d.ellipse([215 * u, rice_y - 52 * u, 300 * u, rice_y + 6 * u], fill=warm)
    d.ellipse([280 * u, rice_y - 40 * u, 340 * u, rice_y + 8 * u], fill=warm)

    # 筷子：两根平行斜置圆角棒，架在碗右上方（同角度、垂直平移，不交叉）
    ang = math.radians(58)
    dx, dy = math.cos(ang), math.sin(ang)
    px, py = -dy, dx
    L, W = 200 * u, 14 * u
    for off in (-16 * u, 16 * u):
        cx, cy = 300 * u + px * off, 120 * u + py * off
        pts = [
            (cx - dx * L / 2 - px * W / 2, cy - dy * L / 2 - py * W / 2),
            (cx + dx * L / 2 - px * W / 2, cy + dy * L / 2 - py * W / 2),
            (cx + dx * L / 2 + px * W / 2, cy + dy * L / 2 + py * W / 2),
            (cx - dx * L / 2 + px * W / 2, cy - dy * L / 2 + py * W / 2),
        ]
        d.polygon(pts, fill=white)

    # 热气：一缕居中短圆棒，与筷子拉开距离
    d.rounded_rectangle([230 * u, 52 * u, 250 * u, 108 * u], radius=10 * u,
                        fill=(255, 255, 255, 200))
    return img


def make(master_size):
    img = rounded_bg(master_size)
    img = draw_bowl(img, master_size)
    return img


def main():
    os.makedirs(ICONS, exist_ok=True)
    master = make(S)
    master.save(os.path.join(ICONS, 'icon-480.png'))
    for s in (96, 64, 40):
        master.resize((s, s), Image.LANCZOS).save(os.path.join(ICONS, f'icon-{s}.png'))
    print('icons ->', ICONS)

    # Android mipmap：48/72/96/144/192
    dens = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
    for name, s in dens.items():
        d = os.path.join(MIPMAP, f'mipmap-{name}')
        os.makedirs(d, exist_ok=True)
        master.resize((s, s), Image.LANCZOS).save(os.path.join(d, 'ic_launcher.png'))
    print('mipmap ->', MIPMAP)


if __name__ == '__main__':
    main()
