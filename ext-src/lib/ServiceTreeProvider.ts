import * as _ from 'lodash';
import {
	Event,
	EventEmitter,
	ExtensionContext,
	TreeDataProvider,
	TreeItem,
	TreeItemCollapsibleState
} from 'vscode';

import { NodeKind, ServerlessNode } from './ServerlessNode';


export default class ServiceTreeProvider implements TreeDataProvider<ServerlessNode> {

	// tslint:disable-next-line:variable-name
	protected _onDidChangeTreeData: EventEmitter<ServerlessNode | null> = new EventEmitter<ServerlessNode | null>();
	// tslint:disable-next-line:member-ordering
	public readonly onDidChangeTreeData: Event<ServerlessNode | null> = this._onDidChangeTreeData.event;

	protected xmlData: any;
	protected warnings: string[];
	protected nodes: ServerlessNode;

	public constructor (protected context: ExtensionContext, protected name: string) {
		this.warnings = [];
		this.nodes = new ServerlessNode(name, NodeKind.ROOT);
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

		if ([NodeKind.CONTAINER, NodeKind.LOG_CONTAINER].includes(element.kind)) {
			treeItem.iconPath = {
				light: this.context.asAbsolutePath('resources/icons/light/package.svg'),
				dark: this.context.asAbsolutePath('resources/icons/dark/package.svg')
			};
		} else if (element.kind === NodeKind.FUNCTION) {
			treeItem.iconPath = {
				light: this.context.asAbsolutePath('resources/icons/light/lambda.svg'),
				dark: this.context.asAbsolutePath('resources/icons/dark/lambda.svg')
			};
		} else if (element.kind === NodeKind.LOG_GROUP) {
			treeItem.iconPath = {
				light: this.context.asAbsolutePath('resources/icons/light/preview.svg'),
				dark: this.context.asAbsolutePath('resources/icons/dark/preview.svg')
			};
		}

		return treeItem;
	}

	public getChildren (element?: ServerlessNode): ServerlessNode[] {
		if (!element) {
			return this.nodes.children;
		}

		return element.children;
	}

	public refresh (data: any): void {
		if (!this.isEqual(data, this.xmlData)) {
			this.nodes.children = [];

			for (const folder of data) {
				this.makeChildren(folder.data, folder.path);
			}

			this.xmlData = data;
			this._onDidChangeTreeData.fire(null);
		}
	}

	protected isEqual (val1: any, val2: any): boolean {
		let result = false, isSame = true, val1Length, val2Length;

		if (_.isArray(val1) && _.isArray(val2)) {
			val1Length = val1.length;
			val2Length = val2.length;

			if (val1Length === val2Length && val1Length) {
				for (let i = 0; i < val1Length; ++i) {
					if (!this.isEqual(val1[i], val2[i])) {
						isSame = false;
						break;
					}
				}
				result = isSame;
			} else if (!val1Length && !val2Length) {
				result = true;
			} else {
				result = (val1 === val2);
			}
		} else if (_.isObject(val1) && _.isObject(val2)) {
			val1Length = _.size(val1);
			val2Length = _.size(val2);

			if (val1Length === val2Length && val1Length) {
				for (const key in val1) {
					// @ts-ignore
					if (!this.isEqual(val1[key], val2[key])) {
						isSame = false;
						break;
					}
				}
				result = isSame;
			} else if (!val1Length && !val2Length) {
				result = true;
			} else {
				result = (val1 === val2);
			}
		} else {
			result = (val1 === val2);
		}

		return result;
	}

	protected makeChildren (serverless: any, documentRoot: string) {
		const functionRootNode = new ServerlessNode(serverless.service, NodeKind.CONTAINER);

		_.forOwn(serverless.functions, (func, funcName) => {
			const functionNode = new ServerlessNode(func.name, NodeKind.FUNCTION, func);
			functionRootNode.children.push(functionNode);
		});

		functionRootNode.setDocumentRoot(documentRoot);
		this.nodes.children.push(functionRootNode);
	}
}
