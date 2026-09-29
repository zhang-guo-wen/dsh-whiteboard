# dsh-whiteboard

A DeepSeek Harness Web plugin with a whiteboard card gallery and fullscreen editing through drawioedit in the right Sidebar. Diagrams live in this plugin's `files/` directory; no workspace selection is needed. A dedicated session grants write access to this directory.

## Install

Install and enable [`@guowenzhang/dsh-drawioedit`](../dsh-drawioedit) first, then this plugin:

```sh
npx @deepseek-ai/dsh plugin --profile web add @guowenzhang/dsh-drawioedit
npx @deepseek-ai/dsh plugin --profile web add /absolute/path/to/dsh-whiteboard
```

Restart DSH Web and open **Whiteboards** in the left navigation. **New whiteboard** first opens a dialog with an editable timestamp-based name. Only **Create** writes the `.drawio` file under the plugin's `files/` directory and opens it in drawioedit. Drawioedit autosaves changes. Each card shows its name, a first-page preview, and last modification time. Click the card to edit, or click the top-right X and confirm to delete the file. Oversized or unreadable diagrams show a preview placeholder. On desktop the right Sidebar expands to fullscreen; narrow screens use its automatic fullscreen mode.

New whiteboards have a single `.drawio` file. Legacy UUID files and their sidecars remain visible. Back up `files/` before replacing or uninstalling the plugin.

## Development

```sh
npm ci --legacy-peer-deps
npm run typecheck
npm run build
npm test
```

Commit the generated `lib/` with source changes. `dsh-drawioedit` supplies the editor assets at runtime.
