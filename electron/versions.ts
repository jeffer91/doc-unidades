import path from 'node:path';
import { getDataRoot, getDb, logHistory } from './database';

const MONTHS=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function relativeToDataRoot(filePath:string){
  const root=getDataRoot();
  const relative=path.relative(root,filePath);
  return relative.startsWith('..')?filePath:relative;
}

function resolvePeriodId(periodLabel:string|undefined){
  if(!periodLabel)return null;
  const rows=getDb().prepare(`SELECT id,start_month,start_year,end_month,end_year FROM core_periodos`).all() as any[];
  const match=rows.find(row=>`${MONTHS[row.start_month-1]} ${row.start_year} - ${MONTHS[row.end_month-1]} ${row.end_year}`===periodLabel);
  return match?.id??null;
}

export function saveFinalDocumentVersion(args:any){
  const periodId=args?.periodId??resolvePeriodId(args?.period);
  const unitId=args?.unitId??args?.unit;
  const processId=args?.processId??args?.process;
  const documentId=args?.documentId??args?.title;
  if(!periodId||!unitId||!processId||!documentId)return null;
  const db=getDb();
  const current=db.prepare(`
    SELECT COALESCE(MAX(version_number),0) AS maxv
    FROM document_versions
    WHERE period_id=? AND unit_id=? AND process_id=? AND document_id=?
  `).get(periodId,unitId,processId,documentId) as {maxv:number};
  const versionNumber=current.maxv+1;
  const snapshot={
    generatedAt:new Date().toISOString(),
    title:args.title,
    code:args.code,
    period:args.period,
    cover:args.cover,
    sections:args.sections??[],
    pending:args.pending??[]
  };
  const info=db.prepare(`
    INSERT INTO document_versions(period_id,unit_id,process_id,document_id,version_number,status,snapshot_json,pdf_relative_path)
    VALUES(?,?,?,?,?,'FINAL',?,?)
  `).run(periodId,unitId,processId,documentId,versionNumber,JSON.stringify(snapshot),args.filePath?relativeToDataRoot(args.filePath):null);
  logHistory({periodId,unitId,processId,documentId},'DOCUMENT_FINAL',`Versión ${versionNumber}`);
  return {id:Number(info.lastInsertRowid),versionNumber};
}
