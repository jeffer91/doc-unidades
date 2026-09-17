import type { ProcessConfig } from '../../../core/types/model';

const text=(id:string,label:string,template:string)=>({id,label,kind:'text' as const,defaultTemplate:template});
const info={id:'INFO',label:'Información',kind:'info' as const};

export const trabajoTitulacionProcess:ProcessConfig={
  id:'TRABAJO_TITULACION',label:'Trabajo de Titulación',unit:'UTET',documents:[
    {id:'EJECUCION',label:'Ejecución',sections:[
      info,
      text('INTRO','Introducción','Seguimiento del Trabajo de Titulación del período {{PERIODO}}.'),
      {id:'SEGUIMIENTO',label:'Seguimiento',kind:'matrix',matrixId:'UTET.TT.SEG',columns:[
        {key:'CEDULA',label:'Cédula',required:true},
        {key:'ESTUDIANTE',label:'Estudiante',required:true},
        {key:'TEMA',label:'Tema'},
        {key:'ESTADO',label:'Estado'}
      ]}
    ]}
  ]
};
