const fs=require('node:fs');
const path=require('node:path');
const {runBrowser}=require('./browser.cjs');

const output=process.env.GAME_OVER_SCREENSHOTS;
if(output) fs.mkdirSync(output,{recursive:true});
for(const [width,height] of [[320,568],[390,844],[640,1024]]){
  runBrowser(async()=>{
    const font=document.createElement('link'); font.rel='stylesheet'; font.href='fonts/galmuri.css';
    await new Promise((resolve,reject)=>{font.onload=resolve; font.onerror=reject; document.head.append(font);});
    await document.fonts.load('24px Galmuri11');
    const p=probe, q=id=>document.getElementById(id);
    p.newGame(); p.S.stage=29; p.S.score=1234567; p.openIntro();
    p.S.running=true; p.S.paused=true; p.S.score+=45678; p.S.time=24; p.endStage(false,'lives');
    await delay(800);
    const fits=element=>{
      const r=element.getBoundingClientRect(), card=document.querySelector('#result .card').getBoundingClientRect();
      check(r.left>=0 && r.right<=innerWidth+1 && r.top>=0 && r.bottom<=innerHeight+1, '화면 잘림: '+element.id);
      check(r.left>=card.left && r.right<=card.right+1 && r.bottom<=card.bottom+1, '카드 밖 요소: '+element.id);
      check(element.scrollWidth<=element.clientWidth, '텍스트 가로 넘침: '+element.id);
    };
    for(const id of ['resLocation','resTime','resStage','resTotal','resBest','btnRevive','reviveStatus','btnNext','btnHome']) fits(q(id));
    const next=q('btnNext').getBoundingClientRect(), home=q('btnHome').getBoundingClientRect();
    check(next.bottom<home.top && q('btnRevive').getBoundingClientRect().bottom<next.top, '버튼 겹침 또는 순서 오류');
    GameControl.setReviveAdAvailable(true); fits(q('btnRevive')); fits(q('reviveStatus'));
    p.S.reviveUsed=true; GameControl.setReviveAdAvailable(true);
    check(q('btnRevive').hidden, '사용 후 광고 버튼 표시'); fits(q('reviveStatus')); fits(q('btnNext')); fits(q('btnHome'));
    p.S.reviveUsed=false; GameControl.setReviveAdAvailable(false);
  },{native:true,width,height,screenshot:output?path.join(output,`game-over-${width}x${height}.png`):undefined});
}
console.log('PASS: 실제 픽셀 글꼴·320/390/640 너비 게임오버 카드와 세 상태 배치');
