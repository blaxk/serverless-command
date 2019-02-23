## Serverless Framework integration for VS Code

This extension enables an integration of Serverless projects with VSCode. It eliminates the need
to start Serverless commands from a separate command line.

## Installation

In order to install an extension you need to open the extension palette and search for serverless-vscode.
You can then install it.

### Alpha version

This is currently an alpha version, that integrates only a subset of possible commands.
See the GitHub repository for remaining planned features for the final version. You're encouraged to
test the version and create additional feature requests.

**Currently the extension only supports Serverless projects with Serverless installed locally!**

That means, that Serverless must be a development dependency of the project itself. A subsequent
version of the extension will also support the globally installed Serverless framework and a
configuration for that.

## Configuration

The extension supports user and workspace configuration. To access the configuration settings,
open `File->Preferences->Settings` (workspace or user) and expand the `Serverless Configuration` node.

The following configuration settings are available:

### serverless.aws.defaultStage

The defult stage that is assumed, if you just press ENTER in the stage input field when executing a command.

### serverless.aws.defaultRegion

The defult region that is assumed, if you just press ENTER in the stage input field when executing a command. See also `serverless.aws.askForRegion`.

### serverless.defaultNodeModulesPath

node_modules 경로를 설정 ('npm root -g' 명령어로 확인 가능)
default: /usr/local/lib/node_modules


## Usage

### The Serverless outline

As soon as you have added a Serverless project to your workspace, you can select the `serverless.yml`
in the Explorer tree view. Then an outline is shown in the Explorer view, that shows the parsed
structure of your Serverless service definition.
The outline will contain a `functions` and an `API` hive, which contain the defined functions in the
project and the defined API endpoint hierarchy. Each item in the outline has a context menu that allows
access to context specific commands. Most of the command will ask you for the target stage when triggered.

#### Top container objects

Each of the top hives has a context menu that lets you invoke service/project related functions.

![Function](images/service-demo.png "Service")

##### Package

Package will ask for the stage and optionally region and packages the service with `serverless package`.

##### Deploy

Package will ask for the stage and optionally region and deploys the service with `serverless deploy`.

##### Variable resolution (Resolve)

Resolve allows you to show a generated `resolved.yml`, i.e. your `serverless.yml` with all Serverless
variables resolved to their values for a selected stage.

#### Functions

The functions hive lets you analyze your service function-wise and contains a node for each function.
Each function then contains a list of all defined HTTP endpoints in the function definition.

![Function](images/function-demo.png "Function")

All function related commands of the extension can be called via the context menu of the function.

![FunctionContext](images/function-context.png "Function context menu")

##### Deploy function

Deploys the selected function with `serverless deploy function`. Attention: In general, single function
deployment does not replace a service deployment. See the Serverless documentation for details.

##### Invoke Function

함수를 호출할때 사용될 데이타를 `test/{함수명}.json` 으로 저장해 놓으면 해당 json 파일을 참조하여 함수를 호출

##### Show logs

Retrieve and show the online logs of the deployed function in the output pane.

##### Open handler

Open the handler source file that is associated with the function.

#### API

The API hive shows the combined API that will eventually be deployed to API Gateway.

## Releases

See the CHANGELOG.md file.