# dsh-whiteboard

[English](README.md) | 中文

## 为什么做这个插件

我在思考时，经常需要一个地方记录草稿，以前一般会写在文档里。现在全面使用 AI 工具，就把这个空间直接集成到了 DeepSeek Harness 中。白板比文档更灵活，适合随手记录想法、梳理流程；采用开放的 `.drawio` 文件格式，也方便在 draw.io 等兼容工具中继续编辑。

插件列表的显示名称与介绍支持英文和中文，随 Harness 语言设置显示，英文为默认回退；英文名称为去掉 npm scope 的原包名，中文名称说明用途，安装仍使用不变的真实包名。

## 截图

![白板列表与名称搜索](docs/images/gallery.png)

![新建白板](docs/images/new-board.png)

![白板编辑器](docs/images/editor.png)

编辑器截图来自旧版；当前版本在编辑器旁保留白板列表。

## 安装

先安装编辑器依赖，再安装白板插件：

```sh
npx @deepseek-ai/dsh plugin --profile web add @guowenzhang/dsh-drawioedit
npx @deepseek-ai/dsh plugin --profile web add @guowenzhang/dsh-whiteboard
```

重启 DSH Web，打开左侧“白板”，点击“新建白板”并确认名称即可开始；点击已有卡片可继续编辑。

## 注意事项

- 绘图内容由编辑器自动保存，无需手动保存。
- 白板保存在插件的 `files/` 目录，不在当前工作区；更新、替换或卸载插件前请备份该目录。
- 删除白板会删除对应文件，请确认后再操作。

## 许可

[Apache-2.0](LICENSE)，第三方组件声明见 [NOTICE](NOTICE)。
