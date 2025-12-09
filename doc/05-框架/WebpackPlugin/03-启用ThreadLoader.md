# 启用 ThreadLoader

## Webpack5 自定义插件：AutoThreadLoaderPlugin

功能目标

- 自动扫描 module.rules
- 在指定 loader（如 babel-loader、ts-loader、vue-loader 前端编译阶段等）前面插入 thread-loader
- 避免重复插入（可多次构建）
- 可配置匹配规则
- 可配置线程数量等参数

## 插件源码

```js
// AutoThreadLoaderPlugin.js
class AutoThreadLoaderPlugin {
  constructor(options = {}) {
    this.match = options.match || [/babel-loader/, /ts-loader/];
    this.threadOptions = options.threadOptions || {
      workers: Math.max(1, require("os").cpus().length - 1),
    };
    this.startTime = 0;
    this.endTime = 0;
  }

  apply(compiler) {
    // 记录开始时间
    compiler.hooks.beforeRun.tap("AutoThreadLoaderPlugin", () => {
      this.startTime = Date.now();
    });

    compiler.hooks.watchRun.tap("AutoThreadLoaderPlugin", () => {
      this.startTime = Date.now();
    });

    // 插入 thread-loader
    compiler.hooks.afterEnvironment.tap("AutoThreadLoaderPlugin", () => {
      const rules = compiler.options.module.rules || [];

      const injectThreadLoader = (rule) => {
        if (!rule.use) return;

        const useArr = Array.isArray(rule.use) ? rule.use : [rule.use];

        this.match.forEach((reg) => {
          const index = useArr.findIndex((u) => {
            const loaderName = typeof u === "string" ? u : u.loader;
            return loaderName && reg.test(loaderName);
          });

          // 找到目标 loader
          if (index !== -1) {
            const exists = useArr.some((u) => {
              const name = typeof u === "string" ? u : u.loader;
              return name && /thread-loader/.test(name);
            });

            // 避免重复插入
            if (!exists) {
              useArr.splice(index, 0, {
                loader: "thread-loader",
                options: this.threadOptions,
              });
              rule.use = useArr;
            }
          }
        });
      };

      const walkRules = (rules) => {
        rules.forEach((r) => {
          if (Array.isArray(r.oneOf)) walkRules(r.oneOf);
          if (r.rules) walkRules(r.rules);
          injectThreadLoader(r);
        });
      };

      walkRules(rules);
    });

    // 构建结束：记录时间 + 输出日志
    compiler.hooks.done.tap("AutoThreadLoaderPlugin", () => {
      this.endTime = Date.now();
      const cost = this.endTime - this.startTime;

      console.log("\n===== AutoThreadLoaderPlugin Report =====");
      console.log(`  🧵 thread-loader workers : ${this.threadOptions.workers}`);
      console.log(`  ⏱️  Build Time           : ${cost} ms`);
      console.log("==========================================\n");
    });
  }
}

module.exports = AutoThreadLoaderPlugin;
```

## webpack.config.js 使用方式

```js
const AutoThreadLoaderPlugin = require("./AutoThreadLoaderPlugin");

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ["babel-loader"], // 插件会自动在前面加 thread-loader
      },
      {
        test: /\.ts$/,
        use: ["ts-loader"],
      },
    ],
  },
  plugins: [
    new AutoThreadLoaderPlugin({
      match: [/babel-loader/, /ts-loader/],
      threadOptions: {
        workers: 4,
        workerParallelJobs: 50,
      },
    }),
  ],
};
```

## 插件插入后的效果

原始：

```js
use: ["babel-loader"];
```

插件自动变为：

```js
use: [
  {
    loader: "thread-loader",
    options: { workers: 4 },
  },
  "babel-loader",
];
```

## 注意事项 & 最佳实践

### 不要对 所有 loader 都加 thread-loader

thread-loader 适合 CPU 密集型 loader：

- babel-loader
- ts-loader (transpileOnly)
- vue-loader 的 template 编译
- image-minimizer-loader

不适合 I/O 或小而快的 loader（比如 style-loader、css-loader、file-loader 等）。
