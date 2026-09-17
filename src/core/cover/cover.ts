import type { CoverSettings, DocumentType } from '../types/model';
import { periodLabel } from '../templates/interpolate';

const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

export function unitFullName(unit:'UGPA'|'UTET'){
  return unit==='UGPA' ? 'Unidad de Gestión de Procesos Académicos' : 'Unidad de Titulación y Eficiencia Terminal';
}

export function elaboratorRole(unit:'UGPA'|'UTET'){
  return unit==='UGPA' ? 'Gestor de Procesos Académicos' : 'Coordinador de Titulación y Eficiencia Terminal';
}

export function todayInstitutional(){
  const d=new Date();
  return `${String(d.getDate()).padStart(2,'0')}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
}

export function inferDocumentType(ctx:any):DocumentType{
  if(ctx.document?.documentType)return ctx.document.documentType;
  const code=String(ctx.document?.code??'').toUpperCase();
  if(code.includes('INF'))return 'INF';
  if(code.includes('RGI'))return 'RGI';
  if(ctx.process?.id==='INFORMES'||String(ctx.document?.label??'').toUpperCase().startsWith('INFORME FINAL'))return 'INF';
  return 'RGI';
}

export function defaultCoverSettings(ctx:any):CoverSettings{
  return {
    type: inferDocumentType(ctx),
    code: ctx.document?.code??'',
    documentName: ctx.document?.label??'',
    title: ctx.document?.label??'',
    subtitle: periodLabel(ctx.period),
    complementaryData: '',
    version: '1.0',
    elaborationDate: todayInstitutional()
  };
}

export function parseCoverContent(raw:string|undefined|null,ctx:any):CoverSettings{
  const base=defaultCoverSettings(ctx);
  if(!raw)return base;
  try{
    const parsed=JSON.parse(raw);
    return {...base,...parsed,type:parsed?.type==='INF'?'INF':parsed?.type==='RGI'?'RGI':base.type};
  }catch{
    return base;
  }
}

export async function loadCoverSettings(ctx:any):Promise<CoverSettings>{
  const saved=await window.docUnits.sections.get({
    periodId:ctx.period.id,
    unitId:ctx.unit,
    processId:ctx.process.id,
    documentId:ctx.document.id,
    sectionId:'PORTADA'
  });
  return parseCoverContent(saved?.content,ctx);
}
