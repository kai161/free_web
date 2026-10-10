(function(g){
const W=DocxRepair.W;
const head='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const r=(text,font)=>'<w:r>'+(font?'<w:rPr><w:rFonts w:ascii="'+font+'" w:hAnsi="'+font+'"/></w:rPr>':'')+'<w:t xml:space="preserve">'+esc(text)+'</w:t></w:r>';
const p=(runs,style)=>'<w:p>'+(style?'<w:pPr><w:pStyle w:val="'+style+'"/></w:pPr>':'')+runs+'</w:p>';
function files(body,styles){return {
 '[Content_Types].xml':head+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
 '_rels/.rels':head+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
 'word/document.xml':head+'<w:document xmlns:w="'+W+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>',
 'word/styles.xml':head+'<w:styles xmlns:w="'+W+'"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Legacy"><w:name w:val="Legacy example"/><w:basedOn w:val="Normal"/><w:rPr><w:rFonts w:ascii=".VnTime" w:hAnsi=".VnTime"/></w:rPr></w:style>'+(styles||'')+'</w:styles>'
};}
const picture='<w:r><w:drawing><wp:inline><wp:extent cx="304800" cy="304800"/><wp:docPr id="1" name="Local sample image"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="sample.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImage"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="304800" cy="304800"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
function sample(){
 const body=p(r('Bản mẫu / 示例','Times New Roman'))+p(r('Xin chµo tÊt c¶ mäi ng\u00adêi'), 'Legacy')+p(r('CéNG HßA X· HéI CHñ NGHÜA VIÖT NAM','.VnTimeH'))+p(r('nhµ n','.VnTime')+'<w:r><w:rPr><w:rFonts w:ascii=".VnTime" w:hAnsi=".VnTime"/><w:b/></w:rPr><w:softHyphen/><w:t>íc</w:t></w:r>')+'<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tblGrid><w:gridCol w:w="8000"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="8000" w:type="dxa"/></w:tcPr>'+p(r('Th«ng Tin To¸n Häc','.VnTime'))+'</w:tc></w:tr></w:tbl>'+p(r('Unicode: Việt Nam · café · Señor · Straße · ® ©','Times New Roman'))+p(r('Tù ® café Việt Nam','.VnTime'))+p(r('VNI: Vieät Nam / Coäng hoøa','VNI-Times'))+p(picture);
 const f=files(body);
 f['word/_rels/document.xml.rels']=head+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdImage" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/sample.png"/></Relationships>';
 f['word/media/sample.png']=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jC1cAAAAASUVORK5CYII='),c=>c.charCodeAt(0));
 return DocxRepair.makeZip(f);
}
g.RepairDemo={sample,files,r,p,head};
})(globalThis);
