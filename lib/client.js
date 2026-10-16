window.__ModuleLoader__.load({
	id: "@guowenzhang/dsh-whiteboard",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region node_modules/@deepseek-ai/dsh-util-workspace-path/lib/index.js
		/**
		* The `dsh-resource://file/…` address grammar: how a file is named across the
		* Sidebar and the resource model, built and parsed without touching a
		* filesystem.
		* @module
		*/
		/** The scheme and type every file address opens with. */
		const FILE_ADDRESS_PREFIX = "dsh-resource://file/";
		/** Component-encode one id or path segment, keeping `:` literal for drive letters. */
		function encodeSegment(segment) {
			return encodeURIComponent(segment).replace(/%3A/gi, ":");
		}
		/** Encode a `/`-separated path segment by segment. */
		function encodePath(path) {
			return path.split("/").map(encodeSegment).join("/");
		}
		/**
		* Build the address of a file read through one Session.
		* @param sessionId - the Session whose Host workspace resolves the path.
		* @param path - absolute or workspace-relative path; backslashes are normalized to `/`, and leading `./` prefixes are dropped.
		* @returns the `dsh-resource://file/session/<sessionId>/<path>` address.
		*/
		function sessionFileAddress(sessionId, path) {
			const normalized = path.replace(/\\/g, "/").replace(/^(?:\.\/)+/, "");
			return `${FILE_ADDRESS_PREFIX}session/${encodeSegment(sessionId)}/${encodePath(normalized)}`;
		}
		/**
		* Browser-safe Workspace path and display helpers.
		* @module @deepseek-ai/dsh-util-workspace-path
		*/
		/** Whether a path uses a Windows drive or UNC prefix. */
		function isWindowsStylePath(value) {
			return /^[A-Za-z]:[/\\]/.test(value) || value.startsWith("\\\\");
		}
		/**
		* Whether a path is absolute in either spelling the Host accepts: POSIX (`/a/b`) or Windows drive or UNC.
		* @param path - the path to classify.
		* @returns `true` for an absolute path; `false` for a Workspace-relative one.
		*/
		function isAbsoluteWorkspacePath(path) {
			return path.startsWith("/") || isWindowsStylePath(path);
		}
		/**
		* The address for a path as a caller holds it: a relative path, or an absolute
		* path inside the Session's workspace, becomes a `session`-scoped address; an
		* absolute path outside it, or one whose workspace root is unknown, keeps its
		* absolute path in that Session's address.
		* @param sessionId - the Session the path is read in.
		* @param cwd - that Session's workspace root, when known.
		* @param path - absolute or workspace-relative path, in either separator spelling.
		* @returns the `dsh-resource://file/…` address.
		*/
		function fileAddressFor(sessionId, cwd, path) {
			const normalized = path.replace(/\\/g, "/");
			if (!isAbsoluteWorkspacePath(normalized)) return sessionFileAddress(sessionId, normalized);
			const root = cwd === void 0 ? "" : cwd.replace(/\\/g, "/").replace(/\/+$/, "");
			if (root !== "" && normalized === root) return sessionFileAddress(sessionId, "");
			if (root !== "" && normalized.startsWith(`${root}/`)) return sessionFileAddress(sessionId, normalized.slice(root.length + 1));
			return sessionFileAddress(sessionId, normalized);
		}
		//#endregion
		//#region src/remote.ts
		const REMOTE_NAMESPACE = "whiteboard";
		const passthrough = { parse: (value) => value };
		function codec(typeSymbol) {
			return {
				mode: "strict",
				typeSymbol,
				schema: passthrough,
				create: () => passthrough
			};
		}
		function descriptor(method) {
			const owner = `@guowenzhang/dsh-whiteboard#${REMOTE_NAMESPACE}/${method}`;
			return {
				id: owner,
				service: REMOTE_NAMESPACE,
				namespace: REMOTE_NAMESPACE,
				method,
				invocation: { kind: "direct" },
				parameters: method === "listBoards" ? [] : [{
					name: "request",
					wire: "request",
					source: "json",
					codec: codec(`${owner}:request`)
				}],
				result: codec(`${owner}:result`)
			};
		}
		const TYPERT_REMOTE = {
			package: "@guowenzhang/dsh-whiteboard",
			descriptors: [
				"listBoards",
				"createBoard",
				"previewBoard",
				"deleteBoard",
				"grantBoardSession"
			].map(descriptor)
		};
		//#endregion
		//#region src/client/locales.ts
		const NS = "whiteboard";
		const zh = {
			nav: "白板",
			title: "白板",
			subtitle: "整理想法、流程和草图。",
			add: "新建白板",
			createTitle: "新建白板",
			createHint: "确认后创建文件，并在 draw.io 中打开。",
			nameLabel: "白板名称",
			defaultNamePrefix: "白板",
			cancel: "取消",
			confirmCreate: "确认创建",
			creating: "正在创建…",
			nameExists: "同名白板已存在，请修改名称。",
			invalidName: "名称不能包含文件路径或无效字符。",
			empty: "还没有白板",
			emptyHint: "创建一块白板，开始绘制。",
			loading: "正在加载白板…",
			refresh: "刷新",
			refreshing: "正在刷新…",
			open: "打开白板",
			modified: "最近修改",
			error: "操作失败",
			retry: "重试",
			search: "搜索白板",
			clearSearch: "清空搜索",
			searchPlaceholder: "搜索白板名称…",
			searchNoResults: "没有匹配的白板",
			searchNoResultsHint: "换一个关键词，或清空搜索查看全部白板。",
			previewLoading: "正在生成预览…",
			previewEmpty: "空白白板",
			previewUnavailable: "无法预览",
			delete: "删除白板",
			deleteTitle: "删除白板",
			deleteHint: "确定删除这块白板吗？删除后无法恢复：",
			confirmDelete: "删除",
			deleting: "正在删除…",
			changed: "白板已被修改，请刷新后重试。",
			editorMissing: "请先安装并启用 dsh-drawioedit 插件。"
		};
		const en = {
			nav: "Whiteboards",
			title: "Whiteboards",
			subtitle: "Map ideas, flows, and sketches.",
			add: "New whiteboard",
			createTitle: "New whiteboard",
			createHint: "Confirm to create the file and open it in draw.io.",
			nameLabel: "Whiteboard name",
			defaultNamePrefix: "Whiteboard",
			cancel: "Cancel",
			confirmCreate: "Create",
			creating: "Creating…",
			nameExists: "A whiteboard with this name already exists.",
			invalidName: "The name contains invalid filename characters.",
			empty: "No whiteboards yet",
			emptyHint: "Create a whiteboard to start drawing.",
			loading: "Loading whiteboards…",
			refresh: "Refresh",
			refreshing: "Refreshing…",
			open: "Open whiteboard",
			modified: "Last edited",
			error: "Operation failed",
			retry: "Retry",
			search: "Search whiteboards",
			clearSearch: "Clear search",
			searchPlaceholder: "Search whiteboard names…",
			searchNoResults: "No matching whiteboards",
			searchNoResultsHint: "Try another keyword, or clear the search to see all whiteboards.",
			previewLoading: "Generating preview…",
			previewEmpty: "Blank whiteboard",
			previewUnavailable: "Preview unavailable",
			delete: "Delete whiteboard",
			deleteTitle: "Delete whiteboard",
			deleteHint: "Delete this whiteboard permanently?",
			confirmDelete: "Delete",
			deleting: "Deleting…",
			changed: "This whiteboard changed. Refresh and try again.",
			editorMissing: "Install and enable the dsh-drawioedit plugin first."
		};
		//#endregion
		//#region src/client/last-board.ts
		const STORAGE_KEY$1 = "dsh.whiteboard.v1.last-board";
		function storage() {
			try {
				return typeof window === "undefined" ? void 0 : window.localStorage;
			} catch {
				return;
			}
		}
		/** The remembered board, or `undefined` when none was recorded or the payload is unusable. */
		function readLastBoard() {
			const store = storage();
			if (!store) return void 0;
			try {
				const raw = store.getItem(STORAGE_KEY$1);
				if (raw === null) return void 0;
				const value = JSON.parse(raw);
				if (typeof value !== "object" || value === null) return void 0;
				const { id, title, updatedAt } = value;
				if (typeof id !== "string" || id === "" || typeof title !== "string" || typeof updatedAt !== "number") return void 0;
				return {
					id,
					title,
					updatedAt
				};
			} catch {
				return;
			}
		}
		/** Remember the board that was just opened, replacing any earlier one. */
		function writeLastBoard(board) {
			const store = storage();
			if (!store) return;
			try {
				store.setItem(STORAGE_KEY$1, JSON.stringify({
					id: board.id,
					title: board.title,
					updatedAt: board.updatedAt
				}));
			} catch {}
		}
		/** Forget the remembered board, so the next visit does not reopen it. */
		function clearLastBoard() {
			const store = storage();
			if (!store) return;
			try {
				store.removeItem(STORAGE_KEY$1);
			} catch {}
		}
		/**
		* The board a returning visit should open: the remembered one, and only while
		* it still exists unchanged in the loaded gallery. A board that was renamed,
		* edited elsewhere, deleted or replaced no longer matches and is left alone.
		*/
		function boardToRestore(boards, last) {
			if (!last) return void 0;
			return boards.find((board) => board.id === last.id && board.title === last.title && board.updatedAt === last.updatedAt);
		}
		//#endregion
		//#region src/client/board-preview-cache.ts
		const KEY_SEPARATOR = "\0";
		/** Cache identity of one board revision. */
		function boardPreviewKey(subject) {
			return `${subject.id}${KEY_SEPARATOR}${subject.updatedAt}`;
		}
		/** Hand the event loop back, so consecutive renders land in separate tasks. */
		function yieldToMainThread() {
			return new Promise((resolve) => {
				setTimeout(resolve, 0);
			});
		}
		/** Create the gallery-wide preview store; one instance lives as long as the plugin. */
		function createBoardPreviewCache(options) {
			const { capacity, load, render } = options;
			const release = options.yieldToMainThread ?? yieldToMainThread;
			const images = /* @__PURE__ */ new Map();
			const pending = /* @__PURE__ */ new Map();
			let renderQueue = Promise.resolve();
			const idOf = (key) => key.slice(0, key.indexOf(KEY_SEPARATOR));
			/** Newest first in iteration order: re-inserting a key refreshes its age. */
			const read = (key) => {
				const image = images.get(key);
				if (image === void 0) return void 0;
				images.delete(key);
				images.set(key, image);
				return image;
			};
			const remember = (key, image) => {
				const id = idOf(key);
				for (const known of [...images.keys()]) if (known !== key && idOf(known) === id) images.delete(known);
				images.delete(key);
				images.set(key, image);
				while (images.size > capacity) {
					const oldest = images.keys().next();
					if (oldest.done) break;
					images.delete(oldest.value);
				}
			};
			const drawInTurn = (source) => {
				const drawn = renderQueue.then(async () => {
					await release();
					return await render(source);
				});
				renderQueue = drawn.then(() => void 0, () => void 0);
				return drawn;
			};
			const preview = (subject) => {
				const key = boardPreviewKey(subject);
				const cached = read(key);
				if (cached !== void 0) return Promise.resolve(cached);
				const running = pending.get(key);
				if (running !== void 0) return running;
				const started = (async () => {
					const source = await load(subject.id);
					const image = source === null ? null : await drawInTurn(source);
					remember(key, image);
					return image;
				})().finally(() => {
					pending.delete(key);
				});
				pending.set(key, started);
				return started;
			};
			return {
				peek: (subject) => read(boardPreviewKey(subject)),
				preview,
				size: () => images.size
			};
		}
		//#endregion
		//#region src/client/preview-renderer.ts
		/**
		* The one entry point to the draw.io renderer.
		*
		* The graphics library behind a preview is the bulk of this plugin's client
		* bundle, so the gallery entry reaches it only through this dynamic import:
		* the build emits it as a separate `client.board-preview.js` chunk that the
		* module loader fetches when the first card actually needs a picture. Reading
		* the source file and parsing its XML cannot be separated from the drawing
		* today — the same module hosts both — but the drawing stays on the main
		* thread, because it builds SVG through the DOM.
		*/
		/** Draw one board source into a self-contained image URL. */
		async function renderBoardPreviewLazily(source) {
			const { renderBoardPreview } = await require.async("./client.board-preview.js");
			return renderBoardPreview(source);
		}
		//#endregion
		//#region src/board-name.ts
		/** Default filename stem shown before a whiteboard is created. */
		function timestampName(date, prefix) {
			const part = (value, width = 2) => String(value).padStart(width, "0");
			return `${prefix}-${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}_${part(date.getHours())}-${part(date.getMinutes())}-${part(date.getSeconds())}-${part(date.getMilliseconds(), 3)}`;
		}
		//#endregion
		//#region src/board-filter.ts
		/**
		* Local title filter for the whiteboard gallery. An empty or whitespace-only
		* query means "no filtering", so the caller can render the full list.
		*/
		function matchesBoard(board, query) {
			const needle = query.trim().toLocaleLowerCase();
			return needle === "" || board.title.toLocaleLowerCase().includes(needle);
		}
		//#endregion
		//#region \0dsh-css:C:\02-codespace\DeepSeek\.agents\worktree\main-183401\dsh-whiteboard\src\client\WhiteboardPanel.module.css.mjs
		const css = ".dTZqvG_page{scrollbar-gutter:stable;width:100%;height:100%;min-height:0;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);font-family:var(--dsw-font-family);font-size:14px;line-height:1.6;overflow:auto}.dTZqvG_inner{box-sizing:border-box;max-width:calc(960px + 2*clamp(24px,4vw,48px));margin:0 auto;padding:28px clamp(24px,4vw,48px) 48px;container:dTZqvG_whiteboard-gallery/inline-size}.dTZqvG_header{justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:24px;display:flex}.dTZqvG_header h1{font:var(--dsw-font-l-20);margin:0}.dTZqvG_header p{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xs-13);margin:4px 0 0}.dTZqvG_page button{font:inherit;cursor:pointer}.dTZqvG_page button:disabled,.dTZqvG_page input:disabled{opacity:.5;cursor:default}.dTZqvG_primary{border-radius:var(--dsw-radius-md);background:var(--dsw-alias-button-primary-fill);height:32px;color:var(--dsw-alias-label-primary-foreground);font:var(--dsw-font-xs-13);white-space:nowrap;border:0;padding:0 12px}.dTZqvG_primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}.dTZqvG_toolbar{border-bottom:.5px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:12px;padding-bottom:12px;display:flex}.dTZqvG_busy{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12);margin-right:auto}.dTZqvG_refresh{border-radius:var(--dsw-radius-md);border:.5px solid var(--dsw-alias-border-l3);height:36px;color:inherit;font:var(--dsw-font-xs-13);background:0 0;padding:0 12px}.dTZqvG_refresh:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.dTZqvG_searchBox{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-base);height:36px;transition:border-color var(--ds-transition-duration) var(--ds-ease-in-out);flex:none;align-items:center;gap:6px;padding:0 4px 0 10px;display:flex}.dTZqvG_searchBox:focus-within{border-color:var(--dsw-alias-state-business-primary)}.dTZqvG_searchBox input{width:clamp(140px,22vw,260px);min-width:0;color:inherit;font:var(--dsw-font-xs-13);background:0 0;border:0;outline:0;padding:0}.dTZqvG_searchBox input::placeholder{color:var(--dsw-alias-label-tertiary)}.dTZqvG_searchClear{corner-shape:round;width:20px;height:20px;color:var(--dsw-alias-label-tertiary);background:0 0;border:0;border-radius:50%;flex:none;padding:0;font-size:16px;line-height:1}.dTZqvG_searchClear:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.dTZqvG_srOnly{clip-path:inset(50%);white-space:nowrap;border:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}.dTZqvG_empty{text-align:center;color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-s-14);flex-direction:column;align-items:center;gap:8px;padding:70px 16px;display:flex}.dTZqvG_empty strong{color:var(--dsw-alias-label-primary)}.dTZqvG_grid{grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;margin:18px 0 0;padding:0;list-style:none;display:grid}.dTZqvG_card{box-sizing:border-box;min-width:0;min-height:264px;position:relative}.dTZqvG_skeletonCard{box-sizing:border-box;border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-bg-skeleton);min-height:264px}.dTZqvG_cardOpen{text-align:left;width:100%;height:100%;min-height:264px;color:inherit;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-bg-base);transition:border-color var(--ds-transition-duration) var(--ds-ease-in-out), transform var(--ds-transition-duration) var(--ds-ease-in-out);flex-direction:column;gap:12px;padding:16px;display:flex}.dTZqvG_cardOpen:hover:not(:disabled){border-color:var(--dsw-alias-border-l3);transform:translateY(-2px)}.dTZqvG_cardTitle{text-overflow:ellipsis;white-space:nowrap;font:var(--dsw-font-s-14);padding-right:32px;font-weight:500;display:block;overflow:hidden}.dTZqvG_preview{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-1);place-items:center;width:100%;height:160px;display:grid;overflow:hidden}.dTZqvG_preview img{object-fit:contain;width:auto;max-width:100%;height:auto;max-height:100%;display:block}.dTZqvG_previewStatus{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12)}.dTZqvG_cardFooter{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12);margin-top:auto;display:block}.dTZqvG_deleteMark{z-index:1;border-radius:var(--dsw-radius-sm);width:28px;height:28px;color:var(--dsw-alias-label-tertiary);background:0 0;border:0;place-items:center;padding:0;display:grid;position:absolute;top:12px;right:12px}.dTZqvG_deleteMark:hover:not(:disabled),.dTZqvG_deleteMark:focus-visible{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary)}.dTZqvG_deleteMark svg{width:17px;height:17px}.dTZqvG_error{border-radius:var(--dsw-radius-sm);color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover-danger);font:var(--dsw-font-xs-13);flex-wrap:wrap;align-items:center;gap:8px;margin-top:16px;padding:12px;display:flex}.dTZqvG_error button{color:inherit;font:inherit;background:0 0;border:0;text-decoration:underline}.dTZqvG_backdrop{z-index:1000;background:var(--dsw-alias-bg-mask-1);backdrop-filter:var(--dsw-mask-blur);place-items:center;padding:20px;display:grid;position:fixed;inset:0}.dTZqvG_dialog{box-sizing:border-box;border-radius:var(--dsw-radius-panel);background:var(--dsw-alias-bg-layer-2);width:min(100%,440px);box-shadow:var(--dsw-elevation-panel);animation:dTZqvG_whiteboardDialogEnter var(--ds-transition-duration) var(--ds-ease-in-out);border:0;padding:24px}@keyframes dTZqvG_whiteboardDialogEnter{0%{opacity:0}to{opacity:1}}.dTZqvG_dialog h2{font:var(--dsw-font-l-20);margin:0}.dTZqvG_dialog p{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);margin:8px 0 20px}.dTZqvG_dialog label{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);margin-bottom:8px;font-weight:500;display:block}.dTZqvG_nameField{border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-base);align-items:center;min-width:0;display:flex}.dTZqvG_nameField:focus-within{border-color:var(--dsw-alias-state-business-primary)}.dTZqvG_nameField input{min-width:0;color:inherit;background:0 0;border:0;outline:0;flex:1;padding:9px 10px}.dTZqvG_nameField span{color:var(--dsw-alias-label-tertiary);padding:0 10px}.dTZqvG_dialog .dTZqvG_nameError{color:var(--dsw-alias-state-error-primary);font:var(--dsw-font-xxs-12);margin:8px 0 0}.dTZqvG_dialogActions{justify-content:flex-end;gap:8px;margin-top:24px;display:flex}.dTZqvG_cancel{border-radius:var(--dsw-radius-md);border:.5px solid var(--dsw-alias-border-l3);height:32px;color:inherit;font:var(--dsw-font-xs-13);background:0 0;padding:0 12px}.dTZqvG_cancel:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.dTZqvG_danger{border-radius:var(--dsw-radius-md);background:var(--dsw-alias-state-error-primary);height:32px;color:var(--dsw-alias-label-primary-foreground);font:var(--dsw-font-xs-13);border:0;padding:0 12px}.dTZqvG_danger:hover:not(:disabled){opacity:.86}.dTZqvG_page button:focus-visible,.dTZqvG_searchBox input:focus-visible,.dTZqvG_nameField input:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}@container dTZqvG_whiteboard-gallery (width<=760px){.dTZqvG_header{flex-direction:column;align-items:stretch}.dTZqvG_header .dTZqvG_primary{align-self:flex-start}.dTZqvG_toolbar{flex-wrap:wrap}.dTZqvG_searchBox{flex:1;min-width:0}.dTZqvG_searchBox input{width:100%}.dTZqvG_grid{grid-template-columns:1fr}.dTZqvG_card{width:100%}}@media (pointer:coarse){.dTZqvG_primary,.dTZqvG_refresh,.dTZqvG_cancel,.dTZqvG_danger{min-height:44px}.dTZqvG_deleteMark{width:44px;height:44px}.dTZqvG_searchBox{height:44px}.dTZqvG_searchClear{width:44px;height:44px}.dTZqvG_searchBox input,.dTZqvG_nameField input{font-size:16px;line-height:24px}}@media (prefers-reduced-motion:reduce){.dTZqvG_cardOpen{transition:none}.dTZqvG_cardOpen:hover:not(:disabled){transform:none}.dTZqvG_searchBox{transition:none}.dTZqvG_dialog{animation:none}}";
		const tagId = "@guowenzhang/dsh-whiteboard/WhiteboardPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var WhiteboardPanel_module_css_default = {
			"backdrop": "dTZqvG_backdrop",
			"busy": "dTZqvG_busy",
			"cancel": "dTZqvG_cancel",
			"card": "dTZqvG_card",
			"cardFooter": "dTZqvG_cardFooter",
			"cardOpen": "dTZqvG_cardOpen",
			"cardTitle": "dTZqvG_cardTitle",
			"danger": "dTZqvG_danger",
			"deleteMark": "dTZqvG_deleteMark",
			"dialog": "dTZqvG_dialog",
			"dialogActions": "dTZqvG_dialogActions",
			"empty": "dTZqvG_empty",
			"error": "dTZqvG_error",
			"grid": "dTZqvG_grid",
			"header": "dTZqvG_header",
			"inner": "dTZqvG_inner",
			"nameError": "dTZqvG_nameError",
			"nameField": "dTZqvG_nameField",
			"page": "dTZqvG_page",
			"preview": "dTZqvG_preview",
			"previewStatus": "dTZqvG_previewStatus",
			"primary": "dTZqvG_primary",
			"refresh": "dTZqvG_refresh",
			"searchBox": "dTZqvG_searchBox",
			"searchClear": "dTZqvG_searchClear",
			"skeletonCard": "dTZqvG_skeletonCard",
			"srOnly": "dTZqvG_srOnly",
			"toolbar": "dTZqvG_toolbar",
			"whiteboard-gallery": "dTZqvG_whiteboard-gallery",
			"whiteboardDialogEnter": "dTZqvG_whiteboardDialogEnter"
		};
		//#endregion
		//#region src/client/WhiteboardPanel.tsx
		function message(error) {
			return error instanceof Error ? error.message : String(error);
		}
		function when(timestamp) {
			return new Intl.DateTimeFormat(void 0, {
				dateStyle: "medium",
				timeStyle: "short"
			}).format(timestamp);
		}
		/** `undefined` is an uncached revision; `null` is a board with nothing to draw. */
		function previewState(image) {
			if (image === void 0) return { kind: "loading" };
			return image === null ? { kind: "empty" } : {
				kind: "image",
				url: image
			};
		}
		function BoardPreview({ board, cached, load, t }) {
			const element = (0, react.useRef)(null);
			const [visible, setVisible] = (0, react.useState)(false);
			const [state, setState] = (0, react.useState)(() => previewState(cached(board)));
			(0, react.useEffect)(() => {
				const target = element.current;
				if (!target || typeof IntersectionObserver === "undefined") {
					setVisible(true);
					return;
				}
				const observer = new IntersectionObserver((entries) => {
					if (!entries.some((entry) => entry.isIntersecting)) return;
					setVisible(true);
					observer.disconnect();
				});
				observer.observe(target);
				return () => observer.disconnect();
			}, []);
			(0, react.useEffect)(() => {
				if (!visible) return;
				const known = cached(board);
				if (known !== void 0) {
					setState(previewState(known));
					return;
				}
				let active = true;
				setState({ kind: "loading" });
				load(board).then((image) => {
					if (active) setState(previewState(image));
				}).catch(() => {
					if (active) setState({ kind: "unavailable" });
				});
				return () => {
					active = false;
				};
			}, [
				board.id,
				board.updatedAt,
				cached,
				load,
				visible
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				ref: element,
				className: WhiteboardPanel_module_css_default.preview,
				"aria-hidden": "true",
				children: state.kind === "image" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
					src: state.url,
					alt: ""
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: WhiteboardPanel_module_css_default.previewStatus,
					"data-kind": state.kind,
					children: t(state.kind === "empty" ? "previewEmpty" : state.kind === "unavailable" ? "previewUnavailable" : "previewLoading")
				})
			});
		}
		function BoardList({ boards, shown, busy, refreshing, t, cached, load, onOpen, onDelete, onCreate, onClearSearch }) {
			if (boards.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: WhiteboardPanel_module_css_default.empty,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("empty") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("emptyHint") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: WhiteboardPanel_module_css_default.primary,
						disabled: busy,
						onClick: onCreate,
						children: t("add")
					})
				]
			});
			if (shown.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: WhiteboardPanel_module_css_default.empty,
				role: "status",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("searchNoResults") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("searchNoResultsHint") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: WhiteboardPanel_module_css_default.cancel,
						onClick: onClearSearch,
						children: t("clearSearch")
					})
				]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
				className: WhiteboardPanel_module_css_default.grid,
				"aria-busy": refreshing,
				children: shown.map((board) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
					className: WhiteboardPanel_module_css_default.card,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: WhiteboardPanel_module_css_default.cardOpen,
						onClick: () => onOpen(board),
						disabled: busy,
						"aria-label": `${t("open")}: ${board.title}`,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
								className: WhiteboardPanel_module_css_default.cardTitle,
								children: board.title
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BoardPreview, {
								board,
								cached,
								load,
								t
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: WhiteboardPanel_module_css_default.cardFooter,
								children: [
									t("modified"),
									": ",
									when(board.updatedAt)
								]
							})
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: WhiteboardPanel_module_css_default.deleteMark,
						disabled: busy,
						onClick: () => onDelete(board),
						"aria-label": `${t("delete")}: ${board.title}`,
						title: t("delete"),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
							viewBox: "0 0 20 20",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "1.8",
							strokeLinecap: "round",
							"aria-hidden": "true",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 5l10 10M15 5 5 15" })
						})
					})]
				}, board.id))
			});
		}
		/** First screen: the grid's own geometry, so the cards land where the bones were. */
		function BoardSkeleton({ t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				role: "status",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: WhiteboardPanel_module_css_default.srOnly,
					children: t("loading")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
					className: WhiteboardPanel_module_css_default.grid,
					"aria-hidden": "true",
					children: [
						0,
						1,
						2,
						3,
						4,
						5
					].map((index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", {
						className: WhiteboardPanel_module_css_default.card,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: WhiteboardPanel_module_css_default.skeletonCard })
					}, index))
				})]
			});
		}
		function WhiteboardPanel({ list, create, previewImage, cachedPreviewImage, remove, open, restore, t }) {
			const [boards, setBoards] = (0, react.useState)([]);
			const [loaded, setLoaded] = (0, react.useState)(false);
			const [refreshing, setRefreshing] = (0, react.useState)(false);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const [createOpen, setCreateOpen] = (0, react.useState)(false);
			const [name, setName] = (0, react.useState)("");
			const [nameError, setNameError] = (0, react.useState)("");
			const [pendingDelete, setPendingDelete] = (0, react.useState)(null);
			const [query, setQuery] = (0, react.useState)("");
			const generation = (0, react.useRef)(0);
			/** Whether this mount already tried to return to the board that was open. */
			const restored = (0, react.useRef)(false);
			const shown = (0, react.useMemo)(() => boards.filter((board) => matchesBoard(board, query)), [boards, query]);
			const refresh = (0, react.useCallback)(async () => {
				const current = ++generation.current;
				setError("");
				setRefreshing(true);
				try {
					const rows = await list();
					if (generation.current === current) setBoards(rows);
				} catch (failure) {
					if (generation.current === current) setError(message(failure));
				} finally {
					if (generation.current === current) {
						setRefreshing(false);
						setLoaded(true);
					}
				}
			}, [list]);
			(0, react.useEffect)(() => {
				refresh();
				return () => {
					generation.current++;
				};
			}, [refresh]);
			(0, react.useEffect)(() => {
				if (restored.current || !loaded) return;
				restored.current = true;
				restore().catch(() => {});
			}, [loaded, restore]);
			const showCreate = () => {
				setName(timestampName(/* @__PURE__ */ new Date(), t("defaultNamePrefix")));
				setNameError("");
				setCreateOpen(true);
			};
			const createNew = async (event) => {
				event.preventDefault();
				if (busy || !name.trim()) return;
				setBusy(true);
				setError("");
				setNameError("");
				let board;
				try {
					board = await create(name);
				} catch (failure) {
					const detail = message(failure);
					if (detail.includes("WHITEBOARD_NAME_EXISTS")) setNameError(t("nameExists"));
					else if (detail.includes("WHITEBOARD_INVALID_NAME")) setNameError(t("invalidName"));
					else setNameError(detail);
					setBusy(false);
					return;
				}
				setBoards((rows) => [board, ...rows]);
				setCreateOpen(false);
				try {
					await open(board);
				} catch (failure) {
					setError(message(failure));
				} finally {
					setBusy(false);
				}
			};
			const openBoard = async (board) => {
				if (busy) return;
				setBusy(true);
				setError("");
				try {
					await open(board);
				} catch (failure) {
					setError(message(failure));
				} finally {
					setBusy(false);
				}
			};
			const deleteBoard = async () => {
				if (busy || !pendingDelete) return;
				const board = pendingDelete;
				setBusy(true);
				setError("");
				try {
					await remove(board.id, board.updatedAt);
					setBoards((rows) => rows.filter((row) => row.id !== board.id));
					setPendingDelete(null);
				} catch (failure) {
					setPendingDelete(null);
					if (message(failure).includes("WHITEBOARD_MODIFIED")) {
						await refresh();
						setError(t("changed"));
					} else setError(message(failure));
				} finally {
					setBusy(false);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("main", {
				className: WhiteboardPanel_module_css_default.page,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WhiteboardPanel_module_css_default.inner,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
								className: WhiteboardPanel_module_css_default.header,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", { children: t("title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("subtitle") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: WhiteboardPanel_module_css_default.primary,
									disabled: busy,
									onClick: showCreate,
									children: t("add")
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: WhiteboardPanel_module_css_default.toolbar,
								children: [
									refreshing && loaded && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: WhiteboardPanel_module_css_default.busy,
										role: "status",
										children: t("refreshing")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: WhiteboardPanel_module_css_default.searchBox,
										role: "search",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "search",
											value: query,
											maxLength: 100,
											disabled: !loaded,
											placeholder: t("searchPlaceholder"),
											"aria-label": t("searchPlaceholder"),
											onChange: (event) => setQuery(event.target.value),
											onKeyDown: (event) => {
												if (event.key === "Escape" && query !== "") {
													event.stopPropagation();
													setQuery("");
												}
											}
										}), query !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: WhiteboardPanel_module_css_default.searchClear,
											title: t("clearSearch"),
											"aria-label": t("clearSearch"),
											onClick: () => setQuery(""),
											children: "×"
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: WhiteboardPanel_module_css_default.refresh,
										onClick: () => void refresh(),
										disabled: refreshing || busy,
										children: t("refresh")
									})
								]
							}),
							error && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: WhiteboardPanel_module_css_default.error,
								role: "alert",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
										t("error"),
										": ",
										error
									] }),
									" ",
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => void refresh(),
										children: t("retry")
									})
								]
							}),
							loaded ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								"aria-live": "polite",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BoardList, {
									boards,
									shown,
									busy,
									refreshing,
									t,
									cached: cachedPreviewImage,
									load: previewImage,
									onOpen: (board) => void openBoard(board),
									onDelete: setPendingDelete,
									onCreate: showCreate,
									onClearSearch: () => setQuery("")
								})
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BoardSkeleton, { t })
						]
					}),
					createOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: WhiteboardPanel_module_css_default.backdrop,
						role: "presentation",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: WhiteboardPanel_module_css_default.dialog,
							role: "dialog",
							"aria-modal": "true",
							"aria-labelledby": "whiteboard-create-title",
							onKeyDown: (event) => {
								if (event.key === "Escape" && !busy) setCreateOpen(false);
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
									id: "whiteboard-create-title",
									children: t("createTitle")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("createHint") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
									onSubmit: (event) => void createNew(event),
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
											htmlFor: "whiteboard-create-name",
											children: t("nameLabel")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: WhiteboardPanel_module_css_default.nameField,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												id: "whiteboard-create-name",
												autoFocus: true,
												required: true,
												maxLength: 100,
												value: name,
												"aria-invalid": Boolean(nameError),
												onChange: (event) => {
													setName(event.target.value);
													setNameError("");
												}
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: ".drawio" })]
										}),
										nameError && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: WhiteboardPanel_module_css_default.nameError,
											role: "alert",
											children: nameError
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: WhiteboardPanel_module_css_default.dialogActions,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: WhiteboardPanel_module_css_default.cancel,
												disabled: busy,
												onClick: () => setCreateOpen(false),
												children: t("cancel")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "submit",
												className: WhiteboardPanel_module_css_default.primary,
												disabled: busy || !name.trim(),
												children: busy ? t("creating") : t("confirmCreate")
											})]
										})
									]
								})
							]
						})
					}),
					pendingDelete && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: WhiteboardPanel_module_css_default.backdrop,
						role: "presentation",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: WhiteboardPanel_module_css_default.dialog,
							role: "dialog",
							"aria-modal": "true",
							"aria-labelledby": "whiteboard-delete-title",
							onKeyDown: (event) => {
								if (event.key === "Escape" && !busy) setPendingDelete(null);
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
									id: "whiteboard-delete-title",
									children: t("deleteTitle")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", { children: [
									t("deleteHint"),
									" ",
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: pendingDelete.title })
								] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: WhiteboardPanel_module_css_default.dialogActions,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: WhiteboardPanel_module_css_default.cancel,
										disabled: busy,
										onClick: () => setPendingDelete(null),
										children: t("cancel")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: WhiteboardPanel_module_css_default.danger,
										disabled: busy,
										onClick: () => void deleteBoard(),
										children: busy ? t("deleting") : t("confirmDelete")
									})]
								})
							]
						})
					})
				]
			});
		}
		//#endregion
		//#region src/client/board-session.ts
		const STORAGE_KEY = "dsh.whiteboard.v1.session";
		/** The dedicated editor Session survives reloads; it is not a chat destination. */
		function readBoardSession() {
			try {
				return window.localStorage?.getItem(STORAGE_KEY) || void 0;
			} catch {
				return;
			}
		}
		function writeBoardSession(sessionId) {
			try {
				window.localStorage?.setItem(STORAGE_KEY, sessionId);
			} catch {}
		}
		/**
		* Replace only a known whiteboard Session's central occupant, not its navigation
		* or rightbar binding. Selecting the global whiteboard panel here would hide the
		* rightbar: the Host only exposes it while the Conversation main key is selected.
		* The normal Conversation registration stays installed underneath this shadow.
		*/
		function installBoardSessionPanel(ctx, owned, face) {
			let reconcile = () => {};
			ctx.slots.inject("main", () => {
				let release;
				reconcile = () => {
					const sessionId = ctx.sidebarRight.mounted.getSnapshot();
					const showList = sessionId !== void 0 && owned(sessionId);
					if (showList && !release) release = ctx.slots.register({
						name: "main",
						key: "conversation",
						priority: -1,
						locale: NS,
						inject: () => ({
							...face,
							restore: async () => "none"
						})
					}, WhiteboardPanel);
					else if (!showList && release) {
						release();
						release = void 0;
					}
				};
				const unsubscribe = ctx.sidebarRight.mounted.subscribe(() => reconcile());
				reconcile();
				return () => {
					unsubscribe();
					release?.();
					reconcile = () => {};
				};
			});
			return () => reconcile();
		}
		//#endregion
		//#region src/client/index.tsx
		/**
		* Rendered previews kept for the lifetime of the plugin. The gallery mounts and
		* unmounts with the main panel, so the store has to outlive a mount to stop a
		* return to the page from regenerating every picture.
		*/
		const PREVIEW_CACHE_CAPACITY = 24;
		async function unwrap(call) {
			const result = await call;
			if (!result.ok) throw new Error(result.error.message);
			return result.value;
		}
		function BoardIcon({ size }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 20 20",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.7",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "2.5",
					y: "3",
					width: "15",
					height: "14",
					rx: "2"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m5 13 3.2-3.2 2.2 2.2 3.8-4M5 6.5h3" })]
			});
		}
		const inject = [
			"slots",
			"locale",
			"remote",
			"sessions",
			"uiWorkspace",
			"sidebarRight",
			"sidebarRightTabs"
		];
		async function apply(ctx) {
			const off = await ctx.remote.$mount(TYPERT_REMOTE);
			ctx.effect(() => () => off(), "whiteboard: remote mount");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "whiteboard: dictionaries");
			const t = ctx.locale.bind(NS);
			const remote = () => {
				const service = ctx.get(`remote.${REMOTE_NAMESPACE}`);
				if (!service) throw new Error("Whiteboard service is unavailable");
				return service;
			};
			const sessions = ctx.sessions;
			const previews = createBoardPreviewCache({
				capacity: PREVIEW_CACHE_CAPACITY,
				load: (id) => unwrap(remote().previewBoard({ id })),
				render: renderBoardPreviewLazily
			});
			let lastSessionId = readBoardSession();
			let syncBoardPanel = () => {};
			/** The drawio editor tab open for the mounted session: the active tab or a background one. */
			const openEditorTab = (sessionId) => {
				const known = ctx.sidebarRight.openTabs.getSnapshot().find((tab) => tab.sessionId === sessionId && tab.kind === "drawio-edit");
				if (known) return { tabId: known.tabId };
				return ctx.sidebarRight.active()?.kind === "drawio-edit" ? {} : void 0;
			};
			const face = {
				list: () => unwrap(remote().listBoards()),
				previewImage: (board) => previews.preview(board),
				cachedPreviewImage: (board) => previews.peek(board),
				remove: (id, expectedUpdatedAt) => unwrap(remote().deleteBoard({
					id,
					expectedUpdatedAt
				})),
				create: async (name) => {
					if (!ctx.sidebarRightTabs.get("drawio-edit")) throw new Error(t("editorMissing"));
					const board = await unwrap(remote().createBoard({ name }));
					writeLastBoard(board);
					return board;
				},
				open: async (board) => {
					if (!ctx.sidebarRightTabs.get("drawio-edit")) throw new Error(t("editorMissing"));
					const catalog = sessions.list.getSnapshot().byId;
					const reusableId = lastSessionId && catalog[lastSessionId]?.cwd === board.directory ? lastSessionId : void 0;
					const sessionId = await sessions.create({
						cwd: board.directory,
						...reusableId ? { sessionId: reusableId } : {}
					});
					await unwrap(remote().grantBoardSession({ sessionId }));
					lastSessionId = sessionId;
					writeBoardSession(sessionId);
					syncBoardPanel();
					writeLastBoard(board);
					if (ctx.sidebarRight.mounted.getSnapshot() !== sessionId) {
						ctx.uiWorkspace.openSession(sessionId);
						await waitForSidebar(ctx, sessionId).catch(() => {});
					}
					ctx.sidebarRight.openResource(fileAddressFor(sessionId, board.directory, board.path), { kind: "drawio-edit" });
					const panel = typeof document === "undefined" ? void 0 : [...document.querySelectorAll("[data-sidebar-right-panel]")].find((element) => element.dataset.sidebarRightSession === sessionId);
					if (window.innerWidth >= 768 && panel?.dataset.sidebarRightPanel !== "fullscreen") {
						const target = ctx.sidebarRight.commandTarget(null);
						if (target) ctx.sidebarRight.toggleFullscreen(target);
					}
				},
				restore: async () => {
					if (!ctx.sidebarRightTabs.get("drawio-edit")) throw new Error(t("editorMissing"));
					const sessionId = ctx.sidebarRight.mounted.getSnapshot();
					if (sessionId === void 0) return "none";
					const open = openEditorTab(sessionId);
					if (open) {
						if (open.tabId !== void 0) ctx.sidebarRight.focus(open.tabId);
						return "focused";
					}
					const board = boardToRestore(await unwrap(remote().listBoards()), readLastBoard());
					if (!board) return "none";
					await face.open(board);
					return "reopened";
				}
			};
			syncBoardPanel = installBoardSessionPanel(ctx, (id) => id === lastSessionId, face);
			ctx.slots.inject("main", () => ctx.slots.register({
				name: "main",
				key: "whiteboard",
				locale: NS,
				inject: () => face
			}, WhiteboardPanel));
			ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
				name: "sidebar.panellist",
				id: "whiteboard",
				order: 26,
				label: () => t("nav")
			}, BoardIcon));
			ctx.effect(() => ctx.sidebarRight.registerCloseHandler("drawio-edit", (_sessionId, tab) => {
				if (tab.kind === "drawio-edit") clearLastBoard();
			}), "whiteboard: forget a closed board");
		}
		function waitForSidebar(ctx, sessionId) {
			if (ctx.sidebarRight.mounted.getSnapshot() === sessionId) return Promise.resolve();
			return new Promise((resolve, reject) => {
				const timeout = window.setTimeout(() => {
					unsubscribe();
					reject(/* @__PURE__ */ new Error("The editor sidebar did not become available"));
				}, 5e3);
				const unsubscribe = ctx.sidebarRight.mounted.subscribe(() => {
					if (ctx.sidebarRight.mounted.getSnapshot() !== sessionId) return;
					window.clearTimeout(timeout);
					unsubscribe();
					resolve();
				});
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
