# 如何捕获 CSSOM 变化(styleSheets 变更)

CSS 相关的变化分两类：

1. DOM 层面的变化 → style 标签、<link rel="stylesheet"> 的增删改
   - 这个直接用 MutationObserver 就能监听到（childList: true, attributes: true）。
2. CSSOM 层面的变化 → 样式表的 规则增删，比如：
   ```js
   document.styleSheets[0].insertRule(".foo { color: red }");
   document.styleSheets[0].deleteRule(0);
   ```
   这种不会触发 MutationObserver，只能通过 hook 方法 来捕获。

## 1. 监听 `<style> / <link>` 节点变化

```js
const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.type === "childList") {
      console.log("style/link 节点增删：", m.addedNodes, m.removedNodes);
    }
    if (m.type === "attributes" && m.target.tagName === "LINK") {
      console.log("link 属性变化：", m.attributeName);
    }
  }
});

observer.observe(document.head, {
  childList: true,
  subtree: true,
  attributes: true,
});
```

## 2. 捕获 CSSOM 规则变更

核心思路是 重写 CSSStyleSheet.prototype.insertRule 和 deleteRule，在调用原方法前后插入记录逻辑。

```js
(function () {
  const rawInsertRule = CSSStyleSheet.prototype.insertRule;
  const rawDeleteRule = CSSStyleSheet.prototype.deleteRule;

  CSSStyleSheet.prototype.insertRule = function (rule, index) {
    console.log(
      "CSSOM insertRule:",
      rule,
      "at",
      index,
      "in",
      this.href || "inline <style>"
    );
    return rawInsertRule.call(this, rule, index);
  };

  CSSStyleSheet.prototype.deleteRule = function (index) {
    console.log(
      "CSSOM deleteRule:",
      index,
      "in",
      this.href || "inline <style>"
    );
    return rawDeleteRule.call(this, index);
  };
})();
```

这样，当脚本里运行：

```js
document.styleSheets[0].insertRule("body { background: yellow }");
```

你就能捕获到 "CSSOM insertRule: body { background: yellow }"。

## 3. RRWeb 的做法

RRWeb 的录制逻辑里确实是 hook 了 insertRule 和 deleteRule，并把这些操作序列化为事件，类似：

```json
{
  "type": "IncrementalSnapshot",
  "data": {
    "source": "stylesheetRule",
    "id": 12, // 对应的 <style> 节点 ID
    "adds": [{ "rule": "body { background: yellow }", "index": 0 }]
  }
}
```

回放时则会找到对应的 style 节点，然后执行：

```js
stylesheet.insertRule(rule, index);
```

## 4. 总结

- DOM 层级变更：用 MutationObserver 监听 `<style> 和 <link>` 节点。
- CSSOM 规则变更：重写 insertRule / deleteRule。
- RRWeb：两者都做了，还维护了 节点 ID → 样式表对象 的映射，确保回放时能找到对应的 styleSheet。
