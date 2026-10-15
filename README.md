# 앱 아이콘 및 스플래시 화면 적용 방법
## 앱 아이콘 적용 방법

assets/icons/icon.png 경로에 이미지를 추가하세요.

앱 아이콘 적용 시 아래 명령어를 입력하세요.

```
flutter pub run flutter_launcher_icons
```

## 스플래시 화면 적용 방법

assets/icons/splash.png 경로에 이미지를 추가하세요.

스플래시 화면 적용 시 아래 명령어를 입력하세요.

```
flutter pub run flutter_native_splash:create
```

스플래시 화면 변경 시 아래 명령어를 입력하세요.

```
flutter pub run flutter_native_splash:remove

flutter clean
flutter pub get

flutter pub run flutter_native_splash:create
```

### 설정

⚠️ **중요**: 환경 설정 파일들은 보안상 이유로 포함되어 있지 않습니다. 각 개발자가 직접 생성해야 합니다.

#### 환경 변수 설정

1. `.env.example`을 복사하여 `.env` 파일 생성:
   ```bash
   cp .env.example .env
   ```
2. `.env` 파일을 열어 실제 값으로 변경

#### Firebase 설정

1. [Firebase Console](https://console.firebase.google.com)에서 새 프로젝트 생성
2. Android 앱 추가:
   - 패키지명: `com.dingco.vibecoding`
   - `google-services.json` 다운로드 → `android/app/`에 저장
   - 예제 파일: `android/app/google-services.json.example` 참고
3. iOS 앱 추가:
   - 번들 ID: `com.dingco.vibecoding`
   - `GoogleService-Info.plist` 다운로드 → `ios/Runner/`에 저장
   - 예제 파일: `ios/Runner/GoogleService-Info.plist.example` 참고

#### Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. `lib/core/config/supabase_config.dart` 업데이트:
   ```dart
   class SupabaseConfig {
     static const String url = '여기에_SUPABASE_URL';
     static const String anonKey = '여기에_SUPABASE_ANON_KEY';
   }
   ```

#### 카카오 로그인 설정

1. [Kakao Developers](https://developers.kakao.com)에서 앱 등록
2. `lib/core/config/kakao_config.dart` 업데이트:
   ```dart
   class KakaoConfig {
     static const String nativeAppKey = '여기에_NATIVE_APP_KEY';
   }
   ```

### 앱 실행

```bash
# 연결된 기기에서 실행
flutter run

# 특정 플랫폼에서 실행
flutter run -d android
flutter run -d ios

# 자세한 로그 출력과 함께 실행
flutter run -v
```

## 🏗️ 프로젝트 구조

```
lib/
├── core/               # 핵심 기능
│   ├── theme/         # 앱 테마 및 스타일링
│   ├── constants/     # 앱 상수
│   └── config/        # 설정 파일
├── features/          # 기능 모듈
│   ├── auth/         # 인증
│   ├── home/         # 홈 화면
│   ├── profile/      # 사용자 프로필
│   └── demo/         # 데모 화면
├── shared/           # 공유 컴포넌트
│   ├── widgets/      # 재사용 가능한 위젯
│   ├── services/     # 서비스 클래스
│   └── providers/    # Riverpod 프로바이더
└── main.dart         # 앱 진입점
```

## 🛠️ 사용 기술

- **Flutter** - UI 프레임워크
- **Riverpod** - 상태 관리
- **Supabase** - Backend as a Service
- **Firebase** - 분석 및 Crashlytics
- **Google Mobile Ads** - 수익화
- **Material Design 3** - 디자인 시스템

## 🚀 배포

### Android

1. 서명 키 생성:
   ```bash
   keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
   ```

2. 릴리즈 APK/AAB 빌드:
   ```bash
   flutter build apk --release
   flutter build appbundle --release
   ```

### iOS

1. Xcode에서 열기:
   ```bash
   open ios/Runner.xcworkspace
   ```

2. 서명 설정 및 빌드:
   ```bash
   flutter build ios --release
   ```

## 🐛 문제 해결

### 자주 발생하는 문제

**Android 빌드 에러**
```bash
cd android && ./gradlew clean && cd ..
flutter clean && flutter pub get
```

**iOS 빌드 에러**
```bash
cd ios && pod deintegrate && pod install && cd ..
```

**권한 문제**
- iOS: `Info.plist`에 사용 설명 추가
- Android: `AndroidManifest.xml`에 권한 추가