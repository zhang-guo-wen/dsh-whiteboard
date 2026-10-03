# dsh-whiteboard

为 DeepSeek Harness 提供白板：主面板是白板卡片列表，右侧边栏用 draw.io 编辑，白板文件保存在插件内。无需选择工作区：白板为该目录创建专用会话并授予写入权限。

## 安装

先安装并启用 [`@guowenzhang/dsh-drawioedit`](../dsh-drawioedit)，再安装本插件：

```sh
npx @deepseek-ai/dsh plugin --profile web add @guowenzhang/dsh-drawioedit
npx @deepseek-ai/dsh plugin --profile web add @guowenzhang/dsh-whiteboard
```

来自 npm 官方源：<https://www.npmjs.com/package/@guowenzhang/dsh-whiteboard>。装完重启宿主；本地目录开发安装、git 源与排查见 [AGENTS.md](AGENTS.md)。

重启 DSH Web 后，打开左侧导航中的“白板”。点击“新建白板”会先显示命名对话框，默认填入时间名称，可直接修改；只有点击“确认创建”才会在插件 `files/` 目录创建 `.drawio` 文件并交给 drawioedit 打开。绘图内容由 drawioedit 自动保存。卡片显示名称、第一页缩略图和最近修改时间；点击卡片可继续编辑，点击右上角叉号并确认可删除文件。工具条上的搜索框按名称筛选当前卡片列表，不匹配时显示空结果提示。再次进入“白板”页时，如果上一块白板的编辑标签仍开着（只是收起过侧边栏或切到过别的页面），会直接回到那块白板；只有主动关闭标签、或该文件已被删除或替换，才会停在白板列表。过大或无法解析的图表显示预览占位内容。桌面端打开白板时右侧编辑列展开为全屏，编辑器可以完整显示自己的左侧形状面板和右侧格式面板；收起侧边栏或退出全屏即可回到白板列表，再点卡片可继续编辑。

新白板只有一个 `.drawio` 文件；旧版 UUID 文件和元数据仍可显示。替换或卸载插件前请备份 `files/` 目录。

## 开发

```sh
npm ci --legacy-peer-deps
npm run typecheck
npm run build
npm test
```

修改源码后须重新构建并提交 `lib/`。`dsh-drawioedit` 在运行时提供编辑器资源。
