export type PdfMode='draft'|'final';

export type PdfSectionPayload={
  kind:'text'|'matrix'|'chart'|'figure';
  label:string;
  text?:string;
  columns?:Array<{key:string;label:string}>;
  rows?:any[];
  svg?:string;
  title?:string;
  note?:string;
};

export type PdfDocumentPayload={
  mode:PdfMode;
  title:string;
  code?:string;
  unit:string;
  process:string;
  period:string;
  pending:string[];
  sections:PdfSectionPayload[];
};
