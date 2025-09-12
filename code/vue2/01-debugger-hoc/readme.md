# Vue2 组件debugger render 函数

## 使用方式

```html
<DebuggerRender is="el-select" v-model="value" clearable>
  <el-option label="A" value="a" />
  <el-option label="B" value="b" />
</DebuggerRender>
```

当 value 或 clearable 变化时，控制台会打印：

```text
[DebuggerRender] <el-select> props changed
┌─────────┬─────────┬─────────┐
│ (index) │ before  │ after   │
├─────────┼─────────┼─────────┤
│ value   │ 'a'     │ 'b'     │
└─────────┴─────────┴─────────┘
```

当插槽内容变化时，会打印：

```text
[DebuggerRender] <el-select> slots changed
┌─────────┬──────────────────┬──────────────────┐
│ index   │ before           │ after            │
├─────────┼──────────────────┼──────────────────┤
│ 0       │ {tag:'el-option'}│ {tag:'el-option'}│
└─────────┴──────────────────┴──────────────────┘
```
