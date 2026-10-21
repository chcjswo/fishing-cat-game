const {runBrowser}=require('./browser.cjs');

runBrowser(async()=>{
  const p=probe, q=id=>document.getElementById(id);
  p.newGame(); p.S.stage=6; p.S.score=18000; p.openIntro();
  check(!p.reviveFromGameOver(), '게임오버가 아닌데 부활');
  p.S.running=true; p.S.paused=true; p.S.score+=5200; p.S.time=24; p.S.lives=1; p.S.fever=8;
  p.spawn('fish',0); const fish=p.S.items.at(-1);
  p.spawn('jellyfish',1); p.spawn('can',2);
  p.spawn('bomb',p.S.lane); p.collect(p.S.items.at(-1));
  const fever=p.S.fever;
  await delay(800);
  check(p.reviveFromGameOver(), '게임오버 부활 실패');
  check(p.S.stage===6 && p.S.score===23200 && p.S.stageStart===18000 && p.S.time===24 && p.S.fever===fever, '부활 시 점수/시간/피버 손실');
  check(p.S.lives===3 && p.S.invuln===3 && p.S.reviveUsed, '부활 하트/보호/횟수 오류');
  check(p.S.items.length===1 && p.S.items[0]===fish && !document.querySelector('.warn'), '위험 요소 제거 또는 물고기 유지 오류');
  check(!p.reviveFromGameOver() && !q('resumeCountdown').hidden, '중복 부활 또는 카운트다운 오류');
  await delay(3100);
  check(!p.S.paused && p.S.time<24 && p.S.time>23.5 && p.S.invuln>2.5, '카운트다운 후 재개/무적 오류');
  q('btnPause').click();
  p.spawn('bomb',p.S.lane); p.collect(p.S.items.at(-1));
  check(p.S.lives===3, '부활 보호 시간 중 피해');
  p.S.invuln=0; p.S.lives=1;
  p.spawn('bomb',p.S.lane); p.collect(p.S.items.at(-1));
  await delay(800);
  check(!p.reviveFromGameOver(), '같은 스테이지 두 번째 부활 허용');
  q('btnNext').click();
  check(!p.S.reviveUsed && p.S.stage===6 && p.S.time===60, '스테이지 재도전 시 부활 기회 초기화 오류');
  p.toTitle();
});

runBrowser(async()=>{
  const p=probe;
  p.newGame(); p.S.running=true; p.S.paused=true; p.S.lives=1; p.S.spawnT=99;
  p.spawn('bomb',p.S.lane); p.S.items.at(-1).y=820;
  p.spawn('fish',p.S.lane); p.S.items.at(-1).y=820;
  p.step(.01);
  check(p.S.lives===0 && p.S.score===0, '사망 직후 같은 프레임에서 물고기를 수집함');
  p.toTitle(); await delay(800);
  check(document.getElementById('title').classList.contains('show'), '이전 사망의 지연 콜백이 타이틀을 덮음');
});
console.log('PASS: 부활 상태 보존·하트 회복·위험 제거·3초 보호·도전당 1회');
