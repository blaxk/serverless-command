import { commands, ExtensionContext, window, workspace } from 'vscode';
import { CommandHandler } from './lib/CommandHandler';
import { WebviewHandler } from './lib/WebviewHandler';
import { Deploy } from './lib/commands/Deploy';
import { DeployFunction } from './lib/commands/DeployFunction';
import { InvokeLocal } from './lib/commands/InvokeLocal';
import { Invoke } from './lib/commands/Invoke';
import { Remove } from './lib/commands/Remove';
import { Logs } from './lib/commands/Logs';
import { OpenHandler } from './lib/commands/OpenHandler';
import { Package } from './lib/commands/Package';
import { Resolve } from './lib/commands/Resolve';
import { CloudWatchLogs } from './lib/webview/CloudWatchLogs';
import { Serverless } from './lib/Serverless';
import ServiceTreeProvider from './lib/ServiceTreeProvider';
import LogsTreeProvider from './lib/LogsTreeProvider';

/**
 * Activation entry point for the extension
 * @param context VSCode context
 */
export function activate (context: ExtensionContext) {
	// tslint:disable-next-line:no-console
	console.log('Loading Serverless extension');

	const serviceTreeProvider = new ServiceTreeProvider(context, 'Service');
	const logsTreeProvider = new LogsTreeProvider(context, 'Logs');

	const ymlData = Serverless.loadYaml();
	serviceTreeProvider.refresh(ymlData);
	logsTreeProvider.refresh(ymlData);

	context.subscriptions.push(window.registerTreeDataProvider('serverlessOutline', serviceTreeProvider));
	context.subscriptions.push(window.registerTreeDataProvider('serverlessLogsOutline', logsTreeProvider));
	context.subscriptions.push(commands.registerCommand('serverless.refreshTreeHandler', () => {
		const ymlData = Serverless.loadYaml()
		serviceTreeProvider.refresh(ymlData);
		logsTreeProvider.refresh(ymlData);
	}));

	window.onDidChangeActiveTextEditor(editor => {
		const ymlData = Serverless.loadYaml()
		serviceTreeProvider.refresh(ymlData);
		logsTreeProvider.refresh(ymlData);
	});

	workspace.onDidSaveTextDocument(document => {
		if (/serverless.yml$/.test(document.fileName)) {
			const ymlData = Serverless.loadYaml()
			serviceTreeProvider.refresh(ymlData);
			logsTreeProvider.refresh(ymlData);
		}
	});

	CommandHandler.registerCommand(OpenHandler, 'serverless.openHandler', context);
	CommandHandler.registerCommand(Resolve, 'serverless.resolve', context);
	CommandHandler.registerCommand(Logs, 'serverless.logs', context);
	CommandHandler.registerCommand(InvokeLocal, 'serverless.invokeLocal', context);
	CommandHandler.registerCommand(Invoke, 'serverless.invoke', context);
	CommandHandler.registerCommand(Remove, 'serverless.remove', context);
	CommandHandler.registerCommand(DeployFunction, 'serverless.deployFunction', context);
	CommandHandler.registerCommand(Package, 'serverless.package', context);
	CommandHandler.registerCommand(Deploy, 'serverless.deploy', context);

	WebviewHandler.registerCommand(CloudWatchLogs, 'cloudWatch.logs', context);

	return null;
}

export function deactivate() {
	return;
}