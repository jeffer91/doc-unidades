import React,{useState} from 'react';
import { periodLabel } from '../core/templates/interpolate';
import type { SummaryItemConfig } from '../core/types/model';
import { loadCoverSettings } from '../core/cover/cover';
import { invalidateMatrixFieldCache, loadAllMatrixData, renderTemplateFields } from '../core/fields/fieldEngine';

function validateRows(item:SummaryItemConfig,rows:any[]){
  const errors:string[]=[];
  rows.forEach((r,i)=>item.columns.forEach(c=>{
    const value=String(r[c.key]??'').trim();
    if(c.required&&!value)errors.push(`Fila ${i+2}: falta ${c.label}`);
    if(c.options&&value&&!c.options.includes(value))errors.push(`Fila ${i+2}: ${c.label} no es válido`);
  }));
  return errors;
}

export function DocumentDraftButton({ctx}:{ctx:any}){
  const [generating,setGenerating]=useState(false);
  const [message,setMessage]=useState('');

  async function generate(){
    if(!ctx.period||generating)return;
    setGenerating(true);setMessage('Preparando borrador…');
    try{
      invalidateMatrixFieldCache();
      const cover=await loadCoverSettings(ctx);
      const sections:any[]=[];
      const seenMatrices=new Set<string>();
      const pendingFields:string[]=[];
      for(const section of ctx.document.sections){
        if(section.kind==='info'||section.kind==='cover')continue;
        if(section.kind==='text'){
          const scope={unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,sectionId:section.id};
          const [saved,tpl]=await Promise.all([
            window.docUnits.sections.get({...scope,periodId:ctx.period.id}),
            window.docUnits.templates.get(scope)
          ]);
          const raw=saved?.content??tpl?.content??section.defaultTemplate??'';
          const rendered=await renderTemplateFields(raw,ctx);
          pendingFields.push(...rendered.pending.map(x=>`${section.label}: ${x}`));
          if(rendered.text.trim())sections.push({kind:'text',label:section.label,text:rendered.text});
        }else if(section.kind==='matrix'&&section.matrixId){
          const rows=await loadAllMatrixData({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,matrixId:section.matrixId});
          seenMatrices.add(section.matrixId);
          if(rows.length)sections.push({kind:'matrix',label:section.label,columns:(section.columns??[]).map((c:any)=>({key:c.key,label:c.label})),rows});
        }
      }

      const summaryItems=(ctx.document.summaryItems??[]) as SummaryItemConfig[];
      const pending:string[]=[];
      for(const item of summaryItems){
        const rows=await loadAllMatrixData({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,matrixId:item.matrixId});
        if(item.required!==false&&(rows.length===0||validateRows(item,rows).length>0))pending.push(item.label);
        if(!seenMatrices.has(item.matrixId)&&rows.length){
          sections.push({kind:'matrix',label:item.label,columns:item.columns.map(c=>({key:c.key,label:c.label})),rows});
        }
      }

      const result=await window.docUnits.pdf.generate({
        draft:true,
        title:ctx.document.label,
        code:cover.code||ctx.document.code||'',
        unit:ctx.unit,
        process:ctx.process.label,
        period:periodLabel(ctx.period),
        cover,
        pending:[...new Set([...pending,...pendingFields])],
        sections
      });
      setMessage(result.saved?'Borrador guardado':'Generación cancelada');
    }catch(err:any){setMessage(err?.message??'No se pudo generar el borrador');}
    finally{setGenerating(false);setTimeout(()=>setMessage(''),2200);}
  }

  return <div className="draft-action-wrap">
    {message&&<span className="draft-status">{message}</span>}
    <button className="draft-button" disabled={generating} onClick={generate}>{generating?'Preparando…':'Descargar borrador'}</button>
  </div>;
}
