import { ExtensionContext } from 'vscode';
import { CommandBase } from '../CommandBase';
import { Serverless } from '../Serverless';
import { NodeKind, ServerlessNode } from '../ServerlessNode';

/**
 * Wrapper for Serverless deploy.
 */

export class Deploy extends CommandBase {

	constructor (private context: ExtensionContext) {
		super(true);
	}

	public invoke (node: ServerlessNode): Thenable<void> {
		if (node.kind !== NodeKind.CONTAINER) {
			return Promise.reject(new Error('Target must be a container'));
		}

		return CommandBase.getConfig().then(config => {
			return Serverless.invoke('deploy', {
				'cwd': node.documentRoot,
				...config
			});
		});
	}

}
