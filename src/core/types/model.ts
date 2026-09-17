export type UnitId = 'UGPA' | 'UTET';
export type SectionKind = 'info' | 'text' | 'matrix';

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
  sections: SectionConfig[];
  summaryItems?: SummaryItemConfig[];
};

export type ProcessConfig = {
  id: string;
  label: string;
  unit: UnitId;
  documents: DocumentConfig[];
};
