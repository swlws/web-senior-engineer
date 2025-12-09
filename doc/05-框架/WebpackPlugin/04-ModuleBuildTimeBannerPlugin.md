# ModuleBuildTimeBannerPlugin

构建时记录一个时间 → 在最终上线页面里自动打印到浏览器控制台。

效果示例（用户打开网页时看到）：

```txt
🕒 Build Time: 2025-12-09 14:35:01
```

## 插件源码：ModuleBuildTimeBannerPlugin.js

```js
// ModuleBuildTimeBannerPlugin.js

class ModuleBuildTimeBannerPlugin {
  constructor(options = {}) {
    this.enabled = options.enabled !== false; // 默认启用
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap(
      "ModuleBuildTimeBannerPlugin",
      (compilation) => {
        // Webpack5 recommended hook
        compilation.hooks.processAssets.tap(
          {
            name: "ModuleBuildTimeBannerPlugin",
            stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
          },
          (assets) => {
            for (const assetName of Object.keys(assets)) {
              if (/\.(js|mjs)$/.test(assetName)) {
                // 在 JS 入口资产中注入 console.log
                const bannerCode = createBannerCode(assetName);

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

function createBannerCode(assetName) {
  const buildTime = new Date().toLocaleString();
  const message = `🕒 [${assetName}] Build Time: ${buildTime}`;
  return `\n/* ModuleBuildTimeBannerPlugin */\nconsole.log("%c${message}", "color:#4caf50;font-size:14px;");\n`;
}

module.exports = ModuleBuildTimeBannerPlugin;
```

## 使用方式（webpack.prod.js）

```js
const ModuleBuildTimeBannerPlugin = require("./ModuleBuildTimeBannerPlugin");

module.exports = {
  mode: "production",
  plugins: [new ModuleBuildTimeBannerPlugin()],
};
```
