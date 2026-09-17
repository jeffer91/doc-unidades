export type UnitId = 'UGPA' | 'UTET';
export type SectionKind = 'info' | 'text' | 'matrix';

export type MatrixColumn = {
  key: string;
  label: string;
  required?: boolean;
  options?: string[];
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
};

export type ProcessConfig = {
  id: string;
  label: string;
  unit: UnitId;
  documents: DocumentConfig[];
};
