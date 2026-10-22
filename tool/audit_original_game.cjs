// 원본 HTML 게임의 콘텐츠와 Flutter 게임/번들을 비교한다.
// node tool/audit_original_game.cjs E:/workspace/games/games/fishing_cat
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const original = process.argv[2];
if (!original) throw new Error('비교할 원본 HTML 게임 폴더를 지정하세요.');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'games');
const bundle = path.join(root, 'assets/game');
const read = (dir, file) => fs.readFileSync(path.join(dir, file), 'utf8');

function content(dir) {
  const code = read(dir, 'game.js');
  const stages = code.match(/const STAGES = (\[[\s\S]*?\n\]);/);
  const items = code.match(/const ITEMS = (\{[\s\S]*?\n\});/);
  assert(stages && items, `${dir}: 스테이지/아이템 정의를 찾지 못했습니다.`);
  const context = { img: name => `assets/i_${name}.png`, PIX: { heartItem: () => 'generated-heart' } };
  const data = vm.runInNewContext(`({stages:${stages[1]},items:${items[1]}})`, context);
  // VM 객체를 평범한 JSON으로 변환하고 이미지 생성 함수도 비교 가능하게 평가한다.
  for (const item of Object.values(data.items)) item.art = item.art();
  return { code, ...JSON.parse(JSON.stringify(data)) };
}

function spawnSelectors(code) {
  return code.slice(code.indexOf('function pickType(){'), code.indexOf('let lastLane=-1;'))
    .replace(/\s+/g, '');
}

const upstream = content(original);
const local = content(source);
const bundled = content(bundle);
assert.equal(upstream.stages.length, 30, '원본 스테이지가 30개여야 합니다.');
assert.deepEqual(local.stages, upstream.stages, '스테이지별 배경·목표·속도·간격·출현 비율·피버 구성이 다릅니다.');
const expectedItems = JSON.parse(JSON.stringify(upstream.items));
// Flutter에서 별도로 적용한 캔/장화의 하트 감소 개선을 유지한다.
for (const key of ['can', 'boot']) {
  expectedItems[key].dmg = 1;
  expectedItems[key].desc = '-100 · 생명 -1';
}
assert.deepEqual(local.items, expectedItems, '아이템 정의에 예상하지 못한 차이가 있습니다.');
assert.equal(spawnSelectors(local.code), spawnSelectors(upstream.code), '일반/피버 출현 선택 로직이 다릅니다.');
assert.match(local.code, /const TEST_MODE = false;/, '앱에서는 테스트 모드를 꺼야 합니다.');

const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const images = new Set(upstream.stages.map(stage => stage.background));
for (const item of Object.values(upstream.items)) if (item.art.startsWith('assets/')) images.add(item.art);
for (const relative of images) {
  assert.equal(hash(path.join(source, relative)), hash(path.join(original, relative)), `이미지 누락/변경: ${relative}`);
  const bundledPath = relative.includes('/backgrounds/') ? relative.replace(/\.png$/, '.jpg') : relative;
  assert(fs.existsSync(path.join(bundle, bundledPath)), `번들 이미지 누락: ${bundledPath}`);
}
const expectedBundleStages = local.stages.map(stage => ({
  ...stage, background: stage.background.replace(/\.png$/, '.jpg'),
}));
assert.deepEqual(bundled.stages, expectedBundleStages, '번들의 스테이지 설정이 다릅니다.');
assert.deepEqual(bundled.items, local.items, '번들의 아이템 설정이 다릅니다.');
assert.equal(bundled.code, local.code.replace(/(assets\/backgrounds\/[\w-]+)\.png/g, '$1.jpg'), '번들 게임 코드가 최신 원본과 다릅니다.');

const fish = Object.values(local.items).filter(item => item.cls === 'fish').length;
const hazards = Object.values(local.items).filter(item => item.dmg).length;
console.log(`PASS: 30개 스테이지 전체 설정 일치, 아이템 ${Object.keys(local.items).length}종(생선 ${fish}, 피해 장애물 ${hazards}, 하트 1)`);
console.log(`PASS: 일반/피버 출현 선택 로직 일치, 원본 이미지 ${images.size}개 SHA-256 일치, 앱 번들 설정·이미지 반영`);
console.log('유지한 차이: 앱 테스트 모드 OFF, 캔/장화 생명 감소, 화면 확장·속도 보정 및 네이티브/UI 개선');
