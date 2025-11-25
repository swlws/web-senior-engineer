# Eval 为什么执行慢

eval 慢 的根本原因：👉 它破坏了 JavaScript 引擎的优化路径，让 V8 无法进行 JIT 优化。

## ✅ 1. eval 会强制引擎停下来重新解析代码（开销大）

正常代码在运行前：

1. 词法分析
2. 语法分析
3. 生成 AST
4. 生成字节码
5. 热路径 → JIT 编译成机器码（超快）

但 eval("...") 属于「运行时注入代码」：

- 运行到 eval() 时，引擎必须 临时暂停执行
- 对字符串重新执行 词法分析 + 语法分析 + AST 构建
- 生成新的字节码（通常不能 JIT）

这是额外开销。

## ✅ 2. eval 破坏作用域，让引擎不能提前优化（最致命）

例如：

```js
let a = 10;
function foo() {
  eval("a = 20");
}
foo();
```

问题：👉 在 eval 运行之前，V8 无法确定变量 a 有没有可能被修改。

因此：❌ 引擎会关闭优化

例如：

- 不能 inline（函数内联）
- 不能 escape analysis（逃逸分析）
- 不能 remove dead code（无用代码删除）
- 不能 perform variable renaming（变量寄存器分配优化）
- 不能消除检查（bounds check elimination）

为什么？

因为 eval 除了重写变量，还可以创造新变量！例如：

```js
eval("var x = 999");
```

这会在当前 scope 注入新变量，使得作用域结构不再稳定。

因此：

> 只要代码出现 eval，V8 会把相关作用域当成“黑盒子”，
> 无法静态分析，就不优化。

## ✅ 3. eval 让作用域链不可靠 → JIT 必须禁用优化

V8 依赖作用域链稳定性才能优化。

但 eval 可能这样做：

```js
let a = 1;
eval("var a = 2"); // 改写当前作用域
```

此时作用域链结构发生变化，必须走慢路径（查哈希表样的 ScopeObject）。

## ✅ 4. eval 代码通常不能在编译阶段优化或提前解析

正常代码可以：

- 常量折叠
- 死代码消除
- 循环优化
- register allocation（寄存器分配优化）
- etc...

但 eval()：

- 只能在运行时知道内容
- 内容不可预测
- 可能引用外部变量
- 可能创建新变量

所以 V8 必须以「最保守」方式执行 eval，进入 baseline interpreter 慢路径。

## 📌 直观对比

### 普通代码（能 JIT）

```js
let sum = 0;
for (let i = 0; i < 1e7; i++) sum += i;
```

→ V8 会将 `sum+=i` 优化为机器码，满速运行。

### eval 版本（无法 JIT）

```js
let sum = 0;
for (let i = 0; i < 1e7; i++) eval("sum += i");
```

- 每次循环都重新解析字符串
- 不能 JIT
- 作用域链不再稳定

→ 至少慢几十倍。

## ✅ 5. eval 让 JavaScript 引擎缓存失效

JavaScript 引擎会对已解析的脚本缓存：

- AST caching
- bytecode caching

但 eval 的内容每次可能都不同：

```js
eval("console.log(" + Math.random() + ")");
```

→ 无法缓存 → 每次都重新解析 → 性能差。

## 📌 最终总结：eval 为什么慢？

| 原因     | 描述                     |
| ------ | ---------------------- |
| 解析开销   | 运行时重新解析字符串             |
| 禁用优化   | eval 破坏作用域链 → JIT 优化全关 |
| 不可预测   | 引擎无法提前分析代码结构           |
| 破坏变量推断 | eval 可能修改或新增变量         |
| 不能缓存   | 字符串动态变化无法字节码缓存         |

简单来说：

> eval = 强迫 JS 引擎用最慢方式执行代码。
