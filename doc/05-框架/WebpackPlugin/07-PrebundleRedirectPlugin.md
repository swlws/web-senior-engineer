# PrebundleRedirectPlugin

模仿 Taro 的 PrebundleRedirectPlugin, 实现预构建依赖

## prebundle

```js
// scripts/prebundle.js
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

// 想要预构建的依赖（可按需扩展）
const deps = [
  "vue",
  "vue-router",
  "axios",
  // ...其它三方依赖
];

const outdir = path.resolve(__dirname, "../prebundle");
if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);

(async () => {
  await esbuild.build({
    entryPoints: deps,
    outdir,
    bundle: true,
    format: "esm",
    splitting: true,
    metafile: true,
    platform: "browser",
    target: "es2017",
    sourcemap: false,
  });

  console.log("✨ Prebundle 完成");
})();
```

使用

```bash
node scripts/prebundle.js
```

## 代码 - PrebundleRedirectPlugin

```js
const path = require("path");
const fs = require("fs");
const { parse } = require("@babel/parser");
const MagicString = require("magic-string");
const traverse = require("@babel/traverse").default;

class PrebundleRedirectPlugin {
  /**
   * @param {Object} options
   * @param {string} options.prebundleDir 预构建产物目录
   */
  constructor(options = {}) {
    this.prebundleDir = options.prebundleDir;

    // 在构造函数中扫描 prebundle 目录，生成 { 包名 → 文件路径 }
    this.pkgMap = this._scanPrebundleDir();
  }

  /** 扫描 prebundle 目录，自动生成包名映射 */
  _scanPrebundleDir() {
    const map = {}; // { packageName -> filePath }

    const files = fs.readdirSync(this.prebundleDir);

    files.forEach((file) => {
      if (!file.endsWith(".js") && !file.endsWith(".mjs")) return;

      const basename = file.replace(/\.(js|mjs)$/, "");

      // ======================
      // 1️⃣ 支持 react-dom/client.js
      // 2️⃣ 支持 lodash-es.js
      // 3️⃣ 支持 vue.js
      // ======================

      const pkgName = basename.replace(/_/g, "/");
      // ⚠️ 注意：如果你 prebundle 时输出文件名用 "_" 代替 "/"，这里会自动恢复

      map[pkgName] = path.join(this.prebundleDir, file);
    });

    return map;
  }

  /** 根据 import 的包名（可能带子路径）查找匹配文件 */
  _resolvePrebundleFile(importPath) {
    // 完整命中，例如 "vue" / "react-dom/client"
    if (this.pkgMap[importPath]) {
      return this.pkgMap[importPath];
    }

    // 模糊匹配顶层包，例如 "lodash/pick" → 匹配 "lodash"
    const topLevel = importPath.split("/")[0];
    if (this.pkgMap[topLevel]) {
      return this.pkgMap[topLevel];
    }

    return null;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap("PrebundleRedirectPlugin", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "PrebundleRedirectPlugin",
          stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        (assets) => {
          for (const assetName of Object.keys(assets)) {
            if (!assetName.endsWith(".js")) continue;

            const code = assets[assetName].source().toString();
            const ms = new MagicString(code);

            let ast;
            try {
              ast = parse(code, {
                sourceType: "module",
                plugins: ["dynamicImport"],
              });
            } catch {
              continue;
            }

            traverse(ast, {
              ImportDeclaration: (p) => {
                const v = p.node.source.value;
                const redirect = this._resolvePrebundleFile(v);
                if (!redirect) return;

                ms.overwrite(
                  p.node.source.start + 1,
                  p.node.source.end - 1,
                  redirect
                );
              },

              CallExpression: (p) => {
                if (p.node.callee.type !== "Import") return;
                const arg = p.node.arguments[0];
                if (!arg || arg.type !== "StringLiteral") return;

                const v = arg.value;
                const redirect = this._resolvePrebundleFile(v);
                if (!redirect) return;

                ms.overwrite(arg.start + 1, arg.end - 1, redirect);
              },
            });

            compilation.updateAsset(
              assetName,
              new compiler.webpack.sources.RawSource(ms.toString())
            );
          }
        }
      );
    });
  }
}

module.exports = PrebundleRedirectPlugin;
```

使用

```js
const PrebundleRedirectPlugin = require("./plugins/PrebundleRedirectPlugin");
const path = require("path");

module.exports = {
  plugins: [
    new PrebundleRedirectPlugin({
      prebundleDir: path.resolve(__dirname, "prebundle"),
    }),
  ],
};
```
