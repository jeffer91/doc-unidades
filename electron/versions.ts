import path from 'node:path';
import { getDataRoot, getDb, logHistory } from './database';

function relativeToDataRoot(filePath:string){
  const root=getDataRoot();
  const relative=path.relative(root,filePath);
  return relative.startsWith('..')?filePath:relative;
}

export function saveFinalDocumentVersion(args:any){
  if(!args?.periodId||!args?.unitId||!args?.processId||!args?.documentId)return null;
  const db=getDb();
  const current=db.prepare(`
    SELECT COALESCE(MAX(version_number),0) AS maxv
    FROM document_versions
    WHERE period_id=? AND unit_id=? AND process_id=? AND document_id=?
  `).get(args.periodId,args.unitId,args.processId,args.documentId) as {maxv:number};
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
  `).run(args.periodId,args.unitId,args.processId,args.documentId,versionNumber,JSON.stringify(snapshot),args.filePath?relativeToDataRoot(args.filePath):null);
  logHistory({periodId:args.periodId,unitId:args.unitId,processId:args.processId,documentId:args.documentId},'DOCUMENT_FINAL',`Versión ${versionNumber}`);
  return {id:Number(info.lastInsertRowid),versionNumber};
}
