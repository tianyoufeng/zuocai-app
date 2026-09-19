# -*- coding: utf-8 -*-
"""build_img_map.py — 扫描 _raw 目录，按文件名中的菜名构建 id→原图映射
输出 tools/img-map.json 供 compress_images.py 使用"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, '_raw')
DATA = os.path.join(ROOT, 'src', 'data')
CATS = ['jiachangcai', 'tanggeng', 'zhushi', 'liangcai', 'zaocan', 'yexiao']

name2id = {}
for cat in CATS:
    text = open(os.path.join(DATA, f'{cat}.js'), encoding='utf-8').read()
    for m in re.finditer(r"id:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'", text):
        name2id[m.group(2)] = m.group(1)

mapping = {}
used_names = set()
for fn in os.listdir(RAW):
    if not fn.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
        continue
    parts = fn.rsplit('.png', 1)[0].split('_')
    if len(parts) < 3:
        continue
    dish = parts[1]
    if dish not in name2id:
        print(f'  ? 未识别: {fn}')
        continue
    rid = name2id[dish]
    if rid in mapping:
        print(f'  ! 重复映射 {rid}（已有 {mapping[rid]}，跳过 {fn}）')
        continue
    mapping[rid] = os.path.join(RAW, fn)
    used_names.add(dish)

with open(os.path.join(ROOT, 'tools', 'img-map.json'), 'w', encoding='utf-8') as f:
    json.dump(mapping, f, ensure_ascii=False, indent=1)

print(f'映射 {len(mapping)} 张（原始图 {sum(1 for x in os.listdir(RAW) if x.lower().endswith((".png",".jpg",".jpeg")))} 张）')
missing = [n for n in name2id if n not in used_names]
if missing:
    print(f'缺原图的菜谱 {len(missing)} 道（后续迭代补图）')
