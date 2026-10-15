// #9 NativeBridge 화면 전환 이벤트와 GameControl(freeze/resume/pause)
const { runBrowser } = require('./browser.cjs');

// 앱(WebView): 화면이 바뀔 때마다 이름을 보내고 GameControl이 있다
runBrowser(async () => {
  const screens = () => bridgeEvents.filter(([type]) => type === 'screen').map(([, payload]) => payload.screen);
  const p = probe;
  check(screens().at(-1) === 'title', `시작 화면 이벤트가 title이 아니다: ${screens()}`);

  document.querySelector('#btnCredits').click();
  check(screens().at(-1) === 'credits', 'credits 이벤트 없음');
  document.querySelector('#credits [data-close]').click();
  check(screens().at(-1) === 'title', '크레딧 닫힘 후 title 이벤트 없음');

  p.newGame();
  check(screens().at(-1) === 'intro', 'intro 이벤트 없음');
  await p.beginStage();
  check(screens().at(-1) === 'play', 'play 이벤트 없음');

  p.togglePause();
  check(screens().at(-1) === 'pause', 'pause 이벤트 없음');
  p.togglePause();
  check(screens().at(-1) === 'play', '계속하기 후 play 이벤트 없음');

  // freeze: 화면 전환 없이 진행만 멈춘다
  const before = screens().length;
  GameControl.freeze();
  const time = p.S.time;
  await delay(200);
  check(p.S.time === time, 'freeze 중에도 시간이 흘렀다');
  check(screens().length === before, 'freeze가 화면을 바꿨다');
  GameControl.resume();
  await delay(200);
  check(p.S.time < time, 'resume 후 시간이 흐르지 않는다');
  check(time - p.S.time < 0.5, 'resume 직후 멈춘 시간만큼 한꺼번에 흘렀다');

  // pause: 일시정지 화면으로 전환 (앱 백그라운드 전환용)
  GameControl.pause();
  check(p.S.paused && screens().at(-1) === 'pause', 'GameControl.pause가 일시정지 화면을 띄우지 않았다');
  GameControl.pause();
  check(p.S.paused, '이미 일시정지면 pause가 해제하면 안 된다');

  p.S.time = 0.01;
  p.S.paused = false;
  p.step(0.05);
  await delay(400);
  check(screens().at(-1) === 'result', 'result 이벤트 없음');
  p.toTitle();
  check(screens().at(-1) === 'title', '처음으로 후 title 이벤트 없음');
}, { native: true });

// 브라우저: NativeBridge가 없으면 GameControl도 만들지 않고 오류도 없다
runBrowser(async () => {
  check(!('GameControl' in window), '브라우저에 GameControl 전역이 생겼다');
  probe.newGame();
  await probe.beginStage();
  probe.togglePause();
  probe.toTitle();
});
console.log('PASS: 화면 전환 이벤트, GameControl freeze/resume/pause, 브라우저 무손상');
