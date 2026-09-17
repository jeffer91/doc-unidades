import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import {
  createPeriod, listPeriods, getSectionContent, saveSectionContent,
  getActiveTemplate, saveTemplate, listMatrixRows, replaceMatrixRows,
  upsertMatrixRow, deleteMatrixRow, getStats, getDataRoot
} from './database';

function resourcePath(name:string){
  return app.isPackaged ? path.join(process.resourcesPath,name) : path.join(__dirname,'..','resources',name);
}
function appIconPath(){return resourcePath('icon.png');}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 680,
    backgroundColor: '#f5f7fa',
    icon: appIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) win.loadURL(devUrl);
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

const entities:Record<string,string>={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};
function esc(value:any){return String(value??'').replace(/[&<>"']/g,ch=>entities[ch]??ch);}
function safeName(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||'documento';}
function logoDataUrl(){
  try{return `data:image/png;base64,${fs.readFileSync(resourcePath('logo.png')).toString('base64')}`;}catch{return '';}
}
function todayEs(){
  const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const d=new Date();return `${String(d.getDate()).padStart(2,'0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
}
function unitName(unit:string){return unit==='UTET'?'Unidad de Titulación y Eficiencia Terminal':'Unidad de Gestión de Procesos Académicos';}
function elaboratorRole(unit:string){return unit==='UTET'?'Coordinador de Titulación y Eficiencia Terminal':'Gestor de Procesos Académicos';}

const baseCss=`
  @page{size:A4;margin:15mm}*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:10pt;line-height:1.45;background:white}
  .watermark{position:fixed;top:42%;left:0;right:0;text-align:center;transform:rotate(-28deg);font-size:62pt;font-weight:800;color:rgba(170,70,70,.10);z-index:-1;letter-spacing:.08em}
`;

function buildCoverHtml(payload:any,totalPages:number){
  const c=payload.cover??{}; const type=(c.type==='INF'?'INF':'RGI'); const logo=logoDataUrl();
  const u=unitName(payload.unit); const title=c.title||payload.title; const docName=c.documentName||payload.title; const code=c.code||payload.code||''; const subtitle=c.subtitle||payload.period||''; const extra=c.complementaryData||'';
  const version=c.version||'1.0'; const date=c.elaborationDate||todayEs(); const role=elaboratorRole(payload.unit);
  const rgiHeader=`<table class="rgi head"><colgroup><col style="width:4.5cm"><col style="width:9cm"><col style="width:4.5cm"></colgroup><tr><td rowspan="2" class="logo">${logo?`<img src="${logo}">`:''}</td><td class="unit">${esc(u)}</td><td rowspan="2" class="control"><b>Código:</b><br>${esc(code)}</td></tr><tr><td class="doc"><b>${esc(docName)}</b>${subtitle?`<br>${esc(subtitle)}`:''}${extra?`<br>${esc(extra)}`:''}</td></tr></table>`;
  const infHeader=`<table class="inf head"><colgroup><col style="width:4.8cm"><col style="width:9.5cm"><col style="width:3.7cm"></colgroup><tr><td rowspan="2" class="logo">${logo?`<img src="${logo}">`:''}</td><td rowspan="2" class="unit">${esc(u)}</td><td class="control"><b>Código:</b><br>${esc(code)}</td></tr><tr><td class="control"><b>Versión:</b><br>${esc(version)}</td></tr><tr><td class="control"><b>Fecha de elaboración:</b><br>${esc(date)}</td><td class="doc"><b>${esc(docName)}</b></td><td class="control"><b>Página 1 de ${totalPages}</b></td></tr></table>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${baseCss}
    @page{margin:15mm}.page{height:267mm;display:flex;flex-direction:column}.head{width:18cm;border-collapse:collapse;table-layout:fixed}.head td{border:.5pt solid #000;padding:1mm;text-align:center;vertical-align:middle;font-size:9pt}.head .logo img{max-width:3.8cm;max-height:1.8cm;object-fit:contain}.head .unit{font-size:9pt}.head .doc{font-size:9pt}.rgi tr:first-child{height:.8cm}.rgi tr:nth-child(2){height:2cm}.inf tr:first-child{height:1.28cm}.inf tr:nth-child(2){height:.75cm}.inf tr:nth-child(3){height:1.22cm}.central{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:25mm 0 18mm}.central h1{font-size:18pt;line-height:1.25;margin:0;max-width:18cm}.central .sub{font-size:${type==='RGI'?'16pt':'14pt'};font-weight:700;margin-top:8pt}.central .extra{font-size:10.5pt;font-weight:700;margin-top:8pt}.sign{width:18cm;border-collapse:collapse;table-layout:fixed}.sign td{border:.5pt solid #000;width:6cm;padding:1mm;font-size:8.5pt;vertical-align:top}.sign .area{height:2.4cm;text-align:center;vertical-align:middle}.sign .name{height:.75cm}.sign .role{height:1.05cm}.draft-note{position:absolute;top:12mm;right:15mm;font-weight:700;color:#a24646}
  </style></head><body>${payload.draft?'<div class="watermark">BORRADOR</div>':''}<div class="page">${payload.draft?'<div class="draft-note">BORRADOR</div>':''}${type==='INF'?infHeader:rgiHeader}<div class="central"><h1>${esc(title)}</h1>${subtitle?`<div class="sub">${esc(subtitle)}</div>`:''}${extra?`<div class="extra">${esc(extra)}</div>`:''}</div><table class="sign"><tr><td class="area">ELABORADO POR:<br><b>ÁREA DE FIRMA / QR DIGITAL</b></td><td class="area">REVISADO POR:<br><b>ÁREA DE FIRMA / QR DIGITAL</b></td><td class="area">APROBADO POR:<br><b>ÁREA DE FIRMA / QR DIGITAL</b></td></tr><tr><td class="name"><b>NOMBRE:</b> Mgs. Jefferson Villarreal</td><td class="name"><b>NOMBRE:</b> Ing. Martha Tomalá</td><td class="name"><b>NOMBRE:</b> Dr. Alex León</td></tr><tr><td class="role"><b>CARGO:</b> ${esc(role)}</td><td class="role"><b>CARGO:</b> Coordinadora General de Carreras</td><td class="role"><b>CARGO:</b> Vicerrector</td></tr></table></div></body></html>`;
}

function buildSectionHtml(section:any,payload:any){
  let body='';
  if(section.kind==='text')body=`<div class="text">${esc(section.text).replace(/\n/g,'<br>')}</div>`;
  else{
    const cols=(section.columns??[]) as any[];const rows=(section.rows??[]) as any[];
    body=`<table><thead><tr>${cols.map(c=>`<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${esc(r[c.key])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${baseCss}
    h1{font-size:16pt;margin:0 0 10mm;color:#1f2a38} .text{text-align:justify;white-space:normal}table{width:100%;border-collapse:collapse;table-layout:auto;font-size:8.5pt}th,td{border:.5pt solid #000;padding:1.5mm;vertical-align:top}th{background:#f1f3f5;text-align:left}.pending{background:#fff7e6;border:1px solid #ead39a;padding:3mm;margin-bottom:7mm}.footer{margin-top:10mm;border-top:.5pt solid #bbb;padding-top:2mm;color:#777;font-size:8pt}
  </style></head><body>${payload.draft?'<div class="watermark">BORRADOR</div>':''}<h1>${esc(section.label)}</h1>${body}<div class="footer">${esc(payload.title)} · ${esc(payload.period)}${payload.draft?' · BORRADOR':''}</div></body></html>`;
}

function buildTocHtml(entries:{label:string;page:number}[],payload:any,pending:string[]){
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${baseCss}
    h1{font-size:18pt;margin:0 0 12mm;text-align:center}.toc{width:100%;border-collapse:collapse}.toc td{padding:2.4mm 0;border-bottom:.5pt dotted #999;font-size:10.5pt}.toc td:last-child{text-align:right;width:18mm;font-weight:700}.pending{margin-top:12mm;border:1px solid #d9bd71;background:#fff8e8;padding:4mm}.pending h2{font-size:11pt;margin:0 0 2mm}.pending ul{margin:0;padding-left:5mm}.note{margin-top:10mm;color:#777;font-size:8.5pt}
  </style></head><body>${payload.draft?'<div class="watermark">BORRADOR</div>':''}<h1>ÍNDICE</h1><table class="toc"><tbody>${entries.map(e=>`<tr><td>${esc(e.label)}</td><td>${e.page}</td></tr>`).join('')}</tbody></table>${payload.draft&&pending.length?`<div class="pending"><h2>Información pendiente del borrador</h2><ul>${pending.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}<div class="note">Índice generado automáticamente por DOC-UNIDADES.</div></body></html>`;
}

async function htmlToPdf(html:string){
  const w=new BrowserWindow({show:false,webPreferences:{sandbox:true}});
  try{
    await w.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    return await w.webContents.printToPDF({printBackground:true,pageSize:'A4',margins:{top:0,bottom:0,left:0,right:0}});
  }finally{w.destroy();}
}

async function pageCount(bytes:Uint8Array){return (await PDFDocument.load(bytes)).getPageCount();}
async function mergePdfs(parts:Uint8Array[]){
  const out=await PDFDocument.create();
  for(const bytes of parts){const src=await PDFDocument.load(bytes);const pages=await out.copyPages(src,src.getPageIndices());pages.forEach(p=>out.addPage(p));}
  return await out.save();
}

async function generatePdf(payload:any){
  const prefix=payload.draft?'BORRADOR_':'';
  const defaultPath=path.join(app.getPath('documents'),`${prefix}${safeName(payload.title)}_${safeName(payload.period)}.pdf`);
  const choice=await dialog.showSaveDialog({title:payload.draft?'Guardar borrador PDF':'Guardar PDF final',defaultPath,filters:[{name:'PDF',extensions:['pdf']}]});
  if(choice.canceled||!choice.filePath)return {saved:false};

  const sections=(payload.sections??[]) as any[];
  const pending=(payload.pending??[]) as string[];
  const sectionPdfs:Uint8Array[]=[];const counts:number[]=[];
  for(const section of sections){const bytes=await htmlToPdf(buildSectionHtml(section,payload));sectionPdfs.push(bytes);counts.push(await pageCount(bytes));}

  let tocPages=1;let tocBytes:Uint8Array=new Uint8Array();let entries:{label:string;page:number}[]=[];
  for(let attempt=0;attempt<2;attempt++){
    let cursor=1+tocPages+1;
    entries=sections.map((s,i)=>{const e={label:s.label,page:cursor};cursor+=counts[i]||0;return e;});
    tocBytes=await htmlToPdf(buildTocHtml(entries,payload,pending));
    const actual=await pageCount(tocBytes);if(actual===tocPages)break;tocPages=actual;
  }
  const totalPages=1+tocPages+counts.reduce((a,b)=>a+b,0);
  const coverBytes=await htmlToPdf(buildCoverHtml(payload,totalPages));
  const merged=await mergePdfs([coverBytes,tocBytes,...sectionPdfs]);
  fs.writeFileSync(choice.filePath,merged);
  return {saved:true,path:choice.filePath,totalPages};
}

app.whenReady().then(() => {
  ipcMain.handle('periods:list', () => listPeriods());
  ipcMain.handle('periods:create', (_e, input) => createPeriod(input));
  ipcMain.handle('sections:get', (_e, args) => getSectionContent(args));
  ipcMain.handle('sections:save', (_e, args) => saveSectionContent(args));
  ipcMain.handle('templates:get', (_e, args) => getActiveTemplate(args));
  ipcMain.handle('templates:save', (_e, args) => saveTemplate(args));
  ipcMain.handle('matrices:list', (_e, args) => listMatrixRows(args));
  ipcMain.handle('matrices:replace', (_e, args) => replaceMatrixRows(args));
  ipcMain.handle('matrices:upsert', (_e, args) => upsertMatrixRow(args));
  ipcMain.handle('matrices:remove', (_e, id) => deleteMatrixRow(id));
  ipcMain.handle('pdf:generate', (_e,args)=>generatePdf(args));
  ipcMain.handle('stats:get', (_e, args) => getStats(args));
  ipcMain.handle('system:data-root', () => getDataRoot());
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
