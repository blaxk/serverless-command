import * as _ from 'lodash';
import { commands, Disposable, ExtensionContext, Uri } from 'vscode';
import { CommandBase } from './CommandBase';
import { ServerlessNode } from './ServerlessNode';


export class WebviewHandler<T extends CommandBase> {

	public static registerCommand<T extends CommandBase>(
		commandClass: { new(extensionUri: Uri): T; },
		name: string,
		context: ExtensionContext,
		multiple?: boolean
	) {
		const handler = new WebviewHandler(context, commandClass, multiple);
		context.subscriptions.push(commands.registerCommand(name, handler.invoke));
	}

	private readonly _extensionUri: Uri;
	private readonly _multiple: boolean;
	private readonly _handlerClass: { new(extensionUri: Uri): T; };
	private handler: any;

	private constructor (private context: ExtensionContext, handlerClass: { new(extensionUri: Uri): T; }, multiple?: boolean) {
		this._extensionUri = context.extensionUri;
		this._multiple = !!multiple;
		this._handlerClass = handlerClass;
		this.invoke = this.invoke.bind(this);
	}

	public invoke (node: ServerlessNode): Thenable<void> {
		if (this._multiple) {
			const handler = new this._handlerClass(this._extensionUri);
			return handler.invoke(node)
		} else {
			// @ts-ignore
			if (!this.handler || !this.handler.isAlive) {
				this.handler = new this._handlerClass(this._extensionUri);
			}

			return this.handler.invoke(node)
		}
	}
}
