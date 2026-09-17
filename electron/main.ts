import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import {
  createPeriod, listPeriods, getSectionContent, saveSectionContent,
  getActiveTemplate, saveTemplate, listMatrixRows, replaceMatrixRows,
  upsertMatrixRow, deleteMatrixRow, getStats, getDataRoot
} from './database';

function appIconPath(){
  return app.isPackaged ? path.join(process.resourcesPath,'icon.png') : path.join(__dirname,'..','resources','icon.png');
}

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
function buildPdfHtml(payload:any){
  const pending=(payload.pending??[]) as string[];
  const sections=(payload.sections??[]) as any[];
  const body=sections.map(section=>{
    if(section.kind==='text')return `<section><h2>${esc(section.label)}</h2><div class="text">${esc(section.text).replace(/\n/g,'<br>')}</div></section>`;
    const cols=(section.columns??[]) as any[]; const rows=(section.rows??[]) as any[];
    const head=cols.map(c=>`<th>${esc(c.label)}</th>`).join('');
    const trs=rows.map(r=>`<tr>${cols.map(c=>`<td>${esc(r[c.key])}</td>`).join('')}</tr>`).join('');
    return `<section><h2>${esc(section.label)}</h2><table><thead><tr>${head}</tr></thead><tbody>${trs}</tbody></table></section>`;
  }).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
    @page{size:A4;margin:16mm 14mm 18mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#1f2733;font-size:10.5pt;line-height:1.45;margin:0}header{border-bottom:2px solid #c8a759;padding-bottom:10px;margin-bottom:18px}h1{font-size:20pt;margin:0;color:#1f2a38}header p{margin:4px 0 0;color:#667386}h2{font-size:13pt;color:#17395b;margin:20px 0 8px;border-bottom:1px solid #dfe4eb;padding-bottom:5px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;margin-top:12px;font-size:9.5pt}.pending{background:#fff7e6;border:1px solid #ead39a;padding:10px 12px;margin:14px 0;border-radius:6px}.pending strong{color:#8a6d1d}.pending ul{margin:6px 0 0 18px;padding:0}.text{white-space:normal;text-align:justify}table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-top:8px}th,td{border:1px solid #d8dee8;padding:5px 6px;vertical-align:top}th{background:#eef2f6;color:#263445;text-align:left}.watermark{position:fixed;inset:38% 0 auto;text-align:center;transform:rotate(-28deg);font-size:64pt;font-weight:800;color:rgba(170,70,70,.11);z-index:-1;letter-spacing:.08em}.footer-note{margin-top:24px;color:#7d8896;font-size:8.5pt;border-top:1px solid #e1e5eb;padding-top:8px}
  </style></head><body>${payload.draft?'<div class="watermark">BORRADOR</div>':''}<header><h1>${esc(payload.title)}</h1><p>${esc(payload.code)}</p><div class="meta"><div><strong>Unidad:</strong> ${esc(payload.unit)}</div><div><strong>Proceso:</strong> ${esc(payload.process)}</div><div><strong>Período:</strong> ${esc(payload.period)}</div><div><strong>Estado:</strong> ${payload.draft?'BORRADOR':'FINAL'}</div></div></header>${payload.draft&&pending.length?`<div class="pending"><strong>Información pendiente</strong><ul>${pending.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}${body||'<p>No existe contenido cargado todavía.</p>'}<div class="footer-note">Generado por DOC-UNIDADES${payload.draft?' · Documento de trabajo no final':''}</div></body></html>`;
}

async function generatePdf(payload:any){
  const prefix=payload.draft?'BORRADOR_':'';
  const defaultPath=path.join(app.getPath('documents'),`${prefix}${safeName(payload.title)}_${safeName(payload.period)}.pdf`);
  const choice=await dialog.showSaveDialog({title:payload.draft?'Guardar borrador PDF':'Guardar PDF final',defaultPath,filters:[{name:'PDF',extensions:['pdf']}]});
  if(choice.canceled||!choice.filePath)return {saved:false};
  const pdfWin=new BrowserWindow({show:false,webPreferences:{sandbox:true}});
  try{
    await pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(buildPdfHtml(payload))}`);
    const pdf=await pdfWin.webContents.printToPDF({printBackground:true,pageSize:'A4'});
    fs.writeFileSync(choice.filePath,pdf);
    return {saved:true,path:choice.filePath};
  }finally{pdfWin.destroy();}
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
