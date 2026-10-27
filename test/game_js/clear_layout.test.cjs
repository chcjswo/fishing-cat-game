const {runBrowser}=require('./browser.cjs');

for(const [width,height] of [[320,568],[390,844],[640,1024]]){
  runBrowser(async()=>{
    const font=document.createElement('link');
    font.rel='stylesheet'; font.href='fonts/galmuri.css';
    await new Promise((resolve,reject)=>{font.onload=resolve; font.onerror=reject; document.head.append(font);});
    await document.fonts.load('36px Galmuri11');
    const p=probe, q=id=>document.getElementById(id), style=id=>getComputedStyle(q(id));

    // 비교 기준: 시간 종료 팝업
    p.newGame(); p.openIntro(); p.S.running=true; p.S.paused=true; p.S.time=0.01;
    p.step(0.05); await delay(650);
    check(q('result').classList.contains('time-up'),'시간 종료 팝업이 열리지 않음');
    const props=['fontSize','letterSpacing'], timeUpHead=props.map(k=>style('resTitle')[k]);
    const timeUpCard=getComputedStyle(document.querySelector('#result .card')).width;
    const timeUpScore=style('resTotal').fontSize, timeUpButton=style('btnNext').width;

    p.newGame(); p.openIntro(); p.S.running=true; p.S.paused=true;
    p.S.score=p.STAGES[0].target; p.S.time=0.01; p.step(0.05); await delay(650);
    check(q('resTitle').textContent==='스테이지 클리어','클리어 팝업이 열리지 않음');
    check(props.every((k,i)=>style('resTitle')[k]===timeUpHead[i]),'클리어 제목 글자가 다른 팝업과 다름');
    check(getComputedStyle(document.querySelector('#result .card')).width===timeUpCard,'클리어 카드 폭이 다른 팝업과 다름');
    check(style('resTotal').fontSize===timeUpScore,'클리어 점수 글자 크기가 다른 팝업과 다름');

    const buttons=['btnHome','btnNext','btnShare'].map(id=>q(id).getBoundingClientRect());
    check(buttons.every(b=>b.width===buttons[0].width && b.height===buttons[0].height && b.left===buttons[0].left),'클리어 버튼 크기/정렬 불일치');
    check(buttons[0].bottom<buttons[1].top && buttons[1].bottom<buttons[2].top,'클리어 버튼이 세로 3줄이 아님');
    check(style('btnNext').width===timeUpButton,'클리어 버튼 폭이 다른 팝업과 다름');
    const card=document.querySelector('#result .card').getBoundingClientRect();
    check(card.top>0 && card.bottom<innerHeight,'클리어 카드 화면 잘림');
  },{native:true,width,height});
}
console.log('PASS: 클리어 팝업 제목·카드 폭·점수 글자·세로 3줄 버튼이 시간 종료 팝업과 일치');
