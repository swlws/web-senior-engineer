# HtmlInjectBuildTimePlugin

如果项目用 HtmlWebpackPlugin，直接插入一个 script 标签，内容是 console.log 打印构建时间。

## Code

```js
const HtmlWebpackPlugin = require("html-webpack-plugin");

class HtmlInjectBuildTimePlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(
      "HtmlInjectBuildTimePlugin",
      (compilation) => {
        HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tap(
          "HtmlInjectBuildTimePlugin",
          (data) => {
            const buildTime = new Date().toLocaleString();
            data.html = data.html.replace(
              "</body>",
              `<script>console.log("Build Time: ${buildTime}")</script></body>`
            );
          }
        );
      }
    );
  }
}

module.exports = HtmlInjectBuildTimePlugin;
```
