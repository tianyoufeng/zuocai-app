# 更新菜谱速查

> 一句话回答「改哪个文件」：**`src/data/` 下按分类拆的 9 个 `.js` 文件**。
> 下面是各种场景的完整流程。

---

## 一、文件对照表

| 要改什么 | 文件（都在 `src/data/`） |
|---|---|
| 家常菜 200 道 | `jiachangcai.js` |
| 汤羹 70 道 | `tanggeng.js` |
| 主食 80 道 | `zhushi.js` |
| 凉菜 50 道 | `liangcai.js` |
| 早餐 50 道 | `zaocan.js` |
| 夜宵 50 道 | `yexiao.js` |
| 粤菜 60 道 | `yuecai.js` |
| 川菜 60 道 | `chuancai.js` |
| 湘菜 60 道 | `xiangcai.js` |
| **食材怎么挑 + 新手提示** | `pick-{分类}.js`（同上 9 个分类各一份） |
| 摘要索引（**自动生成**） | `manifest.js` ← **不要手改** |
| 菜谱配图 | `src/assets/images/{分类}/{菜谱id}.webp` |

---

## 二、场景 A：改一道现有菜（最常发生）

比如「番茄炒蛋的盐写多了」「这道菜的步骤想写细一点」：

1. 打开 `src/data/jiachangcai.js`，找到 `id: 'tomato-egg'` 那一段，直接改
2. 顺手在 `src/data/pick-jiachangcai.js` 里找 `'tomato-egg'`，补充或修正选购要点
3. 跑校验：

```bash
node tools/validate-data.js
```

> 只改 `steps` / `pick` / `tips` 的话，**不用重建索引**（摘要里没有这些字段）。
> 但如果改了 **菜名 / 时间 / 难度 / 热量 / 标签 / 食材名**，就要多跑一步：
>
> ```bash
> node tools/gen-manifest.js
> ```

---

## 三、场景 B：加一道新菜

需要三样东西：菜谱条目、配图、选购数据。

### 1. 加条目

在对应分类文件的**最后一个 `}` 后面**加一段（注意逗号）：

```js
  },
  {
    id: 'hongshao-yu', name: '红烧鱼', cat: 'jiachangcai',
    time: 35, diff: '中等', kcal: 420, tags: ['下饭', '家常'],
    ings: [['鲫鱼', '1 条（约 400 g）'], ['姜', '1 块'], ['生抽', '2 汤匙'],
           ['老抽', '半汤匙'], ['料酒', '1 汤匙'], ['白糖', '1 茶匙'], ['小葱', '2 根']],
    steps: [
      { t: '处理鱼身', d: '……' },
      { t: '煎鱼定型', d: '……' },
      { t: '烧入味', d: '……' }
    ]
  }
];
```

**字段规则**（`validate-data.js` 会逐条检查，违反就报错）：

| 字段 | 规则 |
|---|---|
| `id` | 只能含小写字母、数字、连字符；**全库唯一**。先跑 `node _dev/list-recipes.js --ids` 查重 |
| `name` | 中文菜名，**全库唯一** |
| `cat` | 必须等于所在文件的分类 key（如 `'jiachangcai'`） |
| `time` | 整数分钟，1~480 |
| `diff` | 只能是 `'简单'` / `'中等'` / `'进阶'` |
| `kcal` | 整数，1~3000（按 2 人份估） |
| `tags` | 只能从这些里选：快手 / 下饭 / 硬菜 / 清淡 / 少油 / 低脂 / 素食 / 辣 / 甜 / 重口 / 暖胃 / 家常 / 养生，每道 2~4 个 |
| `ings` | ≥2 项，每项 `['食材名', '用量']`。**用量尽量以阿拉伯数字开头**（详情页会按人数等比换算），无法量化的用 `'适量'` / `'少许'` / `'几滴'` |
| `steps` | ≥2 步（建议 4~7 步），每步 `{ t: '四到六字小标题', d: '做法描述' }` |

### 2. 配图

放一张 `src/assets/images/jiachangcai/hongshao-yu.webp`
（规格：长边 800 / 质量 72 / 单张 30~50KB）。没有图校验会直接报「缺少图片」。

### 3. 选购数据

在 `src/data/pick-jiachangcai.js` 里加**同名 key**（id 一致）：

```js
  'hongshao-yu': {
    pick: [
      ['鲫鱼', '看眼睛清澈凸起、鳃是鲜红；按鱼身能弹回来'],
      ['生抽', '……']
    ],
    tips: [
      '煎鱼前用厨房纸把鱼身擦到全干，不然下锅必破皮',
      '……'
    ]
  },
```

### 4. 重建索引 + 校验

```bash
node tools/gen-manifest.js
node tools/validate-data.js
```

---

## 四、场景 C：加一个全新分类

除了新建 `{分类}.js`、`pick-{分类}.js`、`src/assets/images/{分类}/` 之外，
还要把新分类**登记到这几处**（漏一处就会出问题）：

| 文件 | 改什么 |
|---|---|
| `tools/gen-manifest.js` | `CATS` 数组里加 `{ key: 'xxx', label: '显示名' }` —— 决定分类条上叫什么 |
| `tools/validate-data.js` | `CATS` 数组 |
| `_dev/list-recipes.js` | `CATS` 数组 |
| `_dev/missing-images.js` | `CATS` 数组 |
| `tools/build_img_map.py` | `CATS` 列表 |
| `tools/compress_images.py` | 分类元组 |
| `src/sw.js` | `CORE` 预缓存清单里加上新的数据文件 |

---

## 五、改完之后怎么发布

| 想更新哪里 | 怎么做 | 耗时 |
|---|---|---|
| **网页版（PWA）** | `git push` → GitHub Actions 自动发布 | 30 秒 |
| **iPhone / iPad** | `git push` → 自动重编 IPA → 重新下载 + Sideloadly 重签 | 2 分钟 + 签名 |
| **安卓 APK** | 本地跑 `bash tools/build-apk.sh`，把 `dist/*.apk` 传到 Release | 1 分钟 |

> APK 需要在你这台机器上打（要本地 JDK + Android SDK）。
> iPhone 的 IPA 是云端自动编的，不用管。

---

## 六、常见报错对照

| 报错 | 原因 / 解法 |
|---|---|
| `重复菜名: xxx` / `id 重复` | 换一个 `name` 或 `id`（先 `node _dev/list-recipes.js --ids` 看全库） |
| `缺少图片: assets/images/.../xxx.webp` | 这道菜还没放图 |
| `manifest 条目(680) 与分类文件(681) 不一致` | 忘了跑 `node tools/gen-manifest.js` |
| `pick-xxx: 缺 1 道（xxx）` | 新加的菜没在 `pick-{分类}.js` 里补选购数据 |
| 改了菜但 App 里没变 | 网页版强制刷新；APK / IPA 要重新打包 |

---

## 七、发布前一键自查

```bash
node tools/gen-manifest.js      # 重建摘要索引
node tools/validate-data.js     # 数据 / 图片 / 选购数据 三项全覆盖
node _dev/static-check.js       # 跨文件一致性（类名、图标、状态字段）
```

三条都通过，就可以发布了。

---

## 附：只想改内容、不想碰代码？

直接跟助手说「把 XX 这道菜的份量改成 YY」「加一道 ZZ 菜」，
改完顺手把 APK 和 IPA 一起出好，你只管下载安装。
本文是给你自己动手时用的。
