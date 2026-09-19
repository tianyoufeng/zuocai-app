# -*- coding: utf-8 -*-
"""merge_dex.py — 把 classes.dex 合入 APK 根目录（保留原条目压缩方式）"""
import sys
import zipfile

src, dst, dex = sys.argv[1], sys.argv[2], sys.argv[3]
zin = zipfile.ZipFile(src, 'r')
zout = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
for item in zin.infolist():
    data = zin.read(item.filename)
    zi = zipfile.ZipInfo(item.filename, date_time=item.date_time)
    zi.compress_type = item.compress_type  # STORED 不能变 DEFLATED
    zi.external_attr = item.external_attr
    zout.writestr(zi, data, compress_type=item.compress_type)
zout.write(dex, 'classes.dex')  # 必须在 zip 根目录
zout.close()
zin.close()
print('merged classes.dex ->', dst)
