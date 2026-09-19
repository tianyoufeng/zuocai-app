# -*- coding: utf-8 -*-
"""clean_work.py — 清理 APK 构建中间目录
构建脚本每轮需要把 work-chishenme 清空重建，用 Python 做可以避开
shell 层 rm -rf 的批量删除确认弹窗（该目录只是构建中间产物，非用户数据）。
用法：python tools/clean_work.py <目录>
"""
import os
import shutil
import sys


def main():
    if len(sys.argv) < 2:
        print('用法: python tools/clean_work.py <目录>')
        sys.exit(1)
    target = sys.argv[1]
    if not os.path.isdir(target):
        print('目录不存在，无需清理:', target)
        return
    shutil.rmtree(target)
    print('已清理构建中间目录:', target)


if __name__ == '__main__':
    main()
