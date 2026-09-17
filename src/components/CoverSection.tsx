import React,{useEffect,useMemo,useState} from 'react';
import type { CoverSettings } from '../core/types/model';
import { defaultCoverSettings, elaboratorRole, parseCoverContent, unitFullName } from '../core/cover/cover';

export function CoverSection({ctx}:{ctx:any}){
  const [cover,setCover]=useState<CoverSettings>(()=>defaultCoverSettings(ctx));
  const [loaded,setLoaded]=useState(false);
  const [status,setStatus]=useState('');
  const key=JSON.stringify([ctx.period?.id,ctx.unit,ctx.process.id,ctx.document.id]);

  useEffect(()=>{(async()=>{
    if(!ctx.period)return;
    setLoaded(false);
    const saved=await window.docUnits.sections.get({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,sectionId:'PORTADA'});
    setCover(parseCoverContent(saved?.content,ctx));
    setLoaded(true);
  })()},[key]);

  useEffect(()=>{
    if(!loaded||!ctx.period)return;
    const timer=setTimeout(async()=>{
      await window.docUnits.sections.save({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,sectionId:'PORTADA',content:JSON.stringify(cover)});
      setStatus('Guardado automáticamente');
      setTimeout(()=>setStatus(''),1500);
    },700);
    return()=>clearTimeout(timer);
  },[cover,loaded,key]);

  const unitName=unitFullName(ctx.unit);
  const role=elaboratorRole(ctx.unit);
  const isInf=cover.type==='INF';
  const previewClass=useMemo(()=>`cover-preview ${isInf?'inf':'rgi'}`,[isInf]);
  function set<K extends keyof CoverSettings>(key:K,value:CoverSettings[K]){setCover(old=>({...old,[key]:value}));}

  return <div className="work-card cover-editor-card">
    <div className="section-heading"><div><h2>Portada</h2><p>Configuración exclusiva de la portada institucional. Se usa tanto en borradores como en documentos finales.</p></div><span className="save-state">{status}</span></div>
    <div className="cover-editor-grid">
      <div className="cover-fields">
        <label>Tipo documental<select value={cover.type} onChange={e=>set('type',e.target.value as CoverSettings['type'])}><option value="RGI">RGI</option><option value="INF">INF</option></select></label>
        <label>Unidad responsable<input value={unitName} readOnly/></label>
        <label>Código<input value={cover.code} onChange={e=>set('code',e.target.value)}/></label>
        <label>Nombre formal del documento<input value={cover.documentName} onChange={e=>set('documentName',e.target.value)}/></label>
        <label>Título central<textarea value={cover.title} onChange={e=>set('title',e.target.value)} rows={3}/></label>
        <label>Subtítulo / período<input value={cover.subtitle} onChange={e=>set('subtitle',e.target.value)}/></label>
        <label>Datos complementarios<textarea value={cover.complementaryData} onChange={e=>set('complementaryData',e.target.value)} rows={3} placeholder="Docente, carrera u otros datos cuando corresponda"/></label>
        {isInf&&<><label>Versión<input value={cover.version} onChange={e=>set('version',e.target.value)}/></label><label>Fecha de elaboración<input value={cover.elaborationDate} onChange={e=>set('elaborationDate',e.target.value)}/></>}
        <div className="cover-note"><strong>Índice automático</strong><span>Los documentos RGI e INF generan el índice automáticamente al exportar el PDF, con las secciones y sus páginas reales.</span></div>
      </div>
      <div className={previewClass}>
        {isInf?<table className="cover-head-table inf-table"><colgroup><col style={{width:'26.67%'}}/><col style={{width:'52.78%'}}/><col style={{width:'20.55%'}}/></colgroup><tbody><tr><td rowSpan={2} className="cover-logo-cell"><img src="./logo.png" onError={e=>{(e.currentTarget as HTMLImageElement).src='./icon.png'}}/></td><td rowSpan={2} className="cover-unit-cell">{unitName}</td><td><b>Código:</b><br/>{cover.code||'—'}</td></tr><tr><td><b>Versión:</b><br/>{cover.version||'1.0'}</td></tr><tr><td><b>Fecha de elaboración:</b><br/>{cover.elaborationDate}</td><td><b>{cover.documentName||ctx.document.label}</b></td><td><b>Página 1 de Y</b></td></tr></tbody></table>:<table className="cover-head-table rgi-table"><colgroup><col style={{width:'25%'}}/><col style={{width:'50%'}}/><col style={{width:'25%'}}/></colgroup><tbody><tr><td rowSpan={2} className="cover-logo-cell"><img src="./logo.png" onError={e=>{(e.currentTarget as HTMLImageElement).src='./icon.png'}}/></td><td className="cover-unit-cell">{unitName}</td><td rowSpan={2}><b>Código:</b><br/>{cover.code||'—'}</td></tr><tr><td><b>{cover.documentName||ctx.document.label}</b><br/>{cover.subtitle}{cover.complementaryData?<><br/>{cover.complementaryData}</>:null}</td></tr></tbody></table>}
        <div className="cover-central-preview"><strong>{cover.title||ctx.document.label}</strong><span>{cover.subtitle}</span>{cover.complementaryData&&<small>{cover.complementaryData}</small>}</div>
        <table className="signature-preview"><tbody><tr><td>ELABORADO POR:<br/><b>ÁREA DE FIRMA / QR DIGITAL</b></td><td>REVISADO POR:<br/><b>ÁREA DE FIRMA / QR DIGITAL</b></td><td>APROBADO POR:<br/><b>ÁREA DE FIRMA / QR DIGITAL</b></td></tr><tr><td><b>NOMBRE:</b> Mgs. Jefferson Villarreal</td><td><b>NOMBRE:</b> Ing. Martha Tomalá</td><td><b>NOMBRE:</b> Dr. Alex León</td></tr><tr><td><b>CARGO:</b> {role}</td><td><b>CARGO:</b> Coordinadora General de Carreras</td><td><b>CARGO:</b> Vicerrector</td></tr></tbody></table>
      </div>
    </div>
  </div>;
}
