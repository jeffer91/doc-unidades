import React,{useEffect,useMemo,useRef,useState} from 'react';
import * as XLSX from 'xlsx';
import type { MatrixColumn, SectionConfig, SummaryItemConfig } from '../core/types/model';
import { periodLabel } from '../core/templates/interpolate';
import { loadCoverSettings } from '../core/cover/cover';
import { inspectTemplateFields, invalidateMatrixFieldCache, loadAllMatrixData, renderTemplateFields, type FieldInspection } from '../core/fields/fieldEngine';

type ItemState={rows:any[];errors:string[]};
type TextState={raw:string;rendered:string;inspections:FieldInspection[];mandatoryPending:FieldInspection[]};
type MissingField={sectionId:string;sectionLabel:string;field:FieldInspection};
type Props={ctx:any;onOpenSection:(sectionId:string)=>void};

function blankRow(columns:MatrixColumn[]){return Object.fromEntries(columns.map(c=>[c.key,'']));}
function cleanRows(rows:any[]){return rows.map(r=>Object.fromEntries(Object.entries(r).filter(([k])=>k!=='__id'))).filter(r=>Object.values(r).some(v=>String(v??'').trim()!==''));}
function safeFileName(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||'seccion';}
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
  const [textStates,setTextStates]=useState<Record<string,TextState>>({});
  const [message,setMessage]=useState('');
  const [uploadItem,setUploadItem]=useState<SummaryItemConfig|null>(null);
  const [uploadSection,setUploadSection]=useState<SectionConfig|null>(null);
  const [dataSection,setDataSection]=useState<SectionConfig|null>(null);
  const [editing,setEditing]=useState<SummaryItemConfig|null>(null);
  const [editRows,setEditRows]=useState<any[]>([]);
  const [generating,setGenerating]=useState(false);
  const matrixFileRef=useRef<HTMLInputElement>(null);
  const textFileRef=useRef<HTMLInputElement>(null);
  const key=JSON.stringify([ctx.period?.id,ctx.unit,ctx.process.id,ctx.document.id]);

  const items=useMemo<SummaryItemConfig[]>(()=>{
    if(ctx.document.summaryItems?.length)return ctx.document.summaryItems;
    return ctx.document.sections.filter((s:any)=>s.kind==='matrix'&&s.matrixId).map((s:any)=>({id:s.id,label:s.label,description:'Matriz requerida por el documento.',matrixId:s.matrixId,columns:s.columns??[],sectionId:s.id,required:true}));
  },[ctx.document]);
  const textSections=useMemo<SectionConfig[]>(()=>ctx.document.sections.filter((s:SectionConfig)=>s.kind==='text'),[ctx.document]);
  const optionalFieldKeys=useMemo(()=>new Set((ctx.document.fields??[]).filter((f:any)=>f.required===false).map((f:any)=>f.key)),[ctx.document.fields]);

  async function rowsFor(matrixId:string){return loadAllMatrixData({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,matrixId});}

  async function readTextSection(section:SectionConfig):Promise<TextState>{
    const scope={unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,sectionId:section.id};
    const [saved,tpl]=await Promise.all([window.docUnits.sections.get({...scope,periodId:ctx.period.id}),window.docUnits.templates.get(scope)]);
    const raw=saved?.content??tpl?.content??section.defaultTemplate??'';
    const [rendered,inspections]=await Promise.all([renderTemplateFields(raw,ctx),inspectTemplateFields(raw,ctx)]);
    const mandatoryPending=inspections.filter(i=>i.status==='pending'&&!optionalFieldKeys.has(i.key));
    return {raw,rendered:rendered.text,inspections,mandatoryPending};
  }

  async function loadAll(){
    if(!ctx.period)return;
    invalidateMatrixFieldCache();
    const [matrixEntries,textEntries]=await Promise.all([
      Promise.all(items.map(async item=>{const rows=await rowsFor(item.matrixId);return [item.id,{rows,errors:validateRows(item,rows)}] as const;})),
      Promise.all(textSections.map(async section=>[section.id,await readTextSection(section)] as const))
    ]);
    setStates(Object.fromEntries(matrixEntries));
    setTextStates(Object.fromEntries(textEntries));
  }
  useEffect(()=>{loadAll()},[key,items,textSections]);

  function stateOf(item:SummaryItemConfig){return states[item.id]??{rows:[],errors:[]};}
  function textStateOf(section:SectionConfig):TextState{return textStates[section.id]??{raw:'',rendered:'',inspections:[],mandatoryPending:[]};}
  function matrixComplete(item:SummaryItemConfig){const s=stateOf(item);return s.rows.length>0&&s.errors.length===0;}
  function sectionComplete(section:SectionConfig){const s=textStateOf(section);return s.raw.trim().length>0&&s.mandatoryPending.length===0;}

  const requiredItems=items.filter(i=>i.required!==false);
  const requiredTextSections=textSections.filter(s=>s.required!==false);
  const pendingMatrices=requiredItems.filter(i=>!matrixComplete(i));
  const pendingSections=requiredTextSections.filter(s=>!sectionComplete(s));
  const missingFields:MissingField[]=textSections.flatMap(section=>textStateOf(section).mandatoryPending.map(field=>({sectionId:section.id,sectionLabel:section.label,field})));
  const totalRequired=requiredItems.length+requiredTextSections.length;
  const totalCompleted=requiredItems.filter(matrixComplete).length+requiredTextSections.filter(sectionComplete).length;
  const allComplete=pendingMatrices.length===0&&pendingSections.length===0&&missingFields.length===0;

  function workbookFor(item:SummaryItemConfig,rows:any[]){const data=rows.length?rows:[blankRow(item.columns)];const ws=XLSX.utils.json_to_sheet(data,{header:item.columns.map(c=>c.key)});const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'DATOS');return wb;}
  function downloadTemplate(item:SummaryItemConfig){XLSX.writeFile(workbookFor(item,[]),`${item.matrixId.replaceAll('.','_')}_PLANTILLA.xlsx`);}
  function downloadCurrent(item:SummaryItemConfig){XLSX.writeFile(workbookFor(item,stateOf(item).rows),`${item.matrixId.replaceAll('.','_')}_ACTUALES.xlsx`);}
  function requestMatrixUpload(item:SummaryItemConfig){setUploadItem(item);matrixFileRef.current?.click();}
  async function onMatrixFile(file:File){
    if(!uploadItem)return;
    const wb=XLSX.read(await file.arrayBuffer());const ws=wb.Sheets[wb.SheetNames[0]];const rows=cleanRows(XLSX.utils.sheet_to_json(ws,{defval:''}) as any[]);const errors=validateRows(uploadItem,rows);
    if(errors.length){setMessage(`No se guardó ${uploadItem.label}. ${errors.slice(0,3).join(' · ')}${errors.length>3?' …':''}`);return;}
    await window.docUnits.matrices.replace({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,matrixId:uploadItem.matrixId,rows,sourceName:file.name});
    invalidateMatrixFieldCache();setMessage(`${uploadItem.label}: ${rows.length} registros guardados.`);await loadAll();
  }

  function downloadSection(section:SectionConfig){
    const raw=textStateOf(section).raw;
    const blob=new Blob([raw],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${safeFileName(ctx.document.label)}_${safeFileName(section.label)}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),0);
  }
  function requestSectionUpload(section:SectionConfig){setUploadSection(section);textFileRef.current?.click();}
  async function onTextFile(file:File){
    if(!uploadSection)return;
    const content=await file.text();
    await window.docUnits.sections.save({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,sectionId:uploadSection.id,content});
    setMessage(`${uploadSection.label}: contenido cargado correctamente.`);setUploadSection(null);await loadAll();
  }

  function correct(item:SummaryItemConfig){if(item.sectionId&&ctx.document.sections.some((s:any)=>s.id===item.sectionId&&s.kind==='matrix')){onOpenSection(item.sectionId);return;}const rows=stateOf(item).rows;setEditing(item);setEditRows(rows.length?rows.map(r=>({...r})):[blankRow(item.columns)]);}
  function editCell(rowIndex:number,columnKey:string,value:string){setEditRows(old=>old.map((r,i)=>i===rowIndex?{...r,[columnKey]:value}:r));}
  async function saveCorrection(){
    if(!editing)return;
    const rows=cleanRows(editRows);const errors=validateRows(editing,rows);if(errors.length){setMessage(errors.slice(0,3).join(' · '));return;}
    await window.docUnits.matrices.replace({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,matrixId:editing.matrixId,rows,sourceName:'corrección-app'});
    invalidateMatrixFieldCache();setEditing(null);setMessage(`${editing.label}: correcciones guardadas.`);await loadAll();
  }

  async function collectPdfSections(){
    const out:any[]=[];const seenMatrices=new Set<string>();const fieldPending:string[]=[];
    for(const section of ctx.document.sections){
      if(section.kind==='info'||section.kind==='cover')continue;
      if(section.kind==='text'){
        const fresh=await readTextSection(section);
        fieldPending.push(...fresh.mandatoryPending.map(x=>`${section.label}: ${x.label}`));
        if(fresh.rendered.trim())out.push({kind:'text',label:section.label,text:fresh.rendered});
      }else if(section.kind==='matrix'&&section.matrixId){
        const rows=await rowsFor(section.matrixId);seenMatrices.add(section.matrixId);
        if(rows.length)out.push({kind:'matrix',label:section.label,columns:(section.columns??[]).map((c:any)=>({key:c.key,label:c.label})),rows});
      }
    }
    for(const item of items){
      if(item.includeInPdf!==true||seenMatrices.has(item.matrixId))continue;
      const rows=stateOf(item).rows;
      if(rows.length)out.push({kind:'matrix',label:item.label,columns:item.columns.map(c=>({key:c.key,label:c.label})),rows});
    }
    return {sections:out,fieldPending:[...new Set(fieldPending)]};
  }

  async function generatePdf(draft:boolean){
    setGenerating(true);setMessage('Preparando PDF…');
    try{
      invalidateMatrixFieldCache();
      const [{sections,fieldPending},cover]=await Promise.all([collectPdfSections(),loadCoverSettings(ctx)]);
      const currentPendingSections=requiredTextSections.filter(s=>!textStateOf(s).raw.trim()).map(s=>s.label);
      const issues=[...pendingMatrices.map(i=>i.label),...currentPendingSections,...fieldPending];
      if(!draft&&issues.length){setMessage(`PDF final bloqueado: ${issues.slice(0,3).join(' · ')}${issues.length>3?' …':''}`);return;}
      const result=await window.docUnits.pdf.generate({draft,title:ctx.document.label,code:cover.code||ctx.document.code||'',unit:ctx.unit,process:ctx.process.label,period:periodLabel(ctx.period),cover,pending:[...new Set(issues)],sections});
      setMessage(result.saved?`${draft?'Borrador':'PDF final'} guardado correctamente.`:'Generación cancelada.');
    }catch(err:any){setMessage(err?.message??'No se pudo generar el PDF.');}
    finally{setGenerating(false);}
  }

  const matrixPendingText=pendingMatrices.length===1?'1 matriz pendiente':`${pendingMatrices.length} matrices pendientes`;
  const sectionPendingText=pendingSections.length===1?'1 sección pendiente':`${pendingSections.length} secciones pendientes`;
  const fieldPendingText=missingFields.length===1?'1 campo pendiente':`${missingFields.length} campos pendientes`;
  const dataState=dataSection?textStateOf(dataSection):null;

  return <>
    <div className="work-card summary-card">
      <div className="summary-head"><div><h2>Resumen</h2><p>Centro de control de <strong>{ctx.document.label}</strong>.</p></div><div className="summary-progress"><strong>{totalCompleted} de {totalRequired}</strong><span>elementos obligatorios completos</span></div></div>
      <div className="progress-track"><div className="progress-fill" style={{width:`${totalRequired?Math.round(totalCompleted/totalRequired*100):100}%`}}/></div>
      {message&&<div className="summary-message">{message}</div>}

      <div className="summary-block">
        <div className="summary-block-title"><div><h3>Campos que faltan</h3><p>Variables utilizadas en los textos que todavía no pueden resolverse desde sus datos fuente.</p></div><span className={`status-pill ${missingFields.length?'review':'complete'}`}>{missingFields.length?`${missingFields.length} pendiente${missingFields.length===1?'':'s'}`:'Completo'}</span></div>
        {missingFields.length===0?<div className="summary-empty-ok">No hay campos obligatorios pendientes en los textos actuales.</div>:<div className="missing-fields-list">{missingFields.map((entry,index)=><div className="missing-field-row" key={`${entry.sectionId}-${entry.field.key}-${index}`}><div><strong>{`{{${entry.field.key}}}`}</strong><span>{entry.sectionLabel} · {entry.field.reason}</span><small>Fuente: {entry.field.source}</small></div><button className="secondary compact" onClick={()=>onOpenSection(entry.sectionId)}>Ver sección</button></div>)}</div>}
      </div>

      <div className="summary-block">
        <div className="summary-block-title"><div><h3>Secciones del documento</h3><p>Descarga, carga, revisa y consulta los datos utilizados por cada sección.</p></div></div>
        <div className="summary-list">{textSections.map(section=>{const s=textStateOf(section);const complete=sectionComplete(section);const status=!s.raw.trim()?'Sin contenido':s.mandatoryPending.length?'Pendiente':'Completa';return <div className="summary-row" key={section.id}><div className="summary-info"><div className="summary-title-line"><strong>{section.label}</strong><span className={`status-pill ${complete?'complete':'missing'}`}>{status}</span></div><small>{s.inspections.length?`${s.inspections.length} campo${s.inspections.length===1?'':'s'} automático${s.inspections.length===1?'':'s'} utilizado${s.inspections.length===1?'':'s'}`:'Texto sin campos automáticos'}</small><div className="summary-meta">{s.mandatoryPending.length?`${s.mandatoryPending.length} campo${s.mandatoryPending.length===1?'':'s'} pendiente${s.mandatoryPending.length===1?'':'s'}`:s.raw.trim()?'Contenido disponible':'Debe cargarse o escribirse contenido'}</div></div><div className="summary-actions"><button className="secondary compact" onClick={()=>downloadSection(section)}>Descargar</button><button className="secondary compact" onClick={()=>requestSectionUpload(section)}>Subir</button><button className="secondary compact" onClick={()=>onOpenSection(section.id)}>Ver</button><button className="secondary compact" onClick={()=>setDataSection(section)}>Datos</button></div></div>})}</div>
      </div>

      <div className="summary-block">
        <div className="summary-block-title"><div><h3>Matrices e insumos</h3><p>Fuentes de datos que alimentan campos, cálculos, tablas y otros elementos del documento.</p></div></div>
        <div className="summary-list">{items.length===0?<div className="summary-empty-ok">Este documento no tiene matrices configuradas.</div>:items.map(item=>{const s=stateOf(item);const complete=matrixComplete(item);const optional=item.required===false;const status=s.rows.length===0?(optional?'Opcional':'Sin datos'):s.errors.length?'Revisar':'Completo';return <div className="summary-row" key={item.id}><div className="summary-info"><div className="summary-title-line"><strong>{item.label}</strong><span className={`status-pill ${complete?'complete':s.errors.length?'review':optional?'optional':'missing'}`}>{status}</span></div><small>{item.description??'Información del documento.'}</small><div className="summary-meta">{s.rows.length?`${s.rows.length} registros`:optional?'No obligatorio para cerrar el documento':'Información pendiente'}{s.errors.length?` · ${s.errors[0]}`:''}</div></div><div className="summary-actions"><button className="secondary compact" onClick={()=>downloadTemplate(item)}>Descargar</button><button className="secondary compact" onClick={()=>requestMatrixUpload(item)}>{s.rows.length?'Reemplazar':'Subir'}</button><button className="secondary compact" onClick={()=>correct(item)}>Corregir</button><button className="secondary compact" disabled={!s.rows.length} onClick={()=>downloadCurrent(item)}>Actuales</button></div></div>})}</div>
      </div>

      <div className="document-actions"><div><strong>Documento</strong><span>{allComplete?'Listo para PDF final':`${matrixPendingText} · ${sectionPendingText} · ${fieldPendingText}`}</span></div><div className="document-buttons"><button className="secondary" disabled={generating} onClick={()=>generatePdf(true)}>Descargar borrador PDF</button><button disabled={!allComplete||generating} title={!allComplete?'Completa matrices, secciones y campos pendientes para habilitar el PDF final':''} onClick={()=>generatePdf(false)}>Generar PDF final</button></div></div>
      <input ref={matrixFileRef} type="file" accept=".xlsx,.xls" hidden onChange={e=>{const f=e.target.files?.[0];if(f)onMatrixFile(f);e.currentTarget.value=''}}/>
      <input ref={textFileRef} type="file" accept=".txt,.md,text/plain,text/markdown" hidden onChange={e=>{const f=e.target.files?.[0];if(f)onTextFile(f);e.currentTarget.value=''}}/>
    </div>

    {dataSection&&dataState&&<div className="modal-backdrop"><div className="modal-card field-data-modal"><div className="section-heading"><div><h2>Datos · {dataSection.label}</h2><p>Campos utilizados en esta sección y trazabilidad de su origen.</p></div></div>{dataState.inspections.length===0?<div className="summary-empty-ok">Esta sección no utiliza campos automáticos. Su contenido es texto directo.</div>:<div className="field-data-list">{dataState.inspections.map(field=><div className="field-data-row" key={field.key}><div className="field-data-head"><code>{`{{${field.key}}}`}</code><span className={`status-pill ${field.status==='resolved'?'complete':'review'}`}>{field.status==='resolved'?'Resuelto':'Pendiente'}</span></div><strong>{field.label}</strong><span>{field.status==='resolved'?`Valor actual: ${field.value}`:field.reason}</span><small>Origen: {field.source} · Operación: {field.operation}</small></div>)}</div>}<div className="modal-actions"><button className="secondary" onClick={()=>setDataSection(null)}>Cerrar</button><button onClick={()=>{setDataSection(null);onOpenSection(dataSection.id)}}>Ver sección</button></div></div></div>}

    {editing&&<div className="modal-backdrop"><div className="modal-card matrix-editor-modal"><div className="section-heading"><div><h2>Corregir · {editing.label}</h2><p>Edita los registros guardados directamente en DOC-UNIDADES.</p></div></div><div className="table-wrap correction-table"><table><thead><tr>{editing.columns.map(c=><th key={c.key}>{c.label}{c.required?' *':''}</th>)}<th></th></tr></thead><tbody>{editRows.map((r,i)=><tr key={i}>{editing.columns.map(c=><td key={c.key}>{c.options?<select value={r[c.key]??''} onChange={e=>editCell(i,c.key,e.target.value)}><option value="">Seleccionar</option>{c.options.map(o=><option key={o}>{o}</option>)}</select>:<input value={r[c.key]??''} onChange={e=>editCell(i,c.key,e.target.value)}/>}</td>)}<td><button className="row-delete" onClick={()=>setEditRows(old=>old.filter((_,j)=>j!==i))}>×</button></td></tr>)}</tbody></table></div><div className="modal-actions modal-actions-between"><button className="secondary" onClick={()=>setEditRows(old=>[...old,blankRow(editing.columns)])}>+ Registro</button><div><button className="secondary" onClick={()=>setEditing(null)}>Cancelar</button><button onClick={saveCorrection}>Guardar correcciones</button></div></div></div></div>}
  </>;
}
