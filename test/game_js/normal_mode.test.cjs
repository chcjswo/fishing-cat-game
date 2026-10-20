// #7 출시본 일반 모드: 생명 감소·GAME OVER, 목표 미달 TIME UP·다시 도전, 클리어 별, 테스트 라벨 숨김
const { runBrowser } = require('./browser.cjs');

runBrowser(async () => {
  const p = probe;
  check(document.querySelector('#testModeLabel').hidden, '테스트 모드 라벨이 보인다');

  // 위험 생물 3번 → GAME OVER
  p.newGame();
  p.openIntro();
  p.S.running = true;
  p.S.paused = true;
  for (let hit = 0; hit < 3; hit++) {
    p.S.invuln = 0;
    p.spawn('bomb', p.S.lane);
    p.collect(p.S.items.at(-1));
  }
  check(p.S.lives === 0, `생명이 줄지 않았다: ${p.S.lives}`);
  await delay(900);
  check(document.querySelector('#resTitle').textContent === '게임 오버', '게임 오버가 아니다');

  // 목표 미달 시간 종료 → TIME UP, 다시 도전하면 같은 스테이지·생명 3
  p.newGame();
  p.S.running = true;
  p.S.paused = true;
  p.S.score = p.S.stageStart + p.STAGES[0].target - 1;
  p.S.time = 0.01;
  p.step(0.05);
  await delay(400);
  check(document.querySelector('#resTitle').textContent === '시간 종료', '목표 미달인데 시간 종료가 아니다');
  check(document.querySelector('#resStars .on') === null, 'TIME UP에 별이 있다');
  document.querySelector('#btnNext').click();
  check(p.S.stage === 0 && p.S.score === 0 && p.S.lives === 3, '다시 도전 상태가 틀렸다');

  // 목표 달성 → STAGE CLEAR, 1.8배 이상이면 별 3개
  p.S.running = true;
  p.S.paused = true;
  p.S.score = p.S.stageStart + p.STAGES[0].target * 1.8;
  p.S.time = 0.01;
  p.step(0.05);
  await delay(400);
  check(document.querySelector('#resTitle').textContent === '스테이지 클리어', '목표 달성인데 클리어가 아니다');
  check(document.querySelectorAll('#resStars .on').length === 3, '별 3개가 아니다');
  p.toTitle();
});
console.log('PASS: 일반 모드 생명·GAME OVER·TIME UP·다시 도전·클리어 별·라벨 숨김');
