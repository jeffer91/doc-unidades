import React,{useEffect,useMemo,useRef,useState} from 'react';
import type { FieldDefinition, SectionConfig } from '../core/types/model';
import { availableFields, renderTemplateFields } from '../core/fields/fieldEngine';

export function TextSection({section,ctx,designMode}:{section:SectionConfig;ctx:any;designMode:boolean}){
  const [savedTemplate,setSavedTemplate]=useState<string>('');
  const [template,setTemplate]=useState(section.defaultTemplate ?? '');
  const [content,setContent]=useState('');
  const [status,setStatus]=useState('');
  const [preview,setPreview]=useState('');
  const [fieldPending,setFieldPending]=useState<string[]>([]);
  const [selectedField,setSelectedField]=useState('PERIODO');
  const [pasteCandidate,setPasteCandidate]=useState<string|null>(null);
  const [pasteTarget,setPasteTarget]=useState<'template'|'content'>('content');
  const lastSaved=useRef('');
  const editorRef=useRef<HTMLTextAreaElement>(null);
  const key=JSON.stringify([ctx.period?.id,ctx.unit,ctx.process.id,ctx.document.id,section.id]);
  const fields=useMemo(()=>availableFields(ctx),[ctx.unit,ctx.process.id,ctx.document.id,ctx.document.fields]);
  const grouped=useMemo(()=>{
    const groups=new Map<string,FieldDefinition[]>();
    fields.forEach(f=>{const g=f.group??(f.kind==='system'?'Datos generales':'Campos del documento');groups.set(g,[...(groups.get(g)??[]),f]);});
    return [...groups.entries()];
  },[fields]);

  useEffect(()=>{
    if(!fields.some(f=>f.key===selectedField))setSelectedField(fields[0]?.key??'PERIODO');
  },[fields,selectedField]);

  useEffect(()=>{(async()=>{
    if(!ctx.period)return;
    const scope={unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,sectionId:section.id};
    const t=await window.docUnits.templates.get(scope); const active=t?.content ?? section.defaultTemplate ?? '';
    setSavedTemplate(active);setTemplate(active);
    const c=await window.docUnits.sections.get({...scope,periodId:ctx.period.id});
    const loaded=c?.content ?? active;
    lastSaved.current=loaded;setContent(loaded);
  })()},[key]);

  useEffect(()=>{
    if(designMode||!ctx.period||content===lastSaved.current)return;
    setStatus('Guardando…');
    const timer=setTimeout(async()=>{
      await window.docUnits.sections.save({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,sectionId:section.id,content});
      lastSaved.current=content;setStatus('Guardado automáticamente');setTimeout(()=>setStatus(''),1500);
    },700);
    return()=>clearTimeout(timer);
  },[content,designMode,key]);

  const previewSource=designMode?template:(content||template);
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      if(!ctx.period)return;
      const rendered=await renderTemplateFields(previewSource,ctx);
      if(cancelled)return;
      setPreview(rendered.text);setFieldPending(rendered.pending);
    })();
    return()=>{cancelled=true};
  },[previewSource,key,ctx.document.fields]);

  async function saveContent(){await window.docUnits.sections.save({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,sectionId:section.id,content});lastSaved.current=content;setStatus('Guardado');setTimeout(()=>setStatus(''),1600)}
  async function saveTpl(){await window.docUnits.templates.save({unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,sectionId:section.id,content:template});setSavedTemplate(template);setContent(template);lastSaved.current=template;setStatus('Plantilla guardada');setTimeout(()=>setStatus(''),1600)}

  function insertField(target:'template'|'content'){
    const token=`{{${selectedField}}}`;
    const textarea=editorRef.current;
    const current=target==='template'?template:content;
    const start=textarea?.selectionStart??current.length;
    const end=textarea?.selectionEnd??start;
    const next=current.slice(0,start)+token+current.slice(end);
    if(target==='template')setTemplate(next);else setContent(next);
    requestAnimationFrame(()=>{textarea?.focus();textarea?.setSelectionRange(start+token.length,start+token.length)});
  }

  async function copyText(target:'template'|'content'){
    const value=target==='template'?template:content;
    await window.docUnits.clipboard.writeText(value);
    setStatus('Texto copiado');setTimeout(()=>setStatus(''),1500);
  }

  async function requestPaste(target:'template'|'content'){
    const value=await window.docUnits.clipboard.readText();
    if(!value.trim()){setStatus('El portapapeles no contiene texto');setTimeout(()=>setStatus(''),1800);return;}
    const current=target==='template'?template:content;
    if(!current.trim()){
      if(target==='template')setTemplate(value);else setContent(value);
      setStatus('Texto pegado');setTimeout(()=>setStatus(''),1500);return;
    }
    setPasteTarget(target);setPasteCandidate(value);
  }

  function applyPaste(mode:'replace'|'append'){
    if(pasteCandidate===null)return;
    const current=pasteTarget==='template'?template:content;
    const next=mode==='replace'?pasteCandidate:`${current.trimEnd()}\n\n${pasteCandidate}`;
    if(pasteTarget==='template')setTemplate(next);else setContent(next);
    setPasteCandidate(null);setStatus(mode==='replace'?'Contenido reemplazado':'Texto agregado al final');setTimeout(()=>setStatus(''),1600);
  }

  const fieldPicker=(target:'template'|'content')=><div className="field-picker">
    <div><strong>Insertar campo</strong><span>Los campos se completan desde el contexto, las matrices o cálculos definidos para este documento.</span></div>
    <select value={selectedField} onChange={e=>setSelectedField(e.target.value)}>{grouped.map(([group,defs])=><optgroup key={group} label={group}>{defs.map(f=><option key={f.key} value={f.key}>{f.label} · {f.kind}</option>)}</optgroup>)}</select>
    <button className="secondary" onClick={()=>insertField(target)}>Insertar</button>
  </div>;

  const clipboardActions=(target:'template'|'content')=><div className="clipboard-actions"><button className="secondary compact" onClick={()=>copyText(target)}>Copiar</button><button className="secondary compact" onClick={()=>requestPaste(target)}>Pegar</button></div>;

  const pasteModal=pasteCandidate!==null?<div className="modal-backdrop"><div className="modal-card"><h2>Pegar texto</h2><p>Esta sección ya tiene contenido. Elige cómo deseas incorporar el texto del portapapeles.</p><div className="paste-preview">{pasteCandidate.slice(0,600)}{pasteCandidate.length>600?'…':''}</div><div className="modal-actions"><button className="secondary" onClick={()=>setPasteCandidate(null)}>Cancelar</button><button className="secondary" onClick={()=>applyPaste('append')}>Agregar al final</button><button onClick={()=>applyPaste('replace')}>Reemplazar contenido</button></div></div></div>:null;

  if(designMode) return <><div className="work-card"><div className="section-heading"><div><h2>Diseño · {section.label}</h2><p>Edita el texto base e inserta campos dinámicos. Los simples leen un valor; los compuestos calculan sobre matrices; los heredados consultan otro documento relacionado.</p></div><span className="save-state">{status}</span></div>{fieldPicker('template')}<div className="editor-toolbar">{clipboardActions('template')}</div><textarea ref={editorRef} className="editor tall" value={template} onChange={e=>setTemplate(e.target.value)}/><div className="action-row"><button className="secondary" onClick={()=>setTemplate(section.defaultTemplate ?? '')}>Restaurar original</button><button onClick={saveTpl}>Guardar como nueva versión</button></div>{fieldPending.length>0&&<div className="field-warning"><strong>Campos pendientes</strong><span>{fieldPending.join(' · ')}</span></div>}<div className="preview-panel"><div className="preview-label">Vista previa con datos reales</div><p>{preview}</p></div></div>{pasteModal}</>;

  return <><div className="work-card"><div className="section-heading"><div><h2>{section.label}</h2><p>Texto editable del período. Los campos dinámicos se recalculan con los datos actuales de las matrices.</p></div><span className="save-state">{status}</span></div>{fieldPicker('content')}<div className="editor-toolbar">{clipboardActions('content')}</div><textarea ref={editorRef} className="editor tall" value={content} onChange={e=>setContent(e.target.value)}/><div className="action-row"><button className="secondary" onClick={()=>setContent(savedTemplate)}>Usar plantilla actual</button><button onClick={saveContent}>Guardar ahora</button></div>{fieldPending.length>0&&<div className="field-warning"><strong>Campos pendientes</strong><span>{fieldPending.join(' · ')}</span></div>}<div className="preview-panel"><div className="preview-label">Vista previa con datos reales</div><p>{preview}</p></div></div>{pasteModal}</>;
}
