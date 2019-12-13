import * as yaml from "js-yaml";
import * as json from "jsonc-parser";
import * as _ from "lodash";
import * as path from "path";
import * as fs from "fs";
import {
	Command,
	Event,
	EventEmitter,
	ExtensionContext,
	TextDocument,
	TextEditor,
	TreeDataProvider,
	TreeItem,
	TreeItemCollapsibleState,
	Uri,
	window,
	WorkspaceFolder,
	TextDocumentChangeEvent,
	workspace
} from "vscode";

import { NodeKind, ServerlessNode } from "./ServerlessNode";


export class ServerlessOutlineProvider implements TreeDataProvider<ServerlessNode> {

	// tslint:disable-next-line:variable-name
	private _onDidChangeTreeData: EventEmitter<ServerlessNode | null> = new EventEmitter<ServerlessNode | null>();
	// tslint:disable-next-line:member-ordering
	public readonly onDidChangeTreeData: Event<ServerlessNode | null> = this._onDidChangeTreeData.event;

	private service: any;
	private warnings: string[];
	private nodes: ServerlessNode;

	public constructor (private context: ExtensionContext, private workspaceFolders: WorkspaceFolder[]) {
		this.warnings = [];
		this.nodes = new ServerlessNode("Service", NodeKind.ROOT);

		window.onDidChangeActiveTextEditor(editor => {
			this.refresh();
		});

		this.parseYaml();
	}

	public getTreeItem (element: ServerlessNode): TreeItem {
		const treeItem = new TreeItem(element.name);
		treeItem.contextValue = element.kind;
		if (element.hasChildren) {
			treeItem.collapsibleState =
				element.kind !== NodeKind.ROOT ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed;
		} else {
			treeItem.collapsibleState = TreeItemCollapsibleState.None;
		}

		if (element.kind === NodeKind.CONTAINER) {
			treeItem.iconPath = this.context.asAbsolutePath(`icons/archive.svg`);
		} else if (element.kind === NodeKind.FUNCTION) {
			treeItem.iconPath = this.context.asAbsolutePath(`icons/symbol-method.svg`);
		}
		
		// if (element.kind === NodeKind.APIMETHOD && element.data) {
		// 	treeItem.iconPath = this.context.asAbsolutePath(`images/${_.toLower(element.data.method)}.svg`);
		// }

		return treeItem;
	}

	public getChildren(element?: ServerlessNode): ServerlessNode[] {
		if (!element) {
			return this.nodes.children;
		}

		return element.children;
	}

	public refresh(offset?: ServerlessNode): void {
		this.parseYaml();
		if (offset) {
			this._onDidChangeTreeData.fire(offset);
		} else {
			this._onDidChangeTreeData.fire();
		}
	}	

	private parseYaml (): void {
		for (let idx in this.workspaceFolders) {
			this.nodes.children = [];
			//{name, uri.path}
			const folder = this.workspaceFolders[idx];
			const ymlPath = `${folder.uri.path}/serverless.yml`

			if (this.pathExists(ymlPath)) {
				try {
					const service = yaml.safeLoad(fs.readFileSync(ymlPath, 'utf8'), {});
					this.parseService(service, folder.uri.path, folder.name);
				} catch (err) {
					console.error(err);
				}
			}
		}
	}

	private addAPINode(apiRoot: ServerlessNode, httpNode: ServerlessNode) {
		const http = httpNode.data;
		const httpPath = _.compact(_.split(http.path, "/"));
		const apiLeaf = _.reduce(_.initial(httpPath), (root, httpPathElement) => {
			let apiPath = _.find(root.children, child => child.name === httpPathElement);
			if (!apiPath) {
				apiPath = new ServerlessNode(httpPathElement, NodeKind.APIPATH);
				root.children.push(apiPath);
			}
			return apiPath;
		}, apiRoot);
		const method = _.last(httpPath);
		if (method) {
			apiLeaf.children.push(new ServerlessNode(method, NodeKind.APIMETHOD, http));
		}
	}

	private parseService (service: any, documentRoot: string, serviceName: string) {
		//const apiRootNode = new ServerlessNode("API", NodeKind.CONTAINER);
		const functionRootNode = new ServerlessNode(serviceName, NodeKind.CONTAINER);

		// Parse functions
		_.forOwn(service.functions, (func, funcName) => {
			const functionNode = new ServerlessNode(funcName, NodeKind.FUNCTION, func);

			//Add nodes for the function events
			// if (!_.isEmpty(func.events)) {
			// 	const httpEvents = _.filter(func.events, funcEvent => funcEvent.http);
			// 	if (!_.isEmpty(httpEvents)) {
			// 		//const httpNode = new ServerlessNode("HTTP", NodeKind.CONTAINER);
			// 		_.forEach(httpEvents, ({ http }) => {
			// 			const name = http.path;
			// 			const httpMethodNode = new ServerlessNode(name, NodeKind.APIMETHOD, http);
			// 			httpNode.children.push(httpMethodNode);
			// 			this.addAPINode(apiRootNode, httpMethodNode);
			// 		});
			// 		//functionNode.children.push(httpNode);
			// 	}
			// }

			functionRootNode.children.push(functionNode);
		});

		functionRootNode.setDocumentRoot(documentRoot);

		this.nodes.children.push(functionRootNode);
		//this.nodes.children.push(apiRootNode);
	}

	private pathExists (path: string): boolean {
		try {
			fs.accessSync(path);
		} catch (err) {
			return false;
		}

		return true;
	}

	//TODO: 하위 폴더까지 뒤져서 파일을 있는지 검사
	private subFolderFileExists (path: string): boolean {
		

		return true;
	}

}
