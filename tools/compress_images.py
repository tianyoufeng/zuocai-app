# -*- coding: utf-8 -*-
"""compress_images.py — 把 ImageGen 原图压缩为规格 WebP 入库
规格：最长边 800px / 质量 72 / 目标单张 30-50KB
用法：python tools/compress_images.py <原始图目录> <原始图目录2> ...
原始文件名与菜谱 id 的映射写在 tools/img-map.json：
  { "fanqie-chao-dan": "C:/path/to/raw-001.png", ... }
"""
import json
import os
import sys
from io import BytesIO

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_IMG = os.path.join(ROOT, 'src', 'assets', 'images')
MAP = os.path.join(ROOT, 'tools', 'img-map.json')

TARGET_MAX = 800
QUALITY = 72
MIN_KB, MAX_KB = 30, 50


def compress_one(src_path):
    img = Image.open(src_path).convert('RGB')
    w, h = img.size
    if max(w, h) > TARGET_MAX:
        scale = TARGET_MAX / max(w, h)
        img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    q = QUALITY
    for _ in range(12):
        buf = BytesIO()
        img.save(buf, 'WEBP', quality=q, method=6)
        size_kb = buf.tell() / 1024
        if size_kb <= MAX_KB:
            break
        if q > 36:
            q -= 4
            continue
        # 降到质量下限仍超标：缩边到 720 再压
        w, h = img.size
        img = img.resize((round(w * 0.9), round(h * 0.9)), Image.LANCZOS)
    return buf.getvalue(), size_kb, img.size, q


def main():
    with open(MAP, encoding='utf-8') as f:
        mapping = json.load(f)

    ok, miss = 0, []
    total_bytes = 0
    for rid, src in mapping.items():
        cat_file = None
        for cat in ('jiachangcai', 'tanggeng', 'zhushi', 'liangcai', 'zaocan', 'yexiao'):
            if rid in open(os.path.join(ROOT, 'src', 'data', f'{cat}.js'), encoding='utf-8').read():
                cat_file = cat
                break
        if not cat_file:
            miss.append((rid, 'id 未在分类数据中找到'))
            continue
        if not os.path.exists(src):
            miss.append((rid, f'原图缺失: {src}'))
            continue
        data, kb, size, q = compress_one(src)
        out_dir = os.path.join(SRC_IMG, cat_file)
        os.makedirs(out_dir, exist_ok=True)
        out = os.path.join(out_dir, f'{rid}.webp')
        with open(out, 'wb') as fo:
            fo.write(data)
        total_bytes += len(data)
        ok += 1
        print(f'  {cat_file}/{rid}.webp  {kb:.0f}KB  {size[0]}x{size[1]}  q{q}')

    print(f'\n入库 {ok} 张 · 总计 {total_bytes / 1024 / 1024:.1f} MB')
    if miss:
        print('未处理：')
        for rid, why in miss:
            print(f'  - {rid}: {why}')
        sys.exit(1)


if __name__ == '__main__':
    main()
