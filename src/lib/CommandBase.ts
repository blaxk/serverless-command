import * as _ from "lodash";
import { window, workspace } from "vscode";
import { ServerlessNode } from "./ServerlessNode";

/**
 * Base class for VSCode Serverless commands.
 */
export abstract class CommandBase {

	protected static askForStageAndRegion(): Thenable<string[]> {
		const configuration = workspace.getConfiguration();
		const defaultStage: string = configuration.get("serverlessCommand.aws.stage") || "dev";
		const defaultRegion: string = configuration.get("serverlessCommand.aws.region") || "ap-northeast-2";
		const defaultNodeModulesPath: string = configuration.get("serverlessCommand.nodeModulesPath") || "/usr/local/lib/node_modules";
		const credentialName: string = configuration.get("serverlessCommand.aws.credentials") || "";
		const alias: string = configuration.get("serverlessCommand.aws.alias") || "";

		return Promise.resolve([defaultStage, defaultRegion, defaultNodeModulesPath, credentialName, alias]);
	}

	constructor(public readonly isExclusive: boolean = false) {
	}

	public abstract invoke(node: ServerlessNode): Thenable<void>;

}
