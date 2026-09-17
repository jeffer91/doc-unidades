import type { FieldDefinition, FieldFilter, MatrixColumn } from '../types/model';
import { interpolate } from '../templates/interpolate';

export type RenderedFields = {
  text: string;
  pending: string[];
  resolved: Record<string,string>;
};

export type FieldInspection = {
  key: string;
  label: string;
  kind: string;
  status: 'resolved' | 'pending';
  value: string;
  source: string;
  operation: string;
  reason: string;
};

const SYSTEM_FIELDS:FieldDefinition[]=[
  {key:'PERIODO',label:'Período',group:'Datos generales',kind:'system',required:true},
  {key:'UNIDAD',label:'Unidad responsable',group:'Datos generales',kind:'system',required:true},
  {key:'PROCESO',label:'Proceso',group:'Datos generales',kind:'system',required:true},
  {key:'DOCUMENTO',label:'Documento',group:'Datos generales',kind:'system',required:true}
];

export function availableFields(ctx:any):FieldDefinition[]{return [...SYSTEM_FIELDS,...((ctx.document?.fields??[]) as FieldDefinition[])];}

function norm(value:any){return String(value??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');}
function matches(row:any,filter?:FieldFilter){
  if(!filter)return true;
  const value=row?.[filter.column];
  if(filter.truthy&&!(value===true||norm(value)==='si'||norm(value)==='true'||norm(value)==='1'))return false;
  if(filter.equals!==undefined&&norm(value)!==norm(filter.equals))return false;
  if(filter.notEquals!==undefined&&norm(value)===norm(filter.notEquals))return false;
  return true;
}
function numberValue(value:any){
  if(typeof value==='number')return Number.isFinite(value)?value:NaN;
  let cleaned=String(value??'').trim().replace('%','').replace(/\s/g,'');
  if(cleaned.includes(',')&&cleaned.includes('.'))cleaned=cleaned.replace(/\./g,'').replace(',','.');
  else cleaned=cleaned.replace(',','.');
  return Number(cleaned);
}
function formatNumber(value:number,decimals=0){if(!Number.isFinite(value))return '';return new Intl.NumberFormat('es-EC',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(value);}
function templateContext(ctx:any){return {period:ctx.period,unit:ctx.unit,processLabel:ctx.process.label,documentLabel:ctx.document.label};}
function extractTokens(template:string){return [...new Set([...template.matchAll(/{{\s*([A-Z0-9_]+)\s*}}/g)].map(m=>m[1]))];}

const matrixCache=new Map<string,Promise<any[]>>();
export async function loadAllMatrixData(args:{periodId:number;unitId:string;processId:string;documentId:string;matrixId:string}){
  const key=JSON.stringify(args);if(matrixCache.has(key))return matrixCache.get(key)!;
  const promise=(async()=>{const out:any[]=[];let afterId=0;for(let page=0;page<200;page++){const batch=await window.docUnits.matrices.list({...args,afterId,limit:500});if(!batch.length)break;out.push(...batch.map((x:any)=>x.data));const last=batch[batch.length-1];const next=Number(last?.id??0);if(batch.length<500||!next||next===afterId)break;afterId=next;}return out;})();
  matrixCache.set(key,promise);return promise;
}
export function invalidateMatrixFieldCache(){matrixCache.clear();}

function sourceColumns(def:FieldDefinition,ctx:any):MatrixColumn[]{
  if(!def.source)return [];
  const sourceProcessId=def.source.processId??ctx.process.id;
  if(sourceProcessId!==ctx.process.id)return [];
  const sourceDocumentId=def.source.documentId??ctx.document.id;
  const sourceDocument=ctx.process.documents?.find((d:any)=>d.id===sourceDocumentId);
  if(!sourceDocument)return [];
  const summary=sourceDocument.summaryItems?.find((i:any)=>i.matrixId===def.source!.matrixId);
  if(summary?.columns?.length)return summary.columns;
  const section=sourceDocument.sections?.find((s:any)=>s.matrixId===def.source!.matrixId);
  return section?.columns??[];
}

function rowIsValid(row:any,columns:MatrixColumn[]){
  if(!columns.length)return true;
  for(const column of columns){
    const value=String(row?.[column.key]??'').trim();
    if(column.required&&!value)return false;
    if(column.options&&value&&!column.options.includes(value))return false;
  }
  return true;
}

function systemValue(def:FieldDefinition,ctx:any){
  return interpolate(`{{${def.key}}}`,templateContext(ctx));
}

async function resolveDefinitionDetailed(def:FieldDefinition,ctx:any):Promise<{value:string;reason:string}>{
  if(def.kind==='system'){
    const value=systemValue(def,ctx);
    return {value,reason:value?'':'No existe el contexto requerido.'};
  }
  if(!def.source||!def.operation)return {value:'',reason:'El campo no tiene fuente u operación configurada.'};
  const sourceArgs={periodId:ctx.period.id,unitId:def.source.unitId??ctx.unit,processId:def.source.processId??ctx.process.id,documentId:def.source.documentId??ctx.document.id,matrixId:def.source.matrixId};
  const sourceRows=await loadAllMatrixData(sourceArgs);
  if(sourceRows.length===0)return {value:'',reason:`Sin registros en ${def.source.matrixId}.`};

  const schema=sourceColumns(def,ctx);
  if(schema.length&&sourceRows.some(r=>!rowIsValid(r,schema)))return {value:'',reason:`${def.source.matrixId} contiene registros incompletos o inválidos.`};

  const rows=sourceRows.filter(r=>rowIsValid(r,schema));
  const filtered=rows.filter(r=>matches(r,def.filter));const decimals=def.decimals??0;
  let value='';
  switch(def.operation){
    case 'value':{const row=filtered.find(r=>String(r?.[def.column??'']??'').trim()!=='');value=row?String(row[def.column??'']??'').trim():'';break;}
    case 'count': value=formatNumber(filtered.length,0);break;
    case 'count_unique':{
      if(def.column){const values=new Set(filtered.map(r=>norm(r?.[def.column!]??'')).filter(Boolean));value=formatNumber(values.size,0);}break;
    }
    case 'percentage_where':{
      const denominator=rows.filter(r=>matches(r,def.denominatorFilter));
      if(denominator.length)value=formatNumber((filtered.length/denominator.length)*100,decimals);
      break;
    }
    case 'average':{
      if(def.column){const values=filtered.map(r=>numberValue(r?.[def.column!]??'')).filter(Number.isFinite);if(values.length)value=formatNumber(values.reduce((a,b)=>a+b,0)/values.length,decimals);}break;
    }
    case 'sum':{
      if(def.column){const values=filtered.map(r=>numberValue(r?.[def.column!]??'')).filter(Number.isFinite);if(values.length)value=formatNumber(values.reduce((a,b)=>a+b,0),decimals);}break;
    }
    case 'join_unique':{
      if(def.column){const seen=new Set<string>();const values:string[]=[];for(const row of filtered){const raw=String(row?.[def.column!]??'').trim();const normalized=norm(raw);if(raw&&normalized&&!seen.has(normalized)){seen.add(normalized);values.push(raw);}}value=values.join(def.separator??', ');}break;
    }
  }
  return {value,reason:value?'':'No existe un resultado calculable con los registros actuales.'};
}

export async function inspectTemplateFields(template:string,ctx:any):Promise<FieldInspection[]>{
  const defs=new Map<string,FieldDefinition>(availableFields(ctx).map(d=>[d.key,d]));
  const inspections:FieldInspection[]=[];
  for(const token of extractTokens(template)){
    const def=defs.get(token);
    if(!def){inspections.push({key:token,label:token,kind:'unknown',status:'pending',value:'',source:'Sin definición',operation:'—',reason:'El campo no está registrado para este documento.'});continue;}
    const resolved=await resolveDefinitionDetailed(def,ctx);
    inspections.push({
      key:token,
      label:def.label,
      kind:def.kind,
      status:resolved.value!==''?'resolved':'pending',
      value:resolved.value,
      source:def.kind==='system'?'Contexto del documento':`${def.source?.documentId??ctx.document.id} · ${def.source?.matrixId??'Sin matriz'}`,
      operation:def.kind==='system'?'contexto':def.operation??'—',
      reason:resolved.reason
    });
  }
  return inspections;
}

export async function renderTemplateFields(template:string,ctx:any):Promise<RenderedFields>{
  let text=interpolate(template,templateContext(ctx));
  const defs=new Map<string,FieldDefinition>(((ctx.document?.fields??[]) as FieldDefinition[]).map(d=>[d.key,d]));
  const tokens=extractTokens(text);
  const pending:string[]=[];const resolved:Record<string,string>={};
  for(const token of tokens){
    const def=defs.get(token);
    if(!def){pending.push(token);text=text.replace(new RegExp(`{{\\s*${token}\\s*}}`,'g'),`[Dato pendiente: ${token}]`);continue;}
    const detail=await resolveDefinitionDetailed(def,ctx);
    if(detail.value===''){
      if(def.required!==false)pending.push(def.label);
      text=text.replace(new RegExp(`{{\\s*${token}\\s*}}`,'g'),def.required===false?'':`[Dato pendiente: ${def.label}]`);
    }else{
      resolved[token]=detail.value;
      text=text.replace(new RegExp(`{{\\s*${token}\\s*}}`,'g'),detail.value);
    }
  }
  return {text,pending:[...new Set(pending)],resolved};
}
