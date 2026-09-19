# -*- coding: utf-8 -*-
"""build_library_docs.py — 把项目文档转成适合放进资料库的版本

资料库里相对链接是无效的，所以把仓库内引用 [x](docs/y.md) 统一改写成
GitHub 绝对链接，其余内容原样保留。

产物：_dev/library-docs/*.md（文件名即文档标题）
用法：python tools/../_dev/build_library_docs.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, '_dev', 'library-docs')
GH = 'https://github.com/tianyoufeng/zuocai-app/blob/main/'
REPO = 'https://github.com/tianyoufeng/zuocai-app'

DOCS = [
    ('README.md', '今天吃什么 · 项目总览'),
    ('CHANGELOG.md', '今天吃什么 · 变更日志'),
    ('docs/update-recipes.md', '更新菜谱速查'),
    ('docs/apk-build-guide.md', 'Android 打包指南'),
    ('docs/ios-build-guide.md', 'iOS 安装指南（含 iPhone 真机安装步骤）'),
]


def fix_links(text):
    def repl(m):
        label, target = m.group(1), m.group(2)
        if target.startswith(('http://', 'https://', '#', 'mailto:')):
            return m.group(0)
        clean = target.lstrip('./')
        return '[%s](%s%s)' % (label, GH, clean)
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)', repl, text)


def main():
    os.makedirs(OUT, exist_ok=True)
    made = []
    for src, title in DOCS:
        fp = os.path.join(ROOT, src.replace('/', os.sep))
        if not os.path.exists(fp):
            print('跳过（不存在）:', src)
            continue
        with open(fp, encoding='utf-8') as f:
            text = f.read()

        # 顶部补一行「仓库地址」，资料库里看得见出处
        head = f'> 仓库：{REPO}\n\n'
        body = fix_links(text)
        # 去掉原标题行（文档标题由 --title 提供，避免重复）
        body = re.sub(r'^#\s+.*?\n+', '', body, count=1)

        dst = os.path.join(OUT, title + '.md')
        with open(dst, 'w', encoding='utf-8') as f:
            f.write(head + body)
        made.append((title, dst, len(body)))

    print(f'生成 {len(made)} 篇：')
    for t, p, n in made:
        print(f'  {t}  ({n} 字)')


if __name__ == '__main__':
    main()
