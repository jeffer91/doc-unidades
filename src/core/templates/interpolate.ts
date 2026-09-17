const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export function periodLabel(p:any) {
  if(!p) return '';
  return `${months[(p.start_month ?? p.startMonth)-1]} ${p.start_year ?? p.startYear} - ${months[(p.end_month ?? p.endMonth)-1]} ${p.end_year ?? p.endYear}`;
}

function replaceToken(text:string,key:string,value:string){
  return text.replace(new RegExp(`{{\\s*${key}\\s*}}`,'g'),value);
}

export function interpolate(template:string, ctx:any) {
  let out=template;
  out=replaceToken(out,'PERIODO',periodLabel(ctx.period));
  out=replaceToken(out,'UNIDAD',ctx.unit === 'UGPA' ? 'Unidad de Gestión de Procesos Académicos' : 'Unidad de Titulación y Eficiencia Terminal');
  out=replaceToken(out,'PROCESO',ctx.processLabel ?? '');
  out=replaceToken(out,'DOCUMENTO',ctx.documentLabel ?? '');
  return out;
}
