const {runBrowser}=require('./browser.cjs');

runBrowser(async()=>{
  const p=probe, q=id=>document.getElementById(id);
  p.newGame(); p.S.running=true; p.S.paused=true; p.S.score=1000;
  let score=1000;
  for(const [index,type] of ['can','boot','can'].entries()){
    p.S.invuln=0;
    p.spawn(type,p.S.lane); p.collect(p.S.items.at(-1));
    score-=100;
    check(p.S.lives===2-index, `${type} 피격 후 하트가 줄지 않음: ${p.S.lives}`);
    const filled=[...q('hearts').children].filter(el=>el.innerHTML.includes('#f03a5c')).length;
    check(filled===p.S.lives,'실제 생명과 HUD 하트 표시가 다름');
    check(p.S.score===score,'쓰레기 감점 변경');
    if(index===0){
      p.spawn('boot',p.S.lane); p.collect(p.S.items.at(-1)); score-=100;
      check(p.S.lives===2 && p.S.score===score,'보호 시간 중 연속 피해 또는 감점 누락');
    }
  }
  await delay(800);
  check(q('resTitle').textContent==='게임 오버','쓰레기 세 번 피격 후 게임 오버가 아님');
});
console.log('PASS: 캔·장화 피격 시 하트·HUD 감소와 게임 오버');
