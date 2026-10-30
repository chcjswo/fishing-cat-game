# 게임오버 광고 부활 연결

앱(`lib/features/game/game_screen.dart`)이 AdMob 보상형 광고로 이 통로를 연결한다. 보상형 광고가 로드돼 있을 때만 버튼이 켜지고, 광고를 본 것으로 처리하는 개발용 동작은 넣지 않는다. 성공·실패는 브라우저 테스트에서만 모의한다.

## 게임 규칙

- 생명 0으로 사망한 경우에만 광고 이어하기를 제공한다. 시간 종료에는 제공하지 않는다.
- 현재 스테이지의 한 도전당 1회 사용한다. 스테이지를 처음부터 재시작하거나 다음 스테이지에 진입하면 기회를 초기화한다.
- 보상 성공 시 하트 3개, 점수·남은 시간·피버 게이지 유지, 위험 생물·쓰레기 제거(물고기는 유지), 3·2·1 카운트다운 후 재개, 플레이 시간 기준 3초 무적을 적용한다.
- 광고 화면이 앱을 가려 생기는 비활성화·`visibilitychange`는 중단으로 보지 않는다(앱은 광고 표시 중 `GameControl.pause`를 호출하지 않는다). 광고가 닫히면 바로 3·2·1 카운트다운으로 재개한다.
- 광고 대기 중 `GameControl.pause`가 호출된 경우(종료 확인 등)에는 보상 후 일시정지 메뉴에 머문다. 이용자가 계속하기를 누르면 카운트다운을 시작한다.
- 광고 실패·취소는 기회를 소모하지 않는다. 광고 요청 중에는 세 버튼을 비활성화해 중복 요청과 화면 이동을 막는다. 선택 자체의 제한시간은 없다.
- 현재 스테이지 재시작은 이전 스테이지까지의 총점을 보존하고 생명 3개·60초·피버 초기화 후 같은 스테이지 안내로 이동한다. 최고 기록은 보존한다.

## 앱 어댑터가 연결하는 통로

게임의 `GameControl`은 `window.NativeBridge`가 주입된 앱에서만 생성된다. 게임 로드가 끝난 뒤 다음 메서드를 호출한다.

```javascript
// 실제 요청을 처리할 어댑터가 있고 광고를 제공할 수 있을 때만 활성화한다.
GameControl.setReviveAdAvailable(true);
// 광고를 제공할 수 없으면 다시 비활성화한다.
GameControl.setReviveAdAvailable(false);
```

버튼을 누르면 기존 단일 브리지로 요청을 보낸다.

```javascript
NativeBridge.send('reviveAd', { requestId: 1, stage: 7 });
```

네이티브 어댑터는 `reviveAd` 핸들러에서 보상형 광고를 재생하고, **광고 화면이 닫힌 후** 같은 요청 ID로 완료를 전달한다. 광고 표시 실패나 취소도 반드시 응답해야 버튼이 다시 활성화된다.

```javascript
// SDK의 보상 획득 이벤트를 받은 경우에만 true를 전달한다.
GameControl.completeReviveAd(requestId, true);
// 로드/표시 실패 또는 보상 없이 광고를 닫은 경우.
GameControl.completeReviveAd(requestId, false);
```

광고를 닫았다는 사실만으로 보상을 지급하지 않는다. 중복 ID, 다른 요청 ID, 재시작·타이틀 이동 후 늦게 도착한 응답은 무시한다. 반환값은 실제로 부활이 적용됐을 때만 `true`다.

## 다음 스테이지 전면 광고

스테이지를 클리어하고 `다음 스테이지`를 누르면 게임이 `NativeBridge.send('nextStage', { clearedStage })`를 보낸다. 앱은 `lib/shared/services/interstitial_policy.dart`로 판정해 다음 스테이지 소개 화면 위에 전면 광고를 띄운다.

- 1~5스테이지 클리어: 광고 없음
- 6~20스테이지 클리어: 1/4 확률
- 21스테이지 이상 클리어: 1/3 확률

게임 오버·시간 종료 후 재도전, 마지막 스테이지 클리어 후 다시 하기에서는 보내지 않는다.

## 검증

`test/game_js/revive_ad.test.cjs`가 네이티브 브리지를 모의해 준비·미준비, 성공·취소·실패, 중복 요청·보상, 늦은 응답, 중단 후 일시정지를 확인한다. `revive_state.test.cjs`는 게임 상태 보존·부활 횟수·무적을 확인한다. `next_stage_event.test.cjs`는 다음 스테이지 이동 때만 `nextStage`를 보내는지, `test/interstitial_policy_test.dart`는 전면 광고 확률을 확인한다.
