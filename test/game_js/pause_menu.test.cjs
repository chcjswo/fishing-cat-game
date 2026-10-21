const { runBrowser } = require('./browser.cjs');

runBrowser(async () => {
  const p=probe, q=id=>document.getElementById(id);
  p.newGame();
  p.S.stage=3; p.S.score=12000; p.openIntro();
  await p.beginStage();
  p.S.score+=2300; p.S.time=31.4;
  q('btnPause').click();
  check(p.S.paused && q('pause').classList.contains('show'), '일시정지 팝업 없음');
  check(q('pauseStage').textContent.includes('STAGE 4'), '현재 스테이지 오류');
  check(q('pauseTime').textContent==='32초', '남은 시간 오류');
  check(q('pauseScore').textContent===(2300).toLocaleString(), '총점 대신 스테이지 점수를 표시해야 한다');
  check(q('pauseTarget').textContent===p.STAGES[3].target.toLocaleString(), '목표 점수 오류');
  const time=p.S.time;
  await delay(200);
  check(p.S.time===time, '일시정지 중 시간 경과');
  check(document.activeElement===q('btnResume'), '계속하기에 초점 없음');
  p.toTitle();
});
console.log('PASS: 일시정지 팝업의 스테이지 정보와 시간 정지');
