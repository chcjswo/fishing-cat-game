# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

### 목적

이 문서는 catfishing 프로젝트를 일관된 규칙으로 개발·리뷰·자동화하기 위한 가이드입니다. 아키텍처, 파일별 작성 규칙, 패키지 사용 가이드, 코드 스타일, 빌드/커밋 규칙을 포함합니다.

## 🛠️ 사용 기술

- **Flutter** — UI 프레임워크 (Material Design 3 / `useMaterial3: true`)
- **Riverpod** (`flutter_riverpod` 3.x) — 상태 관리. `Notifier` / `NotifierProvider` / `Provider` / `FutureProvider` 사용
- **go_router** 17.x — 선언적 라우팅 (`ShellRoute` 기반 BottomNavigation)
- **flutter_dotenv** — `.env` 기반 환경 변수
- **google_fonts** — 커스텀 폰트
- **permission_handler** — iOS/Android 런타임 권한
- **intl** — 날짜/숫자/통화/메시지 로케일 포맷
- **http** — REST API 호출
- **flutter_native_splash** / **flutter_launcher_icons** — 스플래시·런처 아이콘 자동 생성
- **package_info_plus**, **url_launcher**, **cached_network_image**, **quick_actions** — 보조 유틸
- _(준비)_ **Firebase** (분석 / Crashlytics), **Google Mobile Ads** (`lib/core/config/admob.dart` 템플릿 보관 중)

## 🏗️ 프로젝트 구조

```
lib/
├── core/                       # 핵심 인프라 (UI 리소스/설정/라우팅)
│   ├── config/
│   │   ├── router.dart         # go_router 단일 정의
│   │   └── admob.dart          # AdMob 핸들러(템플릿, 활성화 시 주석 해제)
│   └── theme/
│       ├── app_colors.dart     # 컬러 팔레트(라이트/다크)
│       ├── app_text_styles.dart# 타이포그래피 시스템
│       └── app_theme.dart      # ThemeData(라이트/다크) 조립
├── features/                   # 화면 단위 기능 모듈 (라우트 1개 = 폴더 1개 권장)
│   ├── home/                   # 홈 탭
│   ├── menu1/                  # 메뉴1 탭
│   ├── menu2/                  # 메뉴2 탭
│   └── settings/               # 설정 + 하위 라우트(추천앱, 문의 진입)
├── shared/                     # 모듈 간 공유 자산
│   ├── models/                 # 데이터 모델 (fromJson/toJson)
│   ├── providers/              # Riverpod 프로바이더
│   ├── services/               # I/O · 외부 API · 비동기 로직
│   └── widgets/                # 재사용 위젯 (셸·다이얼로그 등)
└── main.dart                   # 부트스트랩(.env 로드, ProviderScope, Quick Actions)
```

원칙: **`features/`는 화면**, **`shared/`는 재사용**, **`core/`는 앱 전반의 인프라**로 역할을 분리합니다. 한 모듈이 다른 `features/` 모듈을 직접 import하지 않습니다(공통 코드는 `shared/`로 추출).

## 📁 디렉토리·파일별 작성 가이드

### `lib/main.dart`

- `WidgetsFlutterBinding.ensureInitialized()` → `dotenv.load()` → 스플래시 preserve → `runApp(ProviderScope(...))` 순서를 유지합니다.
- 스플래시 동안 prefetch가 필요한 비동기 작업은 `runApp` 전에 시작해 `ProviderScope.overrides`로 주입합니다(예: `recommendedAppsProvider.overrideWith`).
- Quick Actions 등 플랫폼 채널 초기화는 `addPostFrameCallback`에서 호출합니다.

### `lib/core/config/router.dart`

- 라우트 테이블의 **단일 소스**입니다. 화면 추가 시 이 파일에만 등록합니다.
- 탭 셸은 `ShellRoute`로 감싸고, 현재 인덱스는 `state.uri.path`로 계산해 `BottomNavigation`에 전달합니다.
- 딥링크/리다이렉트(`redirect`), 가드는 라우터 레벨에서 처리합니다(화면 위젯에 인증/리다이렉트 로직을 넣지 않습니다).
- 하위 경로는 `routes:` 중첩으로 표현합니다(예: `/settings/recommended-apps`).

### `lib/core/config/admob.dart`

- 사용 시작 시 `google_mobile_ads` 의존성을 추가하고 주석을 해제합니다. 디버그/프로덕션 광고 ID 분기는 기존 템플릿 구조를 유지합니다.
- 광고 단위 ID는 코드에 직접 두지 말고 `.env` 또는 빌드 시 주입을 검토합니다.

### `lib/core/theme/`

- `app_colors.dart`: 컬러 추가는 여기서만 합니다. **화면/위젯에서 `Color(0x...)` 하드코딩 금지**, 반드시 `AppColors`를 통해 사용합니다.
- `app_text_styles.dart`: Material 3 토큰(display/headline/title/body/label) 명명을 따르며, 화면별 폰트 사이즈 직접 지정은 지양합니다.
- `app_theme.dart`: `ColorScheme`/`AppBarTheme`/`CardTheme` 등 컴포넌트 테마를 한 곳에서 조립합니다. 다크 모드도 같은 파일에 함께 정의합니다.

### `lib/features/<menu>/<menu>_screen.dart`

- **파일 1개 = 화면 1개** 원칙. 폴더명은 라우트 경로와 일치시킵니다.
- 정적 화면은 `StatelessWidget`, 상태 구독이 필요하면 `ConsumerWidget` / `ConsumerStatefulWidget`을 사용합니다.
- 화면 내부에서만 쓰는 위젯은 같은 파일의 private 위젯(`_Foo`) 또는 메서드(`_buildXxx`)로 분리합니다. 외부에서도 쓰면 `shared/widgets/`로 승격합니다.
- 서비스 호출은 직접 하지 말고 `Provider`를 통해 주입합니다.
- AppBar/Card/Color 등은 항상 `Theme.of(context)` 또는 `AppColors`를 통해 가져옵니다.

### `lib/shared/models/`

- 불변(`final` 필드 + `const` 생성자)으로 정의합니다.
- `factory fromJson(Map<String, dynamic> json)`은 **null-safe 디폴트**(`as String? ?? ''` 등)와 누락된 키에 대한 폴백을 항상 둡니다.
- 직렬화(`toJson`)는 필요할 때만 추가합니다.

### `lib/shared/providers/`

- 한 파일에 하나의 도메인 프로바이더(또는 강하게 묶이는 보조 셀렉터)를 둡니다.
- 단순 상태: `NotifierProvider<Notifier, State>`
- 비동기 데이터: `FutureProvider` / `AsyncNotifier`
- 파생 값: `Provider<T>`로 `ref.watch`해 캐싱 — 화면이 직접 변환 로직을 갖지 않게 합니다.
- `ChangeNotifier`는 신규 코드에 도입하지 않습니다(기존 코드도 점진적으로 `Notifier`로 이전).

### `lib/shared/services/`

- 네트워크/스토리지/플랫폼 채널 등 **비동기 I/O 로직 전용**입니다. UI 코드(`BuildContext`, `Widget`) 의존을 두지 않습니다.
- HTTP는 `http` 패키지를 사용하고, `.env` 키는 `dotenv.env['...']`로 읽되 누락 가능성을 방어합니다.
- 큰 응답(예: 16KB 초과)은 `compute(...)`로 isolate에서 디코딩합니다(`recommended_apps_api.dart` 참조).
- 캐시(TTL)·필터링 등 부가 정책은 서비스 내부 정적 필드로 가둡니다.

### `lib/shared/widgets/`

- 두 화면 이상에서 사용되거나, 향후 재사용이 명백한 위젯만 둡니다(섣부른 추출 금지).
- 셸/네비게이션처럼 라우터와 결합되는 위젯은 `go_router`의 `context.go` / `context.push`를 사용합니다.

### `assets/`

- 이미지 소스는 `assets/icons/`에 둡니다. 새 디렉토리를 만들면 `pubspec.yaml`의 `assets:`에 **트레일링 슬래시(`/`)** 와 함께 등록합니다.
- 코드에서는 경로 문자열을 흩뿌리지 말고 `lib/utils/paths.dart` 같은 상수 파일에서 관리하는 것을 권장합니다(현재는 미존재 — 필요 시 신설).

### `.env`

- 민감 정보·외부 URL(`API_URL`, `DISCORD_WEBHOOK_URL`, `RECOMMENDED_APP_SOURCE_ID` 등)은 모두 `.env`에 둡니다. 코드에 하드코딩 금지.
- `.env`는 `pubspec.yaml`의 assets에 등록되어 있어야 런타임에 로드됩니다.

## 라우팅 가이드 (go_router)

- 라우트 정의의 단일 소스는 `lib/core/config/router.dart`입니다. 화면은 `lib/features/**`에 메뉴별 폴더를 만들고 **파일 하나당 화면 하나** 원칙을 지킵니다.
- 하단 탭은 `ShellRoute`로 감싸 공통 레이아웃을 공유합니다.
- 딥링크/리다이렉트/가드 로직은 라우터 레벨에서 처리하고, 화면 위젯이 직접 라우팅을 결정하지 않습니다.
- 화면 간 이동: 탭 전환 등 스택을 비우는 이동에는 `context.go`, 푸시는 `context.push`, 닫기는 `context.pop`을 사용합니다.

## 상태관리 가이드 (Riverpod)

- 전역 상태는 `Notifier` 기반으로 캡슐화하고, **필요한 최소 범위에서 구독**합니다(가능한 한 `ref.watch` 대신 셀렉터 `Provider<Derived>` 또는 `select`를 사용해 리빌드 범위를 좁힙니다).
- 비동기 데이터는 `FutureProvider`/`AsyncNotifier`를 사용하고, **비동기 로직 자체는 `lib/shared/services/`로 분리**합니다(프로바이더는 얇게 유지).
- 액션 호출에는 `ref.read(provider.notifier)`, 값 구독에는 `ref.watch(provider)`를 구분해서 사용합니다.
- 스플래시 등에서 prefetch한 결과는 `ProviderScope(overrides: ...)`로 주입해 화면 진입 시 즉시 사용합니다.

## 권한 처리 (permission_handler)

- **iOS**: 필요한 권한 문자열(`NSPhotoLibraryUsageDescription` 등)을 `ios/Runner/Info.plist`에 추가합니다.
- **Android**: `<uses-permission>`을 `android/app/src/main/AndroidManifest.xml`에 선언하고, 런타임 요청은 공통 헬퍼를 통해 호출합니다(헬퍼가 없다면 `lib/shared/services/`에 신설).
- 화면 위젯에서 직접 `Permission.xxx.request()`를 산발적으로 호출하지 않습니다.

## 국제화 (intl)

- 날짜/시간/통화 포맷은 `intl`의 로케일 기반 API(`DateFormat`, `NumberFormat`)를 사용합니다.
- 텍스트 리소스 분리: 향후 `flutter gen-l10n` 도입을 고려해 사용자 노출 문자열은 `lib/l10n/`에 모으는 것을 권장합니다(현재 한글 문자열이 화면에 직접 박혀 있음 — 점진적 추출 대상).

## 에셋 규칙

- 이미지 소스는 `assets/icons/` 아래에 배치합니다.
- 새 디렉토리 추가 시 `pubspec.yaml`에 디렉토리(끝에 `/`)로 등록하고, 경로는 코드에서 상수로 관리합니다(예: `lib/utils/paths.dart`).
- 원격 이미지는 `cached_network_image`로 로드해 캐시·placeholder를 일관되게 관리합니다.

## 코드 스타일

- **네이밍**: 의미 있는 전체 단어 사용, 축약 지양 (`btn` ❌ → `button` ✅).
- **제어 흐름**: 가드절(early return) 선호, 불필요한 `try/catch` 금지(필요한 경계에서만 사용).
- **주석**: 필수 맥락/의도/엣지 케이스에만 작성, 자명한 주석 금지. `///` 문서 주석은 공개 API에 한정.
- **포맷**: 기존 스타일 유지, 관련 없는 리포맷 금지. `dart format` 기본 설정을 따릅니다.
- **컬러/테마**: 색상은 항상 `lib/core/theme/app_colors.dart`(또는 `Theme.of(context).colorScheme`) 기반으로 사용합니다. **`Color(0x...)` 하드코딩 금지.**
- **상수**: 매직 넘버는 `static const`로 명명. 라우트 경로 등 반복 문자열도 상수화.
- **const**: 가능한 위젯·생성자에 `const`를 붙여 리빌드 비용을 낮춥니다.

## pubspec 규칙

- `assets`는 디렉토리로 등록(트레일링 슬래시 필수):

```yaml
flutter:
  uses-material-design: true
  assets:
    - assets/icons/
    - .env
```

- 새로운 에셋 디렉토리를 추가할 때는 항상 디렉토리로 등록하고, `flutter pub get`을 실행합니다.

## iOS 설정

- `ios/Podfile`의 플랫폼 타깃은 프로젝트 기본값을 유지합니다:

```ruby
platform :ios, '26.0'
```

- Pod 설치/업데이트:

```bash
cd ios && pod install
# 필요 시
pod repo update && pod install
```

## Android 설정

- `minSdkVersion`은 패키지 요구사항을 만족하도록 유지합니다(예: `permission_handler` 21+).
- 런처 아이콘/스플래시 설정 변경 시 `AndroidManifest.xml` 및 그레이들의 자동 생성 섹션을 덮어쓰지 않도록 커스텀 변경은 최소화합니다.

## 스플래시/아이콘 생성 워크플로우

```bash
# 스플래시 이미지/색 변경 후
flutter pub run flutter_native_splash:create

# 런처 아이콘 변경 후
flutter pub run flutter_launcher_icons
```

## 빌드/런 명령

```bash
# 의존성 동기화
flutter pub get

# iOS
cd ios && pod install && cd ..
flutter clean && flutter pub get && flutter run -d ios

# Android
flutter clean && flutter pub get && flutter run -d android
```

## 자주 발생하는 이슈 체크리스트

- 에셋 번들 실패: `pubspec.yaml`의 디렉토리 경로에 트레일링 슬래시(`/`) 있는지 확인
- iOS 타깃 경고: `ios/Podfile`의 `platform :ios, '...'` 확인 후 `pod install`
- 스플래시/아이콘 미적용: 생성 명령 실행 여부 확인
- `.env` 미로드: `pubspec.yaml`의 assets에 `.env`가 등록되어 있는지, `dotenv.load()`가 `runApp` 전에 호출되는지 확인

### 커밋 컨벤션

```
<타입>: <제목 (한국어, 80자 이내)>

- 변경 내용 1
- 변경 내용 2
```

| 타입       | 용도                                           |
| ---------- | ---------------------------------------------- |
| `feat`     | 새로운 기능 추가                               |
| `fix`      | 버그 수정                                      |
| `refactor` | 기능 변경 없는 코드 개선                       |
| `test`     | 테스트 추가/수정                               |
| `docs`     | 문서 변경                                      |
| `style`    | 포맷팅, 세미콜론 등 코드 의미에 영향 없는 변경 |
| `chore`    | 빌드, 설정, 의존성 변경                        |

---

## 작업 프로세스

> **⚠️ 필수 규칙 — 어떤 작업을 진행하든 반드시 지켜야 한다 (예외 없음)**
>
> 1. **작업을 시작하기 전에 최대한 작은 단위로 쪼개서 Todo로 만든다.** 작업 규모와 관계없이 적용한다.
> 2. **각 Todo 단계가 끝나면 반드시 커밋한 뒤에 다음 단계로 넘어간다.** 커밋하지 않은 채 다음 단계를 시작하지 않는다.
> 3. **여러 단계를 묶어서 한 번에 커밋하지 않는다.**
>
> 위 규칙은 선택 사항이 아닌 필수 규칙이며, 모든 작업에 예외 없이 적용된다.

### Todo 기반 단계별 작업

모든 기능 구현은 **Todo를 생성하여 단계별로 작업**하고, **각 단계가 완료될 때마다 커밋**한다.

#### 신규 작업 시 Todo 순서

##### A. 새 화면(Feature) 추가

1. **요구사항 정리** — 라우트 경로, 진입 동선, 표시할 데이터, 의존 권한/.env 키 확인
2. **데이터 모델 작성** — 외부 응답이 있으면 `lib/shared/models/<name>.dart`에 불변 모델·`fromJson` 추가
3. **서비스 작성** — 네트워크/스토리지 I/O가 있으면 `lib/shared/services/<name>_api.dart`에 분리(.env 키 사용·캐시 정책 결정)
4. **Provider 작성** — `lib/shared/providers/<name>_provider.dart`에 `Notifier`/`FutureProvider` 정의(서비스 주입, 파생 셀렉터 분리)
5. **화면 위젯 구현** — `lib/features/<menu>/<menu>_screen.dart` 생성, `ConsumerWidget`/`StatelessWidget` 선택, `AppColors`/`Theme.of(context)` 사용
6. **라우트 등록** — `lib/core/config/router.dart`에 `GoRoute` 추가(필요 시 하위 라우트), 탭 셸 인덱스 매핑 갱신
7. **네비게이션 진입점 연결** — `BottomNavigation` 또는 호출 화면에서 `context.go`/`context.push`로 진입
8. **권한/플랫폼 설정** — 권한이 필요하면 `Info.plist`/`AndroidManifest.xml` 갱신, 런타임 요청은 공통 헬퍼 사용
9. **에셋 추가** — 이미지/폰트가 있으면 `assets/`에 두고 `pubspec.yaml`의 `assets:`에 디렉토리(끝 `/`) 등록, 경로는 상수화
10. **빌드 확인** — `flutter pub get` → `flutter run -d ios|android`로 실 디바이스/에뮬레이터에서 골든 패스·엣지 케이스 동작 확인
11. **커밋** — `feat: <화면 이름> 추가`

##### B. 기존 화면 수정 (UI / 동작 변경)

1. **변경 범위 정의** — 어떤 위젯/Provider만 영향을 받는지 식별
2. **테마/스타일 점검** — 컬러는 `AppColors`, 텍스트 스타일은 `AppTextStyles`/`Theme.of(context).textTheme`에서만 가져오기(하드코딩 발견 시 정리)
3. **상태 의존성 정리** — `ref.watch` 범위를 좁힘(필요 시 `select` 또는 파생 `Provider` 추가)
4. **위젯 수정** — 화면 내부 전용은 같은 파일 private 위젯/메서드, 재사용은 `lib/shared/widgets/`로 승격
5. **빌드/실행 확인** — iOS·Android 양쪽에서 다크/라이트 모드 점검
6. **커밋** — 단순 시각/리빌드 최적화면 `perf:`, 동작 변경이면 `feat:`/`refactor:`

##### C. 버그 수정

1. **재현 시나리오 기록** — 디바이스, OS, 입력값, 기대값/실제값
2. **원인 파악** — 로그·스택 추적 또는 의심 지점부터 가드절·null 처리 검증
3. **최소 수정** — 관련 없는 리포맷·리팩터 금지(가드절 우선, 불필요한 try/catch 추가 지양)
4. **회귀 확인** — 동일 시나리오 + 인접 동선(라우트, Provider 구독자) 재테스트
5. **커밋** — `fix: <증상> 수정`

##### D. 패키지/의존성 추가·업그레이드

1. **필요성 검토** — 기존 패키지(`http`, `intl`, `permission_handler` 등)로 대체 가능한지 먼저 확인
2. **`pubspec.yaml` 수정** — 버전 핀 명확히, dev 전용은 `dev_dependencies`로 분리
3. **`flutter pub get`** 후 `pubspec.lock` 변경 확인
4. **iOS Pod 갱신** — 네이티브 의존이 있으면 `cd ios && pod install`
5. **플랫폼 설정 반영** — `Info.plist` / `AndroidManifest.xml` / Gradle / `min_sdk` 점검
6. **샘플 호출로 동작 확인** — 임시 화면 또는 기존 진입점에서 정상 동작 검증
7. **커밋** — `chore: <패키지> 추가`

##### E. 스플래시/런처 아이콘 변경

1. **소스 이미지 교체** — `assets/icons/splash.png` 또는 `assets/icons/icon.png`
2. **`pubspec.yaml`의 `flutter_native_splash` / `flutter_launcher_icons` 설정 확인**
3. **생성 스크립트 실행**
   - 스플래시: `flutter pub run flutter_native_splash:create`
   - 아이콘: `flutter pub run flutter_launcher_icons`
4. **빌드 확인** — iOS/Android 모두 신규 자원이 적용됐는지 실행으로 확인
5. **커밋** — `chore: 스플래시/아이콘 갱신`

##### F. 환경 변수(.env) 변경

1. **키 추가/수정** — `.env`에 `KEY=VALUE` 추가(민감 정보는 절대 코드에 두지 않음)
2. **사용처에서 안전 접근** — `dotenv.env['KEY'] ?? '<fallback>'` 패턴, 누락 시 동작 정의
3. **`pubspec.yaml`의 `assets`에 `.env` 등록 여부 확인**
4. **빌드 확인** — `dotenv.load()`가 `runApp` 전에 호출되는지 검증
5. **커밋** — `chore: .env에 <키> 추가`

##### G. 일반 원칙 (모든 Todo에 공통 적용)

- **각 단계는 독립적으로 빌드 가능한 단위**여야 한다(중간 커밋이 깨지지 않도록).
- 단계 완료 시점마다 **즉시 커밋**한다. 여러 단계를 묶어 한 번에 커밋하지 않는다.
- Todo는 **체크 가능한 동사형**으로 작성한다(예: "라우트 등록", "Provider 추가"). 모호한 "구현"은 지양.
- 작업이 막히면 Todo에 **블로커 항목**을 추가하고 우선순위를 재조정한다.
