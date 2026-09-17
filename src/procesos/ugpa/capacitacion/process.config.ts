import type { ProcessConfig } from '../../../core/types/model';

const commonText = (label:string) => ({id:label.toUpperCase().replaceAll(' ','_'),label,kind:'text' as const,defaultTemplate:`${label} del proceso de Capacitación Docente para el período {{PERIODO}}.`});

export const capacitacionProcess: ProcessConfig = {
  id:'CAPACITACION', label:'Capacitación Docente', unit:'UGPA',
  documents:[
    {id:'DNC',label:'Detección de Necesidades',fields:[
      {key:'TOTAL_FUENTES_DNC',label:'Total de fuentes del diagnóstico',group:'Diagnóstico',kind:'compound',operation:'count',source:{matrixId:'CAPA.DNC.FUENTES'}},
      {key:'TOTAL_CARRERAS_DNC',label:'Carreras presentes en las fuentes',group:'Diagnóstico',kind:'compound',operation:'count_unique',source:{matrixId:'CAPA.DNC.FUENTES'},column:'CARRERA'},
      {key:'PRIMER_HALLAZGO_DNC',label:'Primer hallazgo registrado',group:'Diagnóstico',kind:'simple',operation:'value',source:{matrixId:'CAPA.DNC.FUENTES'},column:'HALLAZGO',required:false}
    ],sections:[
      {id:'INFO',label:'Información',kind:'info'},
      commonText('Introducción'), commonText('Base Legal'), commonText('Alineación'), commonText('Metodología'),
      {id:'FUENTES',label:'Fuentes',kind:'matrix',matrixId:'CAPA.DNC.FUENTES',columns:[
        {key:'CARRERA',label:'Carrera',required:true},{key:'TIPO_FUENTE',label:'Fuente',required:true},{key:'HALLAZGO',label:'Hallazgo',required:true}
      ]},
      commonText('Resultados'), commonText('Conclusiones'), commonText('Recomendaciones')
    ]},
    {id:'PLAN',label:'Plan de Capacitación',fields:[
      {key:'TOTAL_FUENTES_DNC',label:'Fuentes heredadas del DNC',group:'DNC heredado',kind:'inherited',operation:'count',source:{documentId:'DNC',matrixId:'CAPA.DNC.FUENTES'}},
      {key:'TOTAL_CAPACITACIONES',label:'Total de capacitaciones planificadas',group:'Plan',kind:'compound',operation:'count',source:{matrixId:'CAPA.PLAN.ACCIONES'}},
      {key:'TOTAL_CARRERAS_PLAN',label:'Carreras incluidas en el Plan',group:'Plan',kind:'compound',operation:'count_unique',source:{matrixId:'CAPA.PLAN.ACCIONES'},column:'CARRERA'}
    ],sections:[{id:'INFO',label:'Información',kind:'info'},commonText('Introducción'),{id:'PLAN_MATRIZ',label:'Plan',kind:'matrix',matrixId:'CAPA.PLAN.ACCIONES',columns:[{key:'CARRERA',label:'Carrera',required:true},{key:'CAPACITACION',label:'Capacitación',required:true},{key:'FECHA',label:'Fecha'},{key:'RESPONSABLE',label:'Responsable'}]}]},
    {id:'INFORME',label:'Informe de Cumplimiento',fields:[
      {key:'TOTAL_CAPACITACIONES_PLAN',label:'Capacitaciones heredadas del Plan',group:'Plan heredado',kind:'inherited',operation:'count',source:{documentId:'PLAN',matrixId:'CAPA.PLAN.ACCIONES'}},
      {key:'TOTAL_REGISTROS_CUMPLIMIENTO',label:'Registros de cumplimiento',group:'Cumplimiento',kind:'compound',operation:'count',source:{matrixId:'CAPA.INF.CUMPLIMIENTO'}},
      {key:'TOTAL_FINALIZADAS',label:'Capacitaciones finalizadas',group:'Cumplimiento',kind:'compound',operation:'count',source:{matrixId:'CAPA.INF.CUMPLIMIENTO'},filter:{column:'ESTADO',equals:'Finalizado'}},
      {key:'PORCENTAJE_CUMPLIMIENTO',label:'Porcentaje de capacitaciones finalizadas',group:'Cumplimiento',kind:'compound',operation:'percentage_where',source:{matrixId:'CAPA.INF.CUMPLIMIENTO'},filter:{column:'ESTADO',equals:'Finalizado'},decimals:1}
    ],sections:[{id:'INFO',label:'Información',kind:'info'},commonText('Introducción'),{id:'CUMPLIMIENTO',label:'Cumplimiento',kind:'matrix',matrixId:'CAPA.INF.CUMPLIMIENTO',columns:[{key:'CAPACITACION',label:'Capacitación',required:true},{key:'ESTADO',label:'Estado',required:true},{key:'ASISTENCIA',label:'Asistencia'},{key:'RESULTADO',label:'Resultado'}]},commonText('Conclusiones')]}
  ]
};
