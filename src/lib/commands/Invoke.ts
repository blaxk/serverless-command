
import * as _ from "lodash";
import { ExtensionContext, Uri, window } from "vscode";
import { CommandBase } from "../CommandBase";
import { Serverless } from "../Serverless";
import { NodeKind, ServerlessNode } from "../ServerlessNode";

/**
 * Wrapper for Serverless invoke.
 */

export class Invoke extends CommandBase {

	constructor(private context: ExtensionContext) {
		super(true);
	}

	public invoke(node: ServerlessNode): Thenable<void> {
		if (node.kind !== NodeKind.FUNCTION) {
			return Promise.reject(new Error("Target must be a function"));
		}

		return CommandBase.askForStageAndRegion()
		.then( result => {
			const functionName: string = node.name
			const filePath: string = `${node.documentRoot}/test/${functionName}.json`;

			let options = {
				cwd: node.documentRoot,
				function: functionName,
				region: result[ 1 ],
				stage: result[ 0 ],
				path: filePath,
				log: false
			};

			return Serverless.invoke( "invoke", options, result[ 2 ] );
		});
	}
}
