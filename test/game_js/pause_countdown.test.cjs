const {runBrowser}=require('./browser.cjs');

runBrowser(async()=>{
  const p=probe, q=id=>document.getElementById(id);
  p.newGame(); await p.beginStage(); p.startFever(); p.spawn('fish',0);
  q('btnPause').click();
  const item=p.S.items.at(-1), before={time:p.S.time,fever:p.S.feverT,y:item.y,lane:p.S.lane};
  q('btnResume').click();
  check(!q('resumeCountdown').hidden && q('resumeCount').textContent==='3', '3초 카운트다운 없음');
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft'}));
  await delay(1100);
  check(q('resumeCount').textContent==='2', '2 카운트 없음');
  check(p.S.time===before.time && p.S.feverT===before.fever && item.y===before.y && p.S.lane===before.lane, '카운트다운 중 게임 진행');
  await delay(1000);
  check(q('resumeCount').textContent==='1', '1 카운트 없음');
  await delay(1100);
  check(!p.S.paused && !q('pause').classList.contains('show'), '카운트다운 후 재개 실패');
  check(p.S.time<before.time && before.time-p.S.time<0.5, '재개 시 정지한 시간이 차감됨');

  q('btnPause').click(); q('btnResume').click();
  GameControl.pause();
  const time=p.S.time;
  await delay(3100);
  check(p.S.paused && q('resumeCountdown').hidden && p.S.time===time, '앱 백그라운드 전환 후 자동 재개');
  q('btnResume').click(); q('btnResumeCancel').click();
  check(p.S.paused && q('resumeCountdown').hidden, '카운트다운 취소 실패');

  q('btnResume').click();
  Object.defineProperty(document,'hidden',{configurable:true,value:true});
  document.dispatchEvent(new Event('visibilitychange'));
  Object.defineProperty(document,'hidden',{configurable:true,value:false});
  document.dispatchEvent(new Event('visibilitychange'));
  await delay(3100);
  check(p.S.paused && q('resumeCountdown').hidden, '브라우저 숨김 후 자동 재개');
  p.toTitle();
},{native:true});
console.log('PASS: 3·2·1 재개, 시간·낙하·피버·이동 정지, 취소와 백그라운드 안전 처리');
