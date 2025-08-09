# 第三库中的 devDependencies

当我们 npm install some-lib 时，这个库自己在 package.json 里写的 devDependencies 会不会被装到我们的 node_modules 里？

答案是——不会安装，原因和流程如下。

## 1. npm 对第三方库的依赖解析规则

当你安装一个第三方包（例如 lodash）：

1. npm 会下载这个包的 tarball（或从缓存解压）
2. 读取它的 package.json
3. 只会解析：
   - dependencies（运行时依赖）
   - optionalDependencies（可选依赖）
   - peerDependencies（npm7+ 自动安装）
4. devDependencies 会被忽略，因为它们只是该库在开发和测试时需要的工具，并不是你项目运行所需的依赖。

## 2. 为什么忽略

- devDependencies 通常包含构建工具、测试框架（如 mocha、webpack、eslint）
- 这些对库的使用者来说没意义，只是库作者开发这个库时才需要
- 如果安装这些，会增加你的 node_modules 体积，并可能带来冲突

## 3. 总结

npm install 某个第三方库时，不会安装它的 devDependencies

只有它的 dependencies（和 npm7+ 的 peerDependencies）会被递归解析并安装到你的 node_modules。
