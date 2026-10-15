# Flutter Performance Optimization Guide

이 문서는 Flutter 앱 최적화를 위한 8가지 핵심 항목에 대한 상세 가이드입니다.

## 1. 메모리 누수 (Memory Leaks)

### 위험도: 높음 (Priority 1)

메모리 누수는 앱의 안정성과 성능에 직접적인 영향을 미칩니다.

### 주요 패턴

#### StreamController 미정리
```dart
// ❌ 나쁜 예
class MyWidget extends StatefulWidget {
  final StreamController<int> _controller = StreamController<int>();
  // dispose에서 close하지 않음
}

// ✅ 좋은 예
class MyWidget extends StatefulWidget {
  final StreamController<int> _controller = StreamController<int>();
  
  @override
  void dispose() {
    _controller.close();
    super.dispose();
  }
}
```

#### AnimationController 미정리
```dart
// ❌ 나쁜 예
class MyWidget extends StatefulWidget {
  late AnimationController _controller;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: Duration(seconds: 1),
    );
  }
  // dispose 없음
}

// ✅ 좋은 예
class MyWidget extends StatefulWidget {
  late AnimationController _controller;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: Duration(seconds: 1),
    );
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

#### Timer 미정리
```dart
// ❌ 나쁜 예
Timer.periodic(Duration(seconds: 1), (timer) {
  // 작업 수행
});

// ✅ 좋은 예
late Timer _timer;

@override
void initState() {
  super.initState();
  _timer = Timer.periodic(Duration(seconds: 1), (timer) {
    // 작업 수행
  });
}

@override
void dispose() {
  _timer.cancel();
  super.dispose();
}
```

### 검사 방법
- DevTools의 Memory 탭 사용
- `dispose()` 메서드 누락 확인
- Stream, Timer, Animation 리소스 정리 확인

---

## 2. 과도한 리빌드 (Excessive Rebuilds)

### 위험도: 높음 (Priority 1)

불필요한 리빌드는 프레임 드롭과 배터리 소모를 야기합니다.

### 주요 패턴

#### build 메서드 내 setState
```dart
// ❌ 나쁜 예 - 무한 루프 발생
@override
Widget build(BuildContext context) {
  setState(() {}); // 절대 금지!
  return Container();
}

// ✅ 좋은 예
@override
Widget build(BuildContext context) {
  return Container();
}

void someMethod() {
  setState(() {
    // 상태 변경
  });
}
```

#### Provider.of without listen: false
```dart
// ❌ 나쁜 예 - 모든 변경사항에 리빌드
@override
Widget build(BuildContext context) {
  final data = Provider.of<MyModel>(context);
  // 단순 읽기만 하는데 리빌드됨
  return Text(data.value);
}

// ✅ 좋은 예
@override
Widget build(BuildContext context) {
  final data = Provider.of<MyModel>(context, listen: false);
  return Text(data.value);
}

// ✅ 더 좋은 예 - Consumer 사용
@override
Widget build(BuildContext context) {
  return Consumer<MyModel>(
    builder: (context, model, child) => Text(model.value),
  );
}
```

#### 큰 위젯 트리에서의 setState
```dart
// ❌ 나쁜 예 - 전체 위젯이 리빌드됨
class MyPage extends StatefulWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Header(),
        Content(),
        Footer(),
      ],
    );
  }
  
  void updateSomething() {
    setState(() {}); // 전체가 리빌드!
  }
}

// ✅ 좋은 예 - 변경되는 부분만 분리
class MyPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Header(),
        DynamicContent(), // 이 부분만 StatefulWidget
        Footer(),
      ],
    );
  }
}
```

### 검사 방법
- `debugPrintRebuildDirtyWidgets = true` 설정
- Performance Overlay 사용
- Flutter DevTools의 Widget Rebuild Stats

---

## 3. 비효율적인 리스트 렌더링 (Inefficient List Rendering)

### 위험도: 중간 (Priority 2)

큰 리스트의 비효율적 렌더링은 스크롤 성능 저하를 일으킵니다.

### 주요 패턴

#### ListView with children
```dart
// ❌ 나쁜 예 - 모든 아이템을 한번에 생성
ListView(
  children: items.map((item) => ItemWidget(item)).toList(),
)

// ✅ 좋은 예 - 필요한 것만 생성
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ItemWidget(items[index]),
)
```

#### Column/Row with many children
```dart
// ❌ 나쁜 예 - 많은 자식이 있는 Column
Column(
  children: List.generate(100, (i) => ItemWidget(i)),
)

// ✅ 좋은 예
ListView.builder(
  itemCount: 100,
  itemBuilder: (context, index) => ItemWidget(index),
)
```

#### GridView 최적화
```dart
// ❌ 나쁜 예
GridView(
  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
  ),
  children: items.map((item) => ItemWidget(item)).toList(),
)

// ✅ 좋은 예
GridView.builder(
  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
  ),
  itemCount: items.length,
  itemBuilder: (context, index) => ItemWidget(items[index]),
)
```

### 추가 최적화

#### RepaintBoundary 사용
```dart
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) {
    return RepaintBoundary(
      child: ItemWidget(items[index]),
    );
  },
)
```

#### AutomaticKeepAliveClientMixin
```dart
class MyListItem extends StatefulWidget {
  @override
  _MyListItemState createState() => _MyListItemState();
}

class _MyListItemState extends State<MyListItem> 
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;
  
  @override
  Widget build(BuildContext context) {
    super.build(context); // 반드시 호출
    return ExpensiveWidget();
  }
}
```

---

## 4. 무거운 UI 스레드 작업 (Heavy UI Thread Operations)

### 위험도: 높음 (Priority 1)

UI 스레드를 블로킹하면 앱이 멈춘 것처럼 보입니다.

### 주요 패턴

#### 동기 파일 I/O
```dart
// ❌ 나쁜 예
final content = File('data.txt').readAsStringSync();

// ✅ 좋은 예
final content = await File('data.txt').readAsString();
```

#### JSON 파싱
```dart
// ❌ 나쁜 예 - UI 스레드에서 큰 JSON 파싱
final data = jsonDecode(largeJsonString);

// ✅ 좋은 예 - compute 사용
final data = await compute(jsonDecode, largeJsonString);

// 또는 별도 함수로
Future<Map<String, dynamic>> parseJson(String json) async {
  return await compute(_parseJsonInIsolate, json);
}

Map<String, dynamic> _parseJsonInIsolate(String json) {
  return jsonDecode(json);
}
```

#### build 메서드 내 무거운 연산
```dart
// ❌ 나쁜 예
@override
Widget build(BuildContext context) {
  final sortedList = items.sort(); // 매 빌드마다 정렬
  final filteredList = sortedList.where((item) => item.isValid).toList();
  return ListView(children: filteredList);
}

// ✅ 좋은 예 - 캐싱
List<Item> _cachedFilteredList = [];

@override
void didChangeDependencies() {
  super.didChangeDependencies();
  _updateCachedList();
}

void _updateCachedList() {
  _cachedFilteredList = items
    .where((item) => item.isValid)
    .toList()
    ..sort();
}

@override
Widget build(BuildContext context) {
  return ListView(children: _cachedFilteredList);
}
```

#### 이미지 처리
```dart
// ❌ 나쁜 예
Image.memory(imageBytes); // 큰 이미지 동기 처리

// ✅ 좋은 예
FutureBuilder<ui.Image>(
  future: compute(decodeImage, imageBytes),
  builder: (context, snapshot) {
    if (snapshot.hasData) {
      return RawImage(image: snapshot.data);
    }
    return CircularProgressIndicator();
  },
)
```

---

## 5. 최적화 되지 않은 이미지 (Unoptimized Images)

### 위험도: 중간 (Priority 2)

큰 이미지는 메모리를 많이 사용하고 렌더링이 느립니다.

### 주요 패턴

#### cacheHeight/cacheWidth 미설정
```dart
// ❌ 나쁜 예 - 원본 해상도로 로드
Image.network('https://example.com/large-image.jpg')

// ✅ 좋은 예
Image.network(
  'https://example.com/large-image.jpg',
  cacheHeight: 200,
  cacheWidth: 200,
)
```

#### 적절한 이미지 포맷
```dart
// ❌ 나쁜 예 - 투명도 없는데 PNG 사용
Image.asset('assets/photo.png')

// ✅ 좋은 예 - JPEG 사용
Image.asset('assets/photo.jpg')

// ✅ WebP 사용 (Flutter 2.0+)
Image.asset('assets/photo.webp')
```

#### DecorationImage 최적화
```dart
// ❌ 나쁜 예
Container(
  decoration: BoxDecoration(
    image: DecorationImage(
      image: NetworkImage('https://example.com/bg.jpg'),
    ),
  ),
)

// ✅ 좋은 예
Container(
  decoration: BoxDecoration(
    image: DecorationImage(
      image: NetworkImage('https://example.com/bg.jpg'),
      fit: BoxFit.cover,
    ),
  ),
)
```

#### 이미지 캐싱
```dart
// 캐시 설정 조정
import 'package:flutter/painting.dart';

void main() {
  // 이미지 캐시 크기 증가
  PaintingBinding.instance.imageCache.maximumSize = 100;
  PaintingBinding.instance.imageCache.maximumSizeBytes = 50 * 1024 * 1024; // 50MB
  
  runApp(MyApp());
}
```

---

## 6. 불필요한 패키지 (Unnecessary Packages)

### 위험도: 낮음 (Priority 3)

사용하지 않는 패키지는 앱 크기를 증가시킵니다.

### 검사 방법

#### pubspec.yaml 정리
```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # 사용 중인 패키지만 유지
  http: ^1.0.0
  provider: ^6.0.0
  
  # 사용하지 않는 패키지는 제거
  # old_package: ^1.0.0  # 제거됨
```

#### 사용하지 않는 import 제거
```dart
// ❌ 나쁜 예
import 'package:unused_package/unused_package.dart';
import 'package:another_unused/another.dart';

class MyWidget extends StatelessWidget {
  // unused_package를 사용하지 않음
}

// ✅ 좋은 예
class MyWidget extends StatelessWidget {
  // 필요한 import만 유지
}
```

### 패키지 분석 도구
```bash
# 사용하지 않는 패키지 찾기
flutter pub deps --json | grep "direct"

# 패키지 크기 분석
flutter build apk --analyze-size
```

---

## 7. 상태 관리 (State Management)

### 위험도: 중간 (Priority 2)

부적절한 상태 관리는 버그와 성능 문제를 야기합니다.

### 주요 패턴

#### Global Variables 회피
```dart
// ❌ 나쁜 예
var globalCounter = 0; // 전역 변수

class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Text('$globalCounter');
  }
}

// ✅ 좋은 예 - Provider 사용
class Counter with ChangeNotifier {
  int _count = 0;
  int get count => _count;
  
  void increment() {
    _count++;
    notifyListeners();
  }
}

// 사용
Provider.of<Counter>(context).count
```

#### async 후 context 사용
```dart
// ❌ 나쁜 예
Future<void> loadData() async {
  final data = await fetchData();
  Navigator.push(context, ...); // 위험!
}

// ✅ 좋은 예
Future<void> loadData() async {
  final data = await fetchData();
  if (!mounted) return;
  Navigator.push(context, ...);
}
```

#### 과도한 setState
```dart
// ❌ 나쁜 예 - setState가 너무 많음
class MyWidget extends StatefulWidget {
  int counter = 0;
  String name = '';
  bool isLoading = false;
  // ... 10개 이상의 setState
}

// ✅ 좋은 예 - 상태 관리 라이브러리 사용
class MyModel with ChangeNotifier {
  int _counter = 0;
  String _name = '';
  bool _isLoading = false;
  
  // getters와 setters
  void updateCounter(int value) {
    _counter = value;
    notifyListeners();
  }
}
```

### 권장 상태 관리 솔루션
- Provider: 간단한 앱
- Riverpod: 중간 복잡도
- Bloc: 복잡한 비즈니스 로직
- GetX: 빠른 프로토타입

---

## 8. const 생성자 사용 (Const Constructors)

### 위험도: 낮음 (Priority 3)

const를 사용하면 위젯 재사용과 성능이 개선됩니다.

### 주요 패턴

#### const 위젯
```dart
// ❌ 나쁜 예
Text('Hello')
Icon(Icons.home)
SizedBox(height: 10)

// ✅ 좋은 예
const Text('Hello')
const Icon(Icons.home)
const SizedBox(height: 10)
```

#### const 생성자 정의
```dart
// ❌ 나쁜 예
class MyWidget extends StatelessWidget {
  final String title;
  
  MyWidget({required this.title});
  
  @override
  Widget build(BuildContext context) {
    return Text(title);
  }
}

// ✅ 좋은 예
class MyWidget extends StatelessWidget {
  final String title;
  
  const MyWidget({Key? key, required this.title}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Text(title);
  }
}
```

#### const Collection
```dart
// ❌ 나쁜 예
final list = ['a', 'b', 'c'];
final map = {'key': 'value'};

// ✅ 좋은 예
const list = ['a', 'b', 'c'];
const map = {'key': 'value'};
```

### const 사용 시 이점
- 컴파일 타임에 객체 생성
- 메모리 재사용
- 리빌드 시 재생성하지 않음
- 성능 향상 (특히 복잡한 위젯 트리)

---

## 성능 분석 도구

### Flutter DevTools
```bash
flutter pub global activate devtools
flutter pub global run devtools
```

- Performance Overlay: FPS 확인
- Memory View: 메모리 누수 확인
- Widget Inspector: 위젯 트리 분석
- Timeline: 프레임 타이밍 분석

### 명령어
```bash
# 프로파일 모드 실행
flutter run --profile

# 릴리즈 모드 빌드
flutter build apk --release

# 성능 분석
flutter analyze

# 코드 포맷팅
dart format .
```

---

## 최적화 체크리스트

### 우선순위 1 (높음) - 즉시 수정
- [ ] 메모리 누수 (dispose 미호출)
- [ ] build 내 setState
- [ ] 동기 파일 I/O
- [ ] async 후 mounted 체크 없음

### 우선순위 2 (중간) - 가능한 빠르게
- [ ] ListView without builder
- [ ] Provider.of without listen: false
- [ ] build 내 무거운 연산
- [ ] cacheHeight/Width 미설정
- [ ] 과도한 setState

### 우선순위 3 (낮음) - 시간 날 때
- [ ] const 생성자 누락
- [ ] 사용하지 않는 패키지
- [ ] 전역 변수 사용
