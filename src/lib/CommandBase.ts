import * as _ from "lodash";
import { window, workspace } from "vscode";
import { ServerlessNode } from "./ServerlessNode";

/**
 * Base class for VSCode Serverless commands.
 */
export abstract class CommandBase {

	protected static askForStageAndRegion(): Thenable<string[]> {
		const configuration = workspace.getConfiguration();
		const defaultStage: string = configuration.get("serverless.aws.defaultStage") || "dev";
		const defaultRegion: string = configuration.get("serverless.aws.defaultRegion") || "ap-northeast-2";
		const defaultNodeModulesPath: string = configuration.get("serverless.defaultNodeModulesPath") || "/usr/local/lib/node_modules";
		const credentialName: string = configuration.get("serverless.aws.credentials") || "default";

		return Promise.resolve( [ defaultStage, defaultRegion, defaultNodeModulesPath, credentialName ]);
	}

	constructor(public readonly isExclusive: boolean = false) {
	}

	public abstract invoke(node: ServerlessNode): Thenable<void>;

}
