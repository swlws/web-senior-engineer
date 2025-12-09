# BuildTimeBannerPlugin

构建时记录一个时间 → 在最终上线页面里自动打印到浏览器控制台。

效果示例（用户打开网页时看到）：

```txt
🕒 Build Time: 2025-12-09 14:35:01
```

## 插件源码：BuildTimeBannerPlugin.js

```js
// BuildTimeBannerPlugin.js

class BuildTimeBannerPlugin {
  constructor(options = {}) {
    this.enabled = options.enabled !== false; // 默认启用
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap(
      "BuildTimeBannerPlugin",
      (compilation) => {
        // only apply in production
        if (compiler.options.mode !== "production") return;

        const buildTime = new Date();
        const yyyy = buildTime.getFullYear();
        const MM = String(buildTime.getMonth() + 1).padStart(2, "0");
        const dd = String(buildTime.getDate()).padStart(2, "0");
        const HH = String(buildTime.getHours()).padStart(2, "0");
        const mm = String(buildTime.getMinutes()).padStart(2, "0");
        const ss = String(buildTime.getSeconds()).padStart(2, "0");

        const message = `🕒 Build Time: ${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;

        // 在 JS 入口资产中注入 console.log
        const bannerCode = `\n/* BuildTimeBannerPlugin */\nconsole.log("%c${message}", "color:#4caf50;font-size:14px;");\n`;

        // Webpack5 recommended hook
        compilation.hooks.processAssets.tap(
          {
            name: "BuildTimeBannerPlugin",
            stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
          },
          (assets) => {
            for (const assetName of Object.keys(assets)) {
              if (/\.(js|mjs)$/.test(assetName)) {
                const source = assets[assetName].source();
                const updated = bannerCode + "\n" + source;

                compilation.updateAsset(
                  assetName,
                  new compiler.webpack.sources.RawSource(updated)
                );
              }
            }
          }
        );
      }
    );
  }
}

module.exports = BuildTimeBannerPlugin;
```

## 使用方式（webpack.prod.js）

```js
const BuildTimeBannerPlugin = require("./BuildTimeBannerPlugin");

module.exports = {
  mode: "production",
  plugins: [new BuildTimeBannerPlugin()],
};
```
