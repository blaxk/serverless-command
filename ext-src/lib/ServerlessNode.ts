import * as _ from 'lodash';
import { Command, ExtensionContext } from 'vscode';

export const enum NodeKind {
	ROOT = 'root',
	CONTAINER = 'container',
	FUNCTION = 'function',
	LOG_CONTAINER = 'log_container',
	LOG_GROUP = 'log_group'
}

export class ServerlessNode {

	public children: ServerlessNode[];
	public name: string;
	public kind: NodeKind;
	public documentRoot: string;
	public data?: any;
	public iconPath?: string;

	public constructor (name: string, kind: NodeKind, data?: object) {
		this.children = [];
		this.name = name;
		this.kind = kind;
		this.documentRoot = '';
		this.data = data;
		this.iconPath = '';
	}

	public get hasChildren(): boolean {
		return !_.isEmpty(this.children);
	}

	public getCommand(): Command | null {
		return null;
	}

	public setDocumentRoot(documentRoot: string) {
		this.documentRoot = documentRoot;
		_.forEach(this.children, child => child.setDocumentRoot(documentRoot));
	}
}
