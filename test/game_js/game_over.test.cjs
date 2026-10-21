const {runBrowser}=require('./browser.cjs');

runBrowser(async()=>{
  const p=probe, q=id=>document.getElementById(id);
  p.newGame(); p.S.stage=6; p.S.score=18000; p.openIntro();
  p.S.running=true; p.S.paused=true; p.S.score+=5200; p.S.time=24.1; p.S.lives=1;
  p.spawn('bomb',p.S.lane); p.collect(p.S.items.at(-1));
  await delay(800);
  check(q('result').classList.contains('game-over'), '게임오버 전용 배치가 아님');
  check(q('resLocation').textContent.includes('STAGE 7') && q('resTime').textContent.includes('25초'), '스테이지/시간 오류');
  check(q('resStage').textContent.includes((5200).toLocaleString()), '스테이지 점수 오류');
  check(q('resTotal').textContent===(23200).toLocaleString(), '총점 오류');
  check(getComputedStyle(q('resStars')).display==='none', '게임오버에 별점 표시');
  check(!q('reviveArea').hidden && q('btnRevive').disabled && q('reviveStatus').textContent==='광고 준비 중', 'SDK 미연동 안내 오류');
  q('btnNext').click();
  check(p.S.stage===6 && p.S.score===18000 && p.S.lives===3 && p.S.time===60, '현재 스테이지 재시작 오류');
  check(q('intro').classList.contains('show'), '재시작 스테이지 안내 없음');
  p.S.running=true; p.S.lives=1; p.S.invuln=0; p.spawn('bomb',p.S.lane); p.collect(p.S.items.at(-1));
  await delay(800); q('btnHome').click();
  check(q('title').classList.contains('show') && !p.S.running, '메인 화면 이동 오류');
});
console.log('PASS: 게임오버 정보·세 버튼·현재 스테이지 재시작·메인 이동');
