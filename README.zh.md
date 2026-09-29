# dsh-whiteboard

DeepSeek Harness Web 白板插件，在主面板显示白板卡片，并通过 drawioedit 在右侧侧边栏全屏编辑。图文件保存在本插件的 `files/` 目录；无需选择工作区。白板为该目录创建专用会话并授予写入权限。

## 安装

先安装并启用 [`@guowenzhang/dsh-drawioedit`](../dsh-drawioedit)，再安装本插件：

```sh
npx @deepseek-ai/dsh plugin --profile web add @guowenzhang/dsh-drawioedit
npx @deepseek-ai/dsh plugin --profile web add /absolute/path/to/dsh-whiteboard
```

重启 DSH Web 后，打开左侧导航中的“白板”。点击“新建白板”会先显示命名对话框，默认填入时间名称，可直接修改；只有点击“确认创建”才会在插件 `files/` 目录创建 `.drawio` 文件并交给 drawioedit 打开。绘图内容由 drawioedit 自动保存。卡片显示名称、第一页缩略图和最近修改时间；点击卡片可继续编辑，点击右上角叉号并确认可删除文件。过大或无法解析的图表显示预览占位内容。桌面端会将右侧侧边栏展开为全屏，窄屏由侧边栏自动全屏。

新白板只有一个 `.drawio` 文件；旧版 UUID 文件和元数据仍可显示。替换或卸载插件前请备份 `files/` 目录。

## 开发

```sh
npm ci --legacy-peer-deps
npm run typecheck
npm run build
npm test
```

修改源码后须重新构建并提交 `lib/`。`dsh-drawioedit` 在运行时提供编辑器资源。
