import React,{useEffect,useMemo,useState} from 'react';
import type { SectionConfig } from '../core/types/model';
import { interpolate } from '../core/templates/interpolate';

export function TextSection({section,ctx,designMode}:{section:SectionConfig;ctx:any;designMode:boolean}){
  const [savedTemplate,setSavedTemplate]=useState<string>('');
  const [template,setTemplate]=useState(section.defaultTemplate ?? '');
  const [content,setContent]=useState('');
  const [status,setStatus]=useState('');
  const key=JSON.stringify([ctx.period?.id,ctx.unit,ctx.process.id,ctx.document.id,section.id]);
  useEffect(()=>{(async()=>{
    if(!ctx.period)return;
    const scope={unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,sectionId:section.id};
    const t=await window.docUnits.templates.get(scope); const active=t?.content ?? section.defaultTemplate ?? '';
    setSavedTemplate(active);setTemplate(active);
    const c=await window.docUnits.sections.get({...scope,periodId:ctx.period.id}); setContent(c?.content ?? active);
  })()},[key]);
  const preview=useMemo(()=>interpolate(content || template,{period:ctx.period,unit:ctx.unit,processLabel:ctx.process.label,documentLabel:ctx.document.label}),[content,template,key]);
  async function saveContent(){await window.docUnits.sections.save({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,sectionId:section.id,content});setStatus('Guardado');setTimeout(()=>setStatus(''),1600)}
  async function saveTpl(){await window.docUnits.templates.save({unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,sectionId:section.id,content:template});setSavedTemplate(template);setContent(template);setStatus('Plantilla guardada');setTimeout(()=>setStatus(''),1600)}
  if(designMode) return <div className="work-card"><div className="section-heading"><div><h2>Diseño · {section.label}</h2><p>Edita el texto base. Puedes usar variables como <code>{'{{PERIODO}}'}</code>, <code>{'{{UNIDAD}}'}</code>, <code>{'{{PROCESO}}'}</code> y <code>{'{{DOCUMENTO}}'}</code>.</p></div><span className="save-state">{status}</span></div><textarea className="editor tall" value={template} onChange={e=>setTemplate(e.target.value)}/><div className="action-row"><button className="secondary" onClick={()=>setTemplate(section.defaultTemplate ?? '')}>Restaurar original</button><button onClick={saveTpl}>Guardar como nueva versión</button></div><div className="preview-panel"><div className="preview-label">Vista previa</div><p>{interpolate(template,{period:ctx.period,unit:ctx.unit,processLabel:ctx.process.label,documentLabel:ctx.document.label})}</p></div></div>;
  return <div className="work-card"><div className="section-heading"><div><h2>{section.label}</h2><p>Texto editable del período. La plantilla base se modifica desde Diseño.</p></div><span className="save-state">{status}</span></div><textarea className="editor tall" value={content} onChange={e=>setContent(e.target.value)}/><div className="action-row"><button className="secondary" onClick={()=>setContent(savedTemplate)}>Usar plantilla actual</button><button onClick={saveContent}>Guardar</button></div><div className="preview-panel"><div className="preview-label">Vista previa</div><p>{preview}</p></div></div>
}
