# 키스토어 파일 생성 방법

아래 명령어를 통해 키스토어 파일을 생성합니다.
명령어 입력 시 project-name 을 변경해주세요.

```
keytool -genkey -v -keystore project-name.jks -keyalg RSA -keysize 2048 -validity 10000 -alias project-name
```

키를 생성했다면 android/app/keystore/project-name.jks 경로로 옮겨주세요.

# Key Properties 파일 생성

프로젝트의 android 디렉토리에 key.properties 파일을 생성하고 아래 내용을 입력합니다.

```
storePassword=<앞서 설정한 비밀번호>
keyPassword=<앞서 설정한 비밀번호>
keyAlias=<project-name>
storeFile=keystore/<project-name>.jks
```