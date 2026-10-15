// #14 결과 화면 공유 버튼: 앱에서만 보이고, 누르면 점수를 브리지로 보낸다
const { runBrowser } = require('./browser.cjs');

for (const [width, height] of [[390, 844], [320, 568]]) {
  runBrowser(async () => {
    // 1스테이지를 목표 이상으로 끝내 결과 화면까지 진행한다.
    const playToResult = async (p) => {
      p.newGame();
      p.S.running = true;
      p.S.paused = true;
      p.S.score = p.STAGES[0].target + 1234;
      p.S.time = 0.01;
      p.step(0.05);
      await delay(400);
    };
    const p = probe;
    await playToResult(p);
    const row = document.querySelector('#shareRow');
    check(row && !row.hidden, '앱 결과 화면에 공유 버튼이 없다');

    // 공유 줄과 기존 버튼이 카드 안에 들어오고 서로 겹치지 않는다
    const card = document.querySelector('#result .card').getBoundingClientRect();
    const share = document.querySelector('#btnShare').getBoundingClientRect();
    const next = document.querySelector('#btnNext').getBoundingClientRect();
    const home = document.querySelector('#btnHome').getBoundingClientRect();
    for (const box of [share, next, home]) {
      check(box.left >= card.left && box.right <= card.right && box.bottom <= card.bottom, '버튼이 카드 밖으로 나갔다');
    }
    check(share.top >= Math.max(next.bottom, home.bottom), '공유 버튼이 기존 버튼과 겹친다');
    check(card.bottom <= innerHeight && card.top >= 0, '결과 카드가 화면 밖으로 나갔다');

    document.querySelector('#btnShare').click();
    const [type, payload] = bridgeEvents.at(-1);
    check(type === 'share', '공유 이벤트가 아니다');
    check(payload.score === p.S.score && payload.stage === 1 && payload.best === p.S.score, `공유 페이로드가 틀렸다: ${JSON.stringify(payload)}`);
    p.toTitle();
  }, { native: true, width, height });
}

// 브라우저에서는 공유 버튼이 보이지 않는다
runBrowser(async () => {
  // 1스테이지를 목표 이상으로 끝내 결과 화면까지 진행한다.
  const playToResult = async (p) => {
    p.newGame();
    p.S.running = true;
    p.S.paused = true;
    p.S.score = p.STAGES[0].target + 1234;
    p.S.time = 0.01;
    p.step(0.05);
    await delay(400);
  };
  await playToResult(probe);
  check(document.querySelector('#shareRow').hidden, '브라우저에 공유 버튼이 보인다');
  probe.toTitle();
});
console.log('PASS: 앱 전용 공유 버튼, 390·320 배치, 공유 페이로드');
