const {runBrowser}=require('./browser.cjs');

runBrowser(async()=>{
  const p=probe, q=id=>document.getElementById(id);
  const die=async()=>{
    p.S.running=true; p.S.paused=true; p.S.lives=1; p.S.invuln=0;
    p.spawn('bomb',p.S.lane); p.collect(p.S.items.at(-1)); await delay(800);
  };
  const requests=()=>bridgeEvents.filter(([type])=>type==='reviveAd');
  p.newGame(); await die();
  q('btnRevive').click(); check(requests().length===0 && !p.S.reviveUsed, 'SDK 미연동 중 광고 요청 또는 보상');
  GameControl.setReviveAdAvailable(true);
  check(!q('btnRevive').disabled, '준비된 광고 버튼이 비활성');
  q('btnRevive').click(); q('btnRevive').click();
  const first=requests().at(-1)[1];
  check(requests().length===1 && first.stage===1 && q('btnNext').disabled && q('btnHome').disabled, '중복 광고 요청 또는 진행 중 화면 이동 허용');
  check(!GameControl.completeReviveAd(first.requestId+1,true) && p.S.gameOver, '다른 요청 보상 적용');
  GameControl.completeReviveAd(first.requestId,false);
  check(!p.S.reviveUsed && p.S.gameOver && !q('btnNext').disabled && !q('btnRevive').disabled, '광고 취소/실패 시 기회 소모');
  q('btnRevive').click(); const second=requests().at(-1)[1];
  check(!GameControl.completeReviveAd(first.requestId,true), '이전 요청의 늦은 보상 적용');
  check(GameControl.completeReviveAd(second.requestId,true), '정상 광고 완료 부활 실패');
  check(p.S.lives===3 && p.S.reviveUsed && !q('resumeCountdown').hidden, '광고 완료 보상/카운트다운 오류');
  check(!GameControl.completeReviveAd(second.requestId,true), '보상 중복 지급');
  GameControl.pause(); await die();
  check(q('btnRevive').hidden && q('reviveStatus').textContent.includes('사용했어요'), '부활 사용 완료 안내 없음');
  q('btnNext').click(); await die();
  check(!q('btnRevive').hidden && !q('btnRevive').disabled, '재도전 부활 기회 초기화 실패');
  q('btnRevive').click(); const stale=requests().at(-1)[1];
  p.toTitle();
  check(!GameControl.completeReviveAd(stale.requestId,true) && !p.S.running, '다른 화면으로 이동한 뒤 부활');
  p.newGame(); await die(); q('btnRevive').click();
  const interrupted=requests().at(-1)[1];
  GameControl.pause(); GameControl.completeReviveAd(interrupted.requestId,true);
  await delay(3100);
  check(p.S.paused && q('resumeCountdown').hidden && p.S.time===60, '광고 중 백그라운드/종료 확인 뒤에서 자동 재개');
  p.toTitle();
},{native:true});

runBrowser(async()=>{
  const p=probe;
  p.newGame(); p.S.running=true; p.S.paused=true; p.endStage(false,'lives'); await delay(800);
  document.getElementById('btnRevive').click();
  check(!p.S.reviveUsed && !p.S.running, '브라우저에서 광고 없이 부활');
  p.toTitle();
});
console.log('PASS: 광고 미연동·준비·요청·완료·취소·중복/늦은 신호·사용 제한');
