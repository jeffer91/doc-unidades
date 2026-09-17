import type { ProcessConfig } from '../../core/types/model';
import { planificacionProcess } from './planificacion/process.config';
import { requisitosProcess } from './requisitos/process.config';
import { examenComplexivoProcess } from './examen-complexivo/process.config';
import { trabajoTitulacionProcess } from './trabajo-titulacion/process.config';
import { articuloAcademicoProcess } from './articulo-academico/process.config';
import { induccionProcess } from './induccion/process.config';
import { informesProcess } from './informes/process.config';

export const utetProcesses:ProcessConfig[]=[
  planificacionProcess,
  requisitosProcess,
  examenComplexivoProcess,
  trabajoTitulacionProcess,
  articuloAcademicoProcess,
  induccionProcess,
  informesProcess
];
