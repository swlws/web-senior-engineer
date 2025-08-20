# CommonJS 模块加载机制

## 1. require 做了什么？

当你写：

```js
const foo = require("./foo");
```

Node.js 内部会执行以下步骤：

1. 路径解析：将 ./foo 解析成绝对路径，补充扩展名（.js / .json / .node）。
2. 缓存检查：先检查 require.cache，如果模块已经加载过，则直接返回缓存的 exports 对象。
3. 文件定位：按顺序尝试：
   - ./foo.js
   - ./foo.json
   - ./foo.node（C++ 插件）
   - 如果是目录：会找 package.json 的 main 字段；没有则默认 index.js
4. 模块编译：
   - .js → 读取文件内容，用函数包装执行：
     ```js
     (function (exports, require, module, __filename, __dirname) {
       // 模块代码
     });
     ```
   - .json → JSON.parse 文件内容。
   - .node → 直接调用 C++ 插件 dlopen 加载。
5. 执行模块：执行包装函数，把结果挂载到 module.exports。
6. 缓存模块：执行完成后，将 module.exports 缓存到 require.cache 中。
7. 返回结果：最终 require('./foo') 返回的就是 module.exports。

## 2. 示例：验证缓存

```js
// a.js
console.log("a.js loaded");
module.exports = { msg: "hello" };

// b.js
const a1 = require("./a");
const a2 = require("./a");
console.log(a1 === a2); // true
```

输出：

```txt
a.js loaded
true
```

## 3. 加载规则总结

- 按路径解析，支持相对路径、绝对路径、node_modules。
- 支持三类文件：.js、.json、.node。
- 目录模块 → 查找 package.json → fallback index.js。
- 有 缓存机制，多次 require 相同模块只执行一次。
- require.cache 可以手动清除，实现“热加载”。
  ```js
  function hotRequire(modulePath) {
    const resolvedPath = require.resolve(modulePath); // 绝对路径解析
    delete require.cache[resolvedPath]; // 删除缓存
    return require(modulePath); // 重新加载
  }
  ```

## 4. 对比 import

- require 是 同步加载（CommonJS）。
- import 是 静态分析 + 异步加载（ESM）。
- Tree Shaking 仅对 import 有效，因为 require 是运行时动态执行，编译期无法分析依赖。

```

```
