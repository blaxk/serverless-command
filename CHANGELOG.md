## 1.5.3
- AWS CloudWatchLogs messages -  html parsing 개선 및 sorting 기능 추가
- AWS CloudWatchLogs - Lambda로그 이외의 Log groups도 조회할 수 있도록 수정
- Invoke function 실행시 참조되는 <functionName>.json 파일의 상위 폴더경로 설정할 수 있도록 수정
- 기타 개선

## 1.5.0
- AWS CloudWatchLogs Context Menu에 추가
- serverless.yml 파일인식 개선

# 1.4.0
- serverless 최신 버전에서 --aws-profile 옵션을 오류처리 하므로, AWS Credentials profile 설정 `export AWS_PROFILE={profile}` 으로 적용 되도록 변경
- firstCommand 옵션추가
- nodeModulesPath 옵션삭제

## 1.3.3
- AWS Credentials profile 설정하지 않으면 --aws-profile 옵션 들어가지 안도록 수정, 기본값=""
- Lambda 별칭을 사용할 수 있도록 설정 추가

## 1.2.0
- TreeView 에서 다중 service 보여지도록 수정

## 1.1.5
- TreeView를 사용하여 UI 개선

## 1.0.6
- AWS Credentials 변경 설정 추가

## 1.0.5
- Invoke function 옵션 추가
- Deploy service 하지 않은 상태에서 Invoke function 호출시 반응이 없을때 프로세스 중지 안내 추가
- Remove 옵션 추가
