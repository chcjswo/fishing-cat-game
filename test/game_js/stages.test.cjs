// 실제 앱 번들로 전체 출현 풀·이미지·아이템 효과와 1→30 진행을 검증한다.
const path = require('node:path');
const { runBrowser } = require('./browser.cjs');

runBrowser(async () => {
  const p = probe, q = id => document.getElementById(id);
  check(p.STAGES.length === 30, '30개 스테이지가 아님');
  check(Object.keys(p.ITEMS).length === 35, '아이템 35종이 아님');
  p.newGame();
  const seen = new Set();
  for (let stage = 0; stage < 30; stage++) {
    check(p.S.stage === stage, '스테이지 순서 오류: ' + (stage + 1));
    const st = p.STAGES[stage], types = Object.keys(st.weights);
    check(q('introTitle').textContent === `스테이지 ${stage + 1}`, '안내 제목 오류');
    check(q('legend').children.length === types.length, '안내 아이템 누락');
    check(p.S.time === 60, '스테이지 시간 초기화 오류');
    const bg = p.getBG().background;
    await bg.decode();
    check(bg.naturalWidth > 0 && st.background.endsWith('.jpg'), '앱 배경 로드 실패');
    p.S.running = true; p.S.paused = true;

    // 모든 출현 구간의 중간값을 선택해 낮은 확률의 개체도 빠짐없이 검사한다.
    p.S.lives = 2;
    const total = Object.values(st.weights).reduce((a, b) => a + b, 0);
    let cumulative = 0;
    const random = Math.random;
    try {
      for (const type of types) {
        Math.random = () => (cumulative + st.weights[type] / 2) / total;
        check(p.pickType() === type, '출현 선택 오류: ' + type);
        cumulative += st.weights[type];
      }
      const pool = st.feverFish || ['fish', 'salmon', 'angel'];
      for (let i = 0; i < pool.length; i++) {
        Math.random = () => (i + 0.5) / pool.length;
        const type = p.pickFeverFish();
        check(pool.includes(type) && p.ITEMS[type].cls === 'fish', '피버에 잘못된 종류 출현');
        check(types.includes(type), '스테이지 밖의 피버 생선');
      }
    } finally { Math.random = random; }

    for (let i = 0; i < types.length; i++) {
      const type = types[i], def = p.ITEMS[type];
      check(q('legend').children[i].classList.contains('new') === (stage > 0 && !seen.has(type)), 'NEW 표시 오류: ' + type);
      p.clearItems(); p.endFever();
      p.S.invuln = 0; p.S.lives = 2; p.S.fever = 5;
      p.spawn(type, 1);
      const item = p.S.items.at(-1), image = item.el.querySelector('img');
      if (image) { await image.decode(); check(image.naturalWidth > 0, '아이템 이미지 실패: ' + type); }
      if (def.warn) check(item.delay === def.warn && item.warnEl.isConnected, '위험 경고 누락: ' + type);
      const score = p.S.score;
      p.collect(item);
      if (def.cls === 'fish') {
        check(p.S.score === score + def.pts && p.S.fever === 6, '생선 점수/피버 오류: ' + type);
        p.startFever(); p.spawn(type, 1); p.collect(p.S.items.at(-1));
        check(p.S.score === score + def.pts * 3, '피버 두 배 점수 오류: ' + type);
      } else if (def.dmg) {
        check(p.S.lives === 1 && p.S.fever === 4, '장애물 피해 오류: ' + type);
        check(p.S.score === Math.max(0, score + def.pts), '장애물 점수 오류: ' + type);
      } else check(p.S.lives === 3, '하트 회복 오류');
    }
    types.forEach(type => seen.add(type));
    p.clearItems(); p.endFever(); p.S.lives = 3;
    p.S.score = p.S.stageStart + st.target; p.S.time = 0.01;
    const score = p.S.score;
    p.step(0.05); await delay(350);
    check(q('resTitle').textContent === (stage === 29 ? '모두 클리어!' : '스테이지 클리어'), '클리어 결과 오류');
    q('btnNext').click();
    if (stage < 29) check(p.S.stageStart === score && p.S.lives === 3, '다음 단계 점수/생명 오류');
  }
  check(seen.size === 35, '전체 아이템이 스테이지에 연결되지 않음');
  check(p.S.stage === 0 && p.S.score === 0 && p.S.lives === 3, '올클리어 후 재시작 오류');
  p.toTitle();
}, { gameRoot: path.resolve(__dirname, '../../assets/game'), width: 390, height: 844, native: true });
console.log('PASS: 앱 번들 30스테이지 배경·출현 풀·35종 이미지/효과·피버·NEW 안내·올클리어/재시작');
