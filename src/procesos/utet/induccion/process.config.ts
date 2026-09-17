import type { ProcessConfig } from '../../../core/types/model';

const text=(id:string,label:string,template:string)=>({id,label,kind:'text' as const,defaultTemplate:template});
const info={id:'INFO',label:'Información',kind:'info' as const};

export const induccionProcess:ProcessConfig={
  id:'INDUCCION',label:'Inducción',unit:'UTET',documents:[
    {id:'INDUCCION',label:'Inducción al Proceso',sections:[
      info,
      {id:'ASISTENCIA',label:'Asistencia',kind:'matrix',matrixId:'UTET.IND.ASIST',columns:[
        {key:'CEDULA',label:'Cédula',required:true},
        {key:'ESTUDIANTE',label:'Estudiante',required:true},
        {key:'ASISTIO',label:'Asistió'}
      ]},
      text('INFORME','Informe','Informe de finalización de la inducción del período {{PERIODO}}.')
    ]}
  ]
};
