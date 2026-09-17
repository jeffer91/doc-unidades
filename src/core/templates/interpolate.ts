const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export function periodLabel(p:any) {
  if(!p) return '';
  return `${months[(p.start_month ?? p.startMonth)-1]} ${p.start_year ?? p.startYear} - ${months[(p.end_month ?? p.endMonth)-1]} ${p.end_year ?? p.endYear}`;
}
export function interpolate(template:string, ctx:any) {
  return template
    .replaceAll('{{PERIODO}}', periodLabel(ctx.period))
    .replaceAll('{{UNIDAD}}', ctx.unit === 'UGPA' ? 'Unidad de Gestión de Procesos Académicos' : 'Unidad de Titulación y Eficiencia Terminal')
    .replaceAll('{{PROCESO}}', ctx.processLabel ?? '')
    .replaceAll('{{DOCUMENTO}}', ctx.documentLabel ?? '');
}
