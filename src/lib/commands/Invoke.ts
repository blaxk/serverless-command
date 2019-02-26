
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

		return new Promise( async ( resolve, reject ) => {
			try {
				let result = await CommandBase.askForStageAndRegion();
				let functionName: string = node.name
				let filePath: string = `${node.documentRoot}/test/${functionName}.json`;
				let options = {
					'cwd': node.documentRoot,
					'function': functionName,
					'region': result[1],
					'stage': result[ 0 ],
					'path': filePath,
					'aws-profile': result[3],
					'log': false
				};

				resolve(
					Serverless.invoke( "invoke", options, result[ 2 ] )
				);
			} catch ( err ) {
				reject(err)
			}
		});
	}
}
