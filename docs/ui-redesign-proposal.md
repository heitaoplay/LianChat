# LianChat UI 重新设计方案（v0.1 建议稿）

> 项目：heitaoplay/LianChat UI 二次开发
> 日期：2026-08-20 ｜ 由主理人游承峰汇编，基于 bc-script-dev + ui-design-system + 前端用户体验工程 + impeccable + frontend-design + design-taste-frontend + pommetoys-style 七技能
> 状态：v0.1 建议稿。方向已据实机修正，以下方「v0.2 更正」为准。

---

## v0.2 更正说明（2026-08-20 实机后）

> 本建议稿写作时尚未实机探查 PommeToys。实机后方向有调整，**本节为最新事实**。

1. **主色方向反转**：原稿把"深色暖炭黑 + 珊瑚橙"当默认；实机探查 pommetoys.app 后发现真实 PommeToys 是**暖米色调（cream/beige）明色**，暗色只是 BC 房间场景的适配版。最终落地：
   - 亮色（跟随 PommeToys 真站）：`--bg #F6F1E7` / `--panel #EBE6DA` / `--card #FBF8F1` / `--seam #E4DED0` / `--ink #2B2925` / `--ink-2 #6A645D` / `--accent #E8483F`（iOS 红）。
   - 暗色（BC 房间适配）：`--bg #211c19` / `--panel #322a25` / `--panel-dn #1a1614` / `--accent #f0805a`（珊瑚橙）。
2. **主题系统**：`data-lc-theme-pref`(light/auto/dark) + `data-lc-theme`(实际生效)；auto 档跟随 BC 房间明暗 `Liko.__Sys_ColorAPI__`，回退系统 `prefers-color-scheme`。3D 拨杆（日 / 跟随房间 / 夜）并入对话框头部。
3. **实现进度**：STEP1–5 已落地 `Source/BC_LianChat.js`（设计令牌 + 浮动按钮 + 对话框 + 设置浮层 iOS 开关 + 抛光动效），并实机热注入验证（深 / 浅双主题通过）。
4. **STEP6（本次新增）**：原生聊天日志通知条 `#TextAreaChatLog .ChatMessage.bce-notification` 一并暖色化（主题感知 tint + 左侧 inset 强调轨，零回流）；已实机验证深 / 浅均生效。
5. 令牌命名已从 `--lc-*` 改为实现所用的 `--bg/--panel/--ink/--accent/...` 体系（见源码 `injectDesignTokens()`）。

---

## 1. 现状诊断（UI 审查）

### 1.1 技术现状（好的一面）
- **DOM 覆盖层**（`position:fixed` + z-index 100001）——完全符合 R131 时代的 BC 插件 UI 正确姿势，**意味着 CSS transition/keyframes 动画全部可用**，比 Canvas 逐帧驱动省 10 倍力。
- 组件结构清晰：浮动按钮 / 消息列表项 / 消息对话框 / 设置面板 / 确认弹窗，功能分区完整。

### 1.2 视觉问题（要改的）
| # | 问题 | 证据 | 影响 |
|---|------|------|------|
| 1 | **零设计系统**：颜色散落硬编码 | `#666` ×10+、`#333`、`#ebebeb`、`#ff4d4f`、`#fAfAfA` | 改一个色要全文件找，永远无法统一 |
| 2 | **不感知 BC 主题**：不读 `Liko.__Sys_ColorAPI__` | 浅灰按钮 `#ebebeb` + 深灰文字 `#333` | BC 默认深色主题下按钮像"贴了张白纸"，浅色房又发灰 |
| 3 | **未读强调过于刺眼** | `boxShadow: 0 0 0 3px #ff4d4f` 红色描边 + 同色徽标 | 红色警报感，破坏高级感；红绿警示色被滥用 |
| 4 | **圆角无体系** | 4px（列表项）/ 10px（徽标）/ 6px（提示）混用 | 视觉节奏混乱 |
| 5 | **字体无层级** | 全默认 12-14px，无字重对比 | 名字/时间/预览挤在一起，扫读困难 |
| 6 | **零动效** | 面板生硬开合、未读徽标瞬间出现、按钮无 hover | 缺乏"手感"，没有游戏内工具应有的质感 |
| 7 | **图标依赖作者服务器** | 按钮图标 = 作者 GitHub Pages PNG | 加载器问题之外的另一处外链；且位图放大发虚 |

---

## 2. 设计方向（推荐）

**主推：PommeToys 风格（深色暖调 + 有手感的玩具感）——但克制化。**

理由：
1. 你在之前的项目里确认过喜欢 PommeToys 的 vibe（暖炭黑 + 奶油字 + 珊瑚橙点缀 + 回弹开关），这是"你认可的配方"。
2. 聊天工具天然适合"深色暖调"：不刺眼、耐看、和 BC 默认深色房间主题融合。
3. 克制化原则：珊瑚橙只做**一个焦点**（未读状态/开启态/关键操作），大面积用暖炭黑 + 奶油字，符合你"留白、高级定制、反 AI 味"的审美。

**风格 DNA 一句话**：暖炭黑画布上浮起奶油色信息层，珊瑚橙只负责"有事情发生"。

---

## 3. 设计令牌（Design Tokens）

### 3.1 色彩（DOM 层 CSS 变量，主题自适应）

```css
/* 深色主题（默认） */
--lc-bg:        #1a1614;   /* 暖炭黑（非纯黑，带一点红橙灰度） */
--lc-surface:   #211c19;   /* 面板底 */
--lc-surface-2: #2a2420;   /* 输入区/嵌套层 */
--lc-surface-3: #322a25;   /* 按压态/轨道 */
--lc-text:      #f1e9dd;   /* 主文字（奶油） */
--lc-text-dim:  #a99e8f;   /* 次要文字 */
--lc-text-faint:#7c7264;   /* 极弱文字/占位 */
--lc-accent:    #f0805a;   /* 珊瑚橙：唯一强调色（未读/开启态） */
--lc-accent-soft: rgba(240,128,90,.16);  /* 强调色浅底（选中态背景） */
--lc-danger:    #c0553f;   /* 删除等危险操作（低饱和，不刺眼） */
```

```css
/* 浅色主题（BC 浅色房）：反相处理，由 JS 判断后切换 data-lc-theme */
[data-lc-theme="light"] {
  --lc-bg:#f5f1ea;  --lc-surface:#fffdf9;  --lc-surface-2:#efe9df;  --lc-surface-3:#e6dfd2;
  --lc-text:#2b2622; --lc-text-dim:#6d645a; --lc-text-faint:#9a9084;
  --lc-accent:#d96a42; --lc-accent-soft:rgba(217,106,66,.14);
}
```

主题判定（沿用 bc-script-dev §9.4）：
```js
const base = Liko.__Sys_ColorAPI__?.getThemeColor?.() || '#1a1614';
const isDark = Liko.__Sys_ColorAPI__?.isDark?.(base) ?? true;
root.dataset.lcTheme = isDark ? 'dark' : 'light';
```

### 3.2 字体

- 中文环境**不引入外链字体**（BC 环境不稳），用系统栈 + 字重分层做层级：
```css
--lc-font: -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
```
- 层级：标题 15px/600 → 名字 14px/600 → 正文 13px/400 → 时间/预览 12px/400（`--lc-text-dim`）
- 数字（未读数、编号）用 `font-variant-numeric: tabular-nums` 防跳动

### 3.3 圆角（统一体系）

| 层级 | 值 | 用途 |
|------|-----|------|
| 卡片 | 14px | 面板、对话框 |
| 行 | 10px | 列表项、输入框 |
| 药丸 | 999px | 按钮、徽标、开关 |

### 3.4 阴影

```css
--lc-shadow: 0 2px 4px rgba(0,0,0,.12), 0 12px 32px -8px rgba(0,0,0,.35);
--lc-shadow-float: 0 4px 8px rgba(0,0,0,.16), 0 20px 48px -12px rgba(0,0,0,.45);
--lc-inset-highlight: inset 0 1px 0 rgba(255,255,255,.05);  /* 内高光 = 软 3D 浮起 */
```

### 3.5 缓动（动效唯一曲线，拒绝 linear）

```css
--lc-ease-spring: cubic-bezier(.34,1.56,.64,1);   /* 开关/弹出（带回弹） */
--lc-ease-out:    cubic-bezier(.16,1,.3,1);       /* 面板开合/列表进场 */
--lc-dur-fast: 120ms;  --lc-dur-mid: 200ms;  --lc-dur-slow: 320ms;
```

---

## 4. 组件级改造建议

### 4.1 浮动按钮（最高优先级，第一印象）
- **视觉**：暖炭黑圆钮（56px 药丸或 52px 圆形），内高光 + 柔和浮影；图标从作者 PNG 换成**内联 SVG**（你偏好的 ardot-design 风格线性图标，聊天气泡图形），60% 居中；支持主题自适应。
- **交互**：hover 上浮 2px + 阴影加深 + 图标微放大（1.05）；按下 scale(0.94) 物理反馈。
- **未读态**：珊瑚橙徽标 + **呼吸光环**（`box-shadow` pulse，1.6s ease-in-out 无限，`reduced-motion` 时静止）；去掉现在的"红色描边"警报式做法。
- **入场**：页面加载后按钮从右下角 rise + fade 进场（300ms `--lc-ease-out`）。

### 4.2 消息列表项
- **结构**：头像（圆角 10px，无图时首字母占位）+ 名字/时间首行（名字 600 字重，时间 `--lc-text-faint` 右对齐）+ 预览行（`--lc-text-dim`）。
- **未读项**：左侧 3px 珊瑚橙竖条（`border-left`）+ 浅色底 `--lc-accent-soft`，替换现在的红色数字徽标。
- **hover**：背景 `--lc-surface-2` 过渡（120ms）。
- **进场**：新消息项 stagger 上浮淡入（每项 +60ms 延迟，`--lc-dur-mid`）。

### 4.3 消息对话框（聊天主界面）
- **面板**：`--lc-surface` 底 + 14px 圆角 + `--lc-shadow` + 内高光；顶部标题栏与底部输入栏 `--lc-surface-2` 区分层次。
- **打开动画**：`transform-origin` 设为按钮位置，scale(0.94→1) + opacity(0→1)，200ms `--lc-ease-out`；关闭反向。
- **消息气泡**：自己=珊瑚橙浅底，对方=`--lc-surface-2`；时间分隔条用 `--lc-text-faint` 小字。
- **图片消息**：保持现有 URL 白名单逻辑，预览加淡入（120ms）。
- **输入框**：focus 时 `--lc-accent` 2px 底边框过渡（200ms）。

### 4.4 设置面板
- 统一卡片容器（14px 圆角 + 内高光），分区用 1px `--lc-surface-3` 分隔线（**只画组间线，不画每行线**，避免"账本"感）。
- **开关**：pommetoys 配方——药丸轨道 + 白渐变 thumb，`transition` 用 `--lc-ease-spring` 带回弹；按下整体 scale(0.94) 手感；开启态轨道变珊瑚橙。
- 选项行：标签（600 字重）+ 说明（`--lc-text-faint` 小字），间距 12px 基准。

### 4.5 确认弹窗 / Toast
- 弹窗：fade + scale(0.96→1) 过渡，遮罩淡入。
- 危险操作（删除消息）用 `--lc-danger`，普通操作用 `--lc-accent`——**一个界面只保留一个强调焦点**。

---

## 5. 动效 / 动画 / 过渡动画清单（总表）

> 全部为 DOM 层 CSS 动画（BC R131 插件 UI 正确姿势），只动 `transform`/`opacity`/`box-shadow`，不碰布局属性；全部包裹 `@media (prefers-reduced-motion: no-preference)`。

| # | 动画 | 触发 | 时长 | 曲线 | 目的 |
|---|------|------|------|------|------|
| A1 | 浮动按钮入场 rise+fade | 页面加载 | 300ms | ease-out | 首次引导注意 |
| A2 | 按钮 hover 上浮+图标放大 | 鼠标悬停 | 150ms | ease-out | 反馈"可点" |
| A3 | 按钮按下 scale(0.94) | 按下 | 80ms | ease-out | 物理按压感 |
| A4 | 未读呼吸光环 pulse | 有未读 | 1.6s 循环 | ease-in-out | 温和提醒（替代红色警报） |
| A5 | 徽标数字 pop（spring） | 未读数变化 | 300ms | spring | 数字变化可感知 |
| A6 | 面板开合 scale+fade | 打开/关闭 | 200ms | ease-out | 空间连续性（从按钮长出） |
| A7 | 消息项 stagger 进场 | 新消息 | 200ms/项 +60ms | ease-out | 阅读顺序引导 |
| A8 | 列表项 hover 背景过渡 | 悬停 | 120ms | ease-out | 可扫读 |
| A9 | 开关 spring 回弹 | 切换 | 400ms | spring | 手感核心（pommetoys） |
| A10 | 输入框 focus 底边框过渡 | 聚焦 | 200ms | ease-out | 焦点可见（无障碍） |
| A11 | 弹窗 scale+fade | 打开 | 200ms | ease-out | 层级清晰 |
| A12 | 删除操作危险态微抖（可选） | 危险按钮 hover | 150ms | ease-out | 警示（克制使用） |

**动效哲学**（design-taste-frontend §5）：每个动画都有理由（层级/反馈/状态变化），不做"为了动而动"；未读用呼吸而非闪光；所有循环动画必须 `reduced-motion` 静止。

---

## 6. 实施路线（分支与验证）

| 阶段 | 内容 | 分支 | 验证 |
|------|------|------|------|
| 0 | 设计令牌 + 主题适配 + CSS 变量注入 | `feature/ui-design-system` | 深/浅主题双测 |
| 1 | 浮动按钮 + 徽标 + 入场动效 | `feature/ui-float-button` | 实机热注入（bc-hot-inject） |
| 2 | 消息列表 + 对话框 + 气泡 | `feature/ui-dialog` | 实机 |
| 3 | 设置面板 + 开关 + 弹窗 | `feature/ui-settings-panel` | 实机 + reduced-motion 测试 |
| 4 | 全量动效收尾 + 图标 SVG 化 | `feature/ui-polish` | 冒烟测试（注入→按钮→对话框→设置） |

每阶段完成即合 `dev`，可回滚（vendor 基线 + git）；**发版前需你确认**（工作室红线）。

### 技术注意
1. **加载器必须先改**：`BC_LianChat.user.js` 硬编码作者 URL，UI 改动不生效——私有版指向自己的分发源（详见 ADR）。
2. 图标：作者 PNG 换内联 SVG 后，按钮图标不再依赖作者服务器（顺带解决外链问题）。
3. `#lt-*` 类名/`LCData` 设置键保持不动（用户既有行为保留，避免破坏设置兼容）。
4. 颜色全部走令牌，禁再出现裸 `#666`。

---

## 7. 已知风险与缓解

1. **作者更新覆盖 UI** → 上游同步走 ADR 三方合并；UI 改动集中 + `// [UI-CUSTOM]` 标注。
2. **主题判断失误**（浅色房误判深色）→ `getThemeColor()` 失效时回退手动监听 `prefers-color-scheme`；保留 `data-lc-theme` 手动覆盖入口。
3. **动效性能**（低配机）→ 只动 transform/opacity；`reduced-motion` 全关；循环动画仅未读呼吸 1 处。
4. **版权** → 图标自绘 SVG 不抄作者 PNG；改造保留原作者 MIT 版权头。

---

*本方案为建议稿。确认方向后，按第 6 节路线进入实现。*
