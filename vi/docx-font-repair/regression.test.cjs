// No browser/DOM dependency: independently authored Unicode and published answers.
const {test}=require('node:test');
const assert=require('node:assert/strict');
require('./core.js');require('./answers.js');
for(const f of RepairAnswers)test('published independent answer: '+f.id,()=>{
 const actual=f.before.replace(/[\p{L}\p{M}\u00a1-\u00ff]+/gu,w=>DocxRepair.convertWord(w,f.font)||w);
 assert.equal(actual,f.after);
});
for(const font of ['.VnTime','.VnTimeH','Arial'])test('correct Unicode with arbitrary case / symbols remains unchanged: '+font,()=>{
 const controls=['TâM','tâM','TÂm','cÔNG','mÁ','®','©','ACME®','Tù®','Việt','Tù','má','phóc','café','Señor','Straße','déjà','über','naïve','Ångström'];
 for(const w of controls)assert.equal(DocxRepair.convertWord(w,font),null,w);
});
test('general mapping outside answer phrases',()=>{
 const before='mµ b¹n c¸c tr\u00adêng ®\u00adîc';
 assert.equal(before.split(' ').map(w=>DocxRepair.convertWord(w,'.VnTime')||w).join(' '),'mà bạn các trường được');
});
test('unknown mixed character and combining mark are not partially converted',()=>{
 for(const w of ['chµoЖ','chµo中','chµo\u0301'])assert.equal(DocxRepair.convertWord(w,'.VnTime'),null);
});
