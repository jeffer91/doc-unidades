import type { ProcessConfig } from '../../../core/types/model';

const text=(id:string,label:string,template:string)=>({id,label,kind:'text' as const,defaultTemplate:template});
const info={id:'INFO',label:'Información',kind:'info' as const};

export const articuloAcademicoProcess:ProcessConfig={
  id:'ARTICULO_ACADEMICO',label:'Artículo Académico',unit:'UTET',documents:[
    {id:'GESTION',label:'Gestión',sections:[
      info,
      text('INTRO','Introducción','Gestión de Artículo Académico del período {{PERIODO}}.'),
      {id:'SEGUIMIENTO',label:'Seguimiento',kind:'matrix',matrixId:'UTET.ART.SEG',columns:[
        {key:'CEDULA',label:'Cédula',required:true},
        {key:'ESTUDIANTE',label:'Estudiante',required:true},
        {key:'TEMA',label:'Tema'},
        {key:'ESTADO',label:'Estado'}
      ]}
    ]}
  ]
};
