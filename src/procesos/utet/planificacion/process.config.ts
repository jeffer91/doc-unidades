import type { ProcessConfig } from '../../../core/types/model';

const text=(id:string,label:string,template:string)=>({id,label,kind:'text' as const,defaultTemplate:template});
const info={id:'INFO',label:'Información',kind:'info' as const};

export const planificacionProcess:ProcessConfig={
  id:'PLANIFICACION',label:'Planificación',unit:'UTET',documents:[
    {id:'COMPLEXIVO',label:'Examen Complexivo',sections:[
      info,
      text('INTRO','Introducción','Introducción de la planificación del Examen Complexivo para {{PERIODO}}.'),
      text('METODOLOGIA','Metodología','Metodología de la planificación del Examen Complexivo.'),
      {id:'CRONOGRAMA',label:'Cronograma',kind:'matrix',matrixId:'UTET.PLAN.COMPLEXIVO.CRONO',columns:[{key:'ACTIVIDAD',label:'Actividad',required:true},{key:'FECHA_INICIO',label:'Inicio'},{key:'FECHA_FIN',label:'Fin'},{key:'RESPONSABLE',label:'Responsable'}]}
    ]},
    {id:'TRABAJO',label:'Trabajo de Titulación',sections:[
      info,
      text('INTRO','Introducción','Introducción de la planificación de Trabajo de Titulación para {{PERIODO}}.'),
      text('BASE_LEGAL','Base Legal','Base legal aplicable al Trabajo de Titulación.'),
      {id:'CRONOGRAMA',label:'Cronograma',kind:'matrix',matrixId:'UTET.PLAN.TT.CRONO',columns:[{key:'ACTIVIDAD',label:'Actividad',required:true},{key:'FECHA_INICIO',label:'Inicio'},{key:'FECHA_FIN',label:'Fin'},{key:'RESPONSABLE',label:'Responsable'}]},
      text('RESULTADOS','Resultados','Análisis de resultados y mejora continua.')
    ]},
    {id:'ARTICULO',label:'Artículo Académico',sections:[
      info,
      text('INTRO','Introducción','Introducción de la planificación de Artículo Académico para {{PERIODO}}.'),
      text('MARCO','Marco normativo','Marco normativo y estratégico.'),
      text('METODOLOGIA','Metodología','Metodología de implementación del proceso.'),
      text('DESARROLLO','Desarrollo','Desarrollo operativo del proceso de titulación.'),
      text('EVALUACION','Evaluación','Evaluación, acreditación y seguimiento.'),
      text('DISPOSICIONES','Disposiciones','Disposiciones finales.'),
      text('REFERENCIAS','Referencias','Referencias institucionales.')
    ]}
  ]
};
