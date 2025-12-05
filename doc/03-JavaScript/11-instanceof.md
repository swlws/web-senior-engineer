# instanceof

## 1. 基本用法

```js
obj instanceof Constructor
```

它会判断：

👉 obj 的原型链上，是否存在 Constructor.prototype。

## 2. 运行时机制

instanceof 的内部逻辑大致是：

1. 取 Constructor.prototype，记作 proto。
   - 如果 proto 不是对象（比如被改成了字符串），直接抛 TypeError。
2. 沿着 obj.__proto__（也就是 [[Prototype]]）链向上查找：
   - 如果某一层 __proto__ === proto，返回 true。
   - 如果一直查到 null（原型链顶端）还没找到，返回 false。

## 3. 示例

```js
function Foo() {}
const f = new Foo();

console.log(f instanceof Foo); // true
console.log(f instanceof Object); // true，因为 Foo.prototype.__proto__ === Object.prototype
console.log(f instanceof Array); // false
```

等价于：

```js
let proto = Foo.prototype;
let objProto = Object.getPrototypeOf(f);

while (objProto) {
  if (objProto === proto) return true;
  objProto = Object.getPrototypeOf(objProto);
}
return false;
```

## 4. 特殊情况

### 跨 iframe / realm

每个 iframe 有自己的一套全局对象（不同的 Array, Object 构造函数）。
所以：

```js
iframeArray instanceof Array // 可能是 false
```

### 修改 prototype

```js
function Foo() {}
const f = new Foo();

Foo.prototype = {}; 
console.log(f instanceof Foo); // false，因为 f 的原型链上找不到新 prototype
```

### Symbol.hasInstance 可重写逻辑

ES6 引入：类可以自定义 instanceof 行为。

```js
class MyClass {
  static [Symbol.hasInstance](obj) {
    return obj.flag === true;
  }
}

console.log({ flag: true } instanceof MyClass); // true
```

## 5. 对比 typeof / Object.prototype.toString

- instanceof：基于原型链，适合判断对象是否由某构造函数创建。
- typeof：对基础类型准确，但对对象一律是 "object"（除了 function）。
- Object.prototype.toString.call()：最精准的类型判断方式（可区分数组/正则等）。
