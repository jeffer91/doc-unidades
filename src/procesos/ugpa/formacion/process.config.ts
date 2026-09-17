import type { ProcessConfig } from '../../../core/types/model';

export const formacionProcess: ProcessConfig = {
  id: 'FORMACION',
  label: 'Formación Docente',
  unit: 'UGPA',
  documents: [
    {
      id: 'DNF', label: 'Detección de Necesidades', code: 'UGPA-RGI1-01-PRO-31',
      fields:[
        {key:'TOTAL_CARRERAS',label:'Total de carreras',group:'Carreras',kind:'compound',operation:'count_unique',source:{matrixId:'FORM.DNF.CARRERAS'},column:'CARRERA'},
        {key:'TOTAL_CARRERAS_ACTIVAS',label:'Total de carreras activas',group:'Carreras',kind:'compound',operation:'count_unique',source:{matrixId:'FORM.DNF.CARRERAS'},column:'CARRERA',filter:{column:'ESTADO_PERIODO',equals:'Activa'}},
        {key:'TOTAL_NECESIDADES',label:'Total de necesidades de formación',group:'Necesidades',kind:'compound',operation:'count',source:{matrixId:'FORM.DNF.NECESIDADES'}},
        {key:'TOTAL_CARRERAS_CON_NECESIDADES',label:'Carreras con necesidades',group:'Necesidades',kind:'compound',operation:'count_unique',source:{matrixId:'FORM.DNF.NECESIDADES'},column:'CARRERA'},
        {key:'PORCENTAJE_PRIORIDAD_ALTA',label:'Porcentaje de necesidades con prioridad alta',group:'Necesidades',kind:'compound',operation:'percentage_where',source:{matrixId:'FORM.DNF.NECESIDADES'},filter:{column:'PRIORIDAD_MANUAL',equals:'Alta'},decimals:1},
        {key:'PORCENTAJE_PRIORIDAD_MEDIA',label:'Porcentaje de necesidades con prioridad media',group:'Necesidades',kind:'compound',operation:'percentage_where',source:{matrixId:'FORM.DNF.NECESIDADES'},filter:{column:'PRIORIDAD_MANUAL',equals:'Media'},decimals:1},
        {key:'PORCENTAJE_PRIORIDAD_BAJA',label:'Porcentaje de necesidades con prioridad baja',group:'Necesidades',kind:'compound',operation:'percentage_where',source:{matrixId:'FORM.DNF.NECESIDADES'},filter:{column:'PRIORIDAD_MANUAL',equals:'Baja'},decimals:1},
        {key:'TOTAL_FUENTES_CONFIRMADAS',label:'Fuentes institucionales confirmadas',group:'Fuentes',kind:'compound',operation:'count',source:{matrixId:'FORM.DNF.FUENTES'},filter:{column:'CONFIRMADA',equals:'Sí'}},
        {key:'PRIMERA_FUENTE_CONFIRMADA',label:'Primera fuente institucional confirmada',group:'Fuentes',kind:'simple',operation:'value',source:{matrixId:'FORM.DNF.FUENTES'},column:'FUENTE',filter:{column:'CONFIRMADA',equals:'Sí'},required:false},
        {key:'TOTAL_ENCUESTAS',label:'Total de resultados de encuestas',group:'Fuentes',kind:'compound',operation:'count',source:{matrixId:'FORM.DNF.ENCUESTAS'},required:false},
        {key:'TOTAL_REUNIONES',label:'Total de reuniones académicas',group:'Fuentes',kind:'compound',operation:'count',source:{matrixId:'FORM.DNF.REUNIONES'},required:false}
      ],
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
      fields:[
        {key:'TOTAL_NECESIDADES_DNF',label:'Necesidades heredadas de la DNF',group:'DNF heredada',kind:'inherited',operation:'count',source:{documentId:'DNF',matrixId:'FORM.DNF.NECESIDADES'}},
        {key:'TOTAL_ACCIONES_FORMACION',label:'Total de acciones de formación',group:'Plan',kind:'compound',operation:'count',source:{matrixId:'FORM.PLAN.ACCIONES'}},
        {key:'TOTAL_CARRERAS_PLAN',label:'Carreras incluidas en el Plan',group:'Plan',kind:'compound',operation:'count_unique',source:{matrixId:'FORM.PLAN.ACCIONES'},column:'CARRERA'},
        {key:'NIVELES_FORMACION_PLAN',label:'Niveles de formación incluidos',group:'Plan',kind:'compound',operation:'join_unique',source:{matrixId:'FORM.PLAN.ACCIONES'},column:'NIVEL_FORMACION',required:false}
      ],
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
      fields:[
        {key:'TOTAL_ACCIONES_PLAN',label:'Acciones heredadas del Plan',group:'Plan heredado',kind:'inherited',operation:'count',source:{documentId:'PLAN',matrixId:'FORM.PLAN.ACCIONES'}},
        {key:'TOTAL_ACCIONES_SEGUIMIENTO',label:'Acciones con seguimiento',group:'Cumplimiento',kind:'compound',operation:'count',source:{matrixId:'FORM.INF.SEGUIMIENTO'}},
        {key:'TOTAL_FINALIZADAS',label:'Acciones finalizadas',group:'Cumplimiento',kind:'compound',operation:'count',source:{matrixId:'FORM.INF.SEGUIMIENTO'},filter:{column:'ESTADO',equals:'Finalizado'}},
        {key:'PORCENTAJE_CUMPLIMIENTO',label:'Porcentaje de acciones finalizadas',group:'Cumplimiento',kind:'compound',operation:'percentage_where',source:{matrixId:'FORM.INF.SEGUIMIENTO'},filter:{column:'ESTADO',equals:'Finalizado'},decimals:1},
        {key:'PROMEDIO_AVANCE',label:'Promedio de avance',group:'Cumplimiento',kind:'compound',operation:'average',source:{matrixId:'FORM.INF.SEGUIMIENTO'},column:'AVANCE_PORCENTAJE',decimals:1}
      ],
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
