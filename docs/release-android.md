# Android 릴리스 빌드

## 서명 키 (업로드 키)

- keystore: 저장소 밖에 둔다 (예: `~/keystores/catfishing-upload.jks`). 커밋 금지.
- 비밀번호·별칭: `android/key.properties` (gitignore 대상, 커밋 금지)
- **백업 필수**: keystore와 key.properties를 안전한 곳(비밀번호 관리자, 암호화 백업)에
  보관한다. 업로드 키를 잃으면 Play Console에서 키 재설정 절차를 거쳐야 한다.
- 형식: PKCS12 — store/key 비밀번호가 같아야 한다 (keytool 기본 동작).

키 생성 예:

```bash
keytool -genkeypair -v -keystore ~/keystores/catfishing-upload.jks \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

`android/key.properties` 형식:

```properties
storeFile=C:/Users/<me>/keystores/catfishing-upload.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

key.properties가 없는 머신에서는 릴리스 빌드가 디버그 키로 서명된다
(`flutter run --release` 개발 편의용). **스토어 제출용 AAB는 반드시
key.properties가 있는 상태에서 빌드한다.**

## 빌드

```bash
# 게임 원본(games/) 수정 후에는 항상 자산 동기화 먼저 (assets/game 은 gitignore)
dart run tool/sync_game_assets.dart

# Play 제출용 AAB
flutter build appbundle --release   # → build/app/outputs/bundle/release/app-release.aab

# 실기기 스모크 테스트용 APK
flutter build apk --release
flutter install -d <deviceId>
```

버전은 `pubspec.yaml`의 `version: X.Y.Z+N`이 versionName(X.Y.Z)/versionCode(N)로
그대로 쓰인다. 스토어에 올릴 때마다 `+N`을 올린다.

난독화(R8 minify + resource shrink)는 release 빌드 타입에 적용되어 있고,
flutter_inappwebview가 리플렉션으로 쓰는 클래스는 `android/app/proguard-rules.pro`에서
유지된다.

## 제출 전 체크리스트

- [ ] `games/game.js`의 `TEST_MODE = false` 확인
- [ ] `flutter test`, `node test/game_js/run_all.cjs` 통과
- [ ] 릴리스 빌드 실기기 스모크: 1스테이지 플레이→결과, 뒤로가기 종료 확인(플레이 중
      멈춤·취소 시 이어하기), 햅틱(물고기·피격·폭탄·FEVER), 점수 공유 시트,
      홈 이동 후 복귀 시 일시정지, 앱 재실행 후 최고 점수·사운드 설정 유지,
      비행기 모드 동작
- [ ] `jarsigner -verify build/app/outputs/bundle/release/app-release.aab` → "jar verified"
      (업로드 키로 서명됐는지 `jarsigner -verify -verbose -certs`로 인증서도 확인)

## localStorage origin (포트)

게임 세이브(최고 점수·사운드 설정)는 `http://localhost:38219` origin의 localStorage에
저장되므로 포트를 바꾸면 기존 사용자의 세이브가 사라진다. **첫 공개 릴리스 이후 변경 금지.**
(`lib/shared/services/game_server.dart`의 `gameServerPort`)

## 빌드 크기 참고 (2026-10-16, 1.0.0+1, 디버그 키 서명)

AAB 72.1MB 중 24.4MB는 Play가 크래시 분석에만 쓰는 디버그 심볼이고, ABI별 분할
설치라 기기는 아키텍처 하나만 받는다. 기기 다운로드 추정치는 약 37MB
(게임 자산 약 26MB + 네이티브 라이브러리 약 7MB + 리소스 3MB).

## 빌드 환경 주의

- 프로젝트(E:)와 pub 캐시(C:)가 다른 드라이브면 플러그인 Kotlin 증분 캐시 오류가
  나므로 `android/gradle.properties`에 `kotlin.incremental=false`를 둔다.
- flutter_inappwebview stable(6.1.5)은 AGP 9에서 빌드되지 않아 6.2.0-beta.3을 쓴다.
  stable이 AGP 9를 지원하면 교체한다.
