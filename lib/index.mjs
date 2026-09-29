import { fileURLToPath } from "node:url";
import { lstat, mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { setSandboxMode } from "@deepseek-ai/dsh-sandbox-policy";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
//#region src/board-name.ts
/** Validate a single filename stem. The extension is managed by the plugin. */
function normalizeBoardName(value) {
	if (typeof value !== "string") throw new Error("WHITEBOARD_INVALID_NAME");
	const name = value.trim().replace(/\.drawio$/iu, "");
	if (!name || name.length > 100 || /[<>:"/\\|?*\x00-\x1f]/u.test(name) || /[. ]$/u.test(name) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/iu.test(name)) throw new Error("WHITEBOARD_INVALID_NAME");
	return name;
}
//#endregion
//#region src/boards.ts
const BLANK_BOARD = "<mxGraphModel dx=\"900\" dy=\"600\" grid=\"1\" gridSize=\"10\" guides=\"1\" tooltips=\"1\" connect=\"1\" arrows=\"1\" fold=\"1\" page=\"1\" pageScale=\"1\" pageWidth=\"850\" pageHeight=\"1100\"><root><mxCell id=\"0\"/><mxCell id=\"1\" parent=\"0\"/></root></mxGraphModel>";
function titleOf(name) {
	return name.slice(0, -7);
}
function boardId(value) {
	if (typeof value !== "string" || !value.toLowerCase().endsWith(".drawio") || value.length <= 7 || value.length > 255 || /[<>:"/\\|?*\x00-\x1f]/u.test(value)) throw new Error("WHITEBOARD_INVALID_ID");
	return value;
}
var BoardStore = class {
	directory;
	constructor(directory) {
		this.directory = directory;
	}
	async list() {
		await mkdir(this.directory, { recursive: true });
		const files = (await readdir(this.directory, { withFileTypes: true })).filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".drawio"));
		return (await Promise.all(files.map(async (entry) => {
			const info = await stat(join(this.directory, entry.name));
			let title = titleOf(entry.name);
			if (/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\.drawio$/iu.test(entry.name)) try {
				const metadata = JSON.parse(await readFile(join(this.directory, `${title}.json`), "utf8"));
				if (typeof metadata === "object" && metadata !== null && typeof metadata.title === "string") title = metadata.title;
			} catch {}
			return {
				id: entry.name,
				title,
				path: join(this.directory, entry.name),
				directory: this.directory,
				updatedAt: info.mtimeMs
			};
		}))).sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id));
	}
	async create(value) {
		await mkdir(this.directory, { recursive: true });
		const name = `${normalizeBoardName(value)}.drawio`;
		const path = join(this.directory, name);
		try {
			await writeFile(path, BLANK_BOARD, { flag: "wx" });
		} catch (error) {
			if (error.code === "EEXIST") throw new Error("WHITEBOARD_NAME_EXISTS");
			throw error;
		}
		const info = await stat(path);
		return {
			id: name,
			title: titleOf(name),
			path,
			directory: this.directory,
			updatedAt: info.mtimeMs
		};
	}
	async preview(value) {
		const path = join(this.directory, boardId(value));
		const info = await lstat(path);
		if (!info.isFile()) throw new Error("WHITEBOARD_INVALID_ID");
		if (info.size > 4194304) return null;
		return readFile(path, "utf8");
	}
	async delete(value, expectedUpdatedAt) {
		const id = boardId(value);
		const path = join(this.directory, id);
		const info = await lstat(path);
		if (!info.isFile()) throw new Error("WHITEBOARD_INVALID_ID");
		if (typeof expectedUpdatedAt !== "number" || info.mtimeMs !== expectedUpdatedAt) throw new Error("WHITEBOARD_MODIFIED");
		await unlink(path);
		if (/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\.drawio$/iu.test(id)) try {
			await unlink(join(this.directory, `${titleOf(id)}.json`));
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
		}
	}
};
//#endregion
//#region src/board-service.ts
var __runInitializers = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) {
			if (kind === "field") initializers.unshift(_);
			else descriptor[key] = _;
		}
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
let BoardService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _listBoards_decorators;
	let _createBoard_decorators;
	let _previewBoard_decorators;
	let _deleteBoard_decorators;
	let _grantBoardSession_decorators;
	return class BoardService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_listBoards_decorators = [Remote("listBoards")];
			_createBoard_decorators = [Remote("createBoard")];
			_previewBoard_decorators = [Remote("previewBoard")];
			_deleteBoard_decorators = [Remote("deleteBoard")];
			_grantBoardSession_decorators = [Remote("grantBoardSession")];
			__esDecorate(this, null, _listBoards_decorators, {
				kind: "method",
				name: "listBoards",
				static: false,
				private: false,
				access: {
					has: (obj) => "listBoards" in obj,
					get: (obj) => obj.listBoards
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _createBoard_decorators, {
				kind: "method",
				name: "createBoard",
				static: false,
				private: false,
				access: {
					has: (obj) => "createBoard" in obj,
					get: (obj) => obj.createBoard
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _previewBoard_decorators, {
				kind: "method",
				name: "previewBoard",
				static: false,
				private: false,
				access: {
					has: (obj) => "previewBoard" in obj,
					get: (obj) => obj.previewBoard
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _deleteBoard_decorators, {
				kind: "method",
				name: "deleteBoard",
				static: false,
				private: false,
				access: {
					has: (obj) => "deleteBoard" in obj,
					get: (obj) => obj.deleteBoard
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _grantBoardSession_decorators, {
				kind: "method",
				name: "grantBoardSession",
				static: false,
				private: false,
				access: {
					has: (obj) => "grantBoardSession" in obj,
					get: (obj) => obj.grantBoardSession
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		store = __runInitializers(this, _instanceExtraInitializers);
		constructor(ctx, store) {
			super(ctx, "whiteboard");
			this.store = store;
		}
		async listBoards() {
			return this.store.list();
		}
		async createBoard(request) {
			return this.store.create(request?.name);
		}
		async previewBoard(request) {
			return this.store.preview(request?.id);
		}
		async deleteBoard(request) {
			return this.store.delete(request?.id, request?.expectedUpdatedAt);
		}
		async grantBoardSession(request) {
			const session = typeof request?.sessionId === "string" ? this.ctx.sessions.get(request.sessionId) : void 0;
			const expected = resolve(this.store.directory).toLowerCase();
			if (!session || typeof session.header.cwd !== "string" || resolve(session.header.cwd).toLowerCase() !== expected) throw new Error("Whiteboard session must belong to the plugin files directory");
			setSandboxMode(session, "workspace-write");
		}
	};
})();
//#endregion
//#region src/index.ts
const name = "whiteboard";
const inject = ["sessions"];
function apply(ctx) {
	new BoardService(ctx, new BoardStore(fileURLToPath(new URL("../files/", import.meta.url))));
}
//#endregion
export { apply, inject, name };
