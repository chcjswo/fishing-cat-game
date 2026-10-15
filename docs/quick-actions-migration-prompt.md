# Quick Actions 이식용 프롬프트

다른 Flutter 프로젝트에 홈 화면 앱 아이콘 길게 누르기(Quick Actions / App Shortcuts)를 **이 저장소와 동일하게** 넣을 때 사용한다. 아래 **복사용 블록**을 Cursor 등에 그대로 붙여 넣고, 하단 체크리스트만 채운다.

---

## 복사용 프롬프트

```
당신은 Flutter 프로젝트에 홈 화면 앱 아이콘 길게 누르기(Quick Actions / App Shortcuts)를 추가한다. 아래 요구사항을 순서대로 모두 반영하고, 빠진 단계 없이 빌드 가능한 상태로 마무리한다.

## 목표 동작
- 런처에서 앱 아이콘을 길게 누르면 바로가기 메뉴에 다음 두 항목이 **위에서 아래 순서**로 나온다.
  1) "앱 열기" → 앱 루트(홈) 화면으로 이동
  2) "[문의 제목 문자열]" → 문의/피드백 화면으로 이동
- iOS에서는 아이콘이 SF Symbols **선 스타일**로 보이게 한다(템플릿 PNG 검은 네모 방지).
- Android에서는 각 항목에 흰색 단색 벡터 아이콘(drawable)을 쓴다.

## 의존성
- `pubspec.yaml`에 `quick_actions: ^1.1.0` (또는 최신 호환 버전) 추가 후 `flutter pub get` 한다.

## Dart (앱 진입점)
- `main.dart` 또는 앱이 처음 올라온 뒤 한 번만 실행되는 위치(예: `MaterialApp`을 감싼 `ConsumerStatefulWidget`의 `initState` + `addPostFrameCallback`)에서 다음을 구현한다.
- 상수:
  - `kOpenAppQuickActionType = 'open_app_home'` (고유 문자열)
  - `kFeedbackQuickActionType = 'feedback_bug'` (고유 문자열, 기존과 충돌 없게 조정 가능)
- `QuickActions().initialize((shortcutType) { ... })` 콜백에서:
  - `kFeedbackQuickActionType`이면 **[문의 라우트 경로]**로 `go_router` 등 프로젝트의 라우터로 이동 (예: `router.go('/settings/feedback')`).
  - `kOpenAppQuickActionType`이면 루트로 이동 (예: `router.go('/')`).
- `QuickActions().setShortcutItems([ ... ])`에 **반드시 이 순서**로 넣는다: 먼저 앱 열기, 다음 문의 (앱 전용 바로가기 목록에서 아래쪽에 문의를 두기 위함).
- `defaultTargetPlatform == TargetPlatform.iOS` 분기:
  - 앱 열기 아이콘 문자열: `'sf:house'`
  - 문의 아이콘 문자열: `'sf:envelope'`
- Android 분기:
  - 앱 열기: drawable 이름 `'ic_quick_home'`
  - 문의: drawable 이름 `'ic_quick_feedback'`
- `import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform;` 사용.
- 문의 항목 표시 제목은 `"[문의 제목 문자열]"` 로 한다 (프로젝트에 맞게 한글 수정 가능, 예: "문의사항이 있어요").

## Android
- `android/app/src/main/res/drawable/ic_quick_home.xml` 추가: 24dp 뷰포트, 흰색(#FFFFFFFF) Material 스타일 **집(home)** 아이콘 pathData.
- `android/app/src/main/res/drawable/ic_quick_feedback.xml` 추가: 24dp 뷰포트, 흰색 **편지봉투(mail)** 아이콘 pathData (Material mail 24dp 경로 사용).
- 패키지/리소스 이름은 해당 앱의 `applicationId`와 충돌 없게 유지한다.

## iOS — quick_actions_ios SF Symbols 패치 (필수)
- pub 캐시의 원본만 수정하지 말고, 저장소에 **패치 파일**을 두고 CocoaPods `post_install`에서 복사한다.
- `ios/patches/QuickActionsPlugin.swift` 파일을 추가한다. 내용은 `quick_actions_ios` 플러그인의 `QuickActionsPlugin.swift`와 동일하되, `convertShortcutItemMessageToUIApplicationShortcutItem`에서 아이콘 생성 시:
  - 문자열이 `sf:` 로 시작하면 `UIApplicationShortcutIcon(systemImageName:)` (iOS 15+)에 `sf:` 뒤의 심볼 이름을 넣는다.
  - 그렇지 않으면 기존처럼 `UIApplicationShortcutIcon(templateImageName:)` 을 쓴다.
- `ios/Podfile` 상단에 `require 'fileutils'` 추가.
- `post_install` 블록 끝에 다음 로직 추가:  
  `File.join(__dir__, '.symlinks', 'plugins', 'quick_actions_ios', 'ios', 'quick_actions_ios', 'Sources', 'quick_actions_ios', 'QuickActionsPlugin.swift')` 경로가 있으면 `ios/patches/QuickActionsPlugin.swift` 로 `FileUtils.cp` 덮어쓰기. 실패 시 조용히 넘어가지 말고 `pod install` 로그에 패치 적용 여부를 출력.
- 프로젝트 배포 타깃 iOS 버전이 15 미만이면 SF Symbol API 사용 불가이므로, 최소 버전을 15 이상으로 맞추거나 이 방식 대신 에셋 카탈로그 템플릿 이미지를 쓰도록 분기한다(이 프롬프트는 15+ 가정).

## 라우터
- `go_router` (또는 사용 중인 라우팅)에 문의 화면 경로가 실제로 존재해야 한다. 없으면 동일한 피드백 화면과 경로를 추가한다.

## 검증
- `cd ios && pod install` 후 iOS 시뮬레이터/기기에서 아이콘 길게 눌러 두 항목 순서·아이콘·탭 동작 확인.
- Android 기기/에뮬에서 동일 확인.
- 변경 파일만 커밋하고, 불필요한 리팩터링은 하지 않는다.

## 이 프로젝트에서 맞출 값 (작업자가 채움)
- [ ] 문의 화면 라우트 경로: _______________
- [ ] 루트(홈) 경로: _______________ (보통 `/`)
- [ ] 문의 메뉴 제목 문자열: _______________
- [ ] 앱 표시명(필요 시 "앱 열기" 문구 조정): _______________
```

---

## 참고 (BaseApp 기준)

| 항목 | 이 저장소에서의 예시 |
|------|---------------------|
| 문의 라우트 | `/settings/feedback` |
| 루트 | `/` |
| iOS 패치 파일 | `ios/patches/QuickActionsPlugin.swift` |
| Podfile 복사 로직 | `ios/Podfile` 의 `post_install` |

## 사용 팁

- 라우터가 `go_router`가 아니면 프롬프트 안의 `router.go(...)`만 해당 앱의 네비게이션 API로 바꾸라고 한 줄 덧붙인다.
- `quick_actions` 가 없는 브랜치에 적용하면 diff가 명확하다.
- iOS는 앱이 등록한 바로가기가 항상 '홈 화면 편집' 등 **시스템 항목보다 위**에만 온다. 문의만 **앱 바로가기 구역 안에서** 아래에 두려면 '앱 열기' 항목을 그 위에 두는 방식이 이 프롬프트에 포함되어 있다.
