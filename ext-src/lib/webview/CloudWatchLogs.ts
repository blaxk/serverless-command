import * as fs from 'fs';
import { window, ViewColumn, Uri, Webview, WebviewPanel, env } from 'vscode';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand, GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CommandBase } from '../CommandBase';
import { IServerlessInvokeOptions } from '../Serverless';
import { ServerlessNode } from '../ServerlessNode';

/**
 * Wrapper for CloudWatchLogs.
 */
export class CloudWatchLogs extends CommandBase {

	private _panel?: WebviewPanel;
	private _client?: CloudWatchLogsClient;
	private readonly _extensionUri: Uri;

	constructor (private extensionUri: Uri) {
		super(true);
		this._extensionUri = extensionUri

		this._panel = window.createWebviewPanel(
			this._getNonce(),
			`CloudWatch Logs`,
			ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		//this._panel.title = 'test';
		//this._panel.active
		//this._panel.visible

		this._panel.onDidDispose(() => {
			this.dispose()
		});

		// Update the content based on view changes
		// this._panel.onDidChangeViewState(() => {
		// });

		this._panel.webview.onDidReceiveMessage(async (message) => {
			if (message.type === 'alert') {
				window.showErrorMessage(message.value);
			} else if (['getLogGroups', 'getLogStreams', 'getLogEvents'].includes(message.type)) {
				let result = undefined;
				let error = ''

				try {
					if (message.type === 'getLogGroups') {
						// @ts-ignore
						result = await this['_' + message.type](message.logGroupNamePrefix, message.nextToken)
					} else {
						// @ts-ignore
						result = await this['_' + message.type](message.logGroupName, message.logStreamName, message.startTime, message.endTime)
					}
				} catch (errorMsg) {
					error = errorMsg;
				}

				if (result) {
					if (message.type === 'getLogGroups') {
						this.sendMessage({
							type: message.type,
							result: result.logGroups,
							nextToken: result.nextToken,
							isAdd: result.isAdd
						});
					} else {
						this.sendMessage({
							type: message.type,
							logGroupName: message.logGroupName,
							logStreamName: message.logStreamName,
							result
						});
					}
				} else {
					this.sendMessage({
						type: message.type,
						logGroupName: message.logGroupName,
						logStreamName: message.logStreamName,
						error
					});

					if (error) {
						window.showErrorMessage(error);
					}
				}
			}
		});

		// Set the webview's initial html content 
		this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
	}

	public invoke (node: ServerlessNode): Thenable<void> {
		return CommandBase.getConfig().then(async config => {
			this._client = this._client || this._getClient(config, node);
			const logGroupName = this._getLogGroupName(config, node);

			this.sendMessage({
				type: 'invoke',
				logGroupName
			});

			if (this._panel && !this._panel.visible) this._panel.reveal();
		});
	}

	public dispose () {
		if (this._panel) {
			this._panel.dispose();
			this._panel = undefined;
		}
	}

	public sendMessage (message: any) {
		if (this._panel) {
			this._panel.webview.postMessage(message);
		}
	}

	public get isAlive (): boolean {
		return !!this._panel
	}

	private _getBaseHtml (): string {
		let html = ''
		try {
			const htmlPath = Uri.joinPath(this._extensionUri, 'build', 'index.html').toString();
			html = fs.readFileSync(htmlPath.replace('file://', '')).toString();
		} catch (error) {
			console.error(error)
		}

		return html
	}

	private _getHtmlForWebview (webview: Webview) {
		const basePathOnDisk = Uri.joinPath(this._extensionUri, 'build');
		const baseUri = webview.asWebviewUri(basePathOnDisk);
		const nonce = this._getNonce();
		let html = this._getBaseHtml();

		if (html) {
			// html = html.replace(/<html lang="[a-z\-]+">/, `<html lang="${env.language}">`);
			html = html.replace(/(src|href)="\.\//g, `$1="${baseUri}/`);
			html = html.replace(/<\/head>/, `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src vscode-resource: 'unsafe-inline'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';"></head>`)
			html = html.replace(/<script/g, `<script nonce="${nonce}"`)
		} else {
			html = `<html><body><h1>Error</h1><div>Html not found<div></body></html>`;
		}

		return html;
	}

	private _getLogGroupName (config: IServerlessInvokeOptions, node: ServerlessNode): string {
		const { service, name } = node.data;
		return `/aws/lambda/${service}-${config.stage}-${name}`
	}

	private async _getLogGroups (logGroupNamePrefix?: string, token?: string): Promise<any> {
		try {
			const logStreamsCommand = new DescribeLogGroupsCommand({
				nextToken: token || undefined,
				logGroupNamePrefix: logGroupNamePrefix || undefined
			});

			// @ts-ignore
			const { logGroups, nextToken } = await this._client.send(logStreamsCommand);
			return Promise.resolve({ logGroups, nextToken, isAdd: !!token })
		} catch (error) {
			return Promise.reject(error.message)
		}
	}

	private async _getLogStreams (logGroupName: string): Promise<any> {
		try {
			const logStreamsCommand = new DescribeLogStreamsCommand({
				logGroupName,
				descending: true,
				orderBy: 'LastEventTime'
			});

			// @ts-ignore
			const { logStreams } = await this._client.send(logStreamsCommand);
			return Promise.resolve(logStreams)
		} catch (error) {
			return Promise.reject(error.message)
		}
	}

	private async _getLogEvents (logGroupName: string, logStreamName: string, startTime?: number, endTime?: number): Promise<any> {
		try {
			const logEventsCommand = new GetLogEventsCommand({
				logGroupName,
				logStreamName,
				startTime,
				endTime,
				limit: 1000
			});

			// @ts-ignore
			const { events, nextForwardToken, nextBackwardToken } = await this._client.send(logEventsCommand);
			return Promise.resolve(events)
		} catch (error) {
			return Promise.reject(error.message)
		}
	}

	private _getClient (config: IServerlessInvokeOptions, node: ServerlessNode): CloudWatchLogsClient {
		const profile = process.env.AWS_PROFILE || config.awsProfile || node.data.profile;
		const credentials = profile ? fromIni({ profile }) : profile

		const client = new CloudWatchLogsClient({
			region: config.region,
			credentials
		});

		return client
	}

	private _getNonce () {
		let text = "";
		const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}