# BuildTimeBannerPlugin V2

这个方式不会修改源码，也不会在每个模块都插入，只会 在入口 chunk 自动注入一段 console.log。

## Code

```js
class BuildTimeBannerPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap("BuildTimeBannerPlugin", (compilation) => {
      const buildTime = new Date().toLocaleString();

      compilation.hooks.processAssets.tap(
        {
          name: "BuildTimeBannerPlugin",
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        (assets) => {
          // 找到入口 js
          const entrypoints = compilation.entrypoints;

          for (const [name, entry] of entrypoints) {
            const files = entry.getFiles().filter((f) => f.endsWith(".js"));

            for (const file of files) {
              const source = assets[file].source();
              const banner = `console.log("%cBuild Time: ${buildTime}", "color:#4caf50;font-size:12px");\n`;

              compilation.updateAsset(
                file,
                new compiler.webpack.sources.RawSource(banner + source)
              );
            }
          }
        }
      );
    });
  }
}

module.exports = BuildTimeBannerPlugin;
```
