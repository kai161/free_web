// Uses an externally saved copy of the current public Vercel script; no events reach Vercel.
// PLAYWRIGHT_MODULE, VERCEL_TEST_SCRIPT, BASE_URL and EVIDENCE_DIR may be configured.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.BASE_URL || 'http://127.0.0.1:8768';
const out=process.env.EVIDENCE_DIR || '/tmp/vi-analytics-evidence';
await mkdir(out,{recursive:true});
const sdk=await readFile(process.env.VERCEL_TEST_SCRIPT,'utf8');
const browser=await chromium.launch({channel:'chrome',headless:true});
const captures=[],errors=[],measurements=[];
async function session(enabled){
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 // Exercise the genuine analytics sender in automation. Intercept every POST locally.
 await context.addInitScript(()=>{Object.defineProperty(navigator,'webdriver',{get:()=>false});Object.defineProperty(navigator,'userAgent',{get:()=> 'Mozilla/5.0 Chrome/155.0.0.0 Safari/537.36'});});
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname==='/_vercel/insights/script.js')return route.fulfill({contentType:'application/javascript',body:sdk});
  if(url.pathname.startsWith('/_vercel/insights/')){captures.push({body:req.postDataJSON(),headers:req.headers()});return route.fulfill({status:200,body:'{}'});}
  if(enabled && url.pathname.endsWith('/analytics-config.mjs'))return route.fulfill({contentType:'application/javascript',body:'export const CUSTOM_EVENTS_ENABLED=true;'});
  if(url.origin!==base && !['blob:','data:'].includes(url.protocol))throw new Error('Unexpected external request '+url.origin);
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/nen-anh.html?private=URL_CANARY#FRAGMENT_CANARY');
 await page.waitForFunction(()=>window.vai);
 return {page,context};
}
const events=()=>captures.filter(c=>c.body?.en).map(c=>({name:c.body.en,data:c.body.ed}));
async function fixture(page,noisy){
 const bytes=await page.evaluate(async noisy=>{const c=document.createElement('canvas');c.width=354;c.height=472;const x=c.getContext('2d');
 if(noisy){const data=x.createImageData(c.width,c.height);let seed=912;for(let i=0;i<data.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data.data[i]=seed&255;data.data[i+1]=(seed>>>8)&255;data.data[i+2]=(seed>>>16)&255;data.data[i+3]=255;}x.putImageData(data,0,0);}else{x.fillStyle='#acc';x.fillRect(0,0,354,472);x.fillStyle='#123';x.font='20px sans-serif';x.fillText('SYNTHETIC TEST',20,100);}
 const b=await new Promise(r=>c.toBlob(r,'image/jpeg',1));return [...new Uint8Array(await b.arrayBuffer())];},noisy);
 return {name:'FILE_CANARY.jpg',mimeType:'image/jpeg',buffer:Buffer.from(bytes)};
}
async function compress(page,file,preset='custom',value='195'){
 await page.setInputFiles('#fileInput',file);await page.selectOption('#targetPreset',preset);
 if(preset==='custom'){await page.selectOption('#targetUnit','KB');await page.fill('#customTarget',value);}
 await page.selectOption('#outputFormat','image/jpeg');
 await page.click('#compressButton');await page.waitForFunction(()=>!document.querySelector('#compressButton').disabled);
}
try{
 let {page,context}=await session(false);
 await page.waitForTimeout(150);
 assert.ok(captures.length>0,'pageview sent');
 assert.equal(captures[0].body.o,base+'/nen-anh.html','query/fragment must be removed before first pageview');
 assert.equal(captures[0].headers.referer,undefined,'raw URL must not leak in Referer header');
 const noisy=await fixture(page,true),flat=await fixture(page,false);
 await compress(page,noisy);await page.click('#downloadButton');assert.equal(events().length,0,'custom events off by default');await context.close();
 ({page,context}=await session(true));captures.length=0;
 await compress(page,noisy);
 await page.waitForFunction(()=>document.querySelector('#downloadButton').href.startsWith('blob:'));
 await page.waitForTimeout(150);
 assert.deepEqual(events().map(e=>e.name),['image_compress_started','image_compress_completed']);
 assert.deepEqual(events()[1].data,{target:'custom',format:'jpg',result:'met'});
 const measurement=await page.evaluate(async()=>{const b=await(await fetch(document.querySelector('#downloadButton').href)).blob();const i=await createImageBitmap(b);const r={bytes:b.size,type:b.type,width:i.width,height:i.height};i.close();return r;});
 assert.equal(measurement.type,'image/jpeg');assert.equal(measurement.width,354);assert.equal(measurement.height,472);assert.ok(measurement.bytes<=199680);
 measurements.push({case:'354x472 synthetic high-detail JPG, 195KB target',inputBytes:noisy.buffer.length,...measurement});
 const downloadPromise=page.waitForEvent('download');await page.click('#downloadButton');const dl=await downloadPromise;await dl.saveAs(out+'/synthetic-output.jpg');assert.equal((await readFile(out+'/synthetic-output.jpg')).length,measurement.bytes);
 await page.click('#downloadButton');await page.waitForTimeout(150);assert.equal(events().filter(e=>e.name==='image_download_requested').length,1);
 await page.setInputFiles('#fileInput',[]);assert.equal(events().filter(e=>e.name==='image_compress_completed').length,1,'cancel chooser adds no completion');
 await compress(page,flat);await page.waitForTimeout(100);assert.equal(events().filter(e=>e.name==='image_compress_completed').length,2);
 await compress(page,{name:'FILE_CANARY.jpg',mimeType:'image/jpeg',buffer:Buffer.from('CONTENT_CANARY')});await page.waitForTimeout(150);
 assert.equal(events().at(-1).name,'image_compress_failed');assert.equal(events().at(-1).data.reason,'processing');
 const n=events().length;await page.selectOption('#targetPreset','custom');await page.fill('#customTarget','9');await page.click('#compressButton');await page.waitForTimeout(100);assert.equal(events().length,n,'invalid target is not a processing attempt');
 // A late result after navigation must never be recorded as successful.
 await page.setInputFiles('#fileInput',noisy);await page.fill('#customTarget','195');
 await page.evaluate(()=>{window.realBitmap=window.createImageBitmap;window.createImageBitmap=(...a)=>new Promise((resolve,reject)=>setTimeout(()=>window.realBitmap(...a).then(resolve,reject),250));});
 await page.click('#compressButton');await page.evaluate(()=>{document.querySelector('#compressButton').click();window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}));});await page.waitForTimeout(600);
 assert.equal(events().at(-1).name,'image_compress_started','cancelled run has no terminal success');
 await page.reload();await page.waitForFunction(()=>window.vai);
 await compress(page,noisy,'custom','10');
 const small=await page.evaluate(()=>({size:document.querySelector('#compressedSize').textContent,dimensions:document.querySelector('#outputDimensions').textContent,status:document.querySelector('#statusRegion').textContent}));
 assert.notEqual(small.dimensions,'354 × 472','very low target can change dimensions; guide must warn');measurements.push({case:'354x472 synthetic JPG, 10KB target',...small});
 await page.evaluate(()=>{window.va('event',{name:'ARBITRARY_CANARY',data:{filename:'FILE_CANARY'}});window.va('event',{name:'image_compress_failed',data:{target:'200kb',format:'jpg',reason:'STACK_CANARY',filename:'FILE_CANARY'}});});
 await page.waitForTimeout(150);assert.equal(events().at(-1).data.reason,'processing');
 assert.doesNotMatch(JSON.stringify(captures),/CANARY/,'no user-controlled payload or header values');
 for(const ev of events())assert.ok(Object.keys(ev.data).length<=3);
 // An incoming full referrer cannot be cleaned by Vercel beforeSend, so fail closed.
 const count=captures.length;await page.goto(base+'/nen-anh.html',{referer:'https://source.example/private?REFERRER_CANARY'});await page.waitForFunction(()=>window.vai);await page.waitForTimeout(150);assert.equal(captures.length,count);
 await page.goto(base+'/docx-font-repair/index.html');await page.waitForTimeout(150);assert.equal(captures.length,count,'Word page stays untracked');assert.match(await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content'),/connect-src 'none'/);
 for(const path of ['index.html','nen-anh.html','tao-mat-khau-ngau-nhien.html','dem-ky-tu.html','dinh-dang-json.html','quyen-rieng-tu.html','gioi-thieu.html']){
  await page.goto(base+'/'+path+'?URL_CANARY=x#FRAGMENT_CANARY');
  assert.equal(await page.locator('footer a[href="quyen-rieng-tu.html"]').count(),1);
  assert.equal(await page.locator('footer a[href="gioi-thieu.html"]').count(),1);
  for(const width of [320,390,1280]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path+' overflow');}
 }
 await page.goto(base+'/quyen-rieng-tu.html');await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/privacy-mobile.png',fullPage:true});
 await page.goto(base+'/gioi-thieu.html');await page.setViewportSize({width:1280,height:900});await page.screenshot({path:out+'/about-desktop.png',fullPage:true});
 assert.doesNotMatch(JSON.stringify(captures),/CANARY/);assert.deepEqual(errors,[]);
 await writeFile(out+'/payloads.json',JSON.stringify(captures,null,2));await writeFile(out+'/iig-measurements.json',JSON.stringify(measurements,null,2));
 console.log(JSON.stringify({passed:true,browser:await browser.version(),events:events().length,measurements,out},null,2));
}finally{await browser.close();}
