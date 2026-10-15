// 게임 JS 브라우저 테스트(*.test.cjs)를 모두 실행한다.
// 사용법 (저장소 루트에서): node test/game_js/run_all.cjs
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const files = fs.readdirSync(__dirname).filter((file) => file.endsWith('.test.cjs')).sort();
let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, [path.join(__dirname, file)], { encoding: 'utf8' });
  const output = (result.stdout + result.stderr).trim();
  if (result.status === 0) console.log(`ok   ${file}  ${output}`);
  else {
    failed++;
    console.log(`FAIL ${file}\n${output}`);
  }
}
console.log(`${files.length - failed}/${files.length} passed`);
process.exitCode = failed ? 1 : 0;
