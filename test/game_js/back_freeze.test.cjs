// #11 플레이 중 뒤로가기: freeze 동안 아이템·타이머·FEVER가 멈추고 resume 후 그대로 이어진다
const { runBrowser } = require('./browser.cjs');

runBrowser(async () => {
  const p = probe;
  p.newGame();
  await p.beginStage();
  p.startFever();
  p.spawn('fish', 0, { noWarn: true });
  const item = p.S.items.at(-1);
  await delay(100);

  GameControl.freeze();
  const snapshot = { time: p.S.time, fever: p.S.feverT, y: item.y };
  await delay(400);
  check(p.S.time === snapshot.time, 'freeze 중 타이머가 흘렀다');
  check(p.S.feverT === snapshot.fever, 'freeze 중 FEVER 시간이 줄었다');
  check(item.y === snapshot.y, 'freeze 중 아이템이 떨어졌다');
  check(!document.querySelector('#pause').classList.contains('show'), 'freeze가 일시정지 화면을 띄웠다');

  GameControl.resume();
  await delay(200);
  check(p.S.feverOn && p.S.feverT < snapshot.fever, 'resume 후 FEVER가 이어지지 않는다');
  check(snapshot.fever - p.S.feverT < 0.5, 'resume 직후 멈춘 시간이 FEVER에서 빠졌다');
  p.toTitle();
}, { native: true });
console.log('PASS: freeze 중 타이머·FEVER·낙하 정지, resume 후 이어하기');
