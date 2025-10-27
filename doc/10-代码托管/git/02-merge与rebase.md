# merge 与 rebase

## 🧠 一、两者的核心区别

| 对比项                | `git merge`                                     | `git rebase`                     |
| --------------------- | ----------------------------------------------- | -------------------------------- |
| **目的**              | 把两个分支的修改合并在一起                      | 把当前分支“重新基于”另一个分支   |
| **历史记录**          | **保留分支历史**，会产生一个新的 “merge commit” | **重写历史**，让提交记录变得线性 |
| **结果提交树**        | 有“分叉 + 合并”结构                             | 一条“直线”历史                   |
| **是否改变原提交 ID** | ❌ 否                                           | ✅ 是（会生成新的 commit hash）  |
| **协作安全性**        | 安全，可直接用于共享分支                        | 危险，不应在共享分支使用         |

简单记忆：

- merge —— 合并两个历史
- rebase —— 改变历史的起点

## 🧩 二、示例对比

假设当前有两个分支：

```txt
A---B---C   (main)
         \
          D---E   (feature)
```

### ✅ 使用 git merge

```bash
# 在 main 分支上
git checkout main
git merge feature
```

得到：

```bsah
A---B---C-------F   (main)
         \     /
          D---E   (feature)
```

- Git 创建了一个新的 merge commit F
- 历史完整、结构分叉
- 日志中可以看到“两个分支合并”的记录

> 🟢 适合团队协作、保留完整历史

### ✅ 使用 git rebase

```bash
# 在 feature 分支上
git checkout feature
git rebase main
```

得到：

```bash
A---B---C---D'---E'   (feature)
```

- D 和 E 被“复制”到 C 之后
- 提交哈希（commit ID）改变
- 历史看起来就像从 main 分支后直接开发一样

> 🧹 让历史更整洁、线性

## ⚠️ 三、常见使用场景

| 场景                       | 推荐操作              | 理由                           |
| -------------------------- | --------------------- | ------------------------------ |
| **团队协作中的主分支合并** | `merge`               | 保留真实历史，安全可靠         |
| **自己在开发中的分支整理** | `rebase`              | 整理提交记录，让历史干净       |
| **拉取远程主干更新**       | `git pull --rebase`   | 避免每次拉取产生“merge commit” |
| **代码审查前清理分支提交** | `rebase -i`（交互式） | 可以合并、修改、删除提交       |

## 🧮 四、交互式 Rebase (git rebase -i)

非常强大，可以：

- 修改提交顺序；
- 合并多次提交；
- 修改 commit message；
- 删除无效提交。

```bash
git rebase -i HEAD~3
```

会打开编辑器，比如：

```bash
pick a1b2c3 Add login feature
pick d4e5f6 Fix bug
pick g7h8i9 Add test case
```

可以改成：

```bash
pick a1b2c3 Add login feature
squash d4e5f6 Fix bug
pick g7h8i9 Add test case
```

结果：把第二次提交合并进第一次。

## 🚨 五、注意事项

❗ Rebase 会重写历史

- 因为它会重新生成 commit；
- 所以 千万不要在别人已经拉取过的分支上 rebase。

示例危险情况：

```bash
git rebase main
git push -f   # 强制推送！⚠️
```

> 这样会破坏团队中其他人的提交历史。

## 🧭 六、经验法则（简单总结）

| 目的                          | 使用命令            |
| ----------------------------- | ------------------- |
| 整合公共分支                  | `git merge`         |
| 清理本地历史                  | `git rebase`        |
| 拉取远程主干但不制造新 commit | `git pull --rebase` |
| 合并提交记录                  | `git rebase -i`     |

## 🧱 七、一个直观比喻

假设主分支是高速公路（main），你在旁边修了一条辅路（feature）。

- merge： 你把辅路和主路接起来（保留分叉）；
- rebase： 你把辅路拆掉，重新铺在主路的延长线上（看起来就像一直在主路上修的）。
