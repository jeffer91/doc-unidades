export type UnitId = 'UGPA' | 'UTET';
export type DocumentType = 'RGI' | 'INF';
export type SectionKind = 'info' | 'text' | 'matrix' | 'cover';
export type FieldKind = 'system' | 'simple' | 'compound' | 'inherited';
export type FieldOperation = 'value' | 'count' | 'count_unique' | 'percentage_where' | 'average' | 'sum' | 'join_unique';
export type DocumentBlockKind = 'text' | 'field' | 'indicator' | 'table' | 'chart' | 'figure' | 'list' | 'references' | 'annex';
export type PresentationMode = 'fixed' | 'auto' | 'none';
export type ChartType = 'bar' | 'horizontal_bar' | 'line' | 'pie' | 'stacked_bar';

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
  includeInPdf?: boolean;
};

export type FieldFilter = {
  column: string;
  equals?: string | number | boolean;
  notEquals?: string | number | boolean;
  truthy?: boolean;
};

export type FieldSource = {
  matrixId: string;
  unitId?: UnitId;
  processId?: string;
  documentId?: string;
};

export type FieldDefinition = {
  key: string;
  label: string;
  description?: string;
  group?: string;
  kind: FieldKind;
  operation?: FieldOperation;
  source?: FieldSource;
  column?: string;
  filter?: FieldFilter;
  denominatorFilter?: FieldFilter;
  decimals?: number;
  separator?: string;
  required?: boolean;
};

export type TableDefinition = {
  id: string;
  title: string;
  sourceMatrix: string;
  columns: MatrixColumn[];
  note?: string;
  sectionId?: string;
  includeInPdf?: boolean;
  presentationMode?: PresentationMode;
  apa7?: boolean;
};

export type ChartDefinition = {
  id: string;
  title: string;
  sourceMatrix: string;
  chartType: ChartType;
  categoryField: string;
  valueField?: string;
  note?: string;
  sectionId?: string;
  includeInPdf?: boolean;
  presentationMode?: PresentationMode;
  apa7?: boolean;
};

export type ReferenceDefinition = {
  id: string;
  type: 'norma' | 'libro' | 'articulo' | 'web' | 'institucional' | 'otro';
  citationKey: string;
  referenceText: string;
  verified?: boolean;
};

export type DocumentBlock = {
  id: string;
  kind: DocumentBlockKind;
  sectionId: string;
  title?: string;
  fieldKey?: string;
  matrixId?: string;
  tableId?: string;
  chartId?: string;
  required?: boolean;
  includeInPdf?: boolean;
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
  required?: boolean;
};

export type DocumentConfig = {
  id: string;
  label: string;
  code?: string;
  documentType?: DocumentType;
  sections: SectionConfig[];
  summaryItems?: SummaryItemConfig[];
  fields?: FieldDefinition[];
  blocks?: DocumentBlock[];
  tables?: TableDefinition[];
  charts?: ChartDefinition[];
  references?: ReferenceDefinition[];
};

export type ProcessConfig = {
  id: string;
  label: string;
  unit: UnitId;
  documents: DocumentConfig[];
};
