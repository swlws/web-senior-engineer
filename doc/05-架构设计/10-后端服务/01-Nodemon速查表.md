# Nodemon 速查表

## 命令速查表

| 分类           | 命令 / 参数                             | 说明                                |
| -------------- | --------------------------------------- | ----------------------------------- |
| **基础启动**   | `nodemon app.js`                        | 启动并自动重载 app.js               |
|                | `nodemon server.js --watch src`         | 监听指定目录                        |
|                | `nodemon --exec "node app.js"`          | 自定义执行命令                      |
|                | `nodemon --inspect app.js`              | 调试模式运行                        |
| **监听与忽略** | `--watch <path>`                        | 监听某个文件/目录                   |
|                | `--ext js,ts,json`                      | 指定监听的文件后缀                  |
|                | `--ignore node_modules`                 | 忽略路径                            |
|                | `--ignore *.test.js`                    | 忽略指定模式的文件                  |
| **延迟与节流** | `--delay 2`                             | 延迟 2 秒再重启                     |
|                | `--delay 250ms`                         | 毫秒级延迟                          |
| **日志与输出** | `--quiet`                               | 只输出应用日志，不输出 nodemon 日志 |
|                | `--verbose`                             | 输出更多 debug 信息                 |
| **环境变量**   | `--env PORT=3000`                       | 临时设置环境变量                    |
|                | `cross-env NODE_ENV=dev nodemon app.js` | 跨平台方式设置 env（常用）          |
| **配置文件**   | `nodemon.json`                          | 自定义配置文件                      |
|                | `nodemon --config nodemon.json`         | 使用指定配置文件                    |
| **重启控制**   | `rs`                                    | 在终端手动输入“rs”立即重启          |
| **版本与帮助** | `nodemon -v`                            | 查看版本                            |
|                | `nodemon --help`                        | 帮助信息列表                        |

## 标准 nodemon.json 示例

```json
{
  "watch": ["src"],
  "ext": "js,mjs,json",
  "ignore": ["node_modules", "logs", "*.test.js"],
  "exec": "node ./src/app.js",
  "delay": "300ms",
  "env": {
    "NODE_ENV": "development",
    "PORT": "3000"
  }
}
```
