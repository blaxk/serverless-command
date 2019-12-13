해당 extension은 기존 serverless-vscode extension을 기반으로 재설계 되었으며,
해당 프로젝트 개발에 최적화 되어 있어 Visual Studio Marketplace 에 등록하지 않았다.
향후 프로젝트 특성에 맞춰 업데이트 될 계획이다.

## Configuration

`기본설정 > 설정 > Serverless Command` 로 들어가 설정한다.

### serverless.aws.defaultStage

기본 stage 설정 (default: "dev")

### serverless.aws.defaultRegion

기본 region 설정 (default: "ap-northeast-2")

### serverless.defaultNodeModulesPath

node_modules 경로를 설정 ('npm root -g' 명령어로 확인 가능)
default: /usr/local/lib/node_modules

### serverless.aws.credentials

AWS credentials 별칭을 별도로 설정시 사용
~/.aws/credentials 파일의 등록되어 있는 정보 (default: "default")


##### Package service

`serverless package`.
AWS에 배포가 가능한 상태로 .serverless 폴더에 해당 파일들을 packaging한다.

##### Deploy service

`serverless deploy`
AWS에 어플리케이션을 배포한다.
모든 설정이 배포되기 때문에 수분이 소요된다.

##### Variable resolution (Resolve)

Resolve를 사용하면 생성 된`resolved.yml ', 즉 모든 serverless 변수가 선택된 스테이지에 대한 값으로 해석 된`serverless.yml`을 볼 수 있습니다.

##### Deploy function

`serverless deploy function`
해당 함수와 관련된 파일을 AWS에 배포한다.
배포속도가 빠르다.

##### Invoke Function

`serverless invoke function`
해당 함수를 AWS Lambda 에서 호출한다.
`test/{함수명}.json` 파일을 참조하여 호출 (해당 파일이 없으면 오류가 발생한다.)

##### Show logs

출력 창에 배포 된 기능의 온라인 로그를 검색하고 표시합니다.

##### Open handler

함수와 관련된 핸들러 소스 파일(index.js)을 엽니다.


