# PurgeCSS的能力

PurgeCSS 做的事情：

> 👉 在构建阶段扫描你的源码，找出「没有被使用到的 CSS 选择器」，并把它们从最终 CSS 文件中删除，从而大幅减小 CSS 体积。

## 1️⃣ PurgeCSS 的核心工作原理

PurgeCSS 本质上做了三件事：

### ✅ 1. 扫描内容文件（Content）

它会分析你指定的文件，例如：

- HTML
- JS / TS
- JSX / TSX
- Vue / Svelte 模板
- 字符串拼接的 class 名

```js
content: ['./src/**/*.{html,js,ts,jsx,tsx,vue}']
```

👉 从这些文件中 `提取所有可能出现的 class / id / tag` 名称

### ✅ 2. 解析 CSS 文件

对所有 CSS 规则进行 AST 解析，例如：

```css
.btn-primary {}
.text-center {}
.mt-4 {}
.unused-class {}
```

### ✅ 3. 做“集合差集”运算（关键）

逻辑等价于：

```txt
最终 CSS = CSS 中定义的选择器
         − 内容中从未出现过的选择器
```

所以：

- `.btn-primary` 被保留
- `.unused-class` 被删除

## 2️⃣ PurgeCSS 具体会「删除什么」

| 类型                  | 是否会被删除 |
| ------------------- | ------ |
| 未使用的 `.class`       | ✅      |
| 未使用的 `#id`          | ✅      |
| 未使用的 `tag` 选择器      | ✅      |
| `@keyframes` 未引用的动画 | ✅      |
| `@font-face` 未使用字体  | ✅      |
| 媒体查询中未命中的规则         | ✅      |

## 3️⃣ 为什么能极大减小 CSS 体积

在真实项目中，CSS 体积大的原因通常是：

- UI 框架（AntD / Element / Bootstrap）
- 工具类库（Tailwind）
- 历史遗留样式
- 多主题 / 多皮肤

> 👉 PurgeCSS 可以把 500KB+ 的 CSS 压到几十 KB

## 4️⃣ PurgeCSS 的局限与“坑”

### ⚠️ 1. 动态 class 名无法静态分析

```js
const cls = 'btn-' + type;
```

PurgeCSS `无法知道运行时值`

✅ 解决方式：safelist

```js
{
  safelist: [
    /^btn-/,
    'active',
    'show'
  ]
}
```

### ⚠️ 2. JS 运行时插入的样式

```js
element.classList.add('fade-in');
```

### ⚠️ 3. 第三方组件库 class

- 弹窗
- Toast
- Tooltip
- 动态挂载组件

> 通常需要 safelist

## 5️⃣ 在工程化里的典型位置

结合你前端工程经验，PurgeCSS 一般出现在：

### 🧱 webpack

```js
new PurgeCSSPlugin({
  paths: glob.sync('./src/**/*', { nodir: true }),
})
```

### ⚡ Vite

```js
import purgecss from '@fullhuman/postcss-purgecss';

purgecss({
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
});
```

### 🎨 Tailwind CSS

```js
content: ['./src/**/*.{html,js,vue,ts}']
```

> Tailwind 内部已经集成了类似 PurgeCSS 的机制（JIT）

## 6️⃣ 和其他方案的对比

| 方案           | 本质                   |
| ------------ | -------------------- |
| PurgeCSS     | **删除未使用 CSS（事后清理）**  |
| CSS Modules  | 天然 scoped，避免生成多余 CSS |
| Tailwind JIT | **只生成用到的 CSS（事前生成）** |
| Tree Shaking | JS 维度，不处理 CSS        |

## 7️⃣ 一句话

- PurgeCSS 本质是一次“基于静态分析的 CSS Dead Code Elimination”，通过扫描源码中可见的选择器使用情况，在构建阶段剔除未被引用的样式规则，从而显著降低 CSS 体积，
- 但对动态 class 依赖 safelist 兜底。
