import type { ProcessConfig, UnitId } from '../types/model';
import { formacionProcess } from '../../procesos/ugpa/formacion/process.config';
import { capacitacionProcess } from '../../procesos/ugpa/capacitacion/process.config';
import { curricularProcess } from '../../procesos/ugpa/gestion-curricular/process.config';
import { utetProcesses } from '../../procesos/utet/processes';

export const registry: Record<UnitId, ProcessConfig[]> = {
  UGPA:[capacitacionProcess, formacionProcess, curricularProcess],
  UTET:utetProcesses
};
