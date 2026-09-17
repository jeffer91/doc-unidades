import React,{useEffect,useMemo,useRef,useState} from 'react';
import * as XLSX from 'xlsx';
import type { MatrixColumn, SummaryItemConfig } from '../core/types/model';
import { interpolate, periodLabel } from '../core/templates/interpolate';
import { loadCoverSettings } from '../core/cover/cover';

type ItemState={rows:any[];errors:string[]};
type Props={ctx:any;onOpenSection:(sectionId:string)=>void};

function blankRow(columns:MatrixColumn[]){return Object.fromEntries(columns.map(c=>[c.key,'']));}
function cleanRows(rows:any[]){return rows.map(r=>Object.fromEntries(Object.entries(r).filter(([k])=>k!=='__id'))).filter(r=>Object.values(r).some(v=>String(v??'').trim()!==''));}
function validateRows(item:SummaryItemConfig,rows:any[]){
  const errors:string[]=[];
  rows.forEach((r,i)=>item.columns.forEach(c=>{
    const value=String(r[c.key]??'').trim();
    if(c.required&&!value)errors.push(`Fila ${i+2}: falta ${c.label}`);
    if(c.options&&value&&!c.options.includes(value))errors.push(`Fila ${i+2}: ${c.label} no es válido`);
  }));
  return errors;
}

export function SummarySection({ctx,onOpenSection}:Props){
  const [states,setStates]=useState<Record<string,ItemState>>({});
  const [message,setMessage]=useState('');
  const [uploadItem,setUploadItem]=useState<SummaryItemConfig|null>(null);
  const [editing,setEditing]=useState<SummaryItemConfig|null>(null);
  const [editRows,setEditRows]=useState<any[]>([]);
  const [generating,setGenerating]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);
  const key=JSON.stringify([ctx.period?.id,ctx.unit,ctx.process.id,ctx.document.id]);

  const items=useMemo<SummaryItemConfig[]>(()=>{
    if(ctx.document.summaryItems?.length)return ctx.document.summaryItems;
    return ctx.document.sections.filter((s:any)=>s.kind==='matrix'&&s.matrixId).map((s:any)=>({id:s.id,label:s.label,description:'Matriz requerida por el documento.',matrixId:s.matrixId,columns:s.columns??[],sectionId:s.id,required:true}));
  },[ctx.document]);

  async function loadAll(){
    if(!ctx.period)return;
    const entries=await Promise.all(items.map(async item=>{
      const raw=await window.docUnits.matrices.list({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,matrixId:item.matrixId,limit:500});
      const rows=raw.map((x:any)=>x.data);
      return [item.id,{rows,errors:validateRows(item,rows)}] as const;
    }));
    setStates(Object.fromEntries(entries));
  }
  useEffect(()=>{loadAll()},[key,items]);

  function stateOf(item:SummaryItemConfig){return states[item.id]??{rows:[],errors:[]};}
  function isComplete(item:SummaryItemConfig){const s=stateOf(item);return s.rows.length>0&&s.errors.length===0;}
  const requiredItems=items.filter(i=>i.required!==false);
  const completed=requiredItems.filter(isComplete).length;
  const pending=requiredItems.filter(i=>!isComplete(i));
  const allComplete=requiredItems.length===0||pending.length===0;

  function workbookFor(item:SummaryItemConfig,rows:any[]){
    const data=rows.length?rows:[blankRow(item.columns)];
    const ws=XLSX.utils.json_to_sheet(data,{header:item.columns.map(c=>c.key)});
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,'DATOS');
    return wb;
  }
  function downloadTemplate(item:SummaryItemConfig){XLSX.writeFile(workbookFor(item,[]),`${item.matrixId.replaceAll('.','_')}_PLANTILLA.xlsx`);}
  function downloadCurrent(item:SummaryItemConfig){XLSX.writeFile(workbookFor(item,stateOf(item).rows),`${item.matrixId.replaceAll('.','_')}_ACTUALES.xlsx`);}
  function requestUpload(item:SummaryItemConfig){setUploadItem(item);fileRef.current?.click();}
  async function onFile(file:File){
    if(!uploadItem)return;
    const wb=XLSX.read(await file.arrayBuffer());
    const ws=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(ws,{defval:''}) as any[];
    const errors=validateRows(uploadItem,rows);
    if(errors.length){setMessage(`No se guardó ${uploadItem.label}. ${errors.slice(0,3).join(' · ')}${errors.length>3?' …':''}`);return;}
    await window.docUnits.matrices.replace({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,matrixId:uploadItem.matrixId,rows,sourceName:file.name});
    setMessage(`${uploadItem.label}: ${rows.length} registros guardados.`);await loadAll();
  }
  function correct(item:SummaryItemConfig){
    if(item.sectionId&&ctx.document.sections.some((s:any)=>s.id===item.sectionId&&s.kind==='matrix')){onOpenSection(item.sectionId);return;}
    const rows=stateOf(item).rows;
    setEditing(item);setEditRows(rows.length?rows.map(r=>({...r})):[blankRow(item.columns)]);
  }
  function editCell(rowIndex:number,key:string,value:string){setEditRows(old=>old.map((r,i)=>i===rowIndex?{...r,[key]:value}:r));}
  async function saveCorrection(){
    if(!editing)return;
    const rows=cleanRows(editRows);const errors=validateRows(editing,rows);
    if(errors.length){setMessage(errors.slice(0,3).join(' · '));return;}
    await window.docUnits.matrices.replace({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,matrixId:editing.matrixId,rows,sourceName:'corrección-app'});
    setEditing(null);setMessage(`${editing.label}: correcciones guardadas.`);await loadAll();
  }

  async function collectPdfSections(){
    const out:any[]=[];
    const seenMatrices=new Set<string>();
    for(const section of ctx.document.sections){
      if(section.kind==='info'||section.kind==='cover')continue;
      if(section.kind==='text'){
        const scope={unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,sectionId:section.id};
        const [saved,tpl]=await Promise.all([window.docUnits.sections.get({...scope,periodId:ctx.period.id}),window.docUnits.templates.get(scope)]);
        const raw=saved?.content??tpl?.content??section.defaultTemplate??'';
        const text=interpolate(raw,{period:ctx.period,unit:ctx.unit,processLabel:ctx.process.label,documentLabel:ctx.document.label});
        if(text.trim())out.push({kind:'text',label:section.label,text});
      }else if(section.kind==='matrix'&&section.matrixId){
        const raw=await window.docUnits.matrices.list({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,matrixId:section.matrixId,limit:500});
        const rows=raw.map((x:any)=>x.data);seenMatrices.add(section.matrixId);
        if(rows.length)out.push({kind:'matrix',label:section.label,columns:(section.columns??[]).map((c:any)=>({key:c.key,label:c.label})),rows});
      }
    }
    for(const item of items){
      if(seenMatrices.has(item.matrixId))continue;
      const rows=stateOf(item).rows;
      if(rows.length)out.push({kind:'matrix',label:item.label,columns:item.columns.map(c=>({key:c.key,label:c.label})),rows});
    }
    return out;
  }
  async function generatePdf(draft:boolean){
    setGenerating(true);setMessage('Preparando PDF…');
    try{
      const [sections,cover]=await Promise.all([collectPdfSections(),loadCoverSettings(ctx)]);
      const result=await window.docUnits.pdf.generate({draft,title:ctx.document.label,code:cover.code||ctx.document.code||'',unit:ctx.unit,process:ctx.process.label,period:periodLabel(ctx.period),cover,pending:pending.map(i=>i.label),sections});
      setMessage(result.saved?`${draft?'Borrador':'PDF final'} guardado correctamente.`:'Generación cancelada.');
    }catch(err:any){setMessage(err?.message??'No se pudo generar el PDF.');}
    finally{setGenerating(false);}
  }

  return <>
    <div className="work-card summary-card">
      <div className="summary-head">
        <div><h2>Resumen</h2><p>Control de información requerida para <strong>{ctx.document.label}</strong>.</p></div>
        <div className="summary-progress"><strong>{completed} de {requiredItems.length}</strong><span>insumos obligatorios completos</span></div>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{width:`${requiredItems.length?Math.round(completed/requiredItems.length*100):100}%`}}/></div>
      {message&&<div className="summary-message">{message}</div>}
      <div className="summary-list">
        {items.map(item=>{const s=stateOf(item);const complete=isComplete(item);const optional=item.required===false;const status=s.rows.length===0?(optional?'Opcional':'Sin datos'):s.errors.length?'Revisar':'Completo';return <div className="summary-row" key={item.id}>
          <div className="summary-info"><div className="summary-title-line"><strong>{item.label}</strong><span className={`status-pill ${complete?'complete':s.errors.length?'review':optional?'optional':'missing'}`}>{status}</span></div><small>{item.description??'Información del documento.'}</small><div className="summary-meta">{s.rows.length?`${s.rows.length} registros`:optional?'No obligatorio para cerrar el documento':'Información pendiente'}{s.errors.length?` · ${s.errors[0]}`:''}</div></div>
          <div className="summary-actions"><button className="secondary compact" onClick={()=>downloadTemplate(item)}>Descargar</button><button className="secondary compact" onClick={()=>requestUpload(item)}>{s.rows.length?'Reemplazar':'Subir'}</button><button className="secondary compact" onClick={()=>correct(item)}>Corregir</button><button className="secondary compact" disabled={!s.rows.length} onClick={()=>downloadCurrent(item)}>Actuales</button></div>
        </div>})}
      </div>
      <div className="document-actions">
        <div><strong>Documento</strong><span>{allComplete?'Listo para PDF final':`${pending.length} pendiente${pending.length===1?'':'s'} obligatorio${pending.length===1?'':'s'}`}</span></div>
        <div className="document-buttons"><button className="secondary" disabled={generating} onClick={()=>generatePdf(true)}>Descargar borrador PDF</button><button disabled={!allComplete||generating} title={!allComplete?'Completa los insumos obligatorios para habilitar el PDF final':''} onClick={()=>generatePdf(false)}>Generar PDF final</button></div>
      </div>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={e=>{const f=e.target.files?.[0];if(f)onFile(f);e.currentTarget.value=''}}/>
    </div>

    {editing&&<div className="modal-backdrop"><div className="modal-card matrix-editor-modal"><div className="section-heading"><div><h2>Corregir · {editing.label}</h2><p>Edita los registros guardados directamente en DOC-UNIDADES.</p></div></div><div className="table-wrap correction-table"><table><thead><tr>{editing.columns.map(c=><th key={c.key}>{c.label}{c.required?' *':''}</th>)}<th></th></tr></thead><tbody>{editRows.map((r,i)=><tr key={i}>{editing.columns.map(c=><td key={c.key}>{c.options?<select value={r[c.key]??''} onChange={e=>editCell(i,c.key,e.target.value)}><option value="">Seleccionar</option>{c.options.map(o=><option key={o}>{o}</option>)}</select>:<input value={r[c.key]??''} onChange={e=>editCell(i,c.key,e.target.value)}/>}</td>)}<td><button className="row-delete" onClick={()=>setEditRows(old=>old.filter((_,j)=>j!==i))}>×</button></td></tr>)}</tbody></table></div><div className="modal-actions modal-actions-between"><button className="secondary" onClick={()=>setEditRows(old=>[...old,blankRow(editing.columns)])}>+ Registro</button><div><button className="secondary" onClick={()=>setEditing(null)}>Cancelar</button><button onClick={saveCorrection}>Guardar correcciones</button></div></div></div></div>}
  </>;
}
