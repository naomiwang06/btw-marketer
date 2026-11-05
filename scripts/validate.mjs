// 檢查 content.json 有沒有寫錯。部署前會自動執行；本機也可以跑：node scripts/validate.mjs
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';

const errors = [];
let data;
try {
  data = JSON.parse(readFileSync(new URL('../content.json', import.meta.url), 'utf8'));
} catch (e) {
  console.error('❌ content.json 不是合法的 JSON（常見原因：少逗號、多逗號、引號沒成對）：\n  ' + e.message);
  process.exit(1);
}

const need = (cond, msg) => { if (!cond) errors.push(msg); };
const isStr = (v) => typeof v === 'string' && v.trim() !== '';

need(data.hero && isStr(data.hero.intro), 'hero.intro（一句自介）不能是空的');
need(data.hero && Array.isArray(data.hero.titleLines) && data.hero.titleLines.length > 0, 'hero.titleLines 要是文字陣列');

need(data.about && isStr(data.about.title), 'about.title 不能是空的');
const localFile = (p) => isStr(p) && !/^[a-z]+:/i.test(p) && !p.startsWith('//');
(data.works?.items ?? []).forEach((it, i) => {
  const n = `works.items 第 ${i + 1} 筆`;
  need(isStr(it.title), `${n}：缺少 title`);
  if (!isStr(it.url) && !isStr(it.image)) errors.push(`${n}（${it.title ?? ''}）：url 和 image 至少要有一個`);
  for (const k of ['image', 'cover']) {
    if (localFile(it[k]) && !existsSync(new URL('../' + it[k], import.meta.url))) errors.push(`${n}：${k} 指到的檔案不存在 → ${it[k]}`);
  }
});
(data.tools?.tools ?? []).forEach((it, i) => need(isStr(it.name), `tools.tools 第 ${i + 1} 筆：缺少 name`));
(data.tools?.prompts ?? []).forEach((it, i) => {
  need(isStr(it.title), `tools.prompts 第 ${i + 1} 筆：缺少 title`);
  need(isStr(it.prompt), `tools.prompts 第 ${i + 1} 筆：缺少 prompt`);
});
(data.footer?.socials ?? []).forEach((it, i) => need(isStr(it.label) && isStr(it.url), `footer.socials 第 ${i + 1} 筆：label 和 url 都要填`));

if (errors.length) {
  console.error('❌ content.json 有問題：\n' + errors.map((e) => '  • ' + e).join('\n'));
  process.exit(1);
}
console.log('✅ content.json 檢查通過');
