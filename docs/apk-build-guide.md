# Android APK 打包指南（可复制即用）

> 本项目已内置一键脚本，正常情况只需执行一步。
> 以下同时给出从零开始的环境安装步骤（换机器时用）。

## 一、一键打包（本机已配好环境）

```bash
cd C:/Users/q2764/WorkBuddy/zuocai-app-更新
bash tools/build-apk.sh
bash tools/verify_apk.py dist/chishenme-v3.0.0.apk \
  "C:/Users/q2764/.workbuddy/binaries/android-build/work-chishenme/build/dex/classes.dex" \
  src/index.html
```

产物：`dist/chishenme-v3.0.0.apk`（约 3.2MB）+ 中文名副本。
改了前端代码后重跑脚本即可（版本号在脚本头部 `VERSION_NAME/VERSION_CODE`）。

## 二、从零安装环境（一次性，约 350MB 下载）

1. JDK 17（Corretto 直链）：

```bash
BASEW="C:/Users/<user>/.workbuddy/binaries/android-build"
mkdir -p "$BASEW/dl"
curl -L -o "$BASEW/dl/jdk17.zip" \
  https://corretto.aws/downloads/latest/amazon-corretto-17-x64-windows-jdk.zip
# 解压到 $BASEW/jdk（确保 $BASEW/jdk/bin/javac.exe 存在）
```

2. Android 命令行工具 + SDK 组件：

```bash
curl -L -o "$BASEW/dl/cmdtools.zip" \
  https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip
# 解压并整理出 $BASEW/sdk/cmdline-tools/latest/bin/sdkmanager.bat
mkdir -p "$BASEW/sdk/licenses"
printf '24333f8a63b6825ea9c5514f83c2829b004d1fee\n84831b9409646a918e30573bab4c9c91346d8abd\n' \
  > "$BASEW/sdk/licenses/android-sdk-license"
export JAVA_HOME='C:\Users\<user>\.workbuddy\binaries\android-build\jdk'
"$BASEW/sdk/cmdline-tools/latest/bin/sdkmanager.bat" --sdk_root="$BASEW/sdk" \
  "platforms;android-34" "build-tools;34.0.0" "platform-tools"
```

## 三、手动分步构建（理解链路用）

```bash
BASEW="C:/Users/q2764/.workbuddy/binaries/android-build"
BT="$BASEW/sdk/build-tools/34.0.0"
PLATFORM="$BASEW/sdk/platforms/android-34/android.jar"
BUILD="$BASEW/work-chishenme/build"
# 注意：aapt2/javac 对含中文的路径会失败，先把 _android/ 和 src/ 复制到纯 ASCII 路径
# 以下 $WORKSRC 指 ASCII 路径的工程副本（_android + src）

# 1) 资源编译
"$BT/aapt2.exe" compile --dir "$WORKSRC/_android/res" -o "$BUILD/res.zip"

# 2) 链接（assets 打进包；minSdk 26 = Android 8.0）
"$BT/aapt2.exe" link -o "$BUILD/base.apk" -I "$PLATFORM" \
  --manifest "$WORKSRC/_android/AndroidManifest.xml" -A "$BUILD/assets" \
  --java "$BUILD/gen" --min-sdk-version 26 --target-sdk-version 34 \
  --version-code 30 --version-name "3.0.0" "$BUILD/res.zip"

# 3) Java 编译 → dex
"$BASEW/jdk/bin/javac.exe" -source 8 -target 8 -nowarn -encoding UTF-8 \
  -bootclasspath "$PLATFORM" -d "$BUILD/classes" \
  "$BUILD/gen/com/tianyoufeng/chishenme/R.java" \
  "$WORKSRC/_android/java/com/tianyoufeng/chishenme/MainActivity.java"
"$BASEW/jdk/bin/jar.exe" cf "$BUILD/classes.jar" -C "$BUILD/classes" .
"$BT/d8.bat" --release --min-api 26 --lib "$PLATFORM" \
  --output "$BUILD/dex" "$BUILD/classes.jar"

# 4) classes.dex 合入 APK 根目录（用 tools/merge_dex.py，保留原压缩方式）
python tools/merge_dex.py "$BUILD/base.apk" "$BUILD/unsigned.apk" "$BUILD/dex/classes.dex"

# 5) 密钥库（首次；有效期 30 年）
"$BASEW/jdk/bin/keytool.exe" -genkeypair -keystore "$BASEW/keys/chishenme.keystore" \
  -alias chishenme -keyalg RSA -keysize 2048 -validity 10950 \
  -storepass chishenme2026 -keypass chishenme2026 \
  -dname "CN=Chishenme, OU=Personal, O=Local, C=CN"

# 6) 对齐（必须在签名之前）
"$BT/zipalign.exe" -p -f 4 "$BUILD/unsigned.apk" "$BUILD/aligned.apk"

# 7) 签名（v1+v2+v3）
"$BT/apksigner.bat" sign --ks "$BASEW/keys/chishenme.keystore" \
  --ks-pass pass:chishenme2026 --key-pass pass:chishenme2026 --ks-key-alias chishenme \
  --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true \
  --v4-signing-enabled false --out chishenme-v3.0.0.apk "$BUILD/aligned.apk"
```

## 四、验证

```bash
"$BT/apksigner.bat" verify --verbose chishenme-v3.0.0.apk   # 期望 v2/v3 = true
"$BT/zipalign.exe" -c 4 chishenme-v3.0.0.apk                # 期望无输出
"$BT/aapt2.exe" dump badging chishenme-v3.0.0.apk | grep uses-permission   # 期望无输出（零权限）
python tools/verify_apk.py chishenme-v3.0.0.apk <dex> <src/index.html>
```

## 五、Capacitor 标准工程（Gradle 路线，可选）

项目同时带标准 `android/`（Capacitor 6 生成，已移除 INTERNET 权限、锁竖屏）。
如需标准 Gradle 构建（上架 Google Play 用）：

```bash
npm install
npx cap sync android
cd android && ./gradlew assembleRelease   # 需要 Android Studio 或完整 SDK
```

## 六、常见坑

| 现象 | 原因 / 解法 |
|---|---|
| aapt2 报「找不到指定的文件」 | 路径含中文/非 ASCII → 复制到 ASCII 路径构建（脚本已内置） |
| d8 报 JAVA_HOME 未设置 | export JAVA_HOME 指向 jdk 目录 |
| 安装报「解析包错误」 | classes.dex 不在 zip 根 → 用 merge_dex.py 合入 |
| 签名后 zipalign -c 失败 | 顺序错了：先 align 后 sign |
| 多出 .idsig 文件 | apksigner v4 签名，加 --v4-signing-enabled false |
| 应用能开但数据不保存 | 页面跑在 file:// 下（IndexedDB 被禁）；本项目已用 https://app.local 拦截方案 |
| 覆盖安装报签名冲突 | 密钥库不对。本项目密钥库在 `~/.workbuddy/binaries/android-build/keys/chishenme.keystore`，**务必备份** |

## 七、安装到手机

1. 把 APK 传到手机（微信文件传输助手 / USB / 网盘均可）。
2. 设置 → 允许「安装未知应用」（给对应 App 授权）。
3. 点击 APK 安装；Play Protect 提示「未经扫描」→ 点「仍然安装」。
4. 打开后完全离线可用；收藏/历史数据只存在本机。
