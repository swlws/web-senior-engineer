# README

## 常用命令

| 分类                 | 命令                                                 | 说明                            |
| ------------------ | -------------------------------------------------- | ----------------------------- |
| **启动应用**           | `pm2 start app.js`                                 | 启动单个应用                        |
|                    | `pm2 start ecosystem.config.cjs`                   | 使用生态配置文件启动                    |
|                    | `pm2 start app.js -i max`                          | 多核模式，自动根据 CPU 数量启动实例          |
|                    | `pm2 start app.js --name api`                      | 指定自定义名称                       |
| **停止/删除/重启**       | `pm2 stop all`                                     | 停止所有进程                        |
|                    | `pm2 stop <name/id>`                               | 停止指定进程                        |
|                    | `pm2 restart all`                                  | 重启所有进程                        |
|                    | `pm2 restart <name/id>`                            | 重启指定进程                        |
|                    | `pm2 delete all`                                   | 删除所有进程                        |
|                    | `pm2 delete <name/id>`                             | 删除指定进程                        |
| **查看状态**           | `pm2 list`                                         | 查看应用列表                        |
|                    | `pm2 show <id/name>`                               | 查看详细信息（memory/cpu）            |
|                    | `pm2 status`                                       | 列出所有监控进程                      |
| **日志管理**           | `pm2 logs`                                         | 查看所有日志                        |
|                    | `pm2 logs <name>`                                  | 查看指定应用日志                      |
|                    | `pm2 flush`                                        | 清空所有日志文件                      |
|                    | `pm2 reloadLogs`                                   | 重新加载日志文件                      |
| **监控与指标**          | `pm2 monit`                                        | 实时监控 CPU/内存                   |
| **持久化与系统服务**       | `pm2 save`                                         | 保存当前列表，用于开机自启                 |
|                    | `pm2 resurrect`                                    | 恢复之前保存的进程                     |
|                    | `pm2 startup`                                      | 生成系统启动命令（systemd）             |
| **配置管理**           | `pm2 ecosystem`                                    | 生成 ecosystem.config.js/cjs 模板 |
|                    | `pm2 reload ecosystem.config.cjs --env production` | 使用配置文件并在生产环境下热重载              |
| **部署（PM2 deploy）** | `pm2 deploy production setup`                      | 初始化远程服务器                      |
|                    | `pm2 deploy production`                            | 代码部署（pull + reload）           |
|                    | `pm2 deploy production update`                     | 拉代码并重启                        |
|                    | `pm2 deploy production revert 1`                   | 回滚到上一个版本                      |
| **进程调试**           | `pm2 describe <id>`                                | 查看进程详情                        |
|                    | `pm2 inspect <name>`                               | 使用 inspector 调试               |
