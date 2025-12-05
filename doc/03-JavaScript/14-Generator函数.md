# Generator 函数

## 1. 定义

Generator 函数是 ES6 引入的一种特殊函数，用来生成“迭代器”。
它的写法是在函数声明或表达式前加一个 `*` 号：

```js
function* gen() {
  yield 1;
  yield 2;
  return 3;
}
``;
```

## 2. 特点

1. 可暂停：
   - 普通函数一旦调用，会从头执行到尾；
   - Generator 可以在执行过程中被 yield 暂停，外部再通过调用 next() 继续执行。
2. 返回迭代器对象：
   - 调用 gen() 返回的是一个 迭代器对象，而不是直接执行结果。
   - 需要手动调用 next() 才会执行。

## 3. 使用方式

```js
function* gen() {
  yield "a";
  yield "b";
  return "c";
}

const g = gen();

console.log(g.next()); // { value: 'a', done: false }
console.log(g.next()); // { value: 'b', done: false }
console.log(g.next()); // { value: 'c', done: true }
console.log(g.next()); // { value: undefined, done: true }
```

## 4. 参数

它和普通函数的参数传递方式不太一样，主要有 两种途径：

### 1. 调用 Generator 函数时传参

这是普通函数的参数传递方式：

```js
function* gen(x) {
  yield x + 1;
  yield x + 2;
}

const g = gen(10);

console.log(g.next()); // { value: 11, done: false }
console.log(g.next()); // { value: 12, done: false }
```

这里的 10 直接作为参数传给 gen(x)。

### 2. next(value) 传参

yield 不仅能“产出”值，还能“接收”值。

当你调用 iterator.next(value) 时，value 会传递给 上一个 yield 表达式的返回值。

```js
function* gen() {
  let a = yield 1;
  console.log("接收到：", a);
  let b = yield 2;
  console.log("又接收到：", b);
}

const g = gen();

console.log(g.next()); // { value: 1, done: false }
console.log(g.next(100)); // 传入 100，a = 100
// 打印：接收到： 100
// 返回 { value: 2, done: false }
console.log(g.next(200)); // 传入 200，b = 200
// 打印：又接收到： 200
// 返回 { value: undefined, done: true }
```

重点：

- 第一次调用 next() 的参数会被忽略（因为没有“上一个 yield”来接收）。
- 从第二次调用 next(value) 开始，value 才会传递到 yield 表达式里。

## 5. 应用场景

- 异步流程控制（配合 co 库，早期解决 callback hell 的方式，后来被 async/await 替代）。
- 自定义迭代器（比如自己控制数据的产生节奏）。
- 数据流/懒加载（一次只产出一个值，而不是一次性生成所有结果）。

## 6. 总结一句话

Generator 是 可中断的函数，通过 yield 把执行权交还出去，再用 next() 取回执行权，非常适合 分段执行 和 迭代控制。
