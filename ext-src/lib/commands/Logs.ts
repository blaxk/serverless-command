import * as _ from 'lodash';
import * as path from 'path';
import { ExtensionContext, Uri, window } from 'vscode';
import { CommandBase } from '../CommandBase';
import { Serverless } from '../Serverless';
import { NodeKind, ServerlessNode } from '../ServerlessNode';

/**
 * Wrapper for Serverless logs.
 */

export class Logs extends CommandBase {

	constructor(private context: ExtensionContext) {
		super(true);
	}

	public invoke(node: ServerlessNode): Thenable<void> {
		if (node.kind !== NodeKind.FUNCTION) {
			return Promise.reject(new Error('Target must be a function'));
		}

		return CommandBase.getConfig().then(config => {
			return Serverless.invoke('logs', {
				'cwd': node.documentRoot,
				'function': node.name,
				...config
			});
		});
	}

}
