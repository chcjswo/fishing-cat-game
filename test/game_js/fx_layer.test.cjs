const {runBrowser}=require('./browser.cjs');

runBrowser(async()=>{
  const p=probe, q=id=>document.getElementById(id);
  const catZ=Number(getComputedStyle(q('cat')).zIndex);
  const inFront=el=>Number(getComputedStyle(el.parentElement).zIndex)>catZ;
  p.newGame(); p.S.running=true; p.S.paused=true;
  for(const type of ['fish','can','heart','bomb']){
    p.S.invuln=0;
    p.spawn(type,p.S.lane); p.collect(p.S.items.at(-1));
    const pops=[...document.querySelectorAll('.pop')], bits=[...document.querySelectorAll('.pxl')];
    check(pops.length && pops.every(inFront),'고양이 뒤에 그려진 점수/문구 팝업: '+type);
    check(bits.every(inFront),'고양이 뒤에 그려진 파편: '+type);
    p.clearItems();
    check(!document.querySelector('.pop,.pxl'),'아이템 정리 후 팝업/파편 잔류: '+type);
  }
});
console.log('PASS: 점수·문구 팝업과 파편이 고양이 앞에 표시되고 정리 시 제거');
