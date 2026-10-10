/* Original implementation; no third-party runtime dependencies. */
(function (g) {
'use strict';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const LIMIT = 32 * 1024 * 1024, TOTAL = 64 * 1024 * 1024;
const enc = new TextEncoder(), dec = new TextDecoder('utf-8', {fatal: true});
const fail = code => {throw new Error(code);};
function crc32(data) {let n=0xffffffff; for (const b of data) {n^=b; for(let i=0;i<8;i++) n=(n>>>1)^((n&1)?0xedb88320:0);} return (n^0xffffffff)>>>0;}
const u16=(v,o)=>v.getUint16(o,true), u32=(v,o)=>v.getUint32(o,true);
function join(arr) {const out=new Uint8Array(arr.reduce((n,a)=>n+a.length,0)); let o=0; for(const a of arr){out.set(a,o);o+=a.length;}return out;}
function put(v,o,n,size=4){size===2?v.setUint16(o,n,true):v.setUint32(o,n,true);}
async function readZip(input) {
 const data=new Uint8Array(input), v=new DataView(data.buffer,data.byteOffset,data.byteLength);
 if(data.length>LIMIT)fail('tooLarge');
 if(data.length<22 || u32(v,0)!==0x04034b50)fail('notDocx');
 let end=-1;
 for(let i=data.length-22;i>=Math.max(0,data.length-65557);i--) if(u32(v,i)===0x06054b50 && i+22+u16(v,i+20)===data.length){end=i;break;}
 if(end<0)fail('badZip');
 if(u16(v,end+4)||u16(v,end+6)||u16(v,end+8)!==u16(v,end+10))fail('unsupportedZip');
 const count=u16(v,end+10), size=u32(v,end+12), start=u32(v,end+16);
 if(count>2000||count===65535||start+size!==end)fail('unsupportedZip');
 const entries=new Map(); let at=start, sum=0;
 for(let i=0;i<count;i++){
  if(at+46>end||u32(v,at)!==0x02014b50)fail('badZip');
  const flags=u16(v,at+8), method=u16(v,at+10), compressed=u32(v,at+20), length=u32(v,at+24), nl=u16(v,at+28), xl=u16(v,at+30), cl=u16(v,at+32), local=u32(v,at+42);
  if(flags&1)fail('encrypted');
  if(flags&~0x080e || ![0,8].includes(method) || u16(v,at+34))fail('unsupportedZip');
  if(at+46+nl+xl+cl>end||local+30>start)fail('badZip');
  const name=dec.decode(data.subarray(at+46,at+46+nl));
  if(entries.has(name)||name.startsWith('/')||name.includes('\\')||name.split('/').includes('..'))fail('badZip');
  if(u32(v,local)!==0x04034b50||u16(v,local+6)!==flags||u16(v,local+8)!==method)fail('badZip');
  const lnl=u16(v,local+26), lxl=u16(v,local+28), payload=local+30+lnl+lxl;
  if(dec.decode(data.subarray(local+30,local+30+lnl))!==name || payload+compressed>start)fail('badZip');
  if(length>LIMIT||(sum+=length)>TOTAL)fail('tooLarge');
  if(method===0 && compressed!==length)fail('badZip');
  const entry={name,flags,method,length,crc:u32(v,at+16),central:data.slice(at,at+46+nl+xl+cl),compressed:data.slice(payload,payload+compressed),local,localEnd:payload+compressed,localHeader:data.slice(local,payload)};
  entries.set(name,entry); at+=46+nl+xl+cl;
 }
 if(at!==end)fail('badZip');
 const sorted=[...entries.values()].sort((a,b)=>a.local-b.local);
 if(sorted[0]?.local!==0)fail('badZip');
 for(let i=0;i<sorted.length;i++){
  const e=sorted[i], next=i+1<sorted.length?sorted[i+1].local:start;
  if(e.localEnd>next)fail('badZip');
  // Copy the exact local record, including data descriptors and padding.
  e.raw=data.slice(e.local,next);
 }
 return {entries,comment:data.slice(end+22),original:data};
}
async function unpack(e){
 if(e.decoded)return e.decoded;
 let out=e.compressed;
 if(e.method===8){
  let stream;try{stream=new DecompressionStream('deflate-raw');}catch{fail('browser');}
  const reader=new Blob([out]).stream().pipeThrough(stream).getReader(), chunks=[];let total=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>e.length||total>LIMIT){await reader.cancel();fail('tooLarge');}chunks.push(value);}}catch(err){if(err.message==='tooLarge')throw err;fail('badZip');}
  out=join(chunks);
 }
 if(out.length!==e.length||crc32(out)!==e.crc)fail('badZip');
 e.decoded=out;return out;
}
function freshEntry(name,bytes){
 const n=enc.encode(name), local=new Uint8Array(30+n.length), central=new Uint8Array(46+n.length), l=new DataView(local.buffer),c=new DataView(central.buffer),crc=crc32(bytes);
 put(l,0,0x04034b50);put(l,4,20,2);put(l,6,0x800,2);put(l,14,crc);put(l,18,bytes.length);put(l,22,bytes.length);put(l,26,n.length,2);local.set(n,30);
 put(c,0,0x02014b50);put(c,4,20,2);put(c,6,20,2);put(c,8,0x800,2);put(c,16,crc);put(c,20,bytes.length);put(c,24,bytes.length);put(c,28,n.length,2);central.set(n,46);
 return {raw:join([local,bytes]),central};
}
function writeZip(zip,changes=new Map()){
 const locals=[],centrals=[];let offset=0;
 for(const [name,old] of zip.entries){const e=changes.has(name)?freshEntry(name,changes.get(name)):old;const c=e.central.slice();put(new DataView(c.buffer),42,offset);locals.push(e.raw);centrals.push(c);offset+=e.raw.length;}
 const directory=join(centrals),end=new Uint8Array(22+zip.comment.length),v=new DataView(end.buffer);
 put(v,0,0x06054b50);put(v,8,zip.entries.size,2);put(v,10,zip.entries.size,2);put(v,12,directory.length);put(v,16,offset);put(v,20,zip.comment.length,2);end.set(zip.comment,22);
 return join([...locals,directory,end]);
}
function makeZip(files){const z={entries:new Map(),comment:new Uint8Array()};for(const [name,text]of Object.entries(files)){const bytes=typeof text==='string'?enc.encode(text):text;z.entries.set(name,freshEntry(name,bytes));}return writeZip(z);}
function xml(s){if(/<!DOCTYPE|<!ENTITY/i.test(s))fail('badXml');const d=new DOMParser().parseFromString(s,'application/xml');if(d.getElementsByTagName('parsererror').length)fail('badXml');return d;}
const elems=(n,name)=>[...n.getElementsByTagNameNS(W,name)];
const child=(n,name)=>n&&[...n.children].find(x=>x.namespaceURI===W&&x.localName===name);
const a=(n,k)=>n?n.getAttributeNS(W,k):null;
const closest=(n,name)=>{while(n){if(n.namespaceURI===W&&n.localName===name)return n;n=n.parentElement;}return null;};
// 74 factual single-glyph mappings, checked against duydev/vietnamese-conversion
// src/charsets.ts (MIT package metadata). Uppercase accented glyphs use H font.
// No library conversion/detection code or UniKey GPL code is included.
const OLD = 'µ¸¶·¹¨»¾¼½Æ©ÇÊÈÉË®ÌÐÎÏÑªÒÕÓÔÖ×ÝØÜÞßãáâä«åèæçé¬êíëìîïóñòô\u00adõøö÷ùúýûüþ¡¢£¤¥¦§';
const UNI = 'àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵĂÂÊÔƠƯĐ';
if(OLD.length!==UNI.length||new Set(OLD).size!==OLD.length)fail('internal');
const MAP=new Map([...OLD].map((c,i)=>[c,UNI[i]]));
// Orthographic guard, not a word whitelist. It checks a single Vietnamese
// syllable and deliberately declines ambiguous Unicode and unusual spellings.
const NUCLEI=new Set('a ă â e ê i o ô ơ u ư y ai ao au âu ay ây eo êu ia iê iu oa oă oe oi ôi ơi ua uâ uê ui uô uy ưa ưi ưu ươ ya yê uơ ươi ươu uai uao uay uây uôi uơi uya uyu uyê'.split(' '));
const CLOSED=new Set('a ă â e ê i o ô ơ u ư y iê oa oă oe uâ uê uô uy ươ yê uyê'.split(' '));
function vietnameseSyllable(word){
 if(!/^[A-Za-zÀ-ỹ]+$/u.test(word)||/[fFjJwWzZ]/.test(word))return false;
 // Reject foreign diacritics and more than one tone; remove tone only, retain
 // Vietnamese circumflex/breve/horn distinctions for the syllable parser.
 const nfd=word.toLowerCase().normalize('NFD');let tones=0;
 for(const c of nfd){if(/[\u0300\u0301\u0303\u0309\u0323]/.test(c))tones++;else if(/\p{M}/u.test(c)&&!/[\u0302\u0306\u031b]/.test(c))return false;}
 if(tones>1)return false;
 const bare=nfd.replace(/[\u0300\u0301\u0303\u0309\u0323]/g,'').normalize('NFC');
 if(!/^[aăâbcdđeêghiklmnoôơpqrstuưvxy]+$/.test(bare))return false;
 // gi/qu include an onset vowel; prefer the long onset but permit gi as g+i.
 const onsets=['ngh','ng','ch','gh','gi','kh','nh','ph','qu','th','tr','b','c','d','đ','g','h','k','l','m','n','p','r','s','t','v','x',''];
 const codas=['ch','ng','nh','c','m','n','p','t',''];
 for(const onset of onsets){
  if(!bare.startsWith(onset))continue;const rest=bare.slice(onset.length);if(!rest)continue;
  if(onset==='c'&&/^[eêiy]/.test(rest))continue;
  if(onset==='k'&&!/^[eêiy]/.test(rest))continue;
  if(['gh','ngh'].includes(onset)&&!/^[eêi]/.test(rest))continue;
  if(['g','ng'].includes(onset)&&/^[eê]/.test(rest))continue;
  for(const coda of codas){if(coda&&!rest.endsWith(coda))continue;const nucleus=coda?rest.slice(0,-coda.length):rest;
   if(!(coda?CLOSED:NUCLEI).has(nucleus))continue;
   if(['c','ch','p','t'].includes(coda)&&!/[\u0301\u0323]/.test(nfd))continue;
   if(['ch','nh'].includes(coda)&&!['a','ê','i','oa','uê','uy'].includes(nucleus))continue;
   return true;
  }
 }
 return false;
}
function convertWord(word,font){
 if(word.length<2)return null; // Standalone symbols/glyphs are inherently ambiguous.
 if(![...word].some(c=>MAP.has(c)))return null;
 // Plausible Unicode takes precedence even with stale font and mixed case.
 // Case alone is never evidence of legacy encoding (e.g. TâM must stay TâM).
 if(vietnameseSyllable(word))return null;
 // Unsupported codepoints/combining marks mean a mixed or unknown word.
 if([...word].some(c=>!/[A-Za-z]/.test(c)&&!MAP.has(c)))return null;
 let out=[...word].map(c=>MAP.get(c)||c).join('');
 if(/h$/i.test(font))out=out.toUpperCase();
 return out!==word&&vietnameseSyllable(out)?out:null;
}
function classify(font){if(/^\.Vn(?:Time|Arial|Courier)H?$/i.test(font||''))return 'tcvn3';if(/^VNI[- ]/i.test(font||''))return 'vni';if(/^\.Vn/i.test(font||''))return 'legacy';return 'unicode';}
function fontLayer(rPr){
 const f=child(rPr,'rFonts');if(!f)return null;
 const values={};for(const slot of ['ascii','hAnsi']){
  if(a(f,slot+'Theme')!==null)values[slot]='[theme]';else if(a(f,slot)!==null)values[slot]=a(f,slot);
 }
 return values;
}
function stylesInfo(doc){
 const styles=new Map(),root=doc&&doc.documentElement;let defaultP=null,defaultR=null;
 for(const s of root?elems(root,'style'):[]){const id=a(s,'styleId');if(!id||styles.has(id))fail('badStyles');styles.set(id,s);if(a(s,'default')==='1'){if(a(s,'type')==='paragraph')defaultP=id;if(a(s,'type')==='character')defaultR=id;}}
 const defaults=child(child(child(root,'docDefaults'),'rPrDefault'),'rPr');
 function layers(id,seen=new Set()){
  if(!id)return [];if(seen.has(id)||seen.size>32)fail('badStyles');seen.add(id);const s=styles.get(id);if(!s)fail('badStyles');return [...layers(a(child(s,'basedOn'),'val'),seen),fontLayer(child(s,'rPr'))];
 }
 return {font(run,p){
  const pPr=child(p,'pPr'),rPr=child(run,'rPr');
  const ps=a(child(pPr,'pStyle'),'val')||defaultP,rs=a(child(rPr,'rStyle'),'val')||defaultR;
  const all=[fontLayer(defaults),...layers(ps),...layers(rs),fontLayer(rPr)],slots={};for(const l of all)if(l)Object.assign(slots,l);
  const values=[slots.ascii,slots.hAnsi].filter(Boolean);const f=values[0]||'';
  if(values.some(v=>v.toLowerCase()!==f.toLowerCase()))return {name:values.join(' / '),kind:'uncertain'};
  // Table style font cascades and numbering fonts are deliberately not inferred.
  if((closest(p,'tbl')||child(pPr,'numPr'))&&!fontLayer(rPr))return {name:f,kind:'uncertain'};
  return {name:f,kind:classify(f)};
 }};
}
function scanDocument(doc,part,styles){
 const proposals=[],warnings=[];let group=null,pi=0;
 function flush(){
  if(!group||!group.text){group=null;return;}
  for(const match of group.text.matchAll(/[\p{L}\p{M}\u00a1-\u00ff]+/gu)){
   const before=match[0],start=match.index,end=start+before.length;
   if(!/[^\x00-\x7f]/.test(before))continue;
   const after=group.font.kind==='tcvn3'?convertWord(before,group.font.name):null;
   const pieces=group.pieces.filter(s=>s.end>start&&s.start<end);
   if(after && after!==before && after.length===before.length){
    proposals.push({id:part+':'+proposals.length,part,paragraph:group.paragraph,font:group.font.name,before,after,pieces:pieces.map(s=>({node:s.node,run:s.run,offset:Math.max(start,s.start)-s.start,length:Math.min(end,s.end)-Math.max(start,s.start),replacement:after.slice(Math.max(start,s.start)-start,Math.min(end,s.end)-start)}))});
   }else if(group.font.kind!=='unicode') warnings.push({part,paragraph:group.paragraph,font:group.font.name,text:before,reason:group.font.kind==='vni'?'vni':group.font.kind==='uncertain'?'inheritance':'unverified'});
  }
  group=null;
 }
 for(const p of elems(doc,'p')){
  pi++;flush();
  for(const run of elems(p,'r').filter(r=>closest(r,'p')===p)){
   const font=styles.font(run,p),parent=run.parentElement;
   if(!group||group.font.name!==font.name||group.font.kind!==font.kind||group.parent!==parent){flush();group={text:'',pieces:[],font,parent,paragraph:pi};}
   for(const n of run.children){
    if(n.namespaceURI!==W){flush();continue;}if(n.localName==='rPr')continue;
    if(n.localName==='t'||n.localName==='softHyphen'){
     if(!group)group={text:'',pieces:[],font,parent,paragraph:pi};
     const text=n.localName==='t'?n.textContent:'\u00ad',start=group.text.length;group.text+=text;group.pieces.push({node:n,run,start,end:group.text.length});
    }else{flush();}
   }
  }
  flush();
 }
 if(proposals.length+warnings.length>5000)fail('tooLarge');
 return {proposals,warnings};
}
const rejectedWordNodes=new Set(['ins','del','moveFrom','moveTo','moveFromRangeStart','moveToRangeStart','rPrChange','pPrChange','tblPrChange','sectPrChange','cellIns','cellDel','cellMerge','fldChar','fldSimple','instrText','delText','trackRevisions','customXml','altChunk','sdt','sym','object','subDoc']);
async function analyze(input,name='document.docx'){
 if(!/\.docx$/i.test(name))fail('notDocx');
 const zip=await readZip(input);
 for(const path of zip.entries.keys())if(/(?:vbaProject|_xmlsignatures\/|word\/comments|customXml\/|word\/glossary\/)/i.test(path))fail('complex');
 if(!zip.entries.has('[Content_Types].xml')||!zip.entries.has('word/document.xml')||!zip.entries.has('_rels/.rels'))fail('notDocx');
 const xmls=new Map();
 for(const [path,e]of zip.entries){
  // Verify every entry's actual CRC and size before offering export.
  const bytes=await unpack(e);
  if(/\.(xml|rels)$/i.test(path)){
   const text=dec.decode(bytes);if(/encoding\s*=\s*['"](?!utf-8['"])/i.test(text))fail('badXml');
   const d=xml(text);xmls.set(path,{text,doc:d});
   if(/macroEnabled|digital-signature|encryptedPackage/i.test(text))fail('complex');
   for(const n of d.getElementsByTagName('*')){
    if(n.namespaceURI===W && (rejectedWordNodes.has(n.localName)||n.localName.endsWith('PrChange')))fail('complex');
    if(n.localName==='Relationship' && /(?:aFChunk|attachedTemplate|oleObject)/i.test(n.getAttribute('Type')||''))fail('complex');
   }
  }
 }
 const content=xmls.get('[Content_Types].xml').doc;
 if(![...content.getElementsByTagName('*')].some(n=>n.getAttribute('PartName')==='/word/document.xml'&&n.getAttribute('ContentType')==='application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'))fail('notDocx');
 const rootRels=xmls.get('_rels/.rels').doc;
 if(![...rootRels.getElementsByTagName('*')].some(n=>/\/officeDocument$/.test(n.getAttribute('Type')||'')&&n.getAttribute('Target')==='word/document.xml'&&n.getAttribute('TargetMode')!=='External'))fail('notDocx');
 const styles=stylesInfo(xmls.get('word/styles.xml')?.doc),parts=new Map(),proposals=[],warnings=[];
 for(const [path,x]of xmls){
  if(/^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(path)){
   if(x.doc.documentElement.namespaceURI!==W)fail('complex');
   // DrawingML text is retained, but cannot be silently advertised as repaired.
   if([...x.doc.getElementsByTagName('*')].some(n=>n.localName==='t'&&n.namespaceURI!==W))fail('complex');
   const result=scanDocument(x.doc,path,styles);parts.set(path,x);proposals.push(...result.proposals);warnings.push(...result.warnings);
  }else if(elems(x.doc,'t').length||[...x.doc.getElementsByTagName('*')].some(n=>n.localName==='t'&&/drawingml/.test(n.namespaceURI||'')))fail('complex');
 }
 return {zip,parts,proposals,warnings,name};
}
function setFont(run){
 let rp=child(run,'rPr');if(!rp){rp=run.ownerDocument.createElementNS(W,'w:rPr');run.insertBefore(rp,run.firstChild);}
 let fonts=child(rp,'rFonts');if(!fonts){fonts=run.ownerDocument.createElementNS(W,'w:rFonts');const style=child(rp,'rStyle');rp.insertBefore(fonts,style?style.nextSibling:rp.firstChild);}
 for(const slot of ['ascii','hAnsi','eastAsia','cs']){fonts.removeAttributeNS(W,slot+'Theme');fonts.setAttributeNS(W,'w:'+slot,'Times New Roman');}
}
function applyToDoc(doc,proposals,accepted){
 const modifications=new Map();
 for(const p of proposals)if(accepted.has(p.id))for(const s of p.pieces){if(!modifications.has(s.node))modifications.set(s.node,[]);modifications.get(s.node).push(s);}
 const runs=new Set([...modifications.values()].flat().map(s=>s.run));
 for(const run of runs){
  const replacements=[],rp=child(run,'rPr');
  function mini(node,converted=false){const r=run.cloneNode(false);if(rp)r.appendChild(rp.cloneNode(true));r.appendChild(node);if(converted)setFont(r);replacements.push(r);}
  for(const node of run.children){
   if(node===rp)continue;const changes=modifications.get(node);
   if(!changes){mini(node.cloneNode(true));continue;}
   const text=node.localName==='softHyphen'?'\u00ad':node.textContent;let offset=0;
   function textNode(value,converted){if(!value)return;const t=doc.createElementNS(W,'w:t');t.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');t.textContent=value;mini(t,converted);}
   for(const s of changes.sort((a,b)=>a.offset-b.offset)){if(s.offset<offset)fail('internal');textNode(text.slice(offset,s.offset),false);textNode(s.replacement,true);offset=s.offset+s.length;}
   textNode(text.slice(offset),false);
  }
  for(const r of replacements)run.parentNode.insertBefore(r,run);run.remove();
 }
}
async function exportDocx(model,ids){
 const accepted=new Set(ids),valid=new Set(model.proposals.map(p=>p.id));if([...accepted].some(id=>!valid.has(id)))fail('internal');
 if(!accepted.size)return model.zip.original.slice();
 // Reanalyze original bytes: selections never accumulate and original DOM stays untouched.
 const fresh=await analyze(model.zip.original,model.name),changes=new Map();
 for(const [path,x]of fresh.parts){const selected=fresh.proposals.filter(p=>p.part===path&&accepted.has(p.id));if(!selected.length)continue;applyToDoc(x.doc,selected,accepted);const s=new XMLSerializer().serializeToString(x.doc);xml(s);changes.set(path,enc.encode(s));}
 return writeZip(model.zip,changes);
}
g.DocxRepair={readZip,unpack,writeZip,makeZip,analyze,exportDocx,convertWord,vietnameseSyllable,crc32,W,xml};
})(globalThis);
