import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeAnalyticsEvent, compressorEvent, createCompressionRun } from '../assets/js/analytics-core.mjs';
const origin='https://vi.freetools.best';
const context={origin,referrer:'',eventsEnabled:true};
test('pageview strips query, fragment and unexpected properties; unknown paths fail closed',()=>{
 assert.deepEqual(sanitizeAnalyticsEvent({type:'pageview',url:origin+'/nen-anh.html?name=private.jpg#secret',secret:'text'},context),{type:'pageview',url:origin+'/nen-anh.html'});
 for(const url of ['garbage',origin+'/secret-name', 'https://other.example/nen-anh.html','https://name:password@vi.freetools.best/nen-anh.html',origin+'/docx-font-repair/index.html'])assert.equal(sanitizeAnalyticsEvent({type:'pageview',url},context),null);
});
test('potentially sensitive incoming referrers suppress analytics, not tools',()=>{
 for(const referrer of ['https://source.example/private-name?secret=1','https://source.example/#secret','invalid','https://u:p@source.example/'])assert.equal(sanitizeAnalyticsEvent({type:'pageview',url:origin+'/'},{...context,referrer}),null);
 for(const referrer of ['', 'https://source.example/'])assert.ok(sanitizeAnalyticsEvent({type:'pageview',url:origin+'/'},{...context,referrer}));
});
test('only fixed enums are emitted, no filenames, sizes, arbitrary errors or values',()=>{
 const event=compressorEvent('image_compress_completed',{target:'custom',format:'image/jpeg',metTarget:true,fileName:'private.jpg',value:'secret',stack:'private text'});
 assert.deepEqual(event,{name:'image_compress_completed',data:{target:'custom',format:'jpg',result:'met'}});
 assert.equal(compressorEvent('private name',{}),null);
 assert.deepEqual(compressorEvent('image_compress_failed',{target:'private',format:'private',reason:'private stack'}),{name:'image_compress_failed',data:{target:'unknown',format:'unknown',reason:'processing'}});
});
test('custom events default off; beforeSend rejects unexpected event names and strips extra properties',()=>{
 const payload=compressorEvent('image_compress_completed',{target:'200kb',format:'image/jpeg',metTarget:false});
 const event={type:'event',url:origin+'/nen-anh.html?secret=x',payload:{...payload,data:{...payload.data,fileName:'secret'}},__cdp:'private'};
 assert.equal(sanitizeAnalyticsEvent(event,{origin,referrer:''}),null);
 assert.deepEqual(sanitizeAnalyticsEvent(event,context),{type:'event',url:origin+'/nen-anh.html',payload});
 assert.equal(sanitizeAnalyticsEvent({...event,payload:{name:'private',data:{}}},context),null);
 assert.equal(sanitizeAnalyticsEvent({...event,type:'identify'},context),null);
});
test('one start/terminal event per attempt; one download request per completed result',()=>{
 const events=[];const run=createCompressionRun(e=>events.push(e),{target:'100kb',format:'image/webp'});
 run.download();run.complete(false);run.complete(true);run.fail('processing');run.download();run.download();
 assert.deepEqual(events.map(e=>e.name),['image_compress_started','image_compress_completed','image_download_requested']);
 assert.equal(events[2].data.result,'unmet');
 run.cancel();run.download();assert.equal(events.length,3);
});
test('failure, cancellation, separate attempts and broken analytics cannot produce false success',()=>{
 const events=[];const emit=e=>events.push(e);
 const a=createCompressionRun(emit,{target:'custom',format:'image/png'});a.fail('dimensions');a.fail('processing');a.complete(true);a.download();
 const b=createCompressionRun(emit,{});b.cancel();b.complete(true);b.fail('processing');b.download();
 const c=createCompressionRun(emit,{});c.complete(true);c.download();
 assert.deepEqual(events.map(e=>e.name),['image_compress_started','image_compress_failed','image_compress_started','image_compress_started','image_compress_completed','image_download_requested']);
 assert.doesNotThrow(()=>{const r=createCompressionRun(()=>{throw new Error('blocked');},{});r.complete(true);r.download();});
});
