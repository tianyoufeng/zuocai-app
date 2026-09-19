# CHANGELOG

## v2.0.0 — 2026-09-19

从 v1 单文件 demo 到完整可安装 App 的大版本。设计稿 7 屏 1:1 落地，
150 道菜谱 + 65 张真实成品图，零权限 Android APK。

### 新增
- **菜谱库扩容 10→150 道**：家常菜 60 / 汤羹 20 / 主食 25 / 凉菜 15 / 早餐 15 / 夜宵 15，
  每道含食材用量 + 分步做法 + 时间/难度/热量/标签。
- **分类浏览**：菜谱库分类条（全部 + 6 大分类），首页保留「快手/下饭/清淡」标签筛选。
- **搜索**：菜名 + 食材名双维度，基于常驻摘要索引，零延迟。
- **收藏**：详情/结果页星标收藏，IndexedDB 持久化，「记录」页与「我的」页可查。
- **IndexedDB 存储层**（v1 为 localStorage）：favorites / history / prefs 三 store，
  localStorage 自动降级，脏数据 sanitize。
- **Android APK**：免 Gradle 手工链路（aapt2→javac→d8→zipalign→apksigner），
  **零权限**（无 INTERNET）、竖屏锁定、allowBackup=false、完全离线、3.2MB。
- **Capacitor 6 标准工程**：android/ 目录已生成并按要求修改
  （移除 INTERNET 权限、portrait、usesCleartextTraffic=false）。
- **App 图标**：番茄橙圆角底 + 白瓷碗饭 + 平行筷子，480/96/64/40 + 全密度 mipmap。
- **响应式**：rem/clamp 全尺寸、safe-area 四向、100dvh、768px 容器、
  深色模式暖深令牌组、键盘 adjustResize。
- **自检体系**：静态跨文件一致性 6 项 + 真实浏览器端到端 24 项（24/24 通过）。
- **工具链**：gen-manifest（分类文件→摘要索引）、validate-data、压图管线、
  make_icons、build-apk、verify-apk（逐字节核对 + dex 头校验）。

### 设计稿与需求的 4 处统一（用户确认）
1. 步骤页不放步骤图（需求明确不存步骤图），仅步骤序号 + 标题 + 描述。
2. 保留「热量」字段（常见份量估算值），与设计稿详情页一致。
3. 收藏列表入口放在「我的」页 + 「记录」页收藏横滑条。
4. 菜谱库分类条用 6 大分类；「记录」页保留（v1 新增的第 7 屏）。

### 变更
- 单文件形态重构为标准工程（css/js/data 分离），设计令牌与 v1 完全同源。
- 图片从 JPEG 升级为 WebP（长边 800 / 质量 72 / 单张 30~50KB）。

### 修复（开发中踩到）
- data.js 'use strict' 笔误；手撕包菜步骤标题混入英文单词。
- 追加菜谱时吃掉上一道菜的收尾大括号（校验脚本当场拦截）。
- 静态检查 4 个假阳性（tag-- 残根 / ICON 键正则 / data-screen / 拼接前缀路径）。
- aapt2/javac 对中文路径失败 → 构建统一复制到 ASCII 路径执行。
- d8 需要 JAVA_HOME；压缩脚本 q42 仍超 50KB → 质量下限 + 缩边兜底。

### 已知限制
- 85 道菜暂无图（用户确认分批方案），补图前自动降级暖色占位块。
- iOS 仅交付文档（Windows 无法编译 iOS 工程）。

---

## v1.0 — 2026-09-19（更早）

首个版本：7 屏 UI 设计 + 单文件 HTML 落地 + 8 道菜。详见 git 历史。
