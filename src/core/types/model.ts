export type UnitId = 'UGPA' | 'UTET';
export type DocumentType = 'RGI' | 'INF';
export type SectionKind = 'info' | 'text' | 'matrix' | 'cover';

export type MatrixColumn = {
  key: string;
  label: string;
  required?: boolean;
  options?: string[];
};

export type SummaryItemConfig = {
  id: string;
  label: string;
  description?: string;
  matrixId: string;
  columns: MatrixColumn[];
  required?: boolean;
  sectionId?: string;
};

export type CoverSettings = {
  type: DocumentType;
  code: string;
  documentName: string;
  title: string;
  subtitle: string;
  complementaryData: string;
  version: string;
  elaborationDate: string;
};

export type SectionConfig = {
  id: string;
  label: string;
  kind: SectionKind;
  defaultTemplate?: string;
  matrixId?: string;
  columns?: MatrixColumn[];
};

export type DocumentConfig = {
  id: string;
  label: string;
  code?: string;
  documentType?: DocumentType;
  sections: SectionConfig[];
  summaryItems?: SummaryItemConfig[];
};

export type ProcessConfig = {
  id: string;
  label: string;
  unit: UnitId;
  documents: DocumentConfig[];
};
