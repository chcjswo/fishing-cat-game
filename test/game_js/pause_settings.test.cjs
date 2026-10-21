const { runBrowser }=require('./browser.cjs');

runBrowser(async()=>{
  const q=id=>document.getElementById(id), p=probe;
  p.newGame(); await p.beginStage(); q('btnPause').click();
  const time=p.S.time;
  q('btnPauseSound').click();
  check(localStorage.getItem('fc_sound')==='on' && !q('btnSound').classList.contains('off'), '팝업 소리 설정 저장·동기화 오류');
  q('btnSound').click();
  check(q('btnPauseSound').getAttribute('aria-pressed')==='false' && localStorage.getItem('fc_sound')==='off', '타이틀 소리 설정 동기화 오류');
  check(!q('btnPauseHaptic').hidden, '앱 진동 버튼 없음');
  q('btnPauseHaptic').click();
  check(localStorage.getItem('fc_haptic')==='off' && q('btnHaptic').textContent==='OFF', '팝업 진동 설정 동기화 오류');
  const count=bridgeEvents.filter(([type])=>type==='haptic').length;
  p.spawn('bomb',p.S.lane); p.collect(p.S.items.at(-1));
  check(bridgeEvents.filter(([type])=>type==='haptic').length===count, '진동 OFF 중 진동 발생');
  q('btnHaptic').click();
  check(q('btnPauseHaptic').getAttribute('aria-pressed')==='true' && localStorage.getItem('fc_haptic')==='on', '설정 화면 진동 동기화 오류');
  check(p.S.paused && p.S.time===time, '설정 변경이 게임을 재개함');
  p.toTitle();
},{native:true});

runBrowser(async()=>{
  check(document.getElementById('btnPauseHaptic').hidden, '브라우저에 진동 버튼 표시');
});
console.log('PASS: 팝업 소리·진동 설정 동기화·저장·앱 전용 진동');
