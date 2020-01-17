import { spawn } from "child_process";
import * as _ from "lodash";
import * as path from "path";
import { OutputChannel, Terminal, TerminalOptions, window, workspace } from "vscode";

export interface IServerlessInvokeOptions {
	'stage'?: string;
	'log'?: boolean;
	'data'?: string;
	'cwd'?: string;
	'aws-profile'?: string;
	'alias'?: string;
}

const ProcessingOptions = [
	'cwd',
];

export class Serverless {

	public static invoke ( command: string, options?: IServerlessInvokeOptions, nodeModulesPath?: string ): Thenable<void> {
		const commandOptions = Serverless.formatOptions( options );
		const cwd: string = _.get(options, 'cwd') || __dirname;

		const serverless = new Serverless(cwd);
		return serverless.invokeCommand( command, commandOptions, nodeModulesPath);
	}

	public static invokeWithResult ( command: string, options?: IServerlessInvokeOptions, nodeModulesPath?: string): Thenable<string> {
		const commandOptions = Serverless.formatOptions(options);
		const cwd: string = _.get(options, 'cwd') || __dirname;

		const serverless = new Serverless(cwd);
		return serverless.invokeCommandWithResult( command, commandOptions, nodeModulesPath);
	}

	private static formatOptions(invokeOptions?: IServerlessInvokeOptions): string[] {
		const options = _.defaults({}, _.omitBy(invokeOptions, (value, key) => _.includes(ProcessingOptions, key)), {
			stage: 'dev',
		});
		
		let commandOptions: string[] = []

		_.forEach(options, (value: any, key: string) => {
			if (key && value) {
				commandOptions.push(`--${key}=${value}`);
			} else if (key && value === false) {
				commandOptions.push(`--${key}`);
			}
		});
		
		window.showInformationMessage(`-commandOptions:: ${JSON.stringify(commandOptions)}`)

		return commandOptions;
	}

	private cwd: string;
	private channel: any;
	private timer: any = null;

	private constructor(cwd: string) {
		this.cwd = cwd;
	}

	private invokeCommandWithResult ( command: string, options: string[], nodeModulesPath: string=''): Thenable<string> {
		this.channel = window.createOutputChannel("Serverless");
		this.channel.show(true);

		const serverlessCommand = `Running - "serverless ${command} ${_.join(options, " ")}"`;
		this.channel.appendLine(serverlessCommand);

		return new Promise( ( resolve, reject ) => {
			let result = "";
			const sls = spawn( "node", _.concat(
				[ `${nodeModulesPath}/serverless/bin/serverless` ],
				_.split( command, " " ),
				options,
			), {
					cwd: this.cwd,
				} );

			sls.on( "error", err => {
				reject( err );
			} );

			sls.stdout.on( "data", data => {
				result += data.toString();
			} );

			sls.stderr.on( "data", data => {
				this.channel.append( data.toString() );
			} );

			sls.on( "exit", code => {
				if ( code !== 0 ) {
					this.channel.append( result );
					reject( new Error( `Command exited with ${code}` ) );
				}
				this.channel.appendLine( "\nCommand finished." );
				this.channel.show( true );
				resolve( result );
			} );
		});
	}

	private invokeCommand ( command: string, options: string[], nodeModulesPath: string=''): Thenable<void> {
		this.channel = window.createOutputChannel(command);
		this.channel.show();

		const serverlessCommand = `Running "serverless ${command} ${_.join(options, " ")}"`;
		this.channel.appendLine( serverlessCommand );
		this.stopTimer();

		return new Promise( ( resolve, reject ) => {
			const sls = spawn( "node", _.concat(
				[ `${nodeModulesPath}/serverless/bin/serverless` ],
				_.split( command, " " ),
				options,
			), {
					cwd: this.cwd,
				} );

			// 특정 오류에서 아무 이벤트도 받지 못하는 이슈때문에 사용 (20초 Timeout)
			if ( /invoke/.test( command ) ) {
				this.timer = setTimeout( () => {
					window.showErrorMessage( 'Serverless response is delayed.\n Do you want to stop the serverless process?',
						{},
						{ title: 'Serverless STOP' }
					).then( value => {
						if ( !value ) return;
						sls.kill( 'SIGHUP' );
						reject();
					});
				}, 20000 );
			}

			sls.on( "error", err => {
				this.stopTimer();
				reject( err );
			} );

			sls.stdout.on( "data", data => {
				this.stopTimer();
				this.channel.append( data.toString() );
			} );

			sls.stderr.on( "data", data => {
				this.stopTimer();
				this.channel.append( data.toString() );
			} );

			sls.on( "exit", code => {
				this.stopTimer();

				if ( code !== 0 ) {
					reject( new Error( `Command exited with ${code}` ) );
				}
				this.channel.appendLine( "\nCommand finished." );
				this.channel.show( true );
				resolve();
			} );
		});
	}

	private stopTimer (): void {
		if ( this.timer ) {
			clearTimeout( this.timer );
			this.timer = null;
		}
	}

}
