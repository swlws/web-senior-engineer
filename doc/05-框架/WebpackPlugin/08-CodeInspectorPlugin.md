# CodeInspectorPlugin

code-inspector 类插件最核心的目标：

在浏览器中点击页面元素 → 自动跳转到编辑器中对应的源码文件与行号。

这一类插件（常见：vite-plugin-inspect, vite-plugin-vue-inspector, rspack-inspector, Webpack code inspector 插件）通常包含 构建阶段 + 运行时阶段 两部分。

## 原理

```txt
┌─────────────────┐
│   用户点击 DOM  │ Alt+Click
└────────┬────────┘
         │ inspector runtime
         ▼
┌─────────────────────────────────────┐
│ 读取 DOM 属性中注入的文件路径/行号   │
└────────┬────────────────────────────┘
         │ fetch() 上报
         ▼
┌─────────────────────────────────────┐
│ DevServer 本地 Node 服务收到定位请求 │
└────────┬────────────────────────────┘
         │ 调用 VSCode / WebStorm
         ▼
┌─────────────────────────────────────┐
│  自动打开并定位到源文件对应行        │
└─────────────────────────────────────┘
```

## MVP

Webpack Loader 版 inspector-loader.js

```js
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;

module.exports = function(source) {
  const ast = parser.parse(source, { sourceType: "module", plugins: ["jsx"] });

  traverse(ast, {
    JSXOpeningElement(path) {
      const loc = path.node.loc;
      const file = this.resourcePath.replace(process.cwd(), "");

      path.node.attributes.push({
        type: "JSXAttribute",
        name: { type: "JSXIdentifier", name: "__inspector" },
        value: {
          type: "StringLiteral",
          value: `${file}:${loc.start.line}:${loc.start.column}`
        }
      });
    }
  });

  return generate(ast).code;
};
```

DevServer 服务端

```js
app.get("/open-in-editor", (req, res) => {
  const { file, line, col } = req.query;
  require("child_process").exec(`code -g ${file}:${line}:${col}`);
  res.end();
});
```

## 定位

✔ 调用系统编辑器，例如 VSCode

内部执行：

```bash
# code --help
code -g src/pages/home.vue:12:5
```

## Link

- [code-inspector-plugin](https://www.npmjs.com/package/code-inspector-plugin)
