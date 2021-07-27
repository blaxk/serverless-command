import { spawn } from 'child_process';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as _ from 'lodash';
import { window, workspace } from 'vscode';

export interface IServerlessInvokeOptions {
	'stage'?: string;
	'region'?: string;
	'log'?: boolean;
	'data'?: string;
	'cwd'?: string;
	'alias'?: string;
	'function'?: string;
	'path'?: string;
	'nodeModulesPath'?: string;
	'awsProfile'?: string;
	'firstCommand'?: string;
}

const ProcessingOptions = [
	'cwd',
	'nodeModulesPath',
	'firstCommand',
	'awsProfile'
];

export class Serverless {

	public static loadYaml (): object[] {
		let result = [];

		if (workspace.workspaceFolders) {
			for (const folder of workspace.workspaceFolders) {
				//{name, uri.path}
				const ymlPath = `${folder.uri.path}/serverless.yml`

				if (pathExists(ymlPath)) {
					result.push({
						path: folder.uri.path,
						data: parseYaml(ymlPath)
					});
				}
			}
		}

		return result;
	}

	public static invoke (command: string, options?: IServerlessInvokeOptions): Thenable<void> {
		const commands = Serverless.formatOptions(command, options);
		const cwd: string = _.get(options, 'cwd') || __dirname;

		const serverless = new Serverless(cwd);
		return serverless.invokeCommand(command, commands);
	}

	public static invokeWithResult (command: string, options?: IServerlessInvokeOptions): Thenable<string> {
		const commands = Serverless.formatOptions(command, options);
		const cwd: string = _.get(options, 'cwd') || __dirname;

		const serverless = new Serverless(cwd);
		return serverless.invokeCommandWithResult(command, commands);
	}

	private static formatOptions (command: string, invokeOptions?: IServerlessInvokeOptions): string {
		const options = _.defaults({}, _.omitBy(invokeOptions, (value, key) => _.includes(ProcessingOptions, key)));
		const processingOptions = _.defaults({}, _.omitBy(invokeOptions, (value, key) => !_.includes(ProcessingOptions, key)));
		const commandOptions: string[] = []

		_.forEach(options, (value: any, key: string) => {
			if (key && value) {
				commandOptions.push(`--${key}=${value}`);
			} else if (key && value === false) {
				commandOptions.push(`--${key}`);
			}
		});

		const commands = _.concat(
			['serverless'],
			_.split(command, ' '),
			commandOptions,
		);

		if (processingOptions.awsProfile) {
			commands.unshift(`export AWS_PROFILE=${processingOptions.awsProfile} &&`)
		}

		if (processingOptions.firstCommand) {
			commands.unshift(processingOptions.firstCommand)
		}

		return commands.join(' ');
	}

	private cwd: string;
	private channel: any;
	private timer: any = null;

	private constructor (cwd: string) {
		this.cwd = cwd;
	}

	private invokeCommandWithResult (command: string, commands: string): Thenable<string> {
		this.channel = window.createOutputChannel('Serverless');
		this.channel.show(true);
		this.channel.appendLine(`Running "${commands}"`);

		return new Promise((resolve, reject) => {
			let result = '';
			const sls = spawn(`cd ${this.cwd} && ${commands}`, {
				shell: true
			});

			sls.on('error', err => {
				reject(err);
			});

			sls.stdout.on('data', data => {
				result += data.toString();
			});

			sls.stderr.on('data', data => {
				this.channel.append(data.toString());
			});

			sls.on('exit', code => {
				if (code !== 0) {
					this.channel.append(result);
					reject(new Error(`Command exited with ${code}`));
				}
				this.channel.appendLine('\nCommand finished.');
				this.channel.show(true);
				resolve(result);
			});
		});
	}

	private invokeCommand (command: string, commands: string): Thenable<void> {
		this.channel = window.createOutputChannel(command);
		this.channel.show();
		this.channel.appendLine(`Running "${commands}"`);
		this.stopTimer();

		return new Promise((resolve, reject) => {
			const sls = spawn(`cd ${this.cwd} && ${commands}`, {
				shell: true
			});

			// 특정 오류에서 아무 이벤트도 받지 못하는 이슈때문에 사용 (20초 Timeout)
			if (/invoke/.test(command)) {
				this.timer = setTimeout(() => {
					window.showErrorMessage('Serverless response is delayed.\n Do you want to stop the serverless process?',
						{},
						{ title: 'Stop serverless' }
					).then(value => {
						if (!value) return;
						sls.kill('SIGHUP');
						reject();
					});
				}, 20000);
			}

			sls.on('error', err => {
				this.stopTimer();
				reject(err);
			});

			sls.stdout.on('data', data => {
				this.stopTimer();
				this.channel.append(data.toString());
			});

			sls.stderr.on('data', data => {
				this.stopTimer();
				this.channel.append(data.toString());
			});

			sls.on('exit', code => {
				this.stopTimer();

				if ( code !== 0 ) {
					reject(new Error(`Command exited with ${code}`));
				}
				this.channel.appendLine('\nCommand finished.');
				this.channel.show(true);
				resolve();
			});
		});
	}

	private stopTimer (): void {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}

}



/** ===== Methods ===== */

function pathExists (path: string): boolean {
	try {
		fs.accessSync(path);
	} catch (error) {
		return false;
	}

	return true;
}

function parseYaml (ymlPath: string): object {
	const result = {
		service: '',
		provider: {},
		functions: []
	};

	try {
		const data: any = yaml.load(fs.readFileSync(ymlPath, 'utf8'), {});
		const provider = data.provider;

		for (const key in data.functions) {
			result.functions.push({
				// @ts-ignore
				service: data.service,
				// @ts-ignore
				profile: provider.profile,
				// @ts-ignore
				name: data.functions[key].name || key
			});
		}

		result.service = data.service;
		result.provider = {
			name: provider.name
		}
	} catch (error) {
		console.error(error);
	}

	return result;
}