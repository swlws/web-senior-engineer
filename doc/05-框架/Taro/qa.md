taro info
taro doctor

# 创建页面

taro create newPage --dir pages/mydir

# 创建分包页面

taro create newPage --subpkg mysubpage

taro config list

Taro 基于 WX 小程序的规范设计的 API
尽可能的遵训 WEB 规范，但部分 API 并不能完整的复刻：

- history、location 只能当做仅读对象。路由，Taro.navaigatoTo
- DOM 获取，使用 ref 获取
- DOM 尺寸 使用 Taro.createSelectorQuery

异步获取
const query = Taro.createSelectorQuery()
query
.select('#inner')
.boundingClientRect()
.exec((res) => {
console.log(res)
})

const ctx = Taro.createVideoContext('myVideo')
ctx.play()

多端，环境变量进行区别、文件名后缀

不支持 React Portal
不支持 Vue3 Teleport

Taro.preload

<https://zhuanlan.zhihu.com/p/565159382>

md doc
