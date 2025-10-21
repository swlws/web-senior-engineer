# npm install 的过程

npm install 的执行过程，其实是一个读取 → 解析 → 下载 → 安装 → 链接的完整链路。

## 1. 读取配置

- 读取项目根目录的：
  - `package.json`（依赖声明）
  - `package-lock.json` 或 `npm-shrinkwrap.json`（锁定依赖树）
  - `.npmrc`（私服地址、代理、registry 配置等）
- 判断是否传了参数：
  - `npm install` → 安装所有依赖
  - `npm install <pkg>` → 安装指定依赖

可能会影响安装的选项：--production、--force、--legacy-peer-deps 等

## 2. 解析依赖版本

- 遍历 dependencies、devDependencies、optionalDependencies、（npm7+ 还会解析 peerDependencies）
- 对每个依赖：
  - 从 lock 文件中查找精确版本
  - 如果没有，去 npm registry 查询元数据
  - 根据 semver 规则选出合适的版本
- 递归解析子依赖的依赖

> SemVer: [语义化版本控制规范](https://semver.org/lang/zh-CN/)

## 3. 构建依赖树

- 把所有依赖组成一棵树（包括重复、不同版本的同名包）
- 冲突处理：
  - 如果版本一致 → 提升到顶层（扁平化）
  - 如果版本不一致 → 保留多个副本（嵌套在各自 node_modules 下）
- 考虑 peerDependencies 的安装位置

## 4. 下载 & 缓存

- 检查本地缓存（~/.npm/_cacache）
  - 如果已存在且校验通过 → 直接解压
  - 否则从 registry 下载 .tgz
- 校验完整性（integrity，基于 sha512 或 sha1）

## 5. 链接与生成目录

- 按依赖树结构在 node_modules 中创建目录
- 把包文件解压到对应目录
- 生成二进制文件链接到 node_modules/.bin/（如 eslint、webpack CLI）

## 6. 执行安装脚本

- 对每个包执行：
  - preinstall
  - install
  - postinstall
- 有些包会在这里构建源码、下载额外依赖（例如 node-sass、sharp）

## 7. 更新锁文件

- 如果依赖树变化：
  - 更新 package-lock.json（记录版本号、integrity、依赖关系）
- 保证下次安装完全一致

## 8. 最终收尾

- 清理临时文件
- 输出安装日志
- 如果安装失败（如网络错误、权限问题、脚本报错），可能会留下部分已解压文件

## 📌 一句话总结

> 根据依赖声明 → 确定版本 → 构建依赖树 → 下载解压 → 链接二进制 → 执行安装脚本 → 更新锁文件
