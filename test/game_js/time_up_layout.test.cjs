const fs = require('node:fs');
const path = require('node:path');
const { runBrowser } = require('./browser.cjs');

const output = process.env.TIME_UP_SCREENSHOTS;
if (output) fs.mkdirSync(output, { recursive: true });
for (const [width, height] of [[320, 568], [360, 640], [390, 844], [640, 1024]]) {
  runBrowser(async () => {
    const font = document.createElement('link');
    font.rel = 'stylesheet'; font.href = 'fonts/galmuri.css';
    await new Promise((resolve, reject) => { font.onload = resolve; font.onerror = reject; document.head.append(font); });
    await document.fonts.load('36px Galmuri11');
    const p = probe, q = id => document.getElementById(id);
    q('pause').classList.add('show');
    const pauseButtonWidth = getComputedStyle(q('btnResume')).width;
    q('pause').classList.remove('show');
    p.newGame(); p.S.stage = 29; p.S.score = 9876543; p.openIntro();
    p.S.running = true; p.S.paused = true; p.S.score += 43210; p.S.time = 0.01;
    p.step(0.05); await delay(650); await q('resCat').decode();
    check(q('result').classList.contains('time-up'), '시간 종료 스타일 누락');
    check(q('resTitle').textContent === '시간 종료', '시간 종료 제목 오류');
    const title = getComputedStyle(q('resTitle')), pauseTitle = getComputedStyle(q('pauseHeading'));
    for (const property of ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'padding', 'boxShadow']) {
      check(title[property] === pauseTitle[property], '제목 스타일 불일치: ' + property);
    }
    check(getComputedStyle(q('resStars')).display === 'none', '실패 결과에 별 영역 표시');
    check(!q('shareRow').hidden, '앱 공유 버튼 누락');
    const card = document.querySelector('#result .card').getBoundingClientRect();
    check(card.top > 0 && card.bottom < innerHeight, '카드 화면 잘림');
    for (const id of ['resTitle', 'resCat', 'resStage', 'resTotal', 'resBest', 'btnHome', 'btnNext', 'btnShare']) {
      const element = q(id), box = element.getBoundingClientRect();
      check(box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth, '화면 잘림: ' + id);
      check(element.scrollWidth <= element.clientWidth, '문구 가로 넘침: ' + id);
    }
    const home = q('btnHome').getBoundingClientRect(), retry = q('btnNext').getBoundingClientRect(), share = q('btnShare').getBoundingClientRect();
    check(home.bottom < retry.top && retry.bottom < share.top, '세로 버튼 겹침 또는 순서 오류');
    check(home.left === retry.left && retry.left === share.left && home.width === share.width, '버튼 폭/정렬 오류');
    check(getComputedStyle(q('btnNext')).width === pauseButtonWidth, '일시정지와 버튼 폭 불일치');
    check(share.bottom < card.bottom, '공유 버튼 카드 넘침');
    q('btnShare').click(); check(bridgeEvents.at(-1)[0] === 'share', '공유 동작 오류');

    // 실패 후 재시작과 클리어/게임오버 전환에서 전용 스타일이 남지 않아야 한다.
    q('btnNext').click(); check(p.S.stage === 29 && p.S.lives === 3, '다시 도전 오류');
    p.S.running = true; p.S.score = p.S.stageStart + p.STAGES[29].target; p.S.time = 0.01;
    p.step(0.05); await delay(350);
    check(!q('result').classList.contains('time-up'), '클리어에 시간 종료 스타일 잔류');
    p.newGame(); p.S.running = true; p.endStage(false, 'lives'); await delay(750);
    check(q('result').classList.contains('game-over') && !q('result').classList.contains('time-up'), '게임오버 스타일 오류');

    // 최종 캡처는 시간 종료 화면을 사용한다.
    p.newGame(); p.S.running = true; p.S.time = 0.01; p.step(0.05); await delay(650);
  }, { native: true, width, height, screenshot: output ? path.join(output, `time-up-${width}x${height}.png`) : undefined });
}

runBrowser(async () => {
  const p = probe;
  p.newGame(); p.S.running = true; p.S.paused = true; p.S.time = 0.01;
  p.step(0.05); await delay(400);
  check(document.getElementById('shareRow').hidden, '브라우저에 공유 버튼 표시');
  document.getElementById('btnHome').click();
  check(document.getElementById('title').classList.contains('show'), '처음으로 동작 오류');
}, { width: 320, height: 568 });
console.log('PASS: 시간 종료 제목 일치·320/360/390/640 화면·3단 버튼·공유/재시작·결과 전환');
