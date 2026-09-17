import React,{useEffect,useMemo,useRef,useState} from 'react';
import type { FieldDefinition, SectionConfig } from '../core/types/model';
import { availableFields, inspectTemplateFields, renderTemplateFields, type FieldInspection } from '../core/fields/fieldEngine';
import { periodLabel } from '../core/templates/interpolate';
import './TextSection.css';

export function TextSection({section,ctx,designMode}:{section:SectionConfig;ctx:any;designMode:boolean}){
  const [savedTemplate,setSavedTemplate]=useState<string>('');
  const [template,setTemplate]=useState(section.defaultTemplate ?? '');
  const [content,setContent]=useState('');
  const [status,setStatus]=useState('');
  const [preview,setPreview]=useState('');
  const [fieldPending,setFieldPending]=useState<string[]>([]);
  const [fieldInspections,setFieldInspections]=useState<FieldInspection[]>([]);
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
      const [rendered,inspections]=await Promise.all([
        renderTemplateFields(previewSource,ctx),
        inspectTemplateFields(previewSource,ctx)
      ]);
      if(cancelled)return;
      setPreview(rendered.text);setFieldPending(rendered.pending);setFieldInspections(inspections);
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

  function fieldPromptLine(field:FieldDefinition){
    const source=field.kind==='system'?'contexto del documento':field.source?.matrixId?`matriz ${field.source.matrixId}`:'sin fuente configurada';
    const operation=field.operation?` · operación ${field.operation}`:'';
    return `- {{${field.key}}}: ${field.label} · ${field.kind} · ${source}${operation}`;
  }

  function buildSectionPrompt(target:'template'|'content'){
    const current=target==='template'?template:content;
    const available=fields.map(fieldPromptLine).join('\n');
    const used=fieldInspections.length?fieldInspections.map(i=>`- {{${i.key}}}: ${i.status==='resolved'?`resuelto = ${i.value}`:`pendiente · ${i.reason}`} · fuente: ${i.source} · ${i.operation}`).join('\n'):'- Esta sección todavía no utiliza campos dinámicos.';
    const currentPeriod=ctx.period?periodLabel(ctx.period):'Sin período seleccionado';
    const documentType=ctx.document.documentType??'según configuración institucional';
    return `Actúa como redactor académico e institucional para DOC-UNIDADES.\n\nCONTEXTO\n- Unidad: ${ctx.unit}\n- Proceso: ${ctx.process.label}\n- Documento: ${ctx.document.label}\n- Tipo documental: ${documentType}\n- Sección: ${section.label}\n- Período activo: ${currentPeriod}\n\nOBJETIVO\nRevisa, mejora o completa únicamente el contenido de la sección \"${section.label}\". El resultado debe quedar listo para copiar y pegar directamente en DOC-UNIDADES.\n\nREGLAS OBLIGATORIAS\n1. Mantén un tono académico, institucional, claro, formal y coherente.\n2. Aplica APA 7.ª edición en el cuerpo académico cuando corresponda, especialmente para citas, referencias, tablas y figuras.\n3. Respeta SVD 2.1: los datos deben provenir de registros reales y trazables; no inventes cifras, porcentajes, resultados, autores, años, normas, DOI, referencias ni fuentes.\n4. Conserva exactamente los campos dinámicos escritos entre dobles llaves, por ejemplo {{PERIODO}}. No los reemplaces por valores inventados.\n5. Usa únicamente los campos disponibles listados abajo. No inventes nuevos {{CAMPOS}}.\n6. Si para una afirmación cuantitativa falta un dato, usa el campo dinámico correspondiente si existe; si no existe, evita afirmar una cifra.\n7. Si una tabla es necesaria, debe derivarse de una matriz o cálculo real. No crees tablas decorativas ni datos de ejemplo.\n8. Si un gráfico es necesario, debe representar una comparación, distribución, evolución o relación sustentada por datos reales. Todo gráfico se considera Figura bajo APA 7.\n9. Para tablas APA 7 usa número, título y nota cuando corresponda. Para gráficos/figuras usa número, título y nota/fuente cuando corresponda.\n10. No cambies portada, código documental, índice automático ni reglas RGI/INF. Esta solicitud corresponde solo al cuerpo de la sección.\n11. No inventes bibliografía. Mantén citas existentes cuando no exista evidencia suficiente para corregirlas.\n12. Devuelve únicamente el contenido final de la sección, listo para pegar.\n\nCAMPOS DISPONIBLES\n${available||'- No hay campos dinámicos adicionales configurados.'}\n\nCAMPOS USADOS ACTUALMENTE EN ESTA SECCIÓN\n${used}\n\nCONTENIDO ACTUAL\n---\n${current||'[La sección está vacía]'}\n---\n\nSI SE REQUIERE UNA TABLA O FIGURA\nNo inventes valores. Inserta en el lugar correspondiente una instrucción con uno de estos formatos:\n[TABLA: título | matriz/fuente | variables necesarias]\n[FIGURA: título | tipo de gráfico | matriz/fuente | variables necesarias]\n\nENTREGA\nDevuelve exclusivamente la versión final de la sección \"${section.label}\". Conserva los {{CAMPOS}} necesarios exactamente como aparecen.`;
  }

  async function copyPrompt(target:'template'|'content'){
    const prompt=buildSectionPrompt(target);
    await window.docUnits.clipboard.writeText(prompt);
    setStatus('Prompt copiado');setTimeout(()=>setStatus(''),1800);
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

  const clipboardActions=(target:'template'|'content')=><div className="clipboard-actions">
    <button className="prompt-copy-button compact" onClick={()=>copyPrompt(target)}>Copiar prompt IA</button>
    <button className="secondary compact" onClick={()=>copyText(target)}>Copiar texto</button>
    <button className="secondary compact" onClick={()=>requestPaste(target)}>Pegar</button>
  </div>;

  const fieldsPanel=<div className="section-fields-panel">
    <div className="section-fields-head"><div><strong>Campos usados en esta sección</strong><span>Al entrar desde “Ver” también aparecen aquí los campos, su valor y su origen.</span></div><span className={`status-pill ${fieldInspections.some(i=>i.status==='pending')?'review':'complete'}`}>{fieldInspections.length?`${fieldInspections.length} campo${fieldInspections.length===1?'':'s'}`:'Sin campos'}</span></div>
    {fieldInspections.length===0?<div className="summary-empty-ok">Esta sección no utiliza campos automáticos todavía.</div>:<div className="section-fields-list">{fieldInspections.map(i=><div className="section-field-row" key={i.key}><div className="section-field-name"><code>{`{{${i.key}}}`}</code><strong>{i.label}</strong></div><div className="section-field-detail"><span className={`status-pill ${i.status==='resolved'?'complete':'review'}`}>{i.status==='resolved'?'Resuelto':'Pendiente'}</span><span>{i.status==='resolved'?`Valor: ${i.value}`:i.reason}</span><small>Fuente: {i.source} · Operación: {i.operation}</small></div></div>)}</div>}
  </div>;

  const pasteModal=pasteCandidate!==null?<div className="modal-backdrop"><div className="modal-card"><h2>Pegar texto</h2><p>Esta sección ya tiene contenido. Elige cómo deseas incorporar el texto del portapapeles.</p><div className="paste-preview">{pasteCandidate.slice(0,600)}{pasteCandidate.length>600?'…':''}</div><div className="modal-actions"><button className="secondary" onClick={()=>setPasteCandidate(null)}>Cancelar</button><button className="secondary" onClick={()=>applyPaste('append')}>Agregar al final</button><button onClick={()=>applyPaste('replace')}>Reemplazar contenido</button></div></div></div>:null;

  const sectionHeader=(target:'template'|'content')=><div className="section-heading"><div><h2>{designMode?`Diseño · ${section.label}`:section.label}</h2><p>{designMode?'Edita el texto base e inserta campos dinámicos.':'Texto editable del período. Los campos dinámicos se recalculan con los datos actuales de las matrices.'}</p></div><div className="section-heading-actions"><span className="save-state">{status}</span><button className="prompt-copy-button" onClick={()=>copyPrompt(target)}>Copiar prompt IA</button></div></div>;

  if(designMode) return <><div className="work-card">{sectionHeader('template')}{fieldPicker('template')}<div className="editor-toolbar">{clipboardActions('template')}</div><textarea ref={editorRef} className="editor tall" value={template} onChange={e=>setTemplate(e.target.value)}/><div className="action-row"><button className="secondary" onClick={()=>setTemplate(section.defaultTemplate ?? '')}>Restaurar original</button><button onClick={saveTpl}>Guardar como nueva versión</button></div>{fieldPending.length>0&&<div className="field-warning"><strong>Campos pendientes</strong><span>{fieldPending.join(' · ')}</span></div>}{fieldsPanel}<div className="preview-panel"><div className="preview-label">Vista previa con datos reales</div><p>{preview}</p></div></div>{pasteModal}</>;

  return <><div className="work-card">{sectionHeader('content')}{fieldPicker('content')}<div className="editor-toolbar">{clipboardActions('content')}</div><textarea ref={editorRef} className="editor tall" value={content} onChange={e=>setContent(e.target.value)}/><div className="action-row"><button className="secondary" onClick={()=>setContent(savedTemplate)}>Usar plantilla actual</button><button onClick={saveContent}>Guardar ahora</button></div>{fieldPending.length>0&&<div className="field-warning"><strong>Campos pendientes</strong><span>{fieldPending.join(' · ')}</span></div>}{fieldsPanel}<div className="preview-panel"><div className="preview-label">Vista previa con datos reales</div><p>{preview}</p></div></div>{pasteModal}</>;
}
