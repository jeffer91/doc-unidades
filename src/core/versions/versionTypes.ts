export type DocumentVersionStatus='DRAFT'|'FINAL';

export type DocumentSnapshot={
  periodId:number;
  unitId:string;
  processId:string;
  documentId:string;
  versionNumber:number;
  status:DocumentVersionStatus;
  generatedAt:string;
  sections:any[];
  fields:Record<string,unknown>;
  matrices:Record<string,unknown[]>;
  cover:any;
};
