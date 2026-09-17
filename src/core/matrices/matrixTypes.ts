import type { MatrixColumn } from '../types/model';

export type MatrixDefinition={
  id:string;
  label:string;
  columns:MatrixColumn[];
  required?:boolean;
  includeInPdf?:boolean;
};

export type MatrixContext={
  periodId:number;
  unitId:string;
  processId:string;
  documentId:string;
  matrixId:string;
};
