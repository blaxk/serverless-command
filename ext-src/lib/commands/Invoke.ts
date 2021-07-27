
import * as _ from 'lodash';
import { ExtensionContext, Uri, window } from 'vscode';
import { CommandBase } from '../CommandBase';
import { Serverless } from '../Serverless';
import { NodeKind, ServerlessNode } from '../ServerlessNode';

/**
 * Wrapper for Serverless invoke.
 */

export class Invoke extends CommandBase {

	constructor (private context: ExtensionContext) {
		super(true);
	}

	public invoke(node: ServerlessNode): Thenable<void> {
		if (node.kind !== NodeKind.FUNCTION) {
			return Promise.reject(new Error('Target must be a function'));
		}

		return new Promise(async (resolve, reject) => {
			try {
				const result = await CommandBase.getConfig();
				const functionName: string = node.name
				const path: string = `${node.documentRoot}/test/${functionName}.json`;

				resolve(
					Serverless.invoke('invoke', {
						'cwd': node.documentRoot,
						'function': functionName,
						'path': path,
						...result,
						'log': false
					})
				);
			} catch (error) {
				reject(error)
			}
		});
	}
}
