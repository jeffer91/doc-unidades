import type { ProcessConfig } from '../../../core/types/model';

const info={id:'INFO',label:'Información',kind:'info' as const};

export const examenComplexivoProcess:ProcessConfig={
  id:'EXAMEN_COMPLEXIVO',label:'Examen Complexivo',unit:'UTET',documents:[
    {id:'EJECUCION',label:'Ejecución',sections:[
      info,
      {id:'RESULTADOS',label:'Resultados',kind:'matrix',matrixId:'UTET.COMP.RESULTADOS',columns:[
        {key:'CEDULA',label:'Cédula',required:true},
        {key:'TEORICO',label:'Teórico'},
        {key:'PRACTICO',label:'Práctico'},
        {key:'PROMEDIO',label:'Promedio'}
      ]}
    ]}
  ]
};
