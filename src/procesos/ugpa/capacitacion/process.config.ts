import type { ProcessConfig } from '../../../core/types/model';

const commonText = (label:string) => ({id:label.toUpperCase().replaceAll(' ','_'),label,kind:'text' as const,defaultTemplate:`${label} del proceso de Capacitación Docente para el período {{PERIODO}}.`});

export const capacitacionProcess: ProcessConfig = {
  id:'CAPACITACION', label:'Capacitación Docente', unit:'UGPA',
  documents:[
    {id:'DNC',label:'Detección de Necesidades',sections:[
      {id:'INFO',label:'Información',kind:'info'},
      commonText('Introducción'), commonText('Base Legal'), commonText('Alineación'), commonText('Metodología'),
      {id:'FUENTES',label:'Fuentes',kind:'matrix',matrixId:'CAPA.DNC.FUENTES',columns:[
        {key:'CARRERA',label:'Carrera',required:true},{key:'TIPO_FUENTE',label:'Fuente',required:true},{key:'HALLAZGO',label:'Hallazgo',required:true}
      ]},
      commonText('Resultados'), commonText('Conclusiones'), commonText('Recomendaciones')
    ]},
    {id:'PLAN',label:'Plan de Capacitación',sections:[{id:'INFO',label:'Información',kind:'info'},commonText('Introducción'),{id:'PLAN_MATRIZ',label:'Plan',kind:'matrix',matrixId:'CAPA.PLAN.ACCIONES',columns:[{key:'CARRERA',label:'Carrera',required:true},{key:'CAPACITACION',label:'Capacitación',required:true},{key:'FECHA',label:'Fecha'},{key:'RESPONSABLE',label:'Responsable'}]}]},
    {id:'INFORME',label:'Informe de Cumplimiento',sections:[{id:'INFO',label:'Información',kind:'info'},commonText('Introducción'),{id:'CUMPLIMIENTO',label:'Cumplimiento',kind:'matrix',matrixId:'CAPA.INF.CUMPLIMIENTO',columns:[{key:'CAPACITACION',label:'Capacitación',required:true},{key:'ESTADO',label:'Estado',required:true},{key:'ASISTENCIA',label:'Asistencia'},{key:'RESULTADO',label:'Resultado'}]},commonText('Conclusiones')]}
  ]
};
