import Events from 'events'

const vscodeApi = acquireVsCodeApi()


class VSCode extends Events {
	constructor () {
		super()
	}
	
	send (message) {
		vscodeApi.postMessage(message);
	}
}

const vscode = new VSCode()

window.addEventListener('message', (e) => {
	const message = e.data; // The json data that the extension sent
	vscode.emit(message.type, message);

	// switch (message.command) {
	// 	case 'ready':
	// 		break
	// 	case 'clearColors':
	// 		break
	// }
})

export default vscode