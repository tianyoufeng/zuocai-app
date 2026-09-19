# 今天吃什么 · 本地做菜 App（v2.0）

> GitHub：https://github.com/tianyoufeng/zuocai-app
> 一个**纯本地运行**的家常菜菜谱 App：随机抽菜、分类浏览、搜索、收藏、分步做菜。
> 无后端、无账号、无网络请求、零权限 —— 断网完全可用。

---

## 一、这是什么

| 项目 | 值 |
|---|---|
| 版本 | v2.0.0（versionCode 20） |
| 菜谱数量 | **150 道**（家常菜 60 / 汤羹 20 / 主食 25 / 凉菜 15 / 早餐 15 / 夜宵 15） |
| 图片 | **65 张**真实 AI 成品图（60 道家常菜全覆盖 + 5 分类各 1 张代表图），WebP，30~50KB/张，共 3.0MB |
| 安装包 | **Android APK 3.2MB**（`dist/chishenme-v2.0.0.apk`） |
| 权限 | **零权限**（Manifest 不含 INTERNET 等任何权限） |
| 存储 | 菜谱数据打包内置；收藏/历史/偏好用 IndexedDB，仅存本机 |
| 最低系统 | Android 8.0 (API 26) / iOS 14 |

**分阶段扩容说明**：数据结构、按分类懒加载、图片目录均按 1000 道设计。
本期 65 张图先保证「家常菜全配图 + 各分类有代表图」，其余 85 道在补图前
自动降级为暖色渐变占位块（不会破图）。后续每轮迭代批量生图补齐（约 5-10 积分/张）。

## 二、快速开始

- **浏览器预览**：直接双击 `src/index.html`（file:// 下同样可用，IndexedDB 正常）。
- **手机安装**：把 `dist/chishenme-v2.0.0.apk` 传到 Android 手机安装
  （需允许「安装未知应用」，Play Protect 提示点「仍然安装」）。
- **重新打包**：见 `docs/apk-build-guide.md`（可复制即用）。
- **iOS**：见 `docs/ios-build-guide.md`（需在 Mac 上执行）。

## 三、目录结构

```
zuocai-app/                        （本目录，GitHub 仓库根）
├── README.md / CHANGELOG.md
├── app/                           v1.0 单文件版（保留存档）
├── design/                        UI 设计稿 + 设计规范
├── app-v2/                        ★ v2.0 工程（本版本全部产物）
│   ├── src/                       可直接浏览器打开的前端
│   │   ├── index.html
│   │   ├── css/                   tokens（设计令牌+深色）/ base（骨架）/ screens（组件）
│   │   ├── js/                    icons · db(IndexedDB) · data(懒加载) · random(加权随机)
│   │   │   · ui · app(路由/事件) · screens/×7（home/result/detail/steps/library/records/profile）
│   │   ├── data/                  manifest.js（摘要索引）+ 6 个分类 .js（唯一数据源）
│   │   └── assets/
│   │       ├── icons/             App 图标 480/96/64/40
│   │       └── images/{分类}/     菜谱图 {id}.webp，按分类存放
│   ├── android/                   Capacitor 6 生成的标准 Android 工程
│   │                              （已移除 INTERNET 权限、锁竖屏、allowBackup=false）
│   ├── _android/                  免 Gradle 手工打包壳（零权限，实际出包用这个）
│   ├── tools/                     gen-manifest · validate-data · 压图 · 图标 · build-apk · verify-apk
│   ├── _dev/                      自检脚本（static-check + browser 端到端 24 项）
│   ├── dist/                      chishenme-v2.0.0.apk
│   ├── docs/                      APK / iOS 打包文档
│   ├── package.json · capacitor.config.json
│   └── _raw/                      ImageGen 原图（65 张 PNG，构建时复制到 ASCII 路径压缩）
└── 开发计划与技术方案-v2.md
```

## 四、架构要点

- **数据文件用 .js 不用 .json**：`window.RECIPES.{分类}=[...]`，动态 `<script>` 按分类懒加载。
  file:// 双击预览、APK assets 拦截、http 服务三环境统一兼容，零 CORS 问题。
- **manifest 摘要常驻**（id/菜名/分类/标签/时间/难度/热量/食材名），搜索零延迟；
  完整步骤进详情才加载对应分类并缓存。
- **图片路径按约定推导**（`assets/images/{分类}/{id}.webp`），不占数据字段；
  缺图自动降级暖色占位块。
- **IndexedDB** 三 store（favorites/history/prefs），localStorage 降级兜底，脏数据 sanitize。
- **加权随机**：口味偏好 +2 权重、避开最近 3 次 +1，忌口硬过滤 + 「为什么抽到它」文案。
- **响应式**：375px 基准 rem/clamp、safe-area 四向、100dvh、容器 max-width 768px、
  深色模式暖深令牌组、键盘 adjustResize。

## 五、开发进度

| 阶段 | 状态 |
|---|---|
| P0 工程骨架（令牌/路由/IndexedDB/懒加载） | ✅ |
| P1 数据管线（150 道菜谱文本 + 校验脚本） | ✅ |
| P2 图片管线（65 张生成压缩入库） | ✅ 本期范围 |
| P3 功能（随机/库/详情/搜索/收藏/记录/我的/忌口） | ✅ |
| P4 响应式（safe-area/dvh/深色/平板断点/键盘） | ✅ |
| P5 图标 + APK 手工打包（零权限验证） | ✅ |
| P6 文档（本文件 / 打包指南 / 测试清单） | ✅ |
| P7 推送 GitHub + 归档 | ✅ |

## 六、测试设备清单

| 设备 | 宽度 | 结果 |
|---|---|---|
| iPhone SE | 375×667 / 320 等效 | ✅ 无横向滚动（320px 已测） |
| iPhone 15 | 393×852 | ✅ 基准尺寸 |
| Android 小屏 | 360×640 | ✅ 无横向滚动 |
| Android 主流 | 412×915 | ✅ 无横向滚动 |
| iPad / 折叠屏 | 768×1024 | ✅ 容器 768px 居中，无溢出 |
| 深色模式 | - | ✅ 暖深令牌组切换 |
| 系统字体放大 | - | ✅ rem 跟随根字号 clamp |

自动化回归：`node _dev/static-check.js`（跨文件一致性 6 项）+
`node _dev/browser.js`（真实浏览器 24 项端到端），当前 24/24 通过、真实控制台错误 0。

## 七、待办（下一轮候选）

1. **补图 85 张**（汤羹 19 / 主食 25 / 凉菜 14 / 早餐 14 / 夜宵 14），把图片覆盖率做到 100%。
2. 菜谱扩容到 300 → 600 → 1000 道（管线已就绪，`gen-manifest.js` 一键重建索引）。
3. 按食材反查（「冰箱里有什么做什么」）。
4. 一键采购清单（多菜合并食材）。
5. iOS 真机验证（需 Mac）。

## 八、变更日志

见 [CHANGELOG.md](CHANGELOG.md)。

## 九、已知限制

- 85 道菜暂无图（暖色占位块降级），分批补齐中。
- 零权限在极少数国产 ROM 上理论可能触发 WebView 资源拦截异常；
  已内置三级降级（重试 → 内存喂入 → 可读诊断页）。若真机白屏，回退方案是在
  Manifest 加回 INTERNET 权限（一行）重新打包，其余不变。
- 签名密钥库在 `~/.workbuddy/binaries/android-build/keys/chishenme.keystore`
  （密码见 `docs/apk-build-guide.md`）。**请务必备份**，丢失后无法覆盖安装。
