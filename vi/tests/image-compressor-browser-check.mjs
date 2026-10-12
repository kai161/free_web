// Run against a local server: PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node vi/tests/image-compressor-browser-check.mjs
// Optional: COMPRESSOR_URL, EVIDENCE_DIR. Uses the installed Mac Chrome with an isolated profile.
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.COMPRESSOR_URL || 'http://127.0.0.1:8766/nen-anh.html';
const out = process.env.EVIDENCE_DIR || '/tmp/vi-compressor-evidence';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
// Do not send analytics or other requests to external services while testing.
await context.route('**/*', route => {
  const u = new URL(route.request().url());
  if (u.pathname.startsWith('/_vercel/')) return route.fulfill({ status: 200, body: '' });
  if (u.hostname !== '127.0.0.1' && !['blob:', 'data:'].includes(u.protocol)) return route.abort();
  return route.continue();
});
let page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const results = [];
const hash = b => createHash('sha256').update(b).digest('hex');
try {
  await page.goto(base);
  // Deterministic generated images: fine texture, colored panels and readable text, no private data.
  async function fixture(name, type, width, height, transparent = false) {
    const bytes = await page.evaluate(async ({ type, width, height, transparent }) => {
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      const img = ctx.createImageData(width, height); let seed = 417;
      for (let i = 0; i < img.data.length; i += 4) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        img.data[i] = seed & 255; img.data[i+1] = (seed >>> 8) & 255; img.data[i+2] = (seed >>> 16) & 255;
        img.data[i+3] = transparent && (i / 4) % width < width / 4 ? 0 : 255;
      }
      ctx.putImageData(img, 0, 0);
      ctx.fillStyle = '#f4f7f5'; ctx.fillRect(width / 4, height / 3, width / 2, height / 3);
      ctx.fillStyle = '#0b6b57'; ctx.font = `${Math.round(width / 28)}px sans-serif`;
      ctx.fillText('Ảnh thử FreeTools', width / 4 + 12, height / 2);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, type, 0.92));
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    }, { type, width, height, transparent });
    const buffer = Buffer.from(bytes); await writeFile(`${out}/${name}`, buffer);
    return { name, mimeType: type, buffer };
  }
  const portrait = await fixture('portrait.jpg', 'image/jpeg', 900, 1600);
  const png = await fixture('texture-1600.png', 'image/png', 1600, 1000);
  const jpg = await fixture('texture-1600.jpg', 'image/jpeg', 1600, 1000);
  const webp = await fixture('texture-1600.webp', 'image/webp', 1600, 1000);
  const tiny = await fixture('texture-320.png', 'image/png', 320, 320);
  const alpha = await fixture('transparent.png', 'image/png', 640, 480, true);
  const large = await fixture('large-4200.jpg', 'image/jpeg', 4200, 2800);
  async function target(preset, value = '10', unit = 'KB') {
    await page.selectOption('#targetPreset', preset);
    if (preset === 'custom') {
      await page.selectOption('#targetUnit', unit);
      await page.fill('#customTarget', value);
    }
  }
  async function run(file, preset, mime, value, unit) {
    console.log(`Checking ${file.name} → ${mime}, ${preset} ${value || ''}${unit || ''}`);
    await page.setInputFiles('#fileInput', file);
    await target(preset, value, unit);
    await page.selectOption('#outputFormat', mime);
    await page.click('#compressButton');
    await page.waitForFunction(() => !document.querySelector('#compressButton').disabled && document.querySelector('#statusRegion').dataset.state !== 'working');
    const result = await page.evaluate(async () => {
      const d = document.querySelector('#downloadButton');
      if (d.classList.contains('hidden')) return { state: document.querySelector('#statusRegion').dataset.state, status: document.querySelector('#statusRegion').textContent };
      const blob = await (await fetch(d.href)).blob();
      const img = await createImageBitmap(blob);
      const row = { bytes: blob.size, mime: blob.type, width: img.width, height: img.height,
        status: document.querySelector('#statusRegion').textContent, state: document.querySelector('#statusRegion').dataset.state,
        details: document.querySelector('#resultDetails').textContent, displayed: document.querySelector('#compressedSize').textContent,
        name: d.download };
      img.close(); return row;
    });
    results.push({ input: file.name, inputBytes: file.buffer.length, preset, value, unit, ...result });
    if (result.bytes) {
      assert.equal(result.mime, mime);
      assert.ok(result.displayed.includes(result.bytes.toLocaleString('vi-VN')));
      assert.equal(await page.getAttribute('#previewOutput', 'aria-pressed'), 'true');
    }
    return result;
  }
  for (const [file, preset, mime] of [[portrait,'200kb','image/jpeg'],[jpg,'100kb','image/jpeg'],[png,'200kb','image/webp'],[webp,'1mb','image/webp'],[jpg,'2mb','image/jpeg'],[png,'100kb','image/png']]) {
    const r = await run(file, preset, mime);
    const limit = { '100kb':102400,'200kb':204800,'1mb':1048576,'2mb':2097152 }[preset];
    assert.equal(r.state, r.bytes <= limit ? 'success' : 'error');
  }
  const custom = await run(png,'custom','image/jpeg','0.1','MB');
  assert.ok(custom.bytes <= Math.round(0.1*1048576));
  assert.equal(await page.locator('#customTarget').evaluate(e=>e.validity.valid), true);
  const same = await run(jpg,'2mb','image/jpeg');
  assert.equal(same.bytes,jpg.buffer.length);
  const downloadPromise = page.waitForEvent('download'); await page.click('#downloadButton');
  const download = await downloadPromise; await download.saveAs(`${out}/download-original.jpg`);
  assert.equal(hash(await readFile(`${out}/download-original.jpg`)),hash(jpg.buffer));
  assert.equal(download.suggestedFilename(),'texture-1600-nen.jpg');
  await page.click('#previewOriginal'); assert.equal(await page.getAttribute('#previewOriginal','aria-pressed'),'true');
  await page.click('#previewOutput');
  const popupPromise=page.waitForEvent('popup'); await page.click('#openPreview'); const popup=await popupPromise;
  await popup.waitForLoadState(); assert.ok(popup.url().startsWith('blob:')); await popup.close();
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
  assert.equal(await page.evaluate(async()=> (await fetch(document.querySelector('#downloadButton').href)).status),200);
  await page.setInputFiles('#fileInput',[]); assert.equal(await page.locator('#downloadButton').isVisible(),true);
  const unattainable = await run(tiny,'custom','image/png','10','KB');
  assert.equal(unattainable.state,'error'); assert.ok(unattainable.bytes>10240);
  assert.equal(unattainable.width,320); assert.match(unattainable.status,/Chưa đạt/);
  assert.match(await page.textContent('#downloadButton'),/chưa đạt/);
  const converted = await run(alpha,'200kb','image/jpeg');
  assert.match(converted.details,/nền trắng/);
  assert.deepEqual(await page.evaluate(async()=>{
    const b=await (await fetch(document.querySelector('#downloadButton').href)).blob(); const i=await createImageBitmap(b);
    const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);i.close();return [...x.getImageData(0,0,1,1).data];
  }),[255,255,255,255]);
  await run(alpha,'200kb','image/webp');
  assert.equal(await page.evaluate(async()=>{const b=await (await fetch(document.querySelector('#downloadButton').href)).blob();const i=await createImageBitmap(b);const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);i.close();return x.getImageData(0,0,1,1).data[3];}),0);
  const bigger=await run(webp,'2mb','image/png'); assert.ok(bigger.bytes>webp.buffer.length);assert.match(bigger.details,/lớn hơn ảnh gốc/);
  for(const file of [
    {name:'unsupported.gif',mimeType:'image/gif',buffer:Buffer.from('GIF89a')},
    {name:'empty.png',mimeType:'image/png',buffer:Buffer.alloc(0)},
    {name:'oversize.jpg',mimeType:'image/jpeg',buffer:Buffer.alloc(30*1024*1024+1)}
  ]){
    await page.setInputFiles('#fileInput',file);assert.equal(await page.getAttribute('#statusRegion','data-state'),'error');
    assert.equal(await page.locator('#downloadButton').isVisible(),false);assert.equal(await page.locator('#compressButton').isDisabled(),true);
    results.push({input:file.name,status:await page.textContent('#statusRegion')});
  }
  const corrupt=await run({name:'broken.jpg',mimeType:'image/jpeg',buffer:Buffer.from('not an image')},'100kb','image/jpeg');
  assert.equal(corrupt.state,'error');assert.match(corrupt.status,/bị hỏng/);
  await run(jpg,'100kb','image/jpeg');
  await target('custom','9','KB');await page.click('#compressButton');assert.match(await page.textContent('#statusRegion'),/10KB/);assert.equal(await page.locator('#downloadButton').isVisible(),false);
  // Simulate a browser falling back to PNG for an unsupported output MIME.
  await page.evaluate(()=>{window.realToBlob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(cb){return window.realToBlob.call(this,cb,'image/png');};});
  const fallback=await run(png,'100kb','image/webp');assert.equal(fallback.state,'error');assert.match(fallback.status,/không hỗ trợ xuất/);
  await page.evaluate(()=>{HTMLCanvasElement.prototype.toBlob=window.realToBlob;});
  // Exercise the decoded-pixel safety limit without allocating a 60MP image.
  await page.evaluate(()=>{window.realBitmap=window.createImageBitmap;window.createImageBitmap=async()=>({width:10001,height:6000,close(){}});});
  const tooLarge=await run(jpg,'100kb','image/jpeg');assert.match(tooLarge.status,/60 megapixel/);
  await page.evaluate(()=>{window.createImageBitmap=window.realBitmap;});
  await run(png,'200kb','image/webp');
  await page.mouse.move(0,0);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:`${out}/desktop.png`,fullPage:true});
  const mobileContext = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,acceptDownloads:true});
  await mobileContext.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.pathname.startsWith('/_vercel/'))return route.fulfill({status:200,body:''});
    if(u.hostname!=='127.0.0.1' && !['blob:','data:'].includes(u.protocol))return route.abort();
    return route.continue();
  });
  page = await mobileContext.newPage(); page.on('pageerror',e=>errors.push(e.message)); await page.goto(base);
  const mobile=await run(large,'2mb','image/webp');assert.ok(mobile.width<=2800);assert.match(mobile.details,/Đã giảm kích thước/);
  const mobileDownloadPromise=page.waitForEvent('download');await page.click('#downloadButton');const mobileDownload=await mobileDownloadPromise;await mobileDownload.saveAs(`${out}/download-mobile.webp`);
  assert.equal((await readFile(`${out}/download-mobile.webp`)).length,mobile.bytes);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:`${out}/mobile.png`,fullPage:true});
  for(const width of [320,390,768,1280]){
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
  }
  // Drop a valid image after errors; then reselect the same image and repeat compression.
  await page.evaluate(async bytes=>{const dt=new DataTransfer();dt.items.add(new File([new Uint8Array(bytes)],'dropped.jpg',{type:'image/jpeg'}));document.querySelector('#dropZone').dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true}));},Array.from(jpg.buffer));
  assert.equal(await page.textContent('#fileName'),'dropped.jpg');
  await run(jpg,'100kb','image/jpeg');await run(jpg,'100kb','image/jpeg');
  // Visible FAQ and JSON-LD stay identical; the Word navigation link remains usable.
  assert.equal(await page.locator('.nav-links a[href="/docx-font-repair/index.html"]').count(),1);
  assert.equal((await page.request.get(new URL('/docx-font-repair/index.html',base).href)).status(),200);
  assert.equal(await page.evaluate(()=>{
    const faq=[...document.querySelectorAll('script[type="application/ld+json"]')].map(e=>JSON.parse(e.textContent)).find(e=>e['@type']==='FAQPage');
    return faq.mainEntity.every(q=>[...document.querySelectorAll('details')].some(d=>d.querySelector('summary').textContent===q.name && d.querySelector('p').textContent===q.acceptedAnswer.text));
  }),true);
  assert.deepEqual(errors,[]);
  await writeFile(`${out}/results.json`,JSON.stringify({browser:await browser.version(),base,results,errors},null,2));
  console.log(JSON.stringify({passed:true,browser:await browser.version(),cases:results.length,evidence:out,results},null,2));
} finally {await browser.close();}
