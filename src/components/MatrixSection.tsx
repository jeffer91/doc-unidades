import React,{useEffect,useRef,useState} from 'react';
import * as XLSX from 'xlsx';
import type { SectionConfig } from '../core/types/model';
import { invalidateMatrixFieldCache, loadAllMatrixData } from '../core/fields/fieldEngine';

export function MatrixSection({section,ctx}:{section:SectionConfig;ctx:any}){
  const [rows,setRows]=useState<any[]>([]); const [loading,setLoading]=useState(false); const [message,setMessage]=useState(''); const inputRef=useRef<HTMLInputElement>(null);
  const cols=section.columns ?? []; const matrixId=section.matrixId!; const key=JSON.stringify([ctx.period?.id,ctx.unit,ctx.process.id,ctx.document.id,matrixId]);
  async function load(){if(!ctx.period)return;setLoading(true);invalidateMatrixFieldCache();const r=await loadAllMatrixData({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,matrixId});setRows(r);setLoading(false)}
  useEffect(()=>{load()},[key]);
  function add(){const row:any={};cols.forEach(c=>row[c.key]='');setRows([...rows,row])}
  function update(i:number,k:string,v:string){const copy=[...rows];copy[i]={...copy[i],[k]:v};setRows(copy)}
  function cleanRows(inRows:any[]){return inRows.map(({__id,...r})=>r).filter(r=>Object.values(r).some(v=>String(v??'').trim()!==''));}
  function validate(inRows:any[]){const errors:string[]=[];inRows.forEach((r,i)=>cols.forEach(c=>{if(c.required && String(r[c.key]??'').trim()==='')errors.push(`Fila ${i+2}: falta ${c.label}`);if(c.options && r[c.key] && !c.options.includes(String(r[c.key])))errors.push(`Fila ${i+2}: ${c.label} no es válido`)}));return errors}
  async function save(){
    const clean=cleanRows(rows);const errors=validate(clean);
    if(errors.length){setMessage(`No se guardó. ${errors.slice(0,3).join(' · ')}${errors.length>3?' …':''}`);return;}
    await window.docUnits.matrices.replace({periodId:ctx.period.id,unitId:ctx.unit,processId:ctx.process.id,documentId:ctx.document.id,matrixId,rows:clean,sourceName:'edición-app'});
    invalidateMatrixFieldCache();setMessage(`${clean.length} registros guardados`);await load();setTimeout(()=>setMessage(''),1800);
  }
  async function importFile(file:File){const buf=await file.arrayBuffer();const wb=XLSX.read(buf);const ws=wb.Sheets[wb.SheetNames[0]];const data=cleanRows(XLSX.utils.sheet_to_json(ws,{defval:''}) as any[]);const errors=validate(data);if(errors.length){setMessage(`No se guardó. ${errors.slice(0,3).join(' · ')}${errors.length>3?' …':''}`);return;}setRows(data);setMessage(`${data.length} filas analizadas. Pulsa Guardar para aplicar.`)}
  function exportCurrent(){const data=cleanRows(rows);const ws=XLSX.utils.json_to_sheet(data.length?data:[Object.fromEntries(cols.map(c=>[c.key,'']))],{header:cols.map(c=>c.key)});const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'DATOS');XLSX.writeFile(wb,`${matrixId.replaceAll('.','_')}.xlsx`)}
  return <div className="work-card"><div className="section-heading"><div><h2>{section.label}</h2><p>{loading?'Cargando…':`${rows.length} registros en esta matriz.`}</p></div><span className="save-state">{message}</span></div><div className="matrix-actions"><button className="secondary" onClick={exportCurrent}>Datos actuales</button><button className="secondary" onClick={()=>inputRef.current?.click()}>Importar Excel</button><input ref={inputRef} type="file" accept=".xlsx,.xls" hidden onChange={e=>{const f=e.target.files?.[0];if(f)importFile(f);e.currentTarget.value=''}}/><button className="secondary" onClick={add}>+ Registro</button><button onClick={save}>Guardar</button></div><div className="table-wrap"><table><thead><tr>{cols.map(c=><th key={c.key}>{c.label}{c.required?' *':''}</th>)}<th></th></tr></thead><tbody>{rows.length===0?<tr><td colSpan={cols.length+1} className="empty-cell">Sin registros. Agrega uno o importa Excel.</td></tr>:rows.map((r,i)=><tr key={i}>{cols.map(c=><td key={c.key}>{c.options?<select value={r[c.key]??''} onChange={e=>update(i,c.key,e.target.value)}><option value="">Seleccionar</option>{c.options.map(o=><option key={o}>{o}</option>)}</select>:<input value={r[c.key]??''} onChange={e=>update(i,c.key,e.target.value)}/>}</td>)}<td><button className="row-delete" onClick={()=>setRows(rows.filter((_,j)=>j!==i))}>×</button></td></tr>)}</tbody></table></div></div>
}
