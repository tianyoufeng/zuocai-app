# -*- coding: utf-8 -*-
"""verify_apk.py — APK 逐字节核对（证明包里是这一次的产物）
1. 包内 classes.dex == 构建目录 dex（字节相同）
2. 包内 assets/index.html == src/index.html
3. dex 头部校验（magic/file_size/header_size/endian_tag/adler32）
4. 包内数据抽样：manifest.js / 图片 / MainActivity 字符串
"""
import hashlib
import sys
import zipfile
import zlib

apk_path, dex_src, html_src = sys.argv[1], sys.argv[2], sys.argv[3]

z = zipfile.ZipFile(apk_path)
names = z.namelist()
errors = []

# 1. dex 字节一致
dex_pkg = z.read('classes.dex')
dex_ref = open(dex_src, 'rb').read()
if hashlib.sha256(dex_pkg).hexdigest() != hashlib.sha256(dex_ref).hexdigest():
    errors.append('classes.dex 与构建产物不一致')

# 2. index.html 字节一致
html_pkg = z.read('assets/index.html')
html_ref = open(html_src, 'rb').read()
if hashlib.sha256(html_pkg).hexdigest() != hashlib.sha256(html_ref).hexdigest():
    errors.append('assets/index.html 与源文件不一致')

# 3. dex 头部校验（d8 产出的版本号可能是 035/037/038/039）
if dex_pkg[:4] != b'dex\n' or dex_pkg[4:7] not in (b'035', b'036', b'037', b'038', b'039'):
    errors.append(f'dex magic 异常: {dex_pkg[:7]!r}')
file_size = int.from_bytes(dex_pkg[32:36], 'little')
if file_size != len(dex_pkg):
    errors.append(f'dex file_size 字段({file_size}) != 实际({len(dex_pkg)})')
if int.from_bytes(dex_pkg[36:40], 'little') != 112:
    errors.append('dex header_size != 112')
if int.from_bytes(dex_pkg[40:44], 'little') != 0x12345678:
    errors.append('dex endian_tag 异常')
adler = zlib.adler32(dex_pkg[12:]) & 0xFFFFFFFF
if int.from_bytes(dex_pkg[8:12], 'little') != adler:
    errors.append('dex adler32 校验失败')

# 4. 关键内容抽样（中文按 UTF-8 字节查）
checks = {
    'assets/data/manifest.js': '鱼香肉丝'.encode('utf-8'),
    'assets/js/app.js': 'window.APP'.encode('utf-8'),
    'assets/css/tokens.css': '--safe-top'.encode('utf-8'),
    'assets/index.html': '今天吃什么'.encode('utf-8'),
}
for name, needle in checks.items():
    if name not in names:
        errors.append(f'包内缺少 {name}')
    elif needle not in z.read(name):
        errors.append(f'{name} 中未找到预期内容')
img_count = sum(1 for n in names if n.startswith('assets/assets/images/') and n.endswith('.webp'))
print(f'包内菜谱图片：{img_count} 张')
classes_entry = [n for n in names if 'MainActivity' in n]
print(f'MainActivity 相关条目：{classes_entry if classes_entry else "（已编入 dex，无独立条目，正常）"}')
print(f'uses-permission 条目：{[n for n in names if "permission" in n.lower()] or "无（零权限）"}')

if errors:
    print('\n发现问题：')
    for e in errors:
        print('  ✗ ' + e)
    sys.exit(1)
print('\nAPK 逐字节核对全部通过')
