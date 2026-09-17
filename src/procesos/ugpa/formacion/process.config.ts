import type { ProcessConfig } from '../../../core/types/model';

export const formacionProcess: ProcessConfig = {
  id: 'FORMACION',
  label: 'Formación Docente',
  unit: 'UGPA',
  documents: [
    {
      id: 'DNF', label: 'Detección de Necesidades', code: 'UGPA-RGI1-01-PRO-31',
      summaryItems:[
        {id:'CARRERAS',label:'Carreras',description:'Catálogo de carreras del período.',matrixId:'FORM.DNF.CARRERAS',required:true,columns:[
          {key:'CARRERA',label:'Carrera',required:true},
          {key:'PROGRAMA',label:'Programa',required:true,options:['Técnico Superior','Tecnología Superior','Tecnología Universitaria']},
          {key:'ESTADO_PERIODO',label:'Estado',required:true,options:['Activa','Inactiva']}
        ]},
        {id:'NECESIDADES',label:'Necesidades de Formación',description:'Necesidades priorizadas por carrera.',matrixId:'FORM.DNF.NECESIDADES',sectionId:'NECESIDADES',required:true,columns:[
          {key:'CARRERA',label:'Carrera',required:true},
          {key:'NECESIDAD',label:'Necesidad',required:true},
          {key:'PRIORIDAD_MANUAL',label:'Prioridad',required:true,options:['Alta','Media','Baja']},
          {key:'JUSTIFICACION_PRIORIDAD',label:'Justificación',required:true}
        ]},
        {id:'METODOLOGIA_DATOS',label:'Metodología',description:'Participantes, técnicas, fuentes, procedimientos y evidencias del diagnóstico.',matrixId:'FORM.DNF.METODOLOGIA',required:true,columns:[
          {key:'BLOQUE',label:'Bloque',required:true,options:['GENERAL','PARTICIPANTE','TECNICA','FUENTE','PROCEDIMIENTO','VALIDACION','EVIDENCIA']},
          {key:'CAMPO',label:'Campo',required:true},
          {key:'SELECCION',label:'Selección'},
          {key:'PORCENTAJE',label:'Porcentaje'},
          {key:'VALOR_DETALLE',label:'Valor / detalle'},
          {key:'DESCRIPCION_APLICACION',label:'Descripción de aplicación'}
        ]},
        {id:'FUENTES',label:'Fuentes institucionales',description:'Base legal, bibliografía y referencias institucionales confirmadas para el período.',matrixId:'FORM.DNF.FUENTES',required:true,columns:[
          {key:'FUENTE',label:'Fuente',required:true},
          {key:'VERSION_REFERENCIA',label:'Versión / referencia',required:true},
          {key:'CONFIRMADA',label:'Confirmada',required:true,options:['Sí','No']},
          {key:'OBSERVACION',label:'Observación'}
        ]},
        {id:'ENCUESTAS',label:'Encuestas',description:'Resultados agregados de encuestas usados como fuente del diagnóstico.',matrixId:'FORM.DNF.ENCUESTAS',required:false,columns:[
          {key:'PREGUNTA',label:'Pregunta',required:true},
          {key:'RESULTADO',label:'Resultado',required:true},
          {key:'PORCENTAJE',label:'Porcentaje'},
          {key:'OBSERVACION',label:'Observación'}
        ]},
        {id:'REUNIONES',label:'Reuniones académicas',description:'Hallazgos agregados de reuniones, mesas técnicas u otros espacios de levantamiento.',matrixId:'FORM.DNF.REUNIONES',required:false,columns:[
          {key:'CARRERA',label:'Carrera'},
          {key:'FECHA',label:'Fecha'},
          {key:'HALLAZGO',label:'Hallazgo',required:true},
          {key:'OBSERVACION',label:'Observación'}
        ]}
      ],
      sections: [
        { id:'INFO', label:'Resumen', kind:'info' },
        { id:'INTRO', label:'Introducción', kind:'text', defaultTemplate:'Durante el período {{PERIODO}}, la {{UNIDAD}} desarrolla la Detección de Necesidades de Formación Docente con el propósito de identificar, priorizar y justificar las necesidades de formación de las carreras activas.' },
        { id:'BASE_LEGAL', label:'Base Legal', kind:'text', defaultTemplate:'La presente detección se sustenta en la normativa institucional vigente y en las fuentes confirmadas para el período {{PERIODO}}.' },
        { id:'ALINEACION', label:'Alineación Estratégica', kind:'text', defaultTemplate:'La DNF se articula con la planificación institucional, la gestión académica y los mecanismos de calidad aplicables al período {{PERIODO}}.' },
        { id:'METODOLOGIA', label:'Metodología', kind:'text', defaultTemplate:'La metodología describe participantes, técnicas, fuentes, procedimientos de levantamiento y análisis, validación y evidencias reales del diagnóstico.' },
        { id:'NECESIDADES', label:'Necesidades', kind:'matrix', matrixId:'FORM.DNF.NECESIDADES', columns:[
          {key:'CARRERA',label:'Carrera',required:true},
          {key:'NECESIDAD',label:'Necesidad',required:true},
          {key:'PRIORIDAD_MANUAL',label:'Prioridad',required:true,options:['Alta','Media','Baja']},
          {key:'JUSTIFICACION_PRIORIDAD',label:'Justificación',required:true}
        ]},
        { id:'RESUMEN', label:'Resumen Ejecutivo', kind:'text', defaultTemplate:'Resumen institucional del diagnóstico del período {{PERIODO}}.' },
        { id:'CONCLUSIONES', label:'Conclusiones', kind:'text', defaultTemplate:'Las conclusiones deben construirse a partir de los resultados validados del período {{PERIODO}}.' },
        { id:'RECOMENDACIONES', label:'Recomendaciones', kind:'text', defaultTemplate:'Las recomendaciones orientan la construcción del Plan de Formación Docente.' }
      ]
    },
    {
      id:'PLAN', label:'Plan de Formación', code:'UGPA-RGI2-01-PRO-31',
      sections:[
        {id:'INFO',label:'Resumen',kind:'info'},
        {id:'INTRO',label:'Introducción',kind:'text',defaultTemplate:'El Plan de Formación Docente del período {{PERIODO}} transforma las necesidades validadas en acciones de formación proyectadas y trazables.'},
        {id:'ACCIONES',label:'Acciones de Formación',kind:'matrix',matrixId:'FORM.PLAN.ACCIONES',columns:[
          {key:'CODIGO_DNF',label:'Código DNF',required:true},
          {key:'CARRERA',label:'Carrera',required:true},
          {key:'NECESIDAD',label:'Necesidad',required:true},
          {key:'PRIORIDAD',label:'Prioridad',required:true},
          {key:'ACCION_FORMACION',label:'Acción de formación',required:true},
          {key:'NIVEL_FORMACION',label:'Nivel',required:true},
          {key:'PROGRAMA_TITULO',label:'Programa / título',required:true}
        ]},
        {id:'CONCLUSIONES',label:'Conclusiones',kind:'text',defaultTemplate:'Conclusiones del Plan de Formación Docente para {{PERIODO}}.'}
      ]
    },
    {
      id:'INFORME', label:'Informe de Cumplimiento', code:'UGPA-RGI3-01-PRO-31',
      sections:[
        {id:'INFO',label:'Resumen',kind:'info'},
        {id:'INTRO',label:'Introducción',kind:'text',defaultTemplate:'El Informe de Cumplimiento consolida el estado real de ejecución de las acciones del Plan de Formación Docente del período {{PERIODO}}.'},
        {id:'SEGUIMIENTO',label:'Seguimiento',kind:'matrix',matrixId:'FORM.INF.SEGUIMIENTO',columns:[
          {key:'CODIGO_DNF',label:'Código DNF',required:true},
          {key:'CARRERA',label:'Carrera',required:true},
          {key:'NECESIDAD',label:'Necesidad',required:true},
          {key:'ACCION_FORMACION',label:'Acción',required:true},
          {key:'ESTADO',label:'Estado',required:true,options:['No iniciado','En proceso','Finalizado','No ejecutado']},
          {key:'AVANCE_PORCENTAJE',label:'Avance %',required:true},
          {key:'EVIDENCIA',label:'Evidencia'},
          {key:'RESULTADO_OBSERVACION',label:'Resultado / observación'}
        ]},
        {id:'CONCLUSIONES',label:'Conclusiones',kind:'text',defaultTemplate:'Conclusiones del cumplimiento del período {{PERIODO}}.'},
        {id:'RECOMENDACIONES',label:'Recomendaciones',kind:'text',defaultTemplate:'Recomendaciones derivadas del seguimiento y los resultados del período {{PERIODO}}.'}
      ]
    }
  ]
};
