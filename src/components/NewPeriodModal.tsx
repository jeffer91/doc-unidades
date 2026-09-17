import React,{useState} from 'react';
const months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export function NewPeriodModal({onClose,onCreated}:{onClose:()=>void;onCreated:(p:any)=>void}){
  const y=new Date().getFullYear();
  const [v,setV]=useState({startMonth:4,startYear:y,endMonth:9,endYear:y});
  const [error,setError]=useState('');
  async function create(){try{const p=await window.docUnits.periods.create(v);onCreated(p);onClose();}catch(e:any){setError(e.message ?? String(e));}}
  return <div className="modal-backdrop"><div className="modal-card"><h2>Crear período</h2><div className="form-grid">
    <label>Mes inicio<select value={v.startMonth} onChange={e=>setV({...v,startMonth:Number(e.target.value)})}>{months.map((m,i)=><option value={i+1} key={m}>{m}</option>)}</select></label>
    <label>Año inicio<input type="number" value={v.startYear} onChange={e=>setV({...v,startYear:Number(e.target.value)})}/></label>
    <label>Mes fin<select value={v.endMonth} onChange={e=>setV({...v,endMonth:Number(e.target.value)})}>{months.map((m,i)=><option value={i+1} key={m}>{m}</option>)}</select></label>
    <label>Año fin<input type="number" value={v.endYear} onChange={e=>setV({...v,endYear:Number(e.target.value)})}/></label>
  </div>{error&&<div className="error-box">{error}</div>}<div className="modal-actions"><button onClick={onClose} className="secondary">Cancelar</button><button onClick={create}>Crear período</button></div></div></div>
}
