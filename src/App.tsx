import React,{useEffect,useMemo,useState} from 'react';
import { TopMenu } from './menu-superior/components/TopMenu';
import { NewPeriodModal } from './components/NewPeriodModal';
import { registry } from './core/registry/processRegistry';
import type { SectionConfig, UnitId } from './core/types/model';
import { TextSection } from './components/TextSection';
import { MatrixSection } from './components/MatrixSection';
import { SummarySection } from './components/SummarySection';
import { DocumentDraftButton } from './components/DocumentDraftButton';
import { CoverSection } from './components/CoverSection';

const coverSection:SectionConfig={id:'PORTADA',label:'Portada',kind:'cover'};

function tabLabel(section:any){
  if(section.kind==='info')return 'Resumen';
  if(section.id==='RESUMEN'&&section.label==='Resumen')return 'Resumen Ejecutivo';
  return section.label;
}

export default function App(){
  const [unit,setUnit]=useState<UnitId>('UGPA'); const [periods,setPeriods]=useState<any[]>([]); const [period,setPeriod]=useState<any|null>(null); const [showNew,setShowNew]=useState(false); const [designMode,setDesignMode]=useState(false);
  const processes=registry[unit]; const [processId,setProcessId]=useState(processes[0].id); const process=processes.find(p=>p.id===processId) ?? processes[0]; const [documentId,setDocumentId]=useState(process.documents[0].id); const document=process.documents.find(d=>d.id===documentId) ?? process.documents[0];
  const sections=useMemo(()=>{const [first,...rest]=document.sections;return first?.kind==='info'?[first,coverSection,...rest]:[coverSection,...document.sections]},[document]);
  const defaultSectionId=sections[0]?.id??'PORTADA';
  const [sectionId,setSectionId]=useState(defaultSectionId); const section=sections.find(s=>s.id===sectionId) ?? sections[0];
  useEffect(()=>{window.docUnits.periods.list().then(setPeriods)},[]);
  useEffect(()=>{const p=registry[unit][0];setProcessId(p.id);setDocumentId(p.documents[0].id);setSectionId(p.documents[0].sections[0]?.id??'PORTADA')},[unit]);
  useEffect(()=>{const p=registry[unit].find(x=>x.id===processId)??registry[unit][0];const d=p.documents[0];setDocumentId(d.id);setSectionId(d.sections[0]?.id??'PORTADA')},[processId]);
  useEffect(()=>{setSectionId(document.sections[0]?.id??'PORTADA')},[documentId]);
  const ctx=useMemo(()=>({unit,period,process,document}),[unit,period?.id,process.id,document.id]);
  return <div className="app-shell"><TopMenu unit={unit} onUnit={setUnit} periods={periods} period={period} onPeriod={setPeriod} onNewPeriod={()=>setShowNew(true)} designMode={designMode} onToggleDesign={()=>setDesignMode(!designMode)}/>{showNew&&<NewPeriodModal onClose={()=>setShowNew(false)} onCreated={p=>{setPeriods(old=>[p,...old.filter(x=>x.id!==p.id)]);setPeriod(p)}}/>}
    {!period?<main className="empty-start"><div className="empty-icon">▦</div><h1>Selecciona un período para continuar</h1><p>DOC-UNIDADES no carga información documental hasta que elijas el contexto de trabajo.</p><button onClick={()=>setShowNew(true)}>+ Crear período</button></main>:
    <main className="workspace">
      <nav className="process-tabs">{processes.map(p=><button key={p.id} className={p.id===process.id?'active':''} onClick={()=>setProcessId(p.id)}>{p.label}</button>)}</nav>
      <nav className="document-tabs">{process.documents.map(d=><button key={d.id} className={d.id===document.id?'active':''} onClick={()=>setDocumentId(d.id)}><strong>{d.label}</strong><small>{d.code ?? 'Documento'}</small></button>)}</nav>
      <div className="document-toolbar"><div><strong>{document.label}</strong><span>{document.code ?? 'Documento'}</span></div><DocumentDraftButton ctx={ctx}/></div>
      <nav className="section-tabs">{sections.map(s=><button key={s.id} className={s.id===section.id?'active':''} onClick={()=>setSectionId(s.id)}>{tabLabel(s)}</button>)}</nav>
      <section className="content-area">{section.kind==='cover'?<CoverSection ctx={ctx}/>:section.kind==='text'?<TextSection section={section} ctx={ctx} designMode={designMode}/>:section.kind==='matrix'?<MatrixSection section={section} ctx={ctx}/>:<SummarySection ctx={ctx} onOpenSection={setSectionId}/>}</section>
    </main>}
  </div>
}
