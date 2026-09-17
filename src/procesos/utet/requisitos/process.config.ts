import type { ProcessConfig } from '../../../core/types/model';

const info={id:'INFO',label:'Información',kind:'info' as const};

export const requisitosProcess:ProcessConfig={
  id:'REQUISITOS',label:'Requisitos',unit:'UTET',documents:[
    {id:'SEGUIMIENTO',label:'Seguimiento de Requisitos',sections:[
      info,
      {id:'MATRIZ',label:'Matriz',kind:'matrix',matrixId:'UTET.REQ.SEG',columns:[
        {key:'CEDULA',label:'Cédula',required:true},
        {key:'ESTUDIANTE',label:'Estudiante',required:true},
        {key:'ACADEMICO',label:'Académico'},
        {key:'DOCUMENTACION',label:'Documentación'},
        {key:'APROBACION',label:'Aprobación Titulación'}
      ]}
    ]}
  ]
};
