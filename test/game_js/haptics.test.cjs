// #12·#13 햅틱: 게임이 상황별 진동 패턴을 브리지로 보낸다 (앱 전용)
const { runBrowser } = require('./browser.cjs');

runBrowser(async () => {
  const p = probe;
  const haptics = () => bridgeEvents.filter(([type]) => type === 'haptic').map(([, payload]) => payload.pattern);
  const total = (pattern) => [].concat(pattern).reduce((sum, ms) => sum + ms, 0);
  p.newGame();
  p.openIntro();
  p.S.running = true;
  p.S.paused = true;

  // 위험 생물 피격
  p.S.invuln = 0;
  p.spawn('jellyfish', p.S.lane, { noWarn: true });
  p.collect(p.S.items.at(-1));
  const hit = haptics().at(-1);
  check(hit !== undefined, '피격 진동이 없다');

  // 폭탄은 일반 피격보다 강하다
  p.S.invuln = 0;
  p.spawn('bomb', p.S.lane);
  p.collect(p.S.items.at(-1));
  const bomb = haptics().at(-1);
  check(bomb !== hit && total(bomb) > total(hit), `폭탄 진동이 피격보다 강하지 않다: ${bomb} vs ${hit}`);

  // 보호 시간 중 "휴~"에는 진동 없음
  const count = haptics().length;
  p.spawn('urchin', p.S.lane, { noWarn: true });
  p.collect(p.S.items.at(-1));
  check(haptics().length === count, '보호 시간 중에도 진동했다');
  p.toTitle();
}, { native: true });

// 브라우저에서는 진동을 쓰지 않는다 (원본 동작 유지)
runBrowser(async () => {
  let vibrated = false;
  navigator.vibrate = () => (vibrated = true);
  probe.newGame();
  probe.openIntro();
  probe.S.running = true;
  probe.S.paused = true;
  probe.S.invuln = 0;
  probe.spawn('bomb', probe.S.lane);
  probe.collect(probe.S.items.at(-1));
  check(!vibrated, '브라우저에서 진동했다');
  probe.toTitle();
});
console.log('PASS: 피격·폭탄 진동 패턴, 보호 시간 무진동, 브라우저 무진동');
