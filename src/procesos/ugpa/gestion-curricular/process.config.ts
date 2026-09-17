import type { ProcessConfig } from '../../../core/types/model';
export const curricularProcess: ProcessConfig = {
  id:'GESTION_CURRICULAR',label:'Gestión Curricular',unit:'UGPA',documents:[
    {id:'ACTAS',label:'Actas',sections:[{id:'INFO',label:'Información',kind:'info'},{id:'ACTAS_MATRIZ',label:'Actas por carrera',kind:'matrix',matrixId:'CURR.ACTAS',columns:[{key:'CARRERA',label:'Carrera',required:true},{key:'FECHA',label:'Fecha',required:true},{key:'TEMA',label:'Tema',required:true},{key:'ACUERDOS',label:'Acuerdos'}]}]},
    {id:'FICHAS_CCC',label:'Fichas CCC',sections:[{id:'INFO',label:'Información',kind:'info'},{id:'FICHAS',label:'Fichas',kind:'matrix',matrixId:'CURR.FICHAS',columns:[{key:'CARRERA',label:'Carrera',required:true},{key:'NIVEL',label:'Nivel',required:true},{key:'PERIODO',label:'Período',required:true},{key:'ESTADO',label:'Estado'}]}]},
    {id:'MALLAS',label:'Mallas',sections:[{id:'INFO',label:'Información',kind:'info'},{id:'MALLAS_MATRIZ',label:'Mallas',kind:'matrix',matrixId:'CURR.MALLAS',columns:[{key:'CARRERA',label:'Carrera',required:true},{key:'NIVEL',label:'Nivel',required:true},{key:'MATERIA',label:'Materia',required:true},{key:'CODIGO',label:'Código'}]}]},
    {id:'COMUNICADOS',label:'Comunicados',sections:[{id:'INFO',label:'Información',kind:'info'},{id:'TEXTO',label:'Contenido',kind:'text',defaultTemplate:'Comunicado institucional correspondiente al período {{PERIODO}}.'}]}
  ]
};
