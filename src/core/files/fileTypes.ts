export type DocumentFileType='attachment'|'evidence'|'image'|'excel'|'pdf'|'other';

export type DocumentFileRecord={
  id?:number;
  periodId?:number|null;
  unitId:string;
  processId:string;
  documentId:string;
  sectionId?:string|null;
  fileType:DocumentFileType;
  originalName:string;
  relativePath:string;
  sha256?:string|null;
  sizeBytes?:number|null;
};
