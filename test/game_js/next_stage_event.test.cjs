const {runBrowser}=require('./browser.cjs');

// 다음 스테이지로 넘어갈 때만 앱에 클리어한 스테이지 번호를 알린다 (전면 광고 판정용).
runBrowser(async()=>{
  const p=probe, q=id=>document.getElementById(id);
  const events=()=>bridgeEvents.filter(([type])=>type==='nextStage');
  p.newGame(); p.S.stage=5; p.openIntro();
  p.S.score=p.S.stageStart+p.STAGES[5].target; p.S.running=true; p.endStage(true,'time'); await delay(400);
  check(events().length===0, '결과 화면만 떠도 nextStage 전송');
  q('btnNext').click();
  check(events().length===1 && events()[0][1].clearedStage===6 && p.S.stage===6, '클리어한 스테이지 번호 전송 오류');
  p.S.running=true; p.S.paused=true; p.S.lives=1; p.S.invuln=0;
  p.spawn('bomb',p.S.lane); p.collect(p.S.items.at(-1)); await delay(800);
  q('btnNext').click();
  check(events().length===1, '게임 오버 재도전에서 nextStage 전송');
  p.toTitle();
},{native:true});
console.log('PASS: 다음 스테이지 이동 시에만 nextStage 전송');
