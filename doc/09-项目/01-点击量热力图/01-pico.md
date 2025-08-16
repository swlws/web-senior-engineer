# Pico

[rsify/pico](https://github.com/rsify/pico?utm_source=chatgpt.com)

## 1. Pico 是什么？

Pico 是一个开源的、纯前端的 HTML → PNG 截图工具，特点是完全在客户端运行，无需服务端，也无需 headless 浏览器。它的目标是以极高精度还原当前浏览器视图，包括诸如滚动状态、跨域图片、输入框状态、字体、canvas 内容、视频当前帧等复杂细节。

它的核心原理是：通过 SVG 的 <foreignObject> 将网页内容嵌入，然后用 canvas.drawImage 渲染，再导出为图片格式。

## 2. 功能亮点一览

| 特性                         | 说明                                                                  |
| -------------------------- | ------------------------------------------------------------------- |
| **100% 客户端执行**             | 无需服务器或 Puppeteer 等工具，完全在浏览器中运行。              |
| **高精度内容截图**                | 支持滚动区域、跨域图片、video 帧、Canvas 内容、Web 字体、输入框状态等。 |
| **SVG + foreignObject 渲染** | 利用 SVG 将 HTML 渲染到 Canvas，这是目前少见的截图方式。        |

## 3. 与其他方案对比

- Puppeteer / Headless Chrome
  服务端方案，灵活但需额外环境、资源占用高；并不适合运行在客户端。
- html2canvas
  客户端纯 JS 替代方案，更成熟，但渲染 fidelity（尤其是字体、视频、Canvas）不如 Pico。
- dom-to-image / html-to-image
  常用库，兼容性较好，但有时在复杂内容下表现有限，比如对 WebFonts 或高级 CSS 支持较弱。
- Pico
  渲染准确度高，保留页面真实视觉效果，但实现较为“黑科技” (SVG + foreignObject)，可能存在跨浏览器差异或限制。

----

## 4. Pico 如何处理 CSS

pico 的原理类似我前面讲的 “SVG + foreignObject”，但它做了更完整的实现，尤其是对 CSS 样式的还原。主要步骤如下：

1. 克隆 DOM 节点

- Pico 会从目标 DOM 开始，递归克隆节点树。
- 在克隆过程中，它会 过滤掉不需要的节点（比如脚本）。

2. 计算并内联样式

- 通过 window.getComputedStyle(node) 获取每个元素的最终计算样式。
- 把这些计算结果直接写入 style 属性（内联到克隆节点上）。
- 这样即便外部样式表、媒体查询、继承样式被剥离，克隆后的节点也能在 foreignObject 内独立渲染。

3. 伪元素处理

- getComputedStyle(el, '::before') / ::after 获取 content 和其他样式。
- Pico 会为这些伪元素手动生成子节点插入到克隆 DOM 中，确保它们在截图里可见。

4. 资源处理（CSS 中的背景图、字体等）

- 解析 background-image: url(...)，将其转换为 dataURL 并替换。
- 遍历 document.styleSheets，抽取其中的 @font-face 规则，把字体文件下载后转成 base64 内联到 <style> 中。
- 这样在 foreignObject 内渲染时不会因为跨域或字体缺失而丢失样式。

5. 生成 SVG

- 把克隆好的 DOM 放到 <foreignObject> 内。
- 包装成 <svg>，再序列化成字符串/Blob。
- 最终绘制到 <canvas>。

## 5. 兼容 WebComponent

new XMLSerializer().serializeToString(Node) 获取 WebComponent 的内容。需要特殊处理为普通 DOM + scoped CSS。核心流程：

- 生成独立的 DIV 盒子，用于存放 WebComponent 及其子节点。
- 克隆 WebComponent 中的 DOM 节点，将其添加到独立的盒子中。
- 获取 WebComponent 的样式，将其添加到盒子中。

```js

/**
 * 生成一段随机数
 * 
 * @returns 
 */
function generateRandom16DigitsAndLetters() {
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var timestamp = Date.now().toString(); // 获取当前时间戳字符串
    var randomString = '';

    // 将时间戳作为一部分添加到随机字符串中
    for (var i = 0; i < timestamp.length; i++) {
        randomString += characters.charAt(parseInt(timestamp[i]) % characters.length);
    }

    // 补充剩余的随机字符
    for (var i = timestamp.length; i < 16; i++) {
        var randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }

    return randomString;
}

/**
 * 克隆 Web Component
 *    node.shadowRoot 存在时，即认为是 Web Component
 * 
 * @param {*} target 
 * @param {*} cloneNodeDeep 
 * @returns 
 */
function cloneWebComponent(target, cloneNodeDeep) {
    // 样式表的名空间
    const namespace = `web-component__${generateRandom16DigitsAndLetters()}`;

    // 临时容器
    const box = document.createElement('div')
    box.classList.add(namespace)

    // web component 子节点
    const childNodes = target.shadowRoot.childNodes;
    for (const node of childNodes) {
        const tagName = node.tagName
        if (tagName === 'STYLE') {
            // 创建 style 节点
            box.append(cloneStyleTag(node, `.${namespace}`))
        } else {
            // 创建非 style 节点
            box.append(cloneNodeDeep(node))
        }
    }
    return box
}
```
