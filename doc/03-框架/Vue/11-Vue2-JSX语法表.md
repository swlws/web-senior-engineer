# Vue2 JSX 方法表

| 功能                | JSX 写法                                                                | 等价 h() 写法                                                                             | 备注                               |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------- |
| **普通 props**      | `<MyComp foo="123" bar={456} />`                                      | `h(MyComp, { props: { foo: '123', bar: 456 } })`                                      | 普通组件可直接访问 `this.foo`             |
| **布尔 prop**       | `<MyComp disabled />`                                                 | `h(MyComp, { props: { disabled: true } })`                                            | JSX 中写成自闭合即可                     |
| **自定义事件**         | `<MyComp onClick={this.handleClick} />`                               | `h(MyComp, { on: { click: this.handleClick } })`                                      | Vue 2 `$emit('click')` 捕获        |
| **原生事件**          | `<MyComp nativeOnClick={this.handleClick} />`                         | `h(MyComp, { nativeOn: { click: this.handleClick } })`                                | 监听组件根 DOM 元素                     |
| **默认插槽**          | `<MyComp> <div>content</div> </MyComp>`                               | `h(MyComp, {}, [h('div', 'content')])`                                                | children 数组传递                    |
| **具名插槽**          | `<MyComp scopedSlots={{ header: () => <h1>Title</h1> }} />`           | `h(MyComp, { scopedSlots: { header: () => h('h1', 'Title') } })`                      | 函数返回 VNode 数组                    |
| **作用域插槽**         | `<MyComp scopedSlots={{ item: props => <div>{props.text}</div> }} />` | `h(MyComp, { scopedSlots: { item: props => h('div', props.text) } })`                 | 子组件传递参数给 slot 函数                 |
| **class / style** | `<MyComp class="red" style={{ color: 'red' }} />`                     | `h(MyComp, { class: 'red', style: { color: 'red' } })`                                | class 可以是字符串/对象/数组               |
| **ref**           | `<MyComp ref="myComp" />`                                             | `h(MyComp, { ref: 'myComp' })`                                                        | Vue 实例可通过 `this.$refs.myComp` 访问 |
| **key**           | `<MyComp key="123" />`                                                | `h(MyComp, { key: '123' })`                                                           | 用于列表渲染优化                         |
| **v-model**       | `<MyComp value={this.value} onInput={val => this.value = val} />`     | `h(MyComp, { props: { value: this.value }, on: { input: val => this.value = val } })` | Vue2 JSX 写法没有内置 v-model          |
