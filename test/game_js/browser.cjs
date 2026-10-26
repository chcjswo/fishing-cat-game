// games/ 의 게임을 헤드리스 Edge에서 띄워 스크립트로 검증하는 하네스.
// 원본 fishing_cat/tests/browser.cjs 를 이 저장소 구조에 맞게 옮겼다.
//
// - testMode: true면 game.js의 TEST_MODE를 켠 사본으로 실행한다.
// - native: true면 앱 WebView처럼 window.NativeBridge를 주입하고,
//   보낸 이벤트를 window.bridgeEvents 에 [type, payload]로 쌓는다.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..', 'games');
const PROBE =
  'window.probe={S,STAGES,ITEMS,pickType,pickFeverFish,spawn,collect,step,startFever,endFever,openIntro,beginStage,endStage,newGame,toTitle,togglePause,clearItems,hideAll,applyTheme,reviveFromGameOver,getBG:()=>BG,musicSuspended:()=>musicSuspended};\n';
const NATIVE_BRIDGE =
  'window.bridgeEvents=[];window.NativeBridge={send:(type,payload)=>bridgeEvents.push([type,payload||{}])};';

function runBrowser(script, { screenshot, width = 640, height = 1024, testMode = false, native = false, gameRoot = root } = {}) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fishing-cat-browser-'));
  let html = fs.readFileSync(path.join(gameRoot, 'index.html'), 'utf8');
  html = html.replace('<head>', `<head><base href="${pathToFileURL(gameRoot + path.sep).href}">`);
  html = html.replace(/<link[^>]+>/g, '');
  html = html.replace(
    '</head>',
    `<style>${fs.readFileSync(path.join(gameRoot, 'game.css'), 'utf8')}</style><script>window.testErrors=[];window.addEventListener('error',e=>testErrors.push(e.message));localStorage.setItem('fc_sound','off');${native ? NATIVE_BRIDGE : ''}</script></head>`,
  );
  for (const file of ['pixel.js', 'game.js']) {
    let code = fs.readFileSync(path.join(gameRoot, file), 'utf8');
    if (file === 'game.js') {
      if (testMode) code = code.replace('const TEST_MODE = false;', 'const TEST_MODE = true;');
      code = code.replace('/* ---------- init ---------- */', PROBE + '/* ---------- init ---------- */');
    }
    html = html.replace(new RegExp(`<script src="${file}[^" ]*"></script>`), () => `<script>${code}</script>`);
  }
  html = html.replace(
    '</body>',
    `<script>
  const check=(ok,message)=>{if(!ok)throw new Error(message)};
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  window.addEventListener('load',async()=>{try {await (${script})();check(!testErrors.length,testErrors.join('; '));const out=document.createElement('pre');out.id='verdict';out.hidden=true;out.textContent='PASS';document.body.appendChild(out);}catch(e){const out=document.createElement('pre');out.id='verdict';out.textContent='FAIL: '+e.message;document.body.appendChild(out);}});
  </script></body>`,
  );
  const fixture = path.join(temp, 'probe.html');
  fs.writeFileSync(fixture, html);
  try {
    const args = [path.join(__dirname, 'browser-driver.cjs'), fixture, path.join(temp, 'profile')];
    args.push(screenshot ? path.resolve(screenshot) : '', String(width), String(height));
    const result = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 40000, maxBuffer: 1024 * 1024 });
    const verdict = (result.stdout || '').trim();
    if (result.status !== 0 || verdict !== 'PASS') throw new Error(verdict || 'Browser did not finish: ' + (result.error || result.stderr));
  } finally {
    // mkdtemp creates this exact directory beneath the OS temporary directory.
    fs.rmSync(temp, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}

module.exports = { runBrowser, root };
