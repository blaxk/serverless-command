import * as _ from 'lodash';

import { NodeKind, ServerlessNode } from './ServerlessNode';
import ServiceTreeProvider from './ServiceTreeProvider';


export default class LogsTreeProvider extends ServiceTreeProvider {

	protected makeChildren (serverless: any, documentRoot: string) {
		// only aws
		if (/^aws$/i.test(serverless.provider.name)) {
			const functionRootNode = new ServerlessNode(serverless.service, NodeKind.LOG_CONTAINER);

			_.forOwn(serverless.functions, (func, funcName) => {
				const functionNode = new ServerlessNode(func.name, NodeKind.LOG_GROUP, func);
				functionRootNode.children.push(functionNode);
			});

			functionRootNode.setDocumentRoot(documentRoot);
			this.nodes.children.push(functionRootNode);
		}
	}
}
