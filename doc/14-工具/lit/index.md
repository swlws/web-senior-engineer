# Lit

## Demo

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Lit + Vue2 Count Demo</title>

    <!-- 外部按钮 -->
    <button id="add-btn">Add 外部按钮</button>

    <!-- Vue2 CDN -->
    <script src="https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js"></script>

    <!-- Lit 3.x CDN -->
    <script type="module">
      import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'

      class MyWrapper extends LitElement {
        static properties = {
          count: { type: Number }
        }

        constructor() {
          super()
          this.count = 0
        }

        firstUpdated() {
          const mountPoint = this.renderRoot.querySelector('#vue-root')

          // 记录 Vue 实例
          this.vue = new Vue({
            el: mountPoint,
            data: { count: this.count },
            template: `
            <div style="color: red; font-size: 20px;">
              Vue2 count: {{ count }}
            </div>
          `
          })
        }

        updated(changedProps) {
          if (changedProps.has('count') && this.vue) {
            this.vue.count = this.count
          }
        }

        add() {
          this.count++
        }

        render() {
          console.log('Lit Render')
          return html`
            <button @click=${this.add}>Lit 按钮：count = ${this.count}</button>

            <div style="margin-top: 10px; font-weight:bold;">Lit Rendered Content Below</div>

            <div id="vue-root"></div>
          `
        }
      }

      customElements.define('my-wrapper', MyWrapper)

      // 页面加载完成后，外部按钮绑定事件
      window.addEventListener('DOMContentLoaded', () => {
        const wrapper = document.querySelector('my-wrapper')
        const addBtn = document.getElementById('add-btn')

        addBtn.addEventListener('click', () => {
          wrapper.add() // 调用 Lit 组件方法，触发 count++
        })
      })

      let outerCount = 0
      setInterval(() => {
        outerCount++
        console.log('outerCount:', outerCount)
      }, 1000)
    </script>
  </head>
  <body>
    <my-wrapper></my-wrapper>
  </body>
</html>


```
