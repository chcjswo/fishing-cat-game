// 앱에서는 스플래시 동안 음악을 멈춰 두고, 앱이 스플래시를 걷은 뒤 재개한다
const { runBrowser } = require('./browser.cjs');

runBrowser(async () => {
  check(probe.musicAwaitingSplash(), '앱에서 스플래시 동안 음악이 멈춰 있지 않다');
  GameControl.unmuteMusic();
  check(!probe.musicAwaitingSplash(), 'unmuteMusic 후에도 음악이 멈춰 있다');
}, { native: true });

// 브라우저에서는 스플래시가 없으므로 바로 재생할 수 있다
runBrowser(async () => {
  check(!probe.musicAwaitingSplash(), '브라우저에서 음악이 멈춘 채 시작했다');
});

console.log('PASS: 앱 스플래시 동안 음악 정지, unmuteMusic으로 재개, 브라우저는 바로 재생');
