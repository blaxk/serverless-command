import * as _ from 'lodash';
import * as path from 'path';
import { ExtensionContext, Uri, window } from 'vscode';
import { CommandBase } from '../CommandBase';
import { Serverless } from '../Serverless';
import { NodeKind, ServerlessNode } from '../ServerlessNode';

/**
 * Wrapper for Serverless Remove.
 */

export class Remove extends CommandBase {

	constructor(private context: ExtensionContext) {
		super(true);
	}

	public invoke(node: ServerlessNode): Thenable<void> {
		if (node.kind !== NodeKind.CONTAINER) {
			return Promise.reject(new Error('Target must be a container'));
		}

		return CommandBase.askForStageAndRegion()
			.then( result => {
				return window.showWarningMessage('Do you remove serverless service?',
					{},
					{ title: 'Remove serverless service' }
				).then( value => {
					if ( !value ) return;

					return Serverless.invoke('remove', {
						'cwd': node.documentRoot,
						...result
					});
				});
		});
	}

}
