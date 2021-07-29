import * as path from 'path';
import { ExtensionContext } from 'vscode';
import { CommandBase } from '../CommandBase';
import { Serverless } from '../Serverless';
import { NodeKind, ServerlessNode } from '../ServerlessNode';

/**
 * Wrapper for Serverless invoke local.
 */

export class InvokeLocal extends CommandBase {

	constructor(private context: ExtensionContext) {
		super(true);
	}

	public invoke(node: ServerlessNode): Thenable<void> {
		if (node.kind !== NodeKind.FUNCTION) {
			return Promise.reject(new Error('Target must be a function'));
		}

		return new Promise(async (resolve, reject) => {
			try {
				const config = await CommandBase.getConfig();

				resolve(
					Serverless.invoke('invoke local', {
						'cwd': node.documentRoot,
						'function': node.name,
						'path': path.join(node.documentRoot, config.testFolderPath, `${node.name}.json`),
						...config,
						'log': false
					})
				);
			} catch (error) {
				reject(error)
			}
		});
	}
}
