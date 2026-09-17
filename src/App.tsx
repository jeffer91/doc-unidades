import React,{useEffect,useMemo,useState} from 'react';
import { TopMenu } from './menu-superior/components/TopMenu';
import { NewPeriodModal } from './components/NewPeriodModal';
import { registry } from './core/registry/processRegistry';
import type { UnitId } from './core/types/model';
import { TextSection } from './components/TextSection';
import { MatrixSection } from './components/MatrixSection';
import { InfoSection } from './components/InfoSection';

export default function App(){
  const [unit,setUnit]=useState<UnitId>('UGPA'); const [periods,setPeriods]=useState<any[]>([]); const [period,setPeriod]=useState<any|null>(null); const [showNew,setShowNew]=useState(false); const [designMode,setDesignMode]=useState(false);
  const processes=registry[unit]; const [processId,setProcessId]=useState(processes[0].id); const process=processes.find(p=>p.id===processId) ?? processes[0]; const [documentId,setDocumentId]=useState(process.documents[0].id); const document=process.documents.find(d=>d.id===documentId) ?? process.documents[0]; const [sectionId,setSectionId]=useState(document.sections[0].id); const section=document.sections.find(s=>s.id===sectionId) ?? document.sections[0];
  useEffect(()=>{window.docUnits.periods.list().then(setPeriods)},[]);
  useEffect(()=>{const p=registry[unit][0];setProcessId(p.id);setDocumentId(p.documents[0].id);setSectionId(p.documents[0].sections[0].id)},[unit]);
  useEffect(()=>{const p=registry[unit].find(x=>x.id===processId)??registry[unit][0];const d=p.documents[0];setDocumentId(d.id);setSectionId(d.sections[0].id)},[processId]);
  useEffect(()=>{const p=registry[unit].find(x=>x.id===processId)??registry[unit][0];const d=p.documents.find(x=>x.id===documentId)??p.documents[0];setSectionId(d.sections[0].id)},[documentId]);
  const ctx=useMemo(()=>({unit,period,process,document}),[unit,period?.id,process.id,document.id]);
  return <div className="app-shell"><TopMenu unit={unit} onUnit={setUnit} periods={periods} period={period} onPeriod={setPeriod} onNewPeriod={()=>setShowNew(true)} designMode={designMode} onToggleDesign={()=>setDesignMode(!designMode)}/>{showNew&&<NewPeriodModal onClose={()=>setShowNew(false)} onCreated={p=>{setPeriods(old=>[p,...old.filter(x=>x.id!==p.id)]);setPeriod(p)}}/>}
    {!period?<main className="empty-start"><div className="empty-icon">▦</div><h1>Selecciona un período para continuar</h1><p>DOC-UNIDADES no carga información documental hasta que elijas el contexto de trabajo.</p><button onClick={()=>setShowNew(true)}>+ Crear período</button></main>:
    <main className="workspace">
      <nav className="process-tabs">{processes.map(p=><button key={p.id} className={p.id===process.id?'active':''} onClick={()=>setProcessId(p.id)}>{p.label}</button>)}</nav>
      <nav className="document-tabs">{process.documents.map(d=><button key={d.id} className={d.id===document.id?'active':''} onClick={()=>setDocumentId(d.id)}><strong>{d.label}</strong><small>{d.code ?? 'Documento'}</small></button>)}</nav>
      <nav className="section-tabs">{document.sections.map(s=><button key={s.id} className={s.id===section.id?'active':''} onClick={()=>setSectionId(s.id)}>{s.label}</button>)}</nav>
      <section className="content-area">{section.kind==='text'?<TextSection section={section} ctx={ctx} designMode={designMode}/>:section.kind==='matrix'?<MatrixSection section={section} ctx={ctx}/>:<InfoSection ctx={ctx}/>}</section>
    </main>}
  </div>
}
