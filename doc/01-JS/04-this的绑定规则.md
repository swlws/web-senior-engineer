# `this` 的绑定规则

| 绑定方式       | 说明                                                | 示例                                |
| ---------- | ------------------------------------------------- | --------------------------------- |
| **默认绑定**   | 函数直接调用，非严格模式下 `this` 是 `window`，严格模式为 `undefined` | `foo()`                           |
| **隐式绑定**   | 被对象调用，`this` 指向调用它的对象                             | `obj.fn()`                        |
| **显式绑定**   | 使用 `call` / `apply` / `bind` 显式指定 `this`          | `fn.call(obj)` / `fn.bind(obj)()` |
| **new 绑定** | 使用 `new` 调用构造函数，`this` 指向新创建的对象                   | `new Foo()`                       |
| **箭头函数**   | 没有自己的 `this`，继承定义时外层作用域的 `this`                   | `() => this`                      |
