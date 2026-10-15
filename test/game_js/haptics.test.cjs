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

  // 물고기 받기는 가벼운 진동
  await delay(200);
  p.spawn('fish', p.S.lane);
  p.collect(p.S.items.at(-1));
  const fish = haptics().at(-1);
  check(haptics().length === count + 1 && total(fish) < total(hit), `물고기 진동이 가볍지 않다: ${fish}`);

  // FEVER 발동은 피격과 구분되는 패턴
  p.startFever();
  const fever = haptics().at(-1);
  check(String(fever) !== String(hit) && String(fever) !== String(bomb) && String(fever) !== String(fish), `FEVER 진동이 구분되지 않는다: ${fever}`);

  // FEVER 중 연속 수집에서 진동이 매번 울리지 않는다
  const beforeRain = haptics().length;
  for (let i = 0; i < 10; i++) {
    p.spawn('fish', p.S.lane);
    p.collect(p.S.items.at(-1));
  }
  check(haptics().length - beforeRain <= 1, `연속 수집 진동이 과하다: ${haptics().length - beforeRain}회`);
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
console.log('PASS: 피격·폭탄·물고기·FEVER 진동 패턴, 보호 시간 무진동, 연속 수집 제한, 브라우저 무진동');
