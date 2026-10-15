---
name: flutter-optimizer
description: Flutter 프로젝트의 성능 최적화를 체크하는 스킬. 사용자가 "프로젝트 전체적으로 최적화 관련 체크해줘", "Flutter 앱 성능 분석해줘", "최적화 체크리스트 확인해줘" 등을 요청할 때 사용. 8가지 핵심 항목(메모리 누수, 과도한 리빌드, 비효율적 리스트, 무거운 UI 작업, 최적화 안된 이미지, 불필요한 패키지, 상태 관리, const 생성자)을 우선순위별로 체크하고 구체적인 개선 방안 제시.
---

# Flutter Optimizer

Flutter 앱의 성능 최적화를 위한 포괄적인 분석 및 권장사항 제공 스킬.

## 최적화 체크 항목

이 스킬은 다음 8가지 핵심 항목을 우선순위별로 체크:

### Priority 1 (높음) - 즉시 수정 필요
1. **메모리 누수**: StreamController, AnimationController, Timer 등의 리소스 미정리
2. **과도한 리빌드**: build 내 setState, Provider.of without listen: false
3. **무거운 UI 스레드 작업**: 동기 파일 I/O, JSON 파싱 without compute

### Priority 2 (중간) - 가능한 빠르게 수정
4. **비효율적인 리스트 렌더링**: ListView without builder, 많은 children
5. **최적화 되지 않은 이미지**: cacheHeight/cacheWidth 미설정, 부적절한 포맷
6. **상태 관리**: 전역 변수, 과도한 setState, async 후 context 사용

### Priority 3 (낮음) - 시간 날 때 수정
7. **불필요한 패키지**: pubspec.yaml의 미사용 패키지
8. **const 생성자 누락**: const 키워드로 최적화 가능한 위젯

## 사용 방법

### 1. 자동 분석 (권장)

프로젝트 루트 디렉토리에서 analyzer.py 스크립트 실행:

```bash
python scripts/analyzer.py /path/to/flutter/project
```

스크립트는 프로젝트 전체를 스캔하고 JSON 형태로 결과 반환.

### 2. 수동 체크

프로젝트가 업로드되지 않았거나 빠른 체크가 필요한 경우:

1. 사용자에게 프로젝트 구조 또는 특정 파일 업로드 요청
2. `references/optimization_guide.md` 참조하여 각 항목별 패턴 검사
3. 발견된 이슈를 우선순위별로 정리하여 보고

### 3. 특정 항목만 체크

사용자가 특정 항목만 체크 요청 시:
- 해당 항목의 가이드를 `references/optimization_guide.md`에서 참조
- 관련 패턴만 집중 검사
- 구체적인 코드 예시와 함께 개선 방안 제시

## 분석 결과 제공 형식

### 요약
```
총 발견된 이슈: X개
- 높음 (Priority 1): X개
- 중간 (Priority 2): X개  
- 낮음 (Priority 3): X개
```

### 상세 리포트

각 우선순위별로:

**[Priority Level] - [Category]**
- 파일: `파일경로`
- 라인: `라인번호` (있는 경우)
- 문제: 구체적인 문제 설명
- 개선 방안: 코드 예시와 함께 해결 방법

### 예시

```
🔴 Priority 1 (높음) - 즉시 수정 필요

1. 메모리 누수
   - 파일: lib/screens/home_screen.dart (라인 25)
   - 문제: AnimationController가 dispose()에서 정리되지 않음
   - 개선 방안:
     ```dart
     @override
     void dispose() {
       _controller.dispose();
       super.dispose();
     }
     ```

2. 과도한 리빌드
   - 파일: lib/widgets/counter.dart (라인 42)
   - 문제: build 메서드 내에서 setState 호출
   - 개선 방안: setState를 별도 메서드로 분리
```

## 분석 스크립트 상세

`scripts/analyzer.py`는 다음을 수행:

1. **프로젝트 스캔**: `lib/` 디렉토리의 모든 .dart 파일 분석
2. **패턴 매칭**: 각 최적화 항목에 대한 안티패턴 검색
3. **우선순위 분류**: 발견된 이슈를 severity와 priority로 분류
4. **결과 생성**: JSON 형태로 구조화된 결과 반환

### 스크립트 출력 구조
```json
{
  "summary": {
    "total_issues": 15,
    "by_category": {
      "memory_leak": 3,
      "excessive_rebuild": 5,
      "inefficient_list": 2,
      ...
    }
  },
  "issues_by_priority": {
    "high": [...],
    "medium": [...],
    "low": [...]
  }
}
```

## 상세 가이드 참조

각 최적화 항목에 대한 자세한 설명, 코드 예시, 해결 방법은 `references/optimization_guide.md` 참조.

특히 다음 섹션이 유용:
- 각 항목별 "주요 패턴" - 나쁜 예와 좋은 예
- "검사 방법" - 수동으로 체크하는 방법
- "추가 최적화" - 더 나은 성능을 위한 팁
- "성능 분석 도구" - Flutter DevTools 사용법

## 작업 흐름

1. **분석 준비**
   - Flutter 프로젝트 경로 확인
   - 분석 범위 결정 (전체 vs 특정 항목)

2. **자동 분석 실행**
   - analyzer.py 스크립트 실행
   - 결과 JSON 파싱

3. **결과 해석**
   - 우선순위별로 이슈 그룹화
   - 각 이슈에 대한 상세 설명 추가
   - optimization_guide.md 참조하여 개선 방안 제시

4. **리포트 작성**
   - 요약 (총 이슈 수, 우선순위별 분포)
   - 높은 우선순위 이슈부터 상세 설명
   - 각 이슈에 코드 예시 포함
   - 권장 다음 단계 제시

5. **추가 조언**
   - Flutter DevTools 사용 권장
   - 프로파일 모드 테스트 제안
   - 주기적인 체크 권장

## 사용자 상호작용

### 전체 체크 요청
사용자: "프로젝트 전체적으로 최적화 관련 체크해줘"
→ analyzer.py 실행 → 전체 리포트 제공

### 특정 항목 체크
사용자: "메모리 누수만 체크해줘"
→ 해당 항목만 집중 분석 → 관련 결과만 제공

### 파일별 체크
사용자: "이 파일 최적화 체크해줘" + 파일 업로드
→ 해당 파일만 분석 → 발견된 이슈 리스트

### 개선 방안 요청
사용자: "이 문제 어떻게 고쳐?"
→ optimization_guide.md 참조 → 구체적 코드 예시 제공

## 주의사항

1. **False Positives**: 자동 분석은 100% 정확하지 않을 수 있음. 의심스러운 경우 "검토 필요"로 표시
2. **Context 고려**: 일부 패턴은 특정 상황에서 정당화될 수 있음
3. **버전 차이**: Flutter 버전에 따라 최적화 방법이 다를 수 있음
4. **Trade-offs**: 성능과 코드 가독성 사이의 균형 고려

## 유용한 명령어

```bash
# 프로파일 모드로 앱 실행 (성능 측정용)
flutter run --profile

# 코드 분석
flutter analyze

# DevTools 실행
flutter pub global activate devtools
flutter pub global run devtools

# 릴리즈 빌드 크기 분석
flutter build apk --analyze-size
```

## 참고 자료

- Flutter 공식 성능 가이드: https://docs.flutter.dev/perf
- Flutter DevTools: https://docs.flutter.dev/tools/devtools
- Dart 언어 가이드: https://dart.dev/guides
