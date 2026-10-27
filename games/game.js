// ===== 낚시냥 — game logic =====
(function(){
const $ = s => document.querySelector(s);
const W = 640, BASE_H = 1024;
// 세로로 긴 기기에서는 게임 높이를 늘려 위아래 여백을 없앤다. 픽셀 격자(4px)에 맞추고 상한을 둔다.
const MAX_EXTRA = 512;
let H = BASE_H, EXTRA = 0;
// 앱이 알려 주는 화면 위 카메라 구멍·노치 높이(CSS px). HUD를 그만큼 아래로 내린다.
let SAFE_TOP = 0;
const LANES = [85, 320, 555];
const BASE_CAT_TOP = 780, CAT_W = 176;
let CAT_TOP = BASE_CAT_TOP;
const GAME_TIME = 60;
const MAX_LIFE = 3;
const TEST_MODE = false;
const FEVER_NEED = 18, FEVER_TIME = 7;

const STAGES = [
  { name:'STAGE 1', sub:'맑은 낮 바다', theme:'day', background:'assets/backgrounds/stage-01-clear-harbor-watercolor.png', target:3500, speed:330, interval:.85,
    weights:{ fish:46, salmon:14, angel:5, can:12, boot:10, heart:3 } },
  { name:'STAGE 2', sub:'노을 지는 바다', theme:'sunset', background:'assets/backgrounds/stage-02-sunset-sails-watercolor.png', target:5000, speed:390, interval:.72,
    weights:{ fish:40, salmon:15, angel:7, can:10, boot:8, bomb:14, heart:3 } },
  { name:'STAGE 3', sub:'깜깜한 밤바다', theme:'night', background:'assets/backgrounds/stage-03-night-lighthouse-watercolor.png',  target:6500, speed:450, interval:.62,
    weights:{ fish:36, salmon:15, angel:8, can:8, boot:6, bomb:13, shark:9, heart:3 } },
  { name:'STAGE 4', sub:'햇살 가득 산호섬', theme:'day', background:'assets/backgrounds/stage-04-coral-sanctuary-watercolor.png', target:7500, speed:460, interval:.60,
    weights:{ fish:25, salmon:15, clownfish:28, can:8, bomb:12, shark:7, heart:5 },
    feverFish:['fish','clownfish','clownfish','salmon'] },
  { name:'STAGE 5', sub:'해파리의 에메랄드 만', theme:'day', background:'assets/backgrounds/stage-05-emerald-grotto-watercolor.png', target:8500, speed:475, interval:.58,
    weights:{ fish:20, angel:20, clownfish:27, boot:7, jellyfish:14, shark:7, heart:5 },
    feverFish:['fish','clownfish','angel','clownfish'] },
  { name:'STAGE 6', sub:'푸른 빙하 바다', theme:'day', background:'assets/backgrounds/stage-06-glacier-cathedral-watercolor.png', target:10000, speed:490, interval:.56,
    weights:{ fish:17, salmon:16, tuna:35, can:6, jellyfish:10, shark:11, heart:5 },
    feverFish:['fish','salmon','tuna','tuna'] },
  { name:'STAGE 7', sub:'성게가 몰려오는 폭풍 바다', theme:'night', background:'assets/backgrounds/stage-07-tempest-reef-watercolor.png', target:11000, speed:505, interval:.54,
    weights:{ salmon:24, angel:16, tuna:28, boot:6, urchin:14, bomb:7, heart:5 },
    feverFish:['salmon','angel','tuna','tuna'] },
  { name:'STAGE 8', sub:'보랏빛 산호 바다', theme:'sunset', background:'assets/backgrounds/stage-08-amethyst-reef-watercolor.png', target:12500, speed:520, interval:.52,
    weights:{ clownfish:22, tuna:18, butterfly:28, can:6, jellyfish:10, urchin:11, heart:5 },
    feverFish:['clownfish','tuna','butterfly','butterfly'] },
  { name:'STAGE 9', sub:'붉은 노을의 화산섬', theme:'sunset', background:'assets/backgrounds/stage-09-volcanic-embers-watercolor.png', target:14000, speed:535, interval:.50,
    weights:{ angel:20, tuna:22, butterfly:26, boot:5, lionfish:13, urchin:9, heart:5 },
    feverFish:['angel','tuna','butterfly','butterfly'] },
  { name:'STAGE 10', sub:'황금물고기의 오로라 바다', theme:'night', background:'assets/backgrounds/stage-10-aurora-crown-watercolor.png', target:16000, speed:550, interval:.48,
    weights:{ tuna:22, butterfly:24, golden:22, lionfish:10, urchin:9, shark:8, heart:5 },
    feverFish:['tuna','butterfly','golden','golden'] },
  { name:'STAGE 11', sub:'분홍 산호의 해마 정원', theme:'day', background:'assets/backgrounds/stage-11-seahorse-garden-watercolor.png', target:17500, speed:560, interval:0.47,
    weights:{ butterfly:20, golden:18, seahorse:30, boot:5, jellyfish:12, lionfish:10, heart:5 },
    feverFish:["butterfly","golden","seahorse","seahorse"] },
  { name:'STAGE 12', sub:'바람 부는 풍차 해안', theme:'day', background:'assets/backgrounds/stage-12-windmill-coast-watercolor.png', target:19000, speed:570, interval:0.46,
    weights:{ tuna:20, golden:18, flyingfish:30, can:5, shark:12, urchin:10, heart:5 },
    feverFish:["tuna","golden","flyingfish","flyingfish"] },
  { name:'STAGE 13', sub:'초록 수초의 바다숲', theme:'day', background:'assets/backgrounds/stage-13-seagrass-forest-watercolor.png', target:20000, speed:580, interval:0.45,
    weights:{ clownfish:18, seahorse:24, flyingfish:24, boot:5, crab:14, jellyfish:10, heart:5 },
    feverFish:["clownfish","seahorse","flyingfish"] },
  { name:'STAGE 14', sub:'은빛 달의 진주만', theme:'night', background:'assets/backgrounds/stage-14-pearl-moon-bay-watercolor.png', target:21500, speed:590, interval:0.44,
    weights:{ golden:18, seahorse:18, moonfish:33, can:5, crab:12, shark:9, heart:5 },
    feverFish:["golden","seahorse","moonfish","moonfish"] },
  { name:'STAGE 15', sub:'작은 등불의 반딧빛 바다', theme:'night', background:'assets/backgrounds/stage-15-lantern-cove-watercolor.png', target:23000, speed:600, interval:0.43,
    weights:{ flyingfish:18, moonfish:20, lanternfish:32, boot:5, jellyfish:11, lionfish:9, heart:5 },
    feverFish:["flyingfish","moonfish","lanternfish","lanternfish"] },
  { name:'STAGE 16', sub:'하얀 안개의 난파선 만', theme:'day', background:'assets/backgrounds/stage-16-misty-wreck-watercolor.png', target:24000, speed:610, interval:0.42,
    weights:{ tuna:18, moonfish:20, lanternfish:30, can:5, electricEel:13, crab:9, heart:5 },
    feverFish:["tuna","moonfish","lanternfish"] },
  { name:'STAGE 17', sub:'금빛 모래의 조개 해변', theme:'day', background:'assets/backgrounds/stage-17-shell-dunes-watercolor.png', target:25500, speed:620, interval:0.41,
    weights:{ golden:20, flyingfish:17, seabream:33, boot:5, crab:12, urchin:8, heart:5 },
    feverFish:["golden","flyingfish","seabream","seabream"] },
  { name:'STAGE 18', sub:'푸른 수로의 산호 궁전', theme:'day', background:'assets/backgrounds/stage-18-coral-channel-watercolor.png', target:27000, speed:630, interval:0.4,
    weights:{ seahorse:16, seabream:18, parrotfish:35, can:5, electricEel:12, lionfish:9, heart:5 },
    feverFish:["seahorse","seabream","parrotfish","parrotfish"] },
  { name:'STAGE 19', sub:'소용돌이의 검푸른 협곡', theme:'night', background:'assets/backgrounds/stage-19-whirlpool-strait-watercolor.png', target:28500, speed:640, interval:0.39,
    weights:{ moonfish:20, lanternfish:22, parrotfish:26, boot:5, stingray:13, electricEel:9, heart:5 },
    feverFish:["moonfish","lanternfish","parrotfish"] },
  { name:'STAGE 20', sub:'별빛 피어나는 꿈의 바다', theme:'night', background:'assets/backgrounds/stage-20-starlight-dream-watercolor.png', target:30000, speed:650, interval:0.38,
    weights:{ seabream:18, parrotfish:22, starlight:30, can:4, stingray:12, electricEel:9, heart:5 },
    feverFish:["seabream","parrotfish","starlight","starlight"] },
  { name:'STAGE 21', sub:'유리빛 파도가 반짝이는 석호', theme:'day', background:'assets/backgrounds/stage-21-glass-lagoon-watercolor.png', target:32000, speed:660, interval:0.37,
    weights:{"parrotfish":18,"starlight":20,"blueTang":30,"can":4,"stingray":12,"electricEel":11,"heart":5},
    feverFish:["parrotfish","starlight","blueTang","blueTang"] },
  { name:'STAGE 22', sub:'빗방울 노래하는 맹그로브 만', theme:'day', background:'assets/backgrounds/stage-22-rain-mangrove-watercolor.png', target:34000, speed:670, interval:0.36,
    weights:{"flyingfish":18,"blueTang":20,"squid":30,"boot":4,"jellyfish":12,"crab":11,"heart":5},
    feverFish:["flyingfish","blueTang","squid","squid"] },
  { name:'STAGE 23', sub:'꿀빛 사암의 바람 해안', theme:'sunset', background:'assets/backgrounds/stage-23-honey-sandstone-watercolor.png', target:36000, speed:680, interval:0.35,
    weights:{"blueTang":22,"squid":24,"golden":20,"can":4,"puffer":14,"urchin":11,"heart":5},
    feverFish:["blueTang","squid","golden"] },
  { name:'STAGE 24', sub:'붉은 단풍의 고요한 포구', theme:'sunset', background:'assets/backgrounds/stage-24-maple-inlet-watercolor.png', target:38000, speed:690, interval:0.34,
    weights:{"seabream":18,"blueTang":20,"mandarin":30,"boot":4,"puffer":12,"crab":11,"heart":5},
    feverFish:["seabream","blueTang","mandarin","mandarin"] },
  { name:'STAGE 25', sub:'보랏빛 물안개의 잠든 유적', theme:'night', background:'assets/backgrounds/stage-25-misty-ruins-watercolor.png', target:40000, speed:700, interval:0.33,
    weights:{"moonfish":20,"squid":23,"mandarin":23,"can":4,"octopus":14,"puffer":11,"heart":5},
    feverFish:["moonfish","squid","mandarin"] },
  { name:'STAGE 26', sub:'푸른 수정의 얼음 동굴', theme:'day', background:'assets/backgrounds/stage-26-crystal-ice-cove-watercolor.png', target:42000, speed:710, interval:0.32,
    weights:{"tuna":18,"squid":20,"ribbonfish":30,"boot":4,"electricEel":12,"octopus":11,"heart":5},
    feverFish:["tuna","squid","ribbonfish","ribbonfish"] },
  { name:'STAGE 27', sub:'붉은 바위의 바닷가재 등대', theme:'sunset', background:'assets/backgrounds/stage-27-lobster-lighthouse-watercolor.png', target:44000, speed:720, interval:0.31,
    weights:{"seabream":21,"mandarin":23,"ribbonfish":22,"can":4,"lobster":14,"crab":11,"heart":5},
    feverFish:["seabream","mandarin","ribbonfish"] },
  { name:'STAGE 28', sub:'하늘 거울의 소금 평원', theme:'day', background:'assets/backgrounds/stage-28-sky-mirror-salt-watercolor.png', target:46000, speed:730, interval:0.30,
    weights:{"starlight":18,"ribbonfish":20,"sunfish":30,"boot":4,"lobster":12,"puffer":11,"heart":5},
    feverFish:["starlight","ribbonfish","sunfish","sunfish"] },
  { name:'STAGE 29', sub:'부서진 별의 운석 해협', theme:'night', background:'assets/backgrounds/stage-29-meteor-strait-watercolor.png', target:48000, speed:740, interval:0.30,
    weights:{"lanternfish":20,"ribbonfish":23,"sunfish":23,"can":4,"sawfish":14,"octopus":11,"heart":5},
    feverFish:["lanternfish","ribbonfish","sunfish"] },
  { name:'STAGE 30', sub:'무지개 피어나는 새벽 바다', theme:'day', background:'assets/backgrounds/stage-30-rainbow-dawn-watercolor.png', target:50000, speed:750, interval:0.30,
    weights:{"starlight":18,"sunfish":20,"rainbowfish":30,"boot":4,"sawfish":12,"lobster":11,"heart":5},
    feverFish:["starlight","sunfish","rainbowfish","rainbowfish"] },
];

const img = n => `<img class="px" src="assets/i_${n}.png" alt="">`;
const ITEMS = {
  rainbowfish: { cls:'fish', w:120, h:78, pts:1200, art:()=>img('rainbowfish'), label:'무지개 물고기', desc:'+1200' },
  sawfish: { cls:'sawfish', w:132, h:92, pts:0, dmg:1, art:()=>img('sawfish'), label:'톱가오리', desc:'생명 -1', warn:0.8, speedMul:1.1, hitText:'톱날 조심!', hitColor:'#8ba9ba' },
  sunfish: { cls:'fish', w:106, h:112, pts:1000, art:()=>img('sunfish'), label:'개복치', desc:'+1000' },
  lobster: { cls:'lobster', w:106, h:112, pts:0, dmg:1, art:()=>img('lobster'), label:'바닷가재', desc:'생명 -1', warn:0.7, speedMul:1.05, hitText:'집게 조심!', hitColor:'#e98b76' },
  ribbonfish: { cls:'fish', w:134, h:60, pts:950, art:()=>img('ribbonfish'), label:'갈치', desc:'+950' },
  octopus: { cls:'octopus', w:110, h:100, pts:0, dmg:1, art:()=>img('octopus'), label:'문어', desc:'생명 -1', warn:0.75, speedMul:0.9, hitText:'먹물 조심!', hitColor:'#b493d5' },
  mandarin: { cls:'fish', w:108, h:74, pts:900, art:()=>img('mandarin'), label:'만다린피시', desc:'+900' },
  puffer: { cls:'puffer', w:96, h:96, pts:0, dmg:1, art:()=>img('puffer'), label:'가시복', desc:'생명 -1', warn:0.65, speedMul:0.95, hitText:'가시 조심!', hitColor:'#d9b45f' },
  squid: { cls:'fish', w:82, h:110, pts:850, art:()=>img('squid'), label:'오징어', desc:'+850' },
  blueTang: { cls:'fish', w:112, h:76, pts:800, art:()=>img('blueTang'), label:'블루탱', desc:'+800' },
  starlight: { cls:'fish', w:118, h:76, pts:750, art:()=>img('starlight'), label:'별빛 물고기', desc:'+750' },
  stingray: { cls:'stingray', w:118, h:102, pts:0, dmg:1, art:()=>img('stingray'), label:'가오리', desc:'생명 -1', warn:0.75, speedMul:1.1, hitText:'꼬리 조심!', hitColor:'#929ec9' },
  parrotfish: { cls:'fish', w:120, h:76, pts:650, art:()=>img('parrotfish'), label:'비늘돔', desc:'+650' },
  seabream: { cls:'fish', w:116, h:76, pts:600, art:()=>img('seabream'), label:'분홍 도미', desc:'+600' },
  electricEel: { cls:'electricEel', w:114, h:102, pts:0, dmg:1, art:()=>img('electricEel'), label:'전기뱀장어', desc:'생명 -1', warn:0.7, speedMul:1.05, hitText:'감전!', hitColor:'#84cddd' },
  lanternfish: { cls:'fish', w:112, h:72, pts:550, art:()=>img('lanternfish'), label:'등불고기', desc:'+550' },
  moonfish: { cls:'fish', w:92, h:98, pts:550, art:()=>img('moonfish'), label:'은달고기', desc:'+550' },
  crab: { cls:'crab', w:98, h:80, pts:0, dmg:1, art:()=>img('crab'), label:'집게 게', desc:'생명 -1', warn:0.6, speedMul:0.95, hitText:'집게!', hitColor:'#ef9b72' },
  flyingfish: { cls:'fish', w:126, h:76, pts:500, art:()=>img('flyingfish'), label:'날치', desc:'+500' },
  seahorse: { cls:'fish', w:70, h:106, pts:450, art:()=>img('seahorse'), label:'해마', desc:'+450' },
  fish:   { cls:'fish',  w:112, h:56, pts:100, art:()=>img('fish'), label:'고등어', desc:'+100' },
  salmon: { cls:'fish',  w:112, h:57, pts:200, art:()=>img('salmon'), label:'연어', desc:'+200' },
  angel:  { cls:'fish',  w:78,  h:96, pts:300, art:()=>img('angel'), label:'엔젤피시', desc:'+300' },
  clownfish:{ cls:'fish', w:108, h:64, pts:250, art:()=>img('clownfish'), label:'흰동가리', desc:'+250' },
  tuna:   { cls:'fish', w:128, h:65, pts:350, art:()=>img('tuna'), label:'참치', desc:'+350' },
  butterfly:{ cls:'fish', w:92, h:88, pts:400, art:()=>img('butterfly'), label:'나비고기', desc:'+400' },
  golden: { cls:'fish', w:116, h:72, pts:500, art:()=>img('golden'), label:'황금물고기', desc:'+500' },
  urchin: { cls:'urchin', w:86, h:86, pts:0, dmg:1, art:()=>img('urchin'), label:'성게', desc:'생명 -1', warn:.55, speedMul:1.1, hitText:'따끔!', hitColor:'#c783b5' },
  lionfish:{ cls:'lionfish', w:112, h:102, pts:0, dmg:1, art:()=>img('lionfish'), label:'쏠배감펭', desc:'생명 -1', warn:.7, speedMul:1.15, hitText:'독가시!', hitColor:'#ef9864' },
  can:    { cls:'trash', w:54,  h:82, pts:-100, dmg:1, art:()=>img('can'), label:'빈 캔', desc:'-100 · 생명 -1' },
  boot:   { cls:'trash', w:80,  h:82, pts:-100, dmg:1, art:()=>img('boot'), label:'헌 장화', desc:'-100 · 생명 -1' },
  bomb:   { cls:'bomb',  w:72,  h:100, pts:0, dmg:1, art:()=>img('bomb'), label:'폭탄', desc:'생명 -1' },
  shark:  { cls:'shark', w:132, h:217, pts:0, dmg:1, art:()=>img('shark'), label:'상어', desc:'생명 -1', warn:.7, speedMul:1.25 },
  heart:  { cls:'heart', w:78,  h:72, pts:0, art:()=>PIX.heartItem(), label:'생명 하트', desc:'생명 +1' },
  jellyfish:{ cls:'jellyfish', w:82, h:98, pts:0, dmg:1, art:()=>img('jellyfish'), label:'해파리', desc:'생명 -1', warn:.6, speedMul:.85, hitText:'찌릿!', hitColor:'#c29aff' },
};

/* ---------- build scene ---------- */
let BG;
function build(){
  BG = new PIX.PixelBG($('#bg')); BG.start();
  STAGES.slice(0,2).forEach(st=>{ if(st.background) BG.loadBackground(st.background); });
  PIX.drawTitle($('#titleBg'));
  document.querySelectorAll('#penguins .pg').forEach(p=>{ p.innerHTML = '<div class="bob">'+p.innerHTML+'</div>'; });
  $('#btnL').innerHTML = PIX.arrowSVG(-1);
  $('#btnR').innerHTML = PIX.arrowSVG(1);
  document.querySelectorAll('img').forEach(i=>i.classList.add('px'));
}

/* ---------- scaling ---------- */
function fit(){
  const extra = Math.min(MAX_EXTRA, Math.max(0, Math.floor((innerHeight*W/innerWidth - BASE_H)/4)*4));
  if(extra!==EXTRA){ EXTRA=extra; H=BASE_H+extra; CAT_TOP=BASE_CAT_TOP+extra; $('#game').style.setProperty('--extra', extra+'px'); BG.resize(extra); PIX.drawTitle($('#titleBg'), extra); }
  const s = Math.min(innerWidth/W, innerHeight/H);
  $('#game').style.setProperty('--safe-top', SAFE_TOP/s+'px');
  $('#game').style.transform = `translate(-50%,-50%) scale(${s})`;
}
addEventListener('resize', fit);

/* ---------- audio ---------- */
let actx=null, soundOn = localStorage.getItem('fc_sound') !== 'off';
// 페이지 로드 시 만들어진 컨텍스트는 브라우저에서 suspended로 시작하므로, 사용할 때마다 깨운다.
function audioCtx(){
  actx = actx || new (window.AudioContext||window.webkitAudioContext)();
  if(actx.state==='suspended') actx.resume();
  return actx;
}
// 음악·효과음 볼륨(0~100). iOS WebView는 audio.volume을 무시하므로 GainNode로 조절하고 저장한다.
// baseGain은 슬라이더와 별개인 채널 자체 음량이다.
function volumeChannel(key, baseGain=1){
  let volume=Number(localStorage.getItem(key) ?? 100), gain=null;
  return {
    get volume(){ return volume; },
    output(){
      if(!gain){ const c=audioCtx(); gain=c.createGain(); gain.gain.value=volume/100*baseGain; gain.connect(c.destination); }
      return gain;
    },
    set(v){ volume=v; localStorage.setItem(key, v); if(gain) gain.gain.value=v/100*baseGain; },
  };
}
// 음악 자체 음량 (0.5 ≈ -6dB). mp3를 다시 인코딩하지 않고 음량만 낮춘다.
const MUSIC_BASE_GAIN=.5;
const MUSIC_VOLUME=volumeChannel('fc_music_volume', MUSIC_BASE_GAIN), SFX_VOLUME=volumeChannel('fc_sfx_volume');
// 효과음 자체 음량 (0.125 ≈ -18dB). 슬라이더 볼륨과 별개로 모든 효과음에 곱해진다.
const SFX_BASE_GAIN=.125;
function tone(f, d=.1, type='square', vol=.08, slide=0, delay=0){
  if(!soundOn) return;
  try{
    audioCtx();
    const t = actx.currentTime + delay;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type=type; o.frequency.setValueAtTime(f,t);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide), t+d);
    g.gain.setValueAtTime(vol*SFX_BASE_GAIN,t); g.gain.exponentialRampToValueAtTime(.001,t+d);
    o.connect(g).connect(SFX_VOLUME.output()); o.start(t); o.stop(t+d+.02);
  }catch(e){}
}
const SFX = {
  move:()=>tone(520,.05,'triangle',.05),
  eat:()=>{tone(880,.07,'square',.06);tone(1320,.09,'square',.05,0,.05);},
  big:()=>{tone(784,.07);tone(1046,.07,'square',.06,0,.06);tone(1568,.12,'square',.05,0,.12);},
  yuck:()=>tone(220,.2,'sawtooth',.06,-100),
  hurt:()=>{tone(160,.35,'sawtooth',.1,-110);tone(90,.3,'square',.08,-40,.05);},
  heal:()=>{[660,880,1100,1320].forEach((f,i)=>tone(f,.1,'triangle',.07,0,i*.06));},
  fever:()=>{[523,659,784,1046,1318].forEach((f,i)=>tone(f,.12,'square',.06,0,i*.07));},
  tick:()=>tone(1200,.04,'square',.04),
  clear:()=>{[523,659,784,1046].forEach((f,i)=>tone(f,.18,'triangle',.08,0,i*.12));},
  fail:()=>{[392,330,262].forEach((f,i)=>tone(f,.25,'triangle',.08,0,i*.18));},
};

/* ---------- music ---------- */
// 타이틀은 intro, 플레이 중에는 게임 BGM을 반복 재생한다 (사운드 끄기를 따른다).
// 앱의 로컬 서버는 Range 요청을 지원하지 않아 iOS가 mp3를 스트리밍하지 못하므로
// 파일을 통째로 받아 blob URL로 재생한다.
function loadTrack(src){
  const a=new Audio(); a.loop=true;
  fetch(src).then(r=>r.blob()).then(b=>{
    a.src=URL.createObjectURL(b);
    audioCtx().createMediaElementSource(a).connect(MUSIC_VOLUME.output());
    applyMusic();
  }).catch(()=>{});
  return a;
}
const MUSIC = { title:loadTrack('assets/sounds/intro.mp3'), play:loadTrack('assets/sounds/game_bgm.mp3') };
// 화면별 곡과 재생 여부. 일시정지는 위치를 유지하고, 목록에 없는 화면은 음악을 끈다.
const SCREEN_MUSIC = { title:['title',true], credits:['title',true], settings:['title',true], pause:['play',false] };
let music={track:null, playing:false}, musicSuspended=false;
// 앱에서는 게임이 스플래시 뒤에서 미리 로드되므로, 스플래시를 걷은 앱이 unmuteMusic을 부를 때까지 음악을 틀지 않는다.
let musicAwaitingSplash=!!window.NativeBridge;
function setMusic(track, playing=true){ music={track,playing}; applyMusic(); }
function applyMusic(){
  for(const [name,a] of Object.entries(MUSIC)){
    if(name!==music.track){ a.pause(); a.currentTime=0; continue; }
    if(music.playing && soundOn && !musicSuspended && !musicAwaitingSplash && a.src){ audioCtx(); a.play().catch(()=>{}); } else a.pause();
  }
}
// 앱이 백그라운드로 가면 화면과 관계없이 음악을 멈춘다.
function suspendMusic(on){ musicSuspended=on; applyMusic(); }

/* ---------- state ---------- */
const S = {
  ambT:0,
  running:false, paused:false, stage:0, score:0, stageStart:0, stageScore:0,
  lives:MAX_LIFE, lane:1, time:GAME_TIME, spawnT:0, items:[], fever:0, feverOn:false, feverT:0,
  invuln:0, last:0, lastTick:0, frozen:false,
  gameOver:false, reviveUsed:false,
};
let best = +localStorage.getItem('fc_best') || 0;

/* ---------- HUD ---------- */
function renderHearts(anim){
  const h=$('#hearts'); h.innerHTML='';
  for(let i=0;i<MAX_LIFE;i++){
    const d=document.createElement('div'); d.className='h'; d.innerHTML=PIX.heartIcon(i<S.lives);
    if(anim && anim.idx===i) d.classList.add(anim.type);
    h.appendChild(d);
  }
}
function renderScore(){
  const el=$('#score'); el.textContent=S.score.toLocaleString();
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  const st=STAGES[S.stage];
  $('#targetLabel').textContent = `${Math.max(0,S.score-S.stageStart).toLocaleString()} / ${st.target.toLocaleString()}`;
}
function renderTime(){
  const t=Math.max(0,S.time);
  $('#timeFill').style.transform=`scaleX(${t/GAME_TIME})`;
  $('#timeFill').classList.toggle('low', t<=10);
  const s=Math.ceil(t); $('#timeText').textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
}
function renderFever(){
  const pct = S.feverOn ? (S.feverT/FEVER_TIME) : (S.fever/FEVER_NEED);
  $('#feverFill').style.width=(pct*100)+'%';
  $('#game').classList.toggle('fever-on', S.feverOn);
}

/* ---------- cat ---------- */
let faceTimer=0;
function setFace(f, ms=380, fish=null){
  const c=$('#cat'); c.classList.remove('st-idle','st-happy','st-yuck','st-hurt','st-burnt'); c.classList.add('st-'+f);
  if(f==='happy'||f==='burnt') $('#cat .body').classList.remove('squash');
  const heldFish=$('#heldFish');
  heldFish.hidden=f!=='happy'||!fish;
  if(heldFish.hidden) heldFish.removeAttribute('src');
  else {
    heldFish.src=fish.el.querySelector('img').getAttribute('src');
    heldFish.style.width=Math.min(fish.def.w,132)+'px';
    heldFish.style.height=Math.min(fish.def.h,64)+'px';
  }
  clearTimeout(faceTimer); if(f!=='idle') faceTimer=setTimeout(()=>setFace('idle'),ms);
}
function placeCat(){
  $('#cat').style.transform=`translateX(${LANES[S.lane]-CAT_W/2}px)`;
}
function squash(){ const b=$('#cat .body'); b.classList.remove('squash'); void b.offsetWidth; b.classList.add('squash'); }
function move(dir){
  if(!S.running||S.paused) return;
  const n=Math.max(0,Math.min(2,S.lane+dir));
  if(n!==S.lane){ S.lane=n; placeCat(); SFX.move(); squash(); checkCatchNow(); }
}

/* ---------- penguins ---------- */
function pull(lane){
  const p=$('#penguins').children[lane]; p.classList.add('pull');
  clearTimeout(p._t); p._t=setTimeout(()=>p.classList.remove('pull'), S.feverOn?70:150);
}

/* ---------- spawning ---------- */
function pickType(){
  const w=STAGES[S.stage].weights; let tot=0; for(const k in w){ if(k==='heart'&&S.lives>=MAX_LIFE) continue; tot+=w[k]; }
  let r=Math.random()*tot;
  for(const k in w){ if(k==='heart'&&S.lives>=MAX_LIFE) continue; r-=w[k]; if(r<=0) return k; }
  return 'fish';
}
function pickFeverFish(extra=false){
  const fish=STAGES[S.stage].feverFish;
  if(fish) return fish[Math.floor(Math.random()*fish.length)];
  const r=Math.random();
  return extra ? (r<.7?'fish':'salmon') : (r<.6?'fish':r<.88?'salmon':'angel');
}
let lastLane=-1;
function spawn(type, lane, opts={}){
  const def=ITEMS[type];
  if(lane==null){ lane=Math.floor(Math.random()*3); if(lane===lastLane && Math.random()<.4) lane=(lane+1+Math.floor(Math.random()*2))%3; }
  lastLane=lane;
  const el=document.createElement('div'); el.className='it '+def.cls;
  el.style.width=def.w+'px'; el.style.height=def.h+'px';
  el.innerHTML=`<div class="spin">${def.art()}</div>`;
  const jitter = opts.jitter ? (Math.random()-.5)*opts.jitter : 0;
  // 게임 높이가 늘어 낙하 거리가 길어진 만큼 빠르게 떨어뜨려 고양이에게 닿는 시간은 그대로 둔다.
  const fallScale = CAT_TOP/BASE_CAT_TOP;
  const it={ type, def, lane, x:LANES[lane]-def.w/2+jitter, y:-def.h-20, vy:(opts.speed||STAGES[S.stage].speed)*(def.speedMul||1)*fallScale*(0.92+Math.random()*.16), el, delay:0, done:false };
  if(def.warn && !opts.noWarn){
    it.delay=def.warn;
    const w=document.createElement('div'); w.className='warn'; w.textContent='!'; w.style.left=LANES[lane]+'px';
    $('#fx').appendChild(w); it.warnEl=w; el.style.display='none';
  }
  el.style.transform=`translate(${it.x}px,${it.y}px)`;
  $('#items').appendChild(el);
  S.items.push(it);
  if(!it.delay) pull(lane);
}

/* ---------- catching ---------- */
function inCatchZone(it){
  const bottom=it.y+it.def.h, cy=it.y+it.def.h/2;
  return bottom>=CAT_TOP+34 && cy<=CAT_TOP+150;
}
function checkCatchNow(){
  for(const it of S.items){
    if(!S.running) break;
    if(!it.done && !it.delay && it.lane===S.lane && inCatchZone(it)) collect(it);
  }
}
function popText(txt, x, y, cls=''){
  const p=document.createElement('div'); p.className='pop '+cls; p.textContent=txt; p.style.left=x+'px'; p.style.top=y+'px';
  $('#blastFx').appendChild(p); setTimeout(()=>p.remove(),800);
}
function splats(x,y,color='#fff',n=8){
  for(let i=0;i<n;i++){ const s=document.createElement('div'); s.className='pxl'; s.style.left=x+'px'; s.style.top=y+'px'; s.style.background=color;
    const a=Math.random()*Math.PI*2, r=40+Math.random()*50; s.style.setProperty('--dx',Math.cos(a)*r+'px'); s.style.setProperty('--dy',Math.sin(a)*r+'px');
    $('#blastFx').appendChild(s); setTimeout(()=>s.remove(),500); }
}
function addScore(n){ S.score=Math.max(0,S.score+n); renderScore(); }
function collect(it){
  it.done=true; it.el.remove();
  const cx=LANES[S.lane], cy=CAT_TOP+60, d=it.def;
  if(d.pts<0||d.dmg){ S.fever=Math.max(0,S.fever-1); renderFever(); }
  if(d.cls==='fish'){
    const mul=S.feverOn?2:1, pts=d.pts*mul;
    addScore(pts); popText('+'+pts, cx, cy-30, S.feverOn?'x2':''); setFace('happy',380,it); splats(cx,cy+40,'#bfe8ff',6);
    d.pts>=300?SFX.big():SFX.eat(); fishHaptic();
    if(!S.feverOn){ S.fever++; if(S.fever>=FEVER_NEED) startFever(); }
    renderFever();
  } else if(d.cls==='trash'){
    addScore(d.pts); popText(d.pts, cx, cy-30, 'neg');
    if(S.invuln<=0) hurt(it);
    else { setFace('yuck',600); SFX.yuck(); }
  } else if(d.cls==='heart'){
    if(S.lives<MAX_LIFE){ S.lives++; renderHearts({idx:S.lives-1,type:'gain'}); popText('생명 +1', cx, cy-98, 'heal'); }
    else { addScore(300); popText('+300', cx, cy-98, 'heal'); }
    setFace('happy'); SFX.heal(); splats(cx,cy+30,'#ff9ab4',10);
  } else if(d.dmg){
    if(S.invuln>0){ popText('휴~', cx, cy-30); return; }
    hurt(it);
  }
}
function hurt(it){
  if(!TEST_MODE){ S.lives--; renderHearts({idx:S.lives,type:'lose'}); }
  const cx=LANES[S.lane];
  if(it.type==='bomb'){ const b=document.createElement('div'); b.className='boom'; b.style.left=cx+'px'; b.style.top=(CAT_TOP+80)+'px'; $('#blastFx').appendChild(b); setTimeout(()=>b.remove(),650); }
  else splats(cx,CAT_TOP+40,it.def.hitColor||'#48b8ee',14);
  const f=document.createElement('div'); f.className=it.type==='bomb'?'flash bomb-flash':'flash'; $('#fx').appendChild(f); setTimeout(()=>f.remove(),350);
  const w=$('#world'); w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake');
  popText(it.def.hitText||(it.type==='bomb'?'펑!':'앗!'), cx, CAT_TOP-10, 'neg');
  setFace(it.type==='bomb'?'burnt':'hurt',it.type==='bomb'?1200:900); SFX.hurt(); haptic(it.type==='bomb'?HAPTIC.bomb:HAPTIC.hurt);
  S.invuln=1.2; const c=$('#cat'); c.classList.remove('blink');
  if(it.type!=='bomb'){ void c.offsetWidth; c.classList.add('blink'); }
  if(S.lives<=0) endStage(false,'lives');
}

/* ---------- fever ---------- */
function startFever(){
  S.feverOn=true; BG.fever=true; S.feverT=FEVER_TIME; S.fever=0; SFX.fever(); haptic(HAPTIC.fever);
  $('#game').classList.add('fever'); $('#feverBanner').classList.add('show');
  setTimeout(()=>$('#feverBanner').classList.remove('show'),1500);
  // clear hazards on screen so fever is pure joy
  S.items.forEach(it=>{ if(it.def.dmg||it.def.cls==='trash'){ it.done=true; it.el.remove(); it.warnEl&&it.warnEl.remove(); splats(it.x+it.def.w/2,Math.max(60,it.y),'#fff',5);} });
  [0,1,2].forEach(pull);
}
function endFever(){
  S.feverOn=false; if(BG) BG.fever=false; $('#game').classList.remove('fever'); renderFever();
}
// 피버 때 쏟아진 물고기가 남으면 게이지가 금방 다시 차므로 화면을 비우고 새로 시작한다.
// endFever는 게임오버·재시작에서도 불리므로(부활 시 물고기 유지) 시간이 다 됐을 때만 부른다.
function clearAfterFever(){
  S.items.forEach(it=>{ it.el.remove(); it.warnEl&&it.warnEl.remove(); splats(it.x+it.def.w/2,Math.max(60,it.y),'#fff',5); });
  S.items=[]; S.spawnT=.6;
}

/* ---------- loop ---------- */
// rAF for smoothness + interval fallback (keeps running when rAF is throttled)
let loopOn=false, lastRaf=0;
function tick(){
  if(!S.running) return;
  const now=performance.now(); const dt=Math.min(.05,(now-S.last)/1000); if(dt<.004) return; S.last=now;
  if(!S.paused && !S.frozen) step(dt);
}
function startLoop(){
  if(loopOn) return; loopOn=true;
  const raf=()=>{ lastRaf=performance.now(); tick(); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  setInterval(()=>{ if(performance.now()-lastRaf>60) tick(); }, 16);
}
function step(dt){
  S.time-=dt; if(S.invuln>0) S.invuln-=dt;
  if(S.invuln<=0) $('#cat').classList.remove('revive-protection');
  if(S.time<=10 && Math.ceil(S.time)!==S.lastTick && S.time>0){ S.lastTick=Math.ceil(S.time); SFX.tick(); }
  renderTime();
  if(S.time<=0){ endStage(true,'time'); return; }

  if(S.feverOn){
    S.feverT-=dt; renderFever();
    if(S.feverT<=0){ endFever(); clearAfterFever(); }
  }
  // penguins fish constantly; in fever they go crazy
  S.ambT-=dt;
  if(S.ambT<=0){
    if(S.feverOn){ [0,1,2].forEach(i=>{ if(Math.random()<.8) pull(i); }); S.ambT=.09; }
    else { pull(Math.floor(Math.random()*3)); S.ambT=.28+Math.random()*.35; }
  }
  S.spawnT-=dt;
  if(S.spawnT<=0){
    if(S.feverOn){
      // rain of fish across all lanes
      spawn(pickFeverFish(), null, {speed:600, jitter:70});
      if(Math.random()<.45) spawn(pickFeverFish(true), null, {speed:640, jitter:80});
      S.spawnT=.075;
    } else if(S.time>1.2){
      spawn(pickType());
      // speed up gradually across the minute
      const prog=1-S.time/GAME_TIME;
      S.spawnT=STAGES[S.stage].interval*(1-.28*prog)*(0.85+Math.random()*.3);
    }
  }
  for(const it of S.items){
    if(it.done) continue;
    if(it.delay>0){ it.delay-=dt; if(it.delay<=0){ it.warnEl&&it.warnEl.remove(); it.el.style.display=''; pull(it.lane);} continue; }
    it.y+=it.vy*dt;
    it.el.style.transform=`translate(${it.x}px,${it.y}px)`;
    if(it.lane===S.lane && inCatchZone(it)) { collect(it); if(!S.running) return; continue; }
    if(it.y>H+20){ it.done=true; it.el.remove(); }
  }
  S.items=S.items.filter(i=>!i.done);
}

/* ---------- flow ---------- */
function show(id, behind){ document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('show', s.id===id || s.id===behind)); setMusic(...(SCREEN_MUSIC[id]||[null])); notifyNative('screen',{screen:id}); }
function hideAll(){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('show')); setMusic('play'); notifyNative('screen',{screen:'play'}); }
function clearItems(){ S.items.forEach(i=>{i.el.remove(); i.warnEl&&i.warnEl.remove();}); S.items=[]; $('#fx').innerHTML=''; $('#blastFx').querySelectorAll('.pop,.pxl').forEach(el=>el.remove()); }
function applyTheme(background=STAGES[S.stage].background){ const st=STAGES[S.stage], g=$('#game'); g.classList.remove('day','sunset','night'); g.classList.add(st.theme); BG&&BG.setTheme(st.theme,background,!!background&&st.backgroundPixelated); const next=STAGES[S.stage+1]; if(BG&&background&&next?.background) BG.loadBackground(next.background); }

let resultTimer=null;
function openIntro(){
  clearTimeout(resultTimer); S.gameOver=false; S.reviveUsed=false;
  pendingReviveAd=null; reviveAdMessage='';
  S.invuln=0; $('#cat').classList.remove('revive-protection');
  const st=STAGES[S.stage]; applyTheme();
  $('#introTitle').textContent=`스테이지 ${S.stage+1}`; $('#introSub').textContent=st.sub; $('#introGoal').textContent=st.target.toLocaleString();
  const prev = STAGES.slice(0,S.stage).flatMap(st=>Object.keys(st.weights));
  $('#legend').innerHTML = Object.keys(st.weights).map(k=>{
    const d=ITEMS[k], isNew=S.stage>0 && !prev.includes(k);
    return `<li class="${isNew?'new':''}"><span class="ic">${d.art()}</span><span>${d.label}<em>${isNew?'NEW · ':''}${d.desc}</em></span></li>`;
  }).join('');
  $('#stageLabel').textContent=st.name;
  S.stageStart=S.score; renderScore(); renderHearts(); S.time=GAME_TIME; renderTime(); S.fever=0; S.feverOn=false; renderFever();
  show('intro');
}
function callout(html, ms){ const c=$('#callout'); c.innerHTML=html; c.classList.add('show'); return new Promise(r=>setTimeout(()=>{c.classList.remove('show'); setTimeout(r,200);},ms)); }
async function beginStage(){
  hideAll(); clearItems();
  S.lane=1; placeCat(); setFace('idle'); S.invuln=0; S.spawnT=.6; S.feverOn=false; $('#game').classList.remove('fever');
  await callout(`<b>READY</b>샴냥이를 좌우로 움직여 물고기를 받아요!`, 1100);
  await callout(`<b>GO!</b>`, 550);
  S.running=true; S.paused=false; S.last=performance.now(); startLoop();
}
function endStage(timeUp, why){
  if(!S.running) return;
  cancelResume();
  S.running=false; endFever();
  const st=STAGES[S.stage]; const gained=S.score-S.stageStart;
  const clear = why==='time' && (TEST_MODE || gained>=st.target);
  if(S.score>best){ best=S.score; localStorage.setItem('fc_best',best); }
  resultTimer=setTimeout(()=>{
    const gameOver=why==='lives';
    S.gameOver=gameOver;
    if(!gameOver) clearItems();
    $('#result').classList.toggle('game-over',gameOver);
    $('#result').classList.toggle('time-up',why==='time'&&!clear);
    $('#resLocation').hidden=!gameOver; $('#resTime').hidden=!gameOver; $('#reviveArea').hidden=!gameOver;
    $('#resLocation').textContent=`STAGE ${S.stage+1} · ${st.sub}`;
    $('#resTime').textContent=`남은 시간 ${Math.ceil(Math.max(0,S.time))}초`;
    $('#btnHome').textContent=gameOver?'메인 화면으로':'처음으로';
    const last=S.stage===STAGES.length-1;
    $('#resTitle').textContent = clear ? (last?'모두 클리어!':'스테이지 클리어') : (why==='lives'?'게임 오버':'시간 종료');
    const stars = clear ? (gained>=st.target*1.8?3:gained>=st.target*1.35?2:1) : 0;
    $('#resStars').innerHTML=[0,1,2].map(i=>`<i class="${i<stars?'on':''}">${PIX.starIcon(i<stars)}</i>`).join('');
    const catImg = !clear ? 'cat_hurt' : stars>=3 ? 'cat_reach' : stars===2 ? 'cat_star2' : 'cat_star1';
    $('#resCat').src = 'assets/'+catImg+'.png'; $('#resCat').classList.toggle('cheer', stars>=3); $('#resCat').classList.toggle('sulk', clear && stars===1);
    $('#resStage').textContent=gained.toLocaleString()+(clear?'':` / ${st.target.toLocaleString()}`);
    $('#resTotal').textContent=S.score.toLocaleString();
    $('#resBest').textContent=best.toLocaleString();
    const nb=$('#btnNext');
    if(clear && !last){ nb.textContent='다음 스테이지'; nb.onclick=()=>{S.stage++; openIntro();}; }
    else if(clear && last){ nb.textContent='다시 하기'; nb.onclick=()=>newGame(); }
    else { nb.textContent=gameOver?'현재 스테이지 처음부터 다시하기':'다시 도전'; nb.onclick=restartStage; }
    $('#shareRow').hidden=!window.NativeBridge||gameOver;
    renderReviveAd();
    clear?SFX.clear():SFX.fail();
    show('result');
    if(gameOver) ($('#btnRevive').disabled||$('#btnRevive').hidden?nb:$('#btnRevive')).focus();
  }, why==='lives'?700:300);
}
function newGame(){ S.stage=0; S.score=0; S.lives=MAX_LIFE; openIntro(); }
function reviveFromGameOver(startCountdown=true){
  if(!S.gameOver || S.reviveUsed || S.time<=0) return false;
  S.gameOver=false; S.reviveUsed=true; S.lives=MAX_LIFE; S.invuln=3;
  S.items=S.items.filter(it=>{
    if(it.done || it.def.dmg || it.def.cls==='trash'){ it.el.remove(); it.warnEl&&it.warnEl.remove(); return false; }
    return true;
  });
  $('#fx').innerHTML=''; $('#blastFx').innerHTML=''; $('#world').classList.remove('shake');
  $('#cat').classList.remove('blink'); $('#cat').classList.add('revive-protection'); setFace('idle');
  S.spawnT=Math.max(.6,S.spawnT); renderHearts(); renderScore(); renderTime(); renderFever();
  S.running=true; pauseGame(); startLoop(); if(startCountdown) resumeGame(); return true;
}
function restartStage(){
  cancelResume();
  S.running=false; S.paused=false; S.frozen=false;
  clearItems(); endFever(); S.score=S.stageStart; S.lives=MAX_LIFE; openIntro();
}
function toTitle(){ clearTimeout(resultTimer); cancelResume(); pendingReviveAd=null; S.gameOver=false; S.running=false; S.paused=false; S.frozen=false; $('#cat').classList.remove('revive-protection'); clearItems(); endFever(); S.stage=0; applyTheme(null); show('title'); }

/* ---------- rewarded revive (SDK 연결 전에는 비활성) ---------- */
let reviveAdAvailable=false, reviveAdRequestId=0, pendingReviveAd=null, reviveAdMessage='', reviveAdInterrupted=false;
function renderReviveAd(){
  const button=$('#btnRevive'), pending=pendingReviveAd!==null;
  button.hidden=S.reviveUsed;
  button.disabled=!S.gameOver || S.reviveUsed || S.time<=0 || !window.NativeBridge || !reviveAdAvailable || pending;
  button.textContent=pending?'광고 확인 중…':'▶ 광고 보고 이어하기';
  $('#btnNext').disabled=pending; $('#btnHome').disabled=pending;
  const status=$('#reviveStatus');
  status.textContent=S.reviveUsed?'이번 스테이지의 이어하기를 사용했어요':
    pending?'광고를 마치면 하트 3개로 이어갑니다.':
    S.time<=0?'시간이 끝나 이어할 수 없어요.':
    reviveAdMessage || (reviveAdAvailable?'남은 시간과 점수가 그대로 유지돼요.':'');
  status.hidden=!status.textContent;
}
function requestReviveAd(){
  if($('#btnRevive').disabled || !S.gameOver || S.reviveUsed || pendingReviveAd!==null) return;
  pendingReviveAd=++reviveAdRequestId; reviveAdMessage=''; reviveAdInterrupted=false; renderReviveAd();
  notifyNative('reviveAd',{requestId:pendingReviveAd,stage:S.stage+1});
}
function completeReviveAd(requestId, rewarded){
  if(pendingReviveAd===null || requestId!==pendingReviveAd || !S.gameOver) return false;
  pendingReviveAd=null;
  if(rewarded===true && reviveFromGameOver(!reviveAdInterrupted)) return true;
  reviveAdMessage='광고를 완료하지 못했어요. 다시 시도할 수 있어요.'; renderReviveAd();
  ($('#btnRevive').disabled?$('#btnNext'):$('#btnRevive')).focus(); return false;
}
$('#btnRevive').addEventListener('click', requestReviveAd);

/* ---------- input ---------- */
function bindPress(el, fn){
  el.addEventListener('pointerdown', e=>{ e.preventDefault(); fn(); el.classList.add('press'); setTimeout(()=>el.classList.remove('press'),110); });
}
bindPress($('#btnL'), ()=>move(-1));
bindPress($('#btnR'), ()=>move(1));
addEventListener('keydown', e=>{
  if(e.repeat) return;
  if(e.key==='ArrowLeft'||e.key==='a'){ move(-1); $('#btnL').classList.add('press'); setTimeout(()=>$('#btnL').classList.remove('press'),110); }
  if(e.key==='ArrowRight'||e.key==='d'){ move(1); $('#btnR').classList.add('press'); setTimeout(()=>$('#btnR').classList.remove('press'),110); }
  if(e.key==='Escape'||e.key==='p') togglePause();
});
function togglePause(){
  if(!S.running) return;
  if(resumeTimer!==null){ pauseGame(); return; }
  if(S.paused && !$('#pauseConfirm').hidden){ closePauseConfirm(); return; }
  S.paused?resumeGame():pauseGame();
}
let resumeTimer=null;
function cancelResume(){
  clearInterval(resumeTimer); resumeTimer=null;
  $('#pauseCard').hidden=false; $('#resumeCountdown').hidden=true;
  $('#pause').setAttribute('aria-labelledby','pauseHeading');
}
function pauseGame(){
  cancelResume(); S.paused=true; S.frozen=false;
  renderPause(); show('pause'); $('#btnResume').focus();
}
function resumeGame(){
  if(resumeTimer!==null || document.hidden || musicSuspended) return;
  let count=3;
  $('#pauseCard').hidden=true; $('#resumeCountdown').hidden=false;
  $('#pause').setAttribute('aria-labelledby','resumeHeading');
  $('#resumeCount').textContent=count; $('#btnResumeCancel').focus();
  resumeTimer=setInterval(()=>{
    if(document.hidden || musicSuspended){ pauseGame(); return; }
    count--;
    if(count>0){ $('#resumeCount').textContent=count; return; }
    cancelResume(); S.paused=false; S.last=performance.now(); hideAll(); $('#btnPause').focus();
  },1000);
}
function renderPause(){
  $('#pauseMenu').hidden=false; $('#pauseConfirm').hidden=true;
  const st=STAGES[S.stage], gained=Math.max(0,S.score-S.stageStart);
  $('#pauseStage').textContent=`STAGE ${S.stage+1} · ${st.sub}`;
  $('#pauseTime').textContent=`${Math.ceil(Math.max(0,S.time))}초`;
  $('#pauseScore').textContent=gained.toLocaleString();
  $('#pauseTarget').textContent=st.target.toLocaleString();
  const progress=$('#pauseProgress');
  progress.setAttribute('aria-valuemin',0); progress.setAttribute('aria-valuemax',st.target);
  progress.setAttribute('aria-valuenow',Math.min(gained,st.target));
  progress.firstElementChild.style.width=`${Math.min(100,gained/st.target*100)}%`;
}
let pauseAction=null;
function openPauseConfirm(action){
  pauseAction=action;
  $('#pauseMenu').hidden=true; $('#pauseConfirm').hidden=false;
  const restart=action==='restart';
  $('#pauseConfirmTitle').textContent=restart?'이번 스테이지를 다시 시작할까요?':'타이틀로 돌아갈까요?';
  $('#pauseConfirmCopy').textContent=restart?'이번 스테이지의 점수는 초기화됩니다.\n이전 스테이지까지의 총점은 유지되고,\n생명은 3개로 복구됩니다.':'진행 중인 게임이 종료됩니다.\n다음 게임은 1스테이지부터 시작합니다.';
  $('#btnPauseConfirm').textContent=restart?'다시 시작':'타이틀로 가기';
  $('#btnPauseCancel').focus();
}
function closePauseConfirm(){
  $('#pauseMenu').hidden=false; $('#pauseConfirm').hidden=true;
  $(pauseAction==='restart'?'#btnRestart':'#btnQuit').focus(); pauseAction=null;
}
$('#btnPause').addEventListener('click', togglePause);
$('#btnResume').addEventListener('click', togglePause);
$('#btnResumeCancel').addEventListener('click', pauseGame);
$('#btnRestart').addEventListener('click', ()=>openPauseConfirm('restart'));
$('#btnPauseCancel').addEventListener('click', closePauseConfirm);
$('#btnPauseConfirm').addEventListener('click', ()=>{ const action=pauseAction; pauseAction=null; action==='restart'?restartStage():toTitle(); });
$('#btnQuit').addEventListener('click', ()=>openPauseConfirm('title'));
$('#btnHome').addEventListener('click', toTitle);
$('#btnStart').addEventListener('click', ()=>{ tone(1,.01,'sine',.001); newGame(); });
$('#btnGo').addEventListener('click', beginStage);
$('#btnShare').addEventListener('click', ()=>notifyNative('share',{score:S.score, stage:S.stage+1, best}));
$('#btnCredits').addEventListener('click', ()=>show('credits','title'));
$('#credits [data-close]').addEventListener('click', ()=>show('title'));
$('#credits').addEventListener('click', e=>{ if(e.target.id==='credits') show('title'); });
$('#btnSettings').addEventListener('click', ()=>show('settings','title'));
$('#settings [data-close]').addEventListener('click', ()=>show('title'));
$('#settings').addEventListener('click', e=>{ if(e.target.id==='settings') show('title'); });
function bindVolumeSlider(id, channel, preview){
  const input=$('#'+id), text=$('#'+id+'Text');
  input.value=text.textContent=channel.volume;
  input.addEventListener('input', ()=>{ channel.set(Number(input.value)); text.textContent=input.value; preview&&preview(); });
}
bindVolumeSlider('musicVolume', MUSIC_VOLUME);
// 효과음은 계속 나오지 않으므로 조절할 때마다 한 번 들려준다.
bindVolumeSlider('sfxVolume', SFX_VOLUME, SFX.eat);
const sb=$('#btnSound');
function renderSound(){
  sb.classList.toggle('off',!soundOn); sb.setAttribute('aria-pressed',soundOn);
  $('#btnPauseSound').setAttribute('aria-pressed',soundOn); $('#btnPauseSound b').textContent=soundOn?'ON':'OFF';
}
function toggleSound(){ soundOn=!soundOn; localStorage.setItem('fc_sound',soundOn?'on':'off'); renderSound(); applyMusic(); SFX.eat(); }
renderSound();
sb.addEventListener('click', toggleSound);
$('#btnPauseSound').addEventListener('click', toggleSound);
document.addEventListener('visibilitychange', ()=>{
  suspendMusic(document.hidden);
  if(document.hidden && pendingReviveAd!==null) reviveAdInterrupted=true;
  if(document.hidden && S.running && (!S.paused || resumeTimer!==null)) pauseGame();
});

/* ---------- native app ---------- */
// 앱(WebView)에서만 window.NativeBridge가 주입된다. 브라우저에서는 이벤트를
// 보내지 않고 GameControl 전역도 만들지 않아 기존 동작이 그대로다.
function notifyNative(type, payload){ if(window.NativeBridge) window.NativeBridge.send(type, payload); }
// 진동 패턴은 navigator.vibrate 형식([진동, 쉼, 진동, ...] ms). 앱에서만 기기 진동으로 재생한다.
const HAPTIC = { fish:[10], hurt:[55], bomb:[70,40,90], fever:[20,40,20,40,60] };
// FEVER 중에는 물고기가 비처럼 쏟아져 수집마다 울리면 진동이 끊이지 않으므로 간격을 둔다.
const FISH_HAPTIC_GAP_MS = 250;
let lastFishHaptic = -Infinity;
let hapticOn = localStorage.getItem('fc_haptic') !== 'off';
function haptic(pattern){ if(hapticOn) notifyNative('haptic',{pattern}); }
// 진동은 앱에서만 울리므로 설정의 진동 줄도 앱에서만 보인다.
const hapticButton=$('#btnHaptic');
function renderHaptic(){
  hapticButton.textContent=hapticOn?'ON':'OFF'; hapticButton.setAttribute('aria-pressed', hapticOn);
  $('#btnPauseHaptic').setAttribute('aria-pressed',hapticOn); $('#btnPauseHaptic b').textContent=hapticOn?'ON':'OFF';
}
$('#hapticRow').hidden=!window.NativeBridge;
$('#btnPauseHaptic').hidden=!window.NativeBridge;
renderHaptic();
function toggleHaptic(){ hapticOn=!hapticOn; localStorage.setItem('fc_haptic', hapticOn?'on':'off'); renderHaptic(); haptic(HAPTIC.fish); }
hapticButton.addEventListener('click', toggleHaptic);
$('#btnPauseHaptic').addEventListener('click', toggleHaptic);
function fishHaptic(){
  const now=performance.now();
  if(now-lastFishHaptic<FISH_HAPTIC_GAP_MS) return;
  lastFishHaptic=now; haptic(HAPTIC.fish);
}
if(window.NativeBridge) window.GameControl = {
  // 광고 SDK를 연결하는 쪽에서 준비 여부와 보상 지급 결과를 전달한다.
  setReviveAdAvailable(available){ reviveAdAvailable=available===true; renderReviveAd(); },
  completeReviveAd,
  // 앱 종료 확인 창이 떠 있는 동안 일시정지 화면 없이 진행만 멈춘다.
  freeze(){ if(S.running && !S.paused) S.frozen=true; },
  resume(){ S.frozen=false; S.last=performance.now(); },
  // 앱이 백그라운드로 갈 때 플레이 중이면 일시정지 화면으로 전환한다.
  pause(){
    if(pendingReviveAd!==null) reviveAdInterrupted=true;
    if(S.running && (!S.paused || resumeTimer!==null)) pauseGame();
  },
  // visibilitychange가 WebView에서 항상 오지는 않으므로 앱 생명주기로 음악을 멈추고 재개한다.
  muteMusic(){ suspendMusic(true); },
  setSafeTop(px){ SAFE_TOP=px; fit(); },
  unmuteMusic(){ musicAwaitingSplash=false; suspendMusic(false); },
};

/* ---------- init ---------- */
$('#testModeLabel').hidden=!TEST_MODE;
build(); fit(); placeCat(); renderHearts(); renderScore(); renderTime(); renderFever(); toTitle();

})();
