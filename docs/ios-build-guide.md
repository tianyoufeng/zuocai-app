# iOS 打包指南（在 Mac 上执行，约 30 分钟）

> 本机为 Windows，无法运行 Xcode，iOS 工程需在任意一台 Mac 上生成。
> 前端代码（src/）与 Android 完全同一份，无需改动。

## 前提

- Mac 一台（macOS 13+），App Store 安装 **Xcode 15+**
- Apple ID（免费账号可真机调试；上架 App Store 需 $99/年 开发者账号）

## 一、生成 Capacitor iOS 工程

```bash
# 1. 把仓库 clone 或复制到 Mac（含 src/、package.json、capacitor.config.json）
npm install                      # 安装 @capacitor/core / cli（package.json 已声明）
npm install @capacitor/ios       # iOS 平台包

# 2. 生成 ios/ 工程（首次）
npx cap add ios

# 3. 同步前端资源（src/ → ios/App/App/public/）
npx cap sync ios
```

## 二、Xcode 配置（App/App.xcworkspace → 双击打开）

> 注意打开的是 `.xcworkspace` 不是 `.xcodeproj`。

1. **选中根 Target → General**：
   - Display Name：`今天吃什么`
   - Bundle Identifier：`com.tianyoufeng.chishenme`（与 capacitor.config.json 的 appId 一致）
   - Minimum Deployments：**iOS 14.0**（需求下限）
   - Version：`2.0.0` / Build：`20`
2. **Signing & Capabilities**：
   - 勾选 `Automatically manage signing`
   - Team：选你的 Apple ID（个人团队）
   - 首次在 Xcode → Settings → Accounts 登录 Apple ID 并点 Download Manual Profiles
3. **Info.plist 确认**：
   - 不需要添加任何网络相关配置（App 无网络请求）
   - `UIRequiresFullScreen` = YES，方向只留 Portrait（Capacitor 模板已默认竖屏，
     如需锁定：Target → General → iPhone/iPad Deployment Info 只勾 Portrait）

## 三、真机运行 / 打包

1. iPhone 用数据线连 Mac，手机上点「信任此电脑」。
2. Xcode 顶部选择你的设备 → `▶ Run`。
   - 首次真机运行：手机 设置 → 通用 → VPN 与设备管理 → 信任你的开发者证书。
3. 正式打包（自用 ad-hoc / TestFlight）：
   - Xcode 菜单 → Product → Archive
   - Archive 完成弹出 Organizer → `Distribute App`
   - **自用**：选 `Ad Hoc`（需在开发者后台登记设备 UDID）导出 IPA
   - **分发**：选 `TestFlight / App Store Connect` 上传，TestFlight 邀请自己安装

## 四、验证清单

- [ ] 飞行模式下打开 App：菜谱浏览、抽菜、收藏全部可用（完全离线）
- [ ] 收藏后杀掉 App 重开：收藏还在（IndexedDB）
- [ ] 刘海屏：顶部导航不被刘海遮挡（safe-area 已内置）
- [ ] 底部横条：底部导航不被 Home 指示条遮挡
- [ ] 控制中心深色模式：界面切暖深色、文字可读
- [ ] 设置 → 显示 → 更大字体：文字放大不破版

## 五、常见问题

| 问题 | 解法 |
|---|---|
| `cap add ios` 报错 | 确认在 macOS 且装了 Xcode + `npm i @capacitor/ios` |
| 真机运行报「不受信任的开发者」 | 设置 → 通用 → VPN与设备管理 → 信任证书 |
| Archive 灰色 | Scheme 选「Any iOS Device (arm64)」而不是模拟器 |
| 签名报错 | Bundle ID 不要与他人重复；免费账号 7 天过期需重装 |
| 改了前端没生效 | 重新 `npx cap sync ios` 再 Archive |
