import * as _ from "lodash";
import * as path from "path";
import { ExtensionContext, Uri, window } from "vscode";
import { CommandBase } from "../CommandBase";
import { Serverless } from "../Serverless";
import { NodeKind, ServerlessNode } from "../ServerlessNode";

/**
 * Wrapper for Serverless Remove.
 */

export class Remove extends CommandBase {

	constructor(private context: ExtensionContext) {
		super(true);
	}

	public invoke(node: ServerlessNode): Thenable<void> {
		if (node.kind !== NodeKind.CONTAINER) {
			return Promise.reject(new Error("Target must be a container"));
		}

		return CommandBase.askForStageAndRegion()
			.then( result => {
				return window.showInputBox({
					prompt: `Confirm `,
					placeHolder: '삭제하시려면 "YES"를 입력하세요.'
				}).then( value => {
					if ( value !== 'YES' ) return;

					const options = {
						cwd: node.documentRoot,
						region: result[ 1 ],
						stage: result[ 0 ]
					};
					return Serverless.invoke( "remove", options, result[ 2 ] );
				});
		});
	}

}
