# 今天吃什么 · 本地做菜 App（v3.1）

> GitHub：https://github.com/tianyoufeng/zuocai-app
> 一个**纯本地运行**的家常菜菜谱 App：随机抽菜、分类浏览、搜索、收藏、一页做菜。
> 无后端、无账号、无网络请求、零权限 —— 断网完全可用。

---

## 一、这是什么

| 项目 | 值 |
|---|---|
| 版本 | v3.1.0（versionCode 31） |
| 菜谱数量 | **680 道**（家常菜 200 / 主食 80 / 汤羹 70 / 早餐 50 / 凉菜 50 / 夜宵 50 / **粤菜 60 / 川菜 60 / 湘菜 60**） |
| 选购数据 | **680 条** —— 每道菜的主要食材都有「怎么挑」，另配 2~4 条新手提示 |
| 图片 | **680 张，覆盖率 100%**（无占位块）。WebP，长边 800 / 单张 30~50KB，共 28.7MB |
| 安装包 | **Android**：下载 `chishenme-v3.1.0.apk`（32MB）<br>**iPhone / iPad**：下载 `chishenme-ios-unsigned.ipa`（33MB），用 Sideloadly 拿自己的 Apple ID 自签安装<br>**不想折腾签名**：Safari 打开 <https://tianyoufeng.github.io/zuocai-app/> → 添加到主屏幕（PWA） |
| 权限 | **零权限**（Manifest 不含 INTERNET 等任何权限） |
| 存储 | 菜谱数据打包内置；收藏 / 历史 / 偏好 / 份量用 IndexedDB，仅存本机 |
| 最低系统 | Android 8.0 (API 26) / iOS 14 |

## 二、快速开始

- **浏览器预览**：直接双击 `src/index.html`（file:// 下同样可用，IndexedDB 正常）。
- **在线试用（任何浏览器）**：<https://tianyoufeng.github.io/zuocai-app/>
- **Android 安装**：从 [Releases](https://github.com/tianyoufeng/zuocai-app/releases) 下载
  `chishenme-v3.0.0.apk`（或直接用本机 `dist/chishenme-v3.0.0.apk`）传到手机安装
  （需允许「安装未知应用」，Play Protect 提示点「仍然安装」）。
- **iPhone / iPad 安装（真 App，装在本地）**：从
  [Releases](https://github.com/tianyoufeng/zuocai-app/releases) 下载 `chishenme-ios-unsigned.ipa`，
  在 Windows 上用 **Sideloadly** 拿自己的 Apple ID 签名安装 ——
  桌面独立图标、完全离线、数据存在 App 沙盒里（清理 Safari 不影响）。
  注意：免费 Apple ID 签名 **7 天后失效**，到期用同一台电脑重签一次即可（数据不丢）。
  完整步骤见 `docs/ios-build-guide.md` 路线二。
- **不想折腾签名**：Safari 打开 <https://tianyoufeng.github.io/zuocai-app/> →「分享」→
  「添加到主屏幕」（PWA；见 ios 指南路线一，含已知限制）。
- **重新打包 APK**：见 `docs/apk-build-guide.md`（可复制即用）。
- **自己重编 iOS 包**：改了 `src/` 后 push 到 main，GitHub 会自动在**免费 macOS 机器**上重编
  （`.github/workflows/ios.yml`）—— 不需要 Mac。

## 三、能帮上忙的地方

**1. 每道菜都写了「怎么挑」和「新手提示」**
食材清单里，主要食材下方直接写着选购要点 —— 买菜时能对着看：

> 五花肉：挑三层肥两层瘦、层数分明的；手指按下去能弹回来，表面发黏或渗水的不要

卡片下方是「新手小技巧」，把术语翻译成能上手判断的说法：

> 「油温七成热」= 筷子插进油里周围冒小泡。油面开始冒青烟就是过头了，蛋会发苦

做菜页动火之前还有一条「下锅前先看这几条」。**680 道菜全覆盖**。

**2. 详情页可直接改份量**
食材配料区右侧是 `− N 人份 +` 步进器（范围 1~8）。点一下，食材用量按比例实时换算，
顶部摘要行的「N 人份 / 热量」同步更新。
份量**按道记忆**（`state.serveOf`，写进 IndexedDB）：这道菜设过 4 人份，
下次进来还是 4 人份；没设过的菜沿用「我的 → 默认份量」。
「适量 / 少许 / 几滴」这类不可量化的用量不参与换算。

**3. 开始做菜一页到底**
点「开始做菜」后不再逐步翻页，整页纵向铺开全部步骤与细节，
顶部粘性进度条随滚动推进（「第 N 步 / 共 M 步」），中间有同页备料清单方便对照，
底部一键「做完收工 · 记入记录」，记完自动回首页。

**4. 厨师头像**
「我的」页的「小厨日记」与首页右上角换成手绘厨师形象（内联 SVG，暖橙圆底 + 白厨师帽 + 笑脸），
深浅色模式下都正常显示。

## 四、目录结构

```
zuocai-app/                        （本目录，GitHub 仓库根）
├── README.md / CHANGELOG.md
├── app/                           v1.0 单文件版（保留存档）
├── design/                        UI 设计稿 + 设计规范
├── src/                           ★ 可直接浏览器打开的前端
│   ├── index.html
│   ├── manifest.webmanifest       PWA 清单（装到手机主屏用）
│   ├── sw.js                      Service Worker（离线缓存；图片清单从 manifest 自动推导）
│   ├── css/                       tokens（设计令牌+深色）/ base（骨架）/ screens（组件）
│   ├── js/                        icons · db(IndexedDB) · data(懒加载) · random(加权随机)
│   │   · ui · app(路由/事件) · screens/×7（home/result/detail/steps/library/records/profile）
│   ├── data/                      manifest.js（摘要索引）+ 9 个分类 .js（唯一数据源，共 680 道）
│   │                              + 9 个 pick-{分类}.js（食材选购要点与新手提示）
│   └── assets/
│       ├── icons/                 App 图标 480/96/64/40
│       └── images/{分类}/         菜谱图 {id}.webp，按分类存放，共 500 张
├── android/                       Capacitor 6 生成的标准 Android 工程
│                                  （已移除 INTERNET 权限、锁竖屏、allowBackup=false）
├── _android/                      免 Gradle 手工打包壳（零权限，实际出包用这个）
├── tools/                         gen-manifest · validate-data · build_img_map · compress_images
│                                  · 图标 · build-apk · verify-apk · clean_work
├── _dev/                          自检脚本 + 撰写规范
│   ├── static-check.js            跨文件一致性 6 项
│   ├── browser.js                 真实浏览器端到端 37 项
│   ├── list-recipes.js            导出全库菜谱清单（扩容时防重复）
│   ├── missing-images.js          统计缺图 → missing-images.json
│   ├── recipe-author-guide.md     菜谱撰写规范（批量扩容用）
│   └── image-gen-guide.md         配图生成规范（批量生图用）
├── dist/                          chishenme-v3.0.0.apk + 中文名副本
│                                  （*.apk 不入库 —— 安装包走 GitHub Releases）
├── docs/                          APK / iOS 打包文档
├── .github/workflows/
│   ├── pages.yml                  push 到 main 时自动把 src/ 发布到 GitHub Pages
│   └── ios.yml                    push 到 main 时在免费 macOS 机器上编出未签名 IPA
├── resources/                     iOS 图标（1024）与启动图（2732）源图
├── package.json · capacitor.config.json
├── _raw/                          ImageGen 原图 435 张（本轮新增图，构建时压缩入库）
└── archive/v2.0/                  v2.0 完整快照（含当时的 65 张原图）
```

## 五、架构要点

- **数据文件用 .js 不用 .json**：`window.RECIPES.{分类}=[...]`，动态 `<script>` 按分类懒加载。
  file:// 双击预览、APK assets 拦截、http 服务三环境统一兼容，零 CORS 问题。
- **manifest 摘要常驻**（id/菜名/分类/标签/时间/难度/热量/食材名），搜索零延迟；
  完整步骤进详情才加载对应分类并缓存。
- **菜谱库分批渲染**：首批 60 道 + 「加载更多」，500 道规模下首屏不卡。
- **图片路径按约定推导**（`assets/images/{分类}/{id}.webp`），不占数据字段；
  缺图自动降级暖色占位块（v3.0 已无缺图）。
- **IndexedDB** 三 store（favorites/history/prefs），localStorage 降级兜底，脏数据 sanitize。
- **加权随机**：口味偏好 +2 权重、避开最近 3 次 +1，忌口硬过滤 + 「为什么抽到它」文案。
- **响应式**：375px 基准 rem/clamp、safe-area 四向、100dvh、容器 max-width 768px、
  深色模式暖深令牌组、键盘 adjustResize。

## 六、数据与配图管线（扩容时用）

```bash
# 1. 写菜谱（新增分类条目后）
node tools/validate-data.js --allow-missing-images   # 字段/唯一性校验
node tools/gen-manifest.js                           # 重建摘要索引

# 2. 看还缺哪些图
node _dev/missing-images.js                          # → _dev/missing-images.json

# 3. 按 _dev/image-gen-guide.md 用 ImageGen 生成到 _raw/
#    文件名必须形如「风格前缀_菜名_画面描述_时间戳.png」，第二段用于匹配菜谱

# 4. 压缩入库（长边 800 / 质量 72 / 裁掉底部 10% 去平台水印）
python tools/build_img_map.py                        # 菜名 → 菜谱 id 映射
python tools/compress_images.py                      # → src/assets/images/{分类}/{id}.webp

# 5. 全量校验
node tools/validate-data.js                          # 680 道全配图 + 选购数据覆盖应 0 错误
```

## 七、开发进度

| 阶段 | 状态 |
|---|---|
| P0 工程骨架（令牌/路由/IndexedDB/懒加载） | ✅ |
| P1 数据管线（680 道菜谱 + 680 条选购数据 + 校验脚本） | ✅ v3.1 |
| P2 图片管线（680 张全配图） | ✅ v3.1 |
| P3 功能（随机/库/详情/份量步进/一页做菜/选购要点/搜索/收藏/记录/忌口） | ✅ v3.1 |
| P4 响应式（safe-area/dvh/深色/平板断点/键盘） | ✅ |
| P5 图标 + APK 手工打包（零权限验证） | ✅ |
| P6 文档（本文件 / 打包指南 / 撰写规范 / 生图规范） | ✅ |
| P7 推送 GitHub + 归档 | ✅ |

## 八、测试设备清单

| 设备 | 宽度 | 结果 |
|---|---|---|
| iPhone SE | 375×667 / 320 等效 | ✅ 无横向滚动（320px 已测） |
| iPhone 15 | 393×852 | ✅ 基准尺寸 |
| Android 小屏 | 360×640 | ✅ 无横向滚动 |
| Android 主流 | 412×915 | ✅ 无横向滚动 |
| iPad / 折叠屏 | 768×1024 | ✅ 容器 768px 居中，无溢出 |
| 深色模式 | - | ✅ 暖深令牌组切换 |
| 系统字体放大 | - | ✅ rem 跟随根字号 clamp |

自动化回归（v3.0 实测结果）：

```bash
node _dev/static-check.js   # 跨文件一致性 6 项，全通过
node _dev/browser.js        # 真实浏览器端到端 42 项 → 42/42，真实控制台错误 0
node _dev/pwa-check.js      # PWA 离线 12 项（可传网址验证线上）
node tools/validate-data.js # 680 道 · 有图 680 道 · 选购数据 680 条 · 0 错误
```

> `_dev/browser.js` 依赖 `puppeteer-core` 与 Edge，运行时需指定 NODE_PATH：
> `NODE_PATH="C:/Users/q2764/.workbuddy/binaries/node/workspace/node_modules" node _dev/browser.js`

## 九、待办（下一轮候选）

1. **APK 瘦身**：24MB 主要来自 500 张内置图。可选方案 —— 图片降到长边 640 / 质量 60
   （预计省 40%），或按分类拆多包。
2. **按食材反查**（「冰箱里有什么做什么」）：manifest 里已有 `ings` 食材名，可直接做。
3. **一键采购清单**（多菜合并食材，按份量汇总）。
4. **做菜计时器**：步骤页现在只有总时长提示，可加每步倒计时与后台提醒。
5. **步骤配图**（用户 v2.0 时明确不需要，如需再加）。
6. iOS 真机验证（需 Mac）。

## 十、变更日志

见 [CHANGELOG.md](CHANGELOG.md)。

## 十一、已知限制

- **APK 33MB**：完全离线 + 680 张内置图，体积是必然代价（无网络请求，图只能打进包）。
  想压体积可把图降到长边 640 / 质量 60（预计省 40%），代价是清晰度下降。
- 极少数国产 ROM 上理论可能触发 WebView 资源拦截异常；已内置三级降级
  （重试 → 内存喂入 → 可读诊断页）。若真机白屏，回退方案是在 Manifest 加回
  INTERNET 权限（一行）重新打包，其余不变。
- 签名密钥库在 `~/.workbuddy/binaries/android-build/keys/chishenme.keystore`
  （密码见 `docs/apk-build-guide.md`）。**请务必备份**，丢失后无法覆盖安装。
