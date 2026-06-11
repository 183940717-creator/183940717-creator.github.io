# GitHub 添加作品说明

以后新增作品，不需要再进入 Netlify CMS 后台。只改 GitHub 仓库里的文件即可，Netlify 会自动部署。

## 你只需要改 3 个地方

1. 作品详情素材放到：

```text
我的作品/新作品文件夹/
```

如果是 GIF / 视频 / 超大图片，建议先压缩。发布脚本只会补充新增素材，不会覆盖已有作品大素材，避免旧素材被误替换。

2. 首页/全部作品封面放到：

```text
首页作品封面/作品ID.jpg
首页作品封面/作品ID.png
首页作品封面/作品ID.gif
```

3. 作品数据改这里：

```text
content/projects.json
```

## 新增作品步骤

1. 在 GitHub 打开仓库。
2. 进入 `我的作品`，新建一个作品文件夹，比如：

```text
12_新作品
```

3. 上传作品详情图片、GIF 或视频。
4. 进入 `首页作品封面`，上传封面，文件名必须用作品 ID：

```text
new-project-id.jpg
```

5. 打开 `content/projects.json`。
6. 复制 `作品添加模板.json` 里的内容。
7. 粘贴到 `projects` 数组最后，并修改文字和图片路径。
8. 保存提交，Netlify 会自动部署。

## 关于大文件

作品里的 GIF、视频和超大图片容易让仓库和网站变重。

推荐规则：

- JPG / PNG：尽量控制在 1MB 以内。
- GIF：能转成 MP4 时优先用 MP4。
- MP4：压缩后再上传。
- 如果一次新增很多大素材，先放到本地，我可以帮你统一压缩并同步到发布目录。

## 作品 ID 规则

`id` 是作品的网址标识，只用英文小写、数字和中横线。

推荐：

```text
new-project-id
douyin-event-2026
pheagee-update
```

不推荐：

```text
新作品
New Project
new_project
```

## 分类可选值

```text
brand     品牌
campaign  活动视觉
ui        UI 交互
content   数字内容
digital   数字内容
```

## 图片排列规则

作品详情图片会按文件名里的编号自动分组排列。

```text
NEW-001.jpg
NEW-002.jpg
NEW-003.jpg
```

会从上到下显示 3 排。

如果同一个编号有多个后缀：

```text
NEW-001-1.jpg
NEW-001-2.jpg
NEW-001-3.jpg
```

会显示在同一排。

## 首页精选作品

首页精选由 `featuredProjectIds` 控制。

```json
"featuredProjectIds": [
  "pheagee",
  "douyin-new-year",
  "douyin-annual-report",
  "aigc"
]
```

想把新作品放到首页精选，就把新作品 ID 放进去。

## 保存前检查

如果在本地检查，可以运行：

```bash
node tools/check-projects.js
```

通过后再提交最稳。
