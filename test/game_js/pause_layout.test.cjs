const fs=require('node:fs');
const path=require('node:path');
const {runBrowser}=require('./browser.cjs');

const output=process.env.PAUSE_SCREENSHOTS;
if(output) fs.mkdirSync(output,{recursive:true});
for(const [width,height] of [[360,640],[390,844],[640,1024]]){
  runBrowser(async()=>{
    // 실제 픽셀 글꼴로 긴 버튼 문구와 작은 화면의 잘림을 확인한다.
    const font=document.createElement('link'); font.rel='stylesheet'; font.href='fonts/galmuri.css';
    await new Promise((resolve,reject)=>{font.onload=resolve; font.onerror=reject; document.head.append(font);});
    await document.fonts.load('24px Galmuri11');
    const q=id=>document.getElementById(id), p=probe;
    p.newGame(); p.S.stage=29; p.openIntro(); await p.beginStage();
    p.S.score+=12345; p.S.time=31.4; q('btnPause').click();
    const fits=element=>{
      const r=element.getBoundingClientRect();
      check(r.left>=0 && r.right<=innerWidth+1 && r.top>=0 && r.bottom<=innerHeight+1, '화면 밖으로 잘림: '+element.id);
      check(element.scrollWidth<=element.clientWidth, '텍스트 가로 넘침: '+element.id);
    };
    fits(q('pauseCard'));
    for(const id of ['btnResume','btnRestart','btnQuit','btnPauseSound','btnPauseHaptic']) fits(q(id));
    q('btnRestart').click(); fits(q('pauseCard')); fits(q('pauseConfirmCopy'));
    q('btnPauseCancel').click();
  },{native:true,width,height,screenshot:output?path.join(output,`pause-${width}x${height}.png`):undefined});
}
console.log('PASS: 실제 픽셀 글꼴·360×640/390×844/640×1024 팝업과 확인 창 잘림 없음');
