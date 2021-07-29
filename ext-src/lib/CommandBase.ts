import { workspace } from 'vscode';
import { ServerlessNode } from './ServerlessNode';
import { IServerlessInvokeOptions } from './Serverless';

/**
 * Base class for VSCode Serverless commands.
 */
export abstract class CommandBase {

	protected static getConfig (): Thenable<IServerlessInvokeOptions> {
		const configuration = workspace.getConfiguration();
		const stage: string = configuration.get('serverlessCommand.aws.stage') || 'dev';
		const region: string = configuration.get('serverlessCommand.aws.region') || 'ap-northeast-2';
		const nodeModulesPath: string = configuration.get('serverlessCommand.nodeModulesPath') || '/usr/local/lib/node_modules';
		const awsProfile: string = configuration.get('serverlessCommand.aws.credentials') || '';
		const alias: string = configuration.get('serverlessCommand.aws.alias') || '';
		const firstCommand: string = configuration.get('serverlessCommand.firstCommand') || '';
		const testFolderPath: string = configuration.get('serverlessCommand.testFolderPath') || './test';

		return Promise.resolve({
			nodeModulesPath,
			firstCommand,
			testFolderPath,
			stage,
			region,
			awsProfile,
			alias
		});
	}

	constructor (public readonly isExclusive: boolean = false) {
	}

	public abstract invoke (node: ServerlessNode): Thenable<void>;
}
