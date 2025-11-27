# fetch 与 pull

## 🧠 一、核心

- git fetch：只下载更新，不合并。
- git pull：下载 + 自动合并。

## 📦 二、核心区别对比

| 对比项                    | `git fetch`                              | `git pull`                                     |
| ------------------------- | ---------------------------------------- | ---------------------------------------------- |
| **作用**                  | 仅从远程获取最新对象（更新本地远程分支） | 从远程获取并自动合并到当前分支                 |
| **是否修改当前分支**      | ❌ 否                                    | ✅ 是                                          |
| **是否自动 merge/rebase** | ❌ 否                                    | ✅ 是                                          |
| **风险**                  | 安全，不会改动工作区                     | 可能产生冲突或自动 merge                       |
| **常见用途**              | 查看远程更新、手动对比差异               | 同步远程代码                                   |
| **等价命令**              | `git fetch origin`                       | `git fetch origin + git merge origin/<branch>` |

## 🧩 三、形象举例

假设远程仓库 origin/main 比你本地的 main 多两个提交：

```bash
远程：A---B---C---D
本地：A---B
```

### ✅ git fetch

```bash
git fetch origin
```

此时：

```bash
本地 main:  A---B
远程 main:  A---B---C---D
```

- 只是更新了 origin/main 的指针；
- 你的 main 没有改变；
- 可以手动查看差异：

```bash
git diff main origin/main
```

或选择手动合并：

```bash
git merge origin/main
```

> 🟢 安全、可控、无副作用。

### ✅ git pull

```bash
git pull origin main
```

等价于：

```bash
git fetch origin main
git merge origin/main
```

结果：

```bash
本地：A---B---C---D   ← main
```

- 自动合并到当前分支；
- 若有冲突，需要手动解决；
- 一步完成同步更新。

> 🟠 快捷但有风险（可能引发冲突或产生 merge commit）。

## ⚙️ 四、git pull --rebase

这是一个非常实用的变体 👇

```bash
git pull --rebase origin main
```

等价于：

```bash
git fetch origin main
git rebase origin/main
```

📈 效果：

- 不产生多余的 “merge commit”；
- 让提交历史保持线性；
- 适合个人开发分支或频繁同步主干的场景。

🧹 示例：

```bash
远程:  A---B---C
本地:  A---B---X---Y
```

执行 git pull --rebase 后：

```bash
本地:  A---B---C---X'---Y'
```

## 🧮 五、工作区的变化总结

| 操作                | 远程分支更新 | 本地分支更新      | 工作区文件变化 |
| ------------------- | ------------ | ----------------- | -------------- |
| `git fetch`         | ✅ 是        | ❌ 否             | ❌ 否          |
| `git pull`          | ✅ 是        | ✅ 是             | ✅ 是          |
| `git pull --rebase` | ✅ 是        | ✅ 是（线性历史） | ✅ 是          |

## 🧭 六、使用建议

| 场景                       | 推荐命令                  | 理由              |
| -------------------------- | ------------------------- | ----------------- |
| 想看远程更新但不动自己分支 | `git fetch`               | 安全、可审查差异  |
| 想更新本地代码并合并       | `git pull`                | 方便快捷          |
| 想保持干净线性历史         | `git pull --rebase`       | 减少 merge commit |
| 协作时手动控制合并         | `git fetch` + `git merge` | 避免意外冲突      |

## 🧱 七、直观比喻

远程仓库就像“图书馆”，本地仓库是“你的笔记本”。

| 操作                | 比喻                                                                 |
| ------------------- | -------------------------------------------------------------------- |
| `git fetch`         | 去图书馆抄下目录，看看有哪些新书；你自己的笔记没动。                 |
| `git pull`          | 把新书直接带回家并放进你的笔记中。                                   |
| `git pull --rebase` | 把你的笔记先挪一边，把图书馆的新内容插进来，再重新把笔记整理在后面。 |

## 📘 八、实际工作流建议

推荐日常做法：

```bash
# 1. 保持更新但不立刻合并
git fetch origin

# 2. 查看差异
git log main..origin/main

# 3. 确认没问题后再更新
git pull --rebase
```
