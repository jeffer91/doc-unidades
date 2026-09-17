import type { ProcessConfig } from '../../../core/types/model';

const text=(id:string,label:string,template:string)=>({id,label,kind:'text' as const,defaultTemplate:template});
const info={id:'INFO',label:'Información',kind:'info' as const};

export const informesProcess:ProcessConfig={
  id:'INFORMES',label:'Informes',unit:'UTET',documents:[
    {id:'FINAL',label:'Informe Final',documentType:'INF',sections:[
      info,
      text('INTRO','Introducción','Informe Final del Proceso de Titulación del período {{PERIODO}}.'),
      {id:'COMPONENTES',label:'Componentes',kind:'matrix',matrixId:'UTET.INF.COMP',columns:[
        {key:'COMPONENTE',label:'Componente',required:true},
        {key:'ESTADO',label:'Estado',required:true},
        {key:'OBSERVACION',label:'Observación'}
      ]},
      text('CONCLUSIONES','Conclusiones','Conclusiones institucionales del proceso.')
    ]}
  ]
};
