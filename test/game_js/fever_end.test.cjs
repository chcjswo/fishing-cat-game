const {runBrowser}=require('./browser.cjs');

runBrowser(async()=>{
  const p=probe;
  p.newGame(); p.S.running=true; p.S.paused=true;
  p.startFever();
  // 피버 동안 쏟아지는 물고기를 화면에 쌓는다(고양이 레인 밖에서 잡히지 않게)
  for(let i=0;i<20;i++) p.step(0.075);
  check(p.S.items.length>0,'피버 중 아이템이 생성되지 않음');
  const elements=p.S.items.map(it=>it.el);
  p.S.feverT=0.01; p.step(0.02);
  check(!p.S.feverOn,'피버가 끝나지 않음');
  check(p.S.items.length===0,'피버 종료 후 아이템 잔류: '+p.S.items.length);
  check(elements.every(el=>!el.isConnected),'피버 종료 후 아이템 요소가 화면에 남음');
  check(p.S.fever===0,'피버 종료 직후 게이지가 비어 있지 않음');
  p.step(0.5);
  check(p.S.items.length===0,'피버 종료 직후 쉬는 시간 없이 아이템 출현');
});
console.log('PASS: 피버 종료 시 화면 아이템 제거·게이지 0·0.6초 쉬고 출현');
