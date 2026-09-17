import React from 'react';
import type { UnitId } from '../../core/types/model';
import { periodLabel } from '../../core/templates/interpolate';

type Props={
  unit:UnitId; onUnit:(u:UnitId)=>void;
  periods:any[]; period:any|null; onPeriod:(p:any|null)=>void;
  onNewPeriod:()=>void; designMode:boolean; onToggleDesign:()=>void;
};

export function TopMenu({unit,onUnit,periods,period,onPeriod,onNewPeriod,designMode,onToggleDesign}:Props){
  return <header className="top-menu">
    <div className="brand-wrap">
      <div className="brand-mark" aria-hidden="true">DU</div>
      <div><div className="brand-title">DOC-UNIDADES</div><div className="brand-subtitle">ITSQMET · Gestión documental institucional</div></div>
    </div>
    <div className="top-controls">
      <label>Unidad<select value={unit} onChange={e=>onUnit(e.target.value as UnitId)}><option value="UGPA">UGPA</option><option value="UTET">UTET</option></select></label>
      <label>Período<select value={period?.id ?? ''} onChange={e=>onPeriod(periods.find(p=>String(p.id)===e.target.value) ?? null)}><option value="">Seleccionar período</option>{periods.map(p=><option key={p.id} value={p.id}>{periodLabel(p)}</option>)}</select></label>
      <button className="icon-button" onClick={onNewPeriod} title="Crear período">+</button>
      <button className={designMode?'design-button active':'design-button'} onClick={onToggleDesign}>{designMode?'Salir de diseño':'Diseño'}</button>
    </div>
  </header>
}
