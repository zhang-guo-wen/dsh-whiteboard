# dsh-whiteboard

A DeepSeek Harness Web plugin: the main panel keeps the whiteboard card gallery while drawioedit edits the selected board in the right Sidebar, so the list and the editor stay side by side. Diagrams live in this plugin's `files/` directory; no workspace selection is needed. A dedicated session grants write access to this directory.

## Install

Install and enable [`@guowenzhang/dsh-drawioedit`](../dsh-drawioedit) first, then this plugin:

```sh
npx @deepseek-ai/dsh plugin --profile web add @guowenzhang/dsh-drawioedit
npx @deepseek-ai/dsh plugin --profile web add @guowenzhang/dsh-whiteboard
```

From the npm registry: <https://www.npmjs.com/package/@guowenzhang/dsh-whiteboard> — restart the host afterwards; local checkouts, git sources and troubleshooting are in [AGENTS.md](AGENTS.md).

Restart DSH Web and open **Whiteboards** in the left navigation. **New whiteboard** first opens a dialog with an editable timestamp-based name. Only **Create** writes the `.drawio` file under the plugin's `files/` directory and opens it in drawioedit. Drawioedit autosaves changes. Each card shows its name, a first-page preview, and last modification time. Click the card to edit, or click the top-right X and confirm to delete the file. The persistent search box in the toolbar filters the loaded cards by name and shows an empty-result hint when nothing matches. Returning to the **Whiteboards** page goes straight back to the board whose editor tab is still open — collapsing the Sidebar or switching pages keeps it — and only an explicit tab close, a deleted board or a replaced file leaves you on the gallery. Oversized or unreadable diagrams show a preview placeholder. On desktop, opening a board expands the editor column to fullscreen so draw.io can show its own left shapes palette and right format panel; collapse the Sidebar or leave fullscreen to get back to the gallery and click a card to continue editing.

New whiteboards have a single `.drawio` file. Legacy UUID files and their sidecars remain visible. Back up `files/` before replacing or uninstalling the plugin.

## Development

```sh
npm ci --legacy-peer-deps
npm run typecheck
npm run build
npm test
```

Commit the generated `lib/` with source changes. `dsh-drawioedit` supplies the editor assets at runtime.
