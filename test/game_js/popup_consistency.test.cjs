const fs = require('node:fs');
const path = require('node:path');
const { runBrowser } = require('./browser.cjs');
const output = process.env.POPUP_SCREENSHOTS;
if (output) fs.mkdirSync(output, { recursive: true });

for (const [width, height] of [[320, 568], [390, 844], [640, 1024]]) {
  runBrowser(async () => {
    const font = document.createElement('link');
    font.rel = 'stylesheet'; font.href = 'fonts/galmuri.css';
    await new Promise((ok, fail) => { font.onload = ok; font.onerror = fail; document.head.append(font); });
    await document.fonts.load('36px Galmuri11');
    const p = probe, q = id => document.getElementById(id);
    const scale = q('game').getBoundingClientRect().width / 640;
    const fits = element => {
      const r = element.getBoundingClientRect();
      check(r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1, '팝업 잘림: ' + element.id);
      check(element.scrollWidth <= element.clientWidth, '문구 넘침: ' + element.id);
    };
    const catSize = element => {
      const s = getComputedStyle(element);
      check(s.width === '108px' && s.height === '112px' && s.objectFit === 'contain', '고양이 크기 불일치');
    };
    const verticalGaps = ids => {
      for (let i = 1; i < ids.length; i++) {
        const gap = (q(ids[i]).getBoundingClientRect().top - q(ids[i - 1]).getBoundingClientRect().bottom) / scale;
        check(Math.abs(gap - 32) < 0.2, '버튼 간격 불일치: ' + ids[i - 1] + '/' + ids[i] + ': ' + gap);
      }
      ids.forEach(id => fits(q(id)));
    };

    p.newGame(); p.S.stage = 29; p.openIntro(); p.S.running = true; p.togglePause(); await delay(300);
    const pauseCat = document.querySelector('.pause-cat'); await pauseCat.decode(); catSize(pauseCat);
    check((pauseCat.getBoundingClientRect().top - q('pauseHeading').getBoundingClientRect().bottom) / scale >= 28, '일시정지 제목과 고양이 여백 부족');
    fits(q('pauseCard')); fits(q('pauseHeading')); verticalGaps(['btnResume', 'btnRestart', 'btnQuit']);
    q('btnRestart').click(); verticalGaps(['btnPauseCancel', 'btnPauseConfirm']); fits(q('pauseCard'));
    q('btnPauseCancel').click();

    p.S.time = 0.01; p.step(0.05); await delay(650); await q('resCat').decode();
    catSize(q('resCat')); fits(document.querySelector('#result .card')); fits(q('resTitle'));
    check(parseFloat(getComputedStyle(document.querySelector('#result .card')).paddingTop) === 80, '시간 종료 높이 여유 부족');
    verticalGaps(['btnHome', 'btnNext', 'btnShare']);
    q('btnNext').click(); p.S.running = true; p.S.time = 24; p.endStage(false, 'lives'); await delay(1050);
    await q('resCat').decode(); catSize(q('resCat'));
    for (const available of [false, true]) {
      GameControl.setReviveAdAvailable(available);
      fits(document.querySelector('#result .card')); fits(q('resTitle'));
      verticalGaps(['btnRevive', 'btnNext', 'btnHome']);
      if (!q('reviveStatus').hidden) fits(q('reviveStatus'));
    }

    for (const multiplier of [1, 1.35, 1.8]) {
      p.newGame(); p.S.running = true; p.S.paused = true;
      p.S.score = p.STAGES[0].target * multiplier; p.S.time = 0.01; p.step(0.05); await delay(650);
      await q('resCat').decode(); catSize(q('resCat'));
      fits(document.querySelector('#result .card')); fits(q('resTitle'));
      const a = q('btnHome').getBoundingClientRect(), b = q('btnNext').getBoundingClientRect();
      check(Math.abs((b.left - a.right) / scale - 32) < 0.2, '클리어 가로 버튼 간격');
      const shareGap = (q('btnShare').getBoundingClientRect().top - Math.max(a.bottom, b.bottom)) / scale;
      check(Math.abs(shareGap - 32) < 0.2, '클리어 공유 간격');
    }
    // 캡처는 높이를 늘린 시간 종료 화면을 사용한다.
    p.newGame(); p.S.running = true; p.S.time = 0.01; p.step(0.05); await delay(650);
  }, { native: true, width, height, screenshot: output ? path.join(output, `popup-${width}x${height}.png`) : undefined });
}
console.log('PASS: 팝업 고양이 108x112·제목 여백·공통 버튼 간격 32·작은 화면/광고 상태/별 1~3개');
