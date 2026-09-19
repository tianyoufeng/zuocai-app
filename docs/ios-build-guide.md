# iOS 安装指南

iOS 装不了安卓那种双击就装的 APK —— 没有 Apple 开发者账号就签不出可分发的安装包。
所以这里给两条路：**路线一 PWA 装到主屏（推荐，零成本）** 与 **路线二 Mac 上编译原生 App**。

---

## 路线一（推荐）：装到主屏 —— PWA

**不需要 Mac、不需要开发者账号、不花钱**；以后代码更新会自动生效，不用重装。

线上地址（GitHub Pages 自动部署，push 到 main 就更新）：

```
https://tianyoufeng.github.io/zuocai-app/
```

### iPhone 上的操作

1. 用 **Safari** 打开上面的地址（必须 Safari —— 微信内置浏览器、Chrome 都不支持「添加到主屏幕」）
2. 等首页出来。**首次需要联网**：20MB 菜谱图会在后台分批缓存，放着别关一会儿
3. 点底部「分享」按钮 → 往下翻 → **「添加到主屏幕」**
4. 起个名字点「添加」，桌面上就出现「今天吃什么」的图标
5. 以后从那图标打开：**全屏、无地址栏**，观感跟原生 App 一致
6. **验证离线**：开飞行模式，再点图标 —— 应该照常能抽菜、看菜谱、看图

### Android 也能用同一份

Chrome 打开同一地址 → 右上角菜单 → **「安装应用」**。
（Android 更推荐直接装 APK，体积和体验都更好。）

### 已知限制（先说清楚，别装完觉得被坑）

| 限制 | 说明 |
|---|---|
| 首次要联网 | 20MB 图片要下载缓存；缓存完（实测 25 秒内可完成大部分）之后完全离线可用 |
| 数据存在 Safari 里 | 收藏 / 历史 / 份量存在浏览器本地存储，**「设置 → Safari → 清除历史记录与网站数据」会一并清掉** |
| 系统可能回收缓存 | iPhone 存储极度紧张时 iOS 可能清掉站点数据；重新联网打开一次即可恢复 |
| 无系统级推送 | PWA 拿不到 iOS 通知（本项目本来也不需要） |

> 想要「数据绝对不丢、离线绝对可靠」，走路线二编原生 App。

### 本地自检（改完前端用这个验）

```bash
# 验本地
NODE_PATH="C:/Users/q2764/.workbuddy/binaries/node/workspace/node_modules" node _dev/pwa-check.js
# 验线上
NODE_PATH="C:/Users/q2764/.workbuddy/binaries/node/workspace/node_modules" node _dev/pwa-check.js https://tianyoufeng.github.io/zuocai-app/
```

覆盖 12 项：manifest 合法性 / SW 注册 / 核心资源入缓存 / 图片渐进预热 / 断网后仍能打开与浏览。

### 部署是怎么配的

- `.github/workflows/pages.yml`：push 到 `main` 且改了 `src/**` → 自动把 **`src/` 作为站点根**发布
- 站点根发布的好处：URL 不带 `/src/` 前缀，Service Worker 作用域覆盖整站
- 图标：`tools/make_pwa_icons.py` 从 `icon-480.png` 生成 180 / 192 / 512 三个尺寸

---

## 路线二：真正的 iOS App（装在本地运行）

这条路产出的**不是网页，是真正的 iOS App** —— 桌面有自己的图标、完全离线、
数据存在 App 自己的沙盒里，体验跟安卓那边一致。

**先说三个事实，免得白折腾：**

| 事实 | 说明 |
|---|---|
| **编译不需要 Mac** | 用 GitHub 的免费 macOS 机器（`.github/workflows/ios.yml`），push 后自动出**未签名 IPA** |
| **装进手机必须自己签名** | 用你自己的 Apple ID 签，Windows 上就能做（Sideloadly）。凭证不经过第三方 |
| **免费账号签的 App 7 天失效** | 到期点图标会闪退，要用同一台电脑重签一次（约 1 分钟，数据不丢） |

> 想彻底免掉「7 天重签」，只有 Apple 开发者账号（$99/年，走 TestFlight 分发，1 年有效）。
> iOS 不像安卓能随便装 APK —— 这是苹果的规则，绕不过去。

### 第一步：拿到未签名 IPA

已经自动构建好了，直接下载：

- **Release 页面**：<https://github.com/tianyoufeng/zuocai-app/releases> → 最新的 `chishenme-ios-unsigned.ipa`
- **Actions 页面**：workflow `Build iOS App (unsigned IPA)` → Artifacts

想自己重编：改了 `src/` 后 push 到 main 就会自动跑（约 8 分钟）。

### 第二步：Windows 上准备两样东西

1. **iTunes**（或 Microsoft Store 里的「Apple 设备」App）—— 装它是为了拿到 iPhone 驱动
2. **Sideloadly** —— <https://sideloadly.io/> 下载安装

然后 iPhone 用数据线连电脑，手机上点「信任此电脑」。

### 第三步：签名并安装

1. 打开 Sideloadly，顶部设备选到你的 iPhone
2. 把 `chishenme-ios-unsigned.ipa` 拖进中间的 IPA 框
3. **Apple ID** 填你自己的（普通账号就行，不需要开发者账号）
4. 点 **Start**，按提示输入 Apple ID 密码（这一步是向 Apple 换取签名证书）
5. 手机上：**设置 → 通用 → VPN 与设备管理 → 开发者 App → 信任**
6. 回到桌面，就有「今天吃什么」了

### 第四步：7 天后重签

免费签名的有效期是 **7 天**，到期后点图标会闪退。重签只要用 Sideloadly
重新拖一次同一个 IPA、再 Start 一遍。

**不要先删 App**，直接覆盖安装 —— 收藏和历史记录都会保留。

> 懒人方案：用 **AltStore + AltServer**。AltServer 常驻你的电脑，
> 手机和电脑在同一 Wi-Fi 下会自动后台续签，不用手动操作。代价是电脑得常开着。

### 和 PWA 那条路有什么不一样？

- 图标、启动画面、竖屏锁定，与安卓版一致
- Bundle ID `com.tianyoufeng.chishenme`，版本 3.1.0（31）
- 数据存在 App 自己的沙盒里，清理 Safari 不会影响它
- 完全离线：没有任何网络权限

---

### 附：有 Mac 的话，也可以手动编

> 前端代码（src/）与 Android 完全同一份，无需改动。
> 有 Mac 就能直接在 Xcode 里跑真机 / Archive，比 Sideloadly 省事。

#### 前提

- Mac 一台（macOS 13+），App Store 安装 **Xcode 15+**
- Apple ID（免费账号可真机调试；上架 App Store 需 $99/年 开发者账号）

#### 一、生成 Capacitor iOS 工程

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
   - Version：`3.1.0` / Build：`31`
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
