import type { TableDefinition } from '../types/model';

export function tableShouldRender(table:TableDefinition,rows:any[]){
  if(table.presentationMode==='none')return false;
  return table.includeInPdf!==false&&rows.length>0;
}

export function tableTrace(table:TableDefinition,rows:any[]){
  return {
    tableId:table.id,
    sourceMatrix:table.sourceMatrix,
    rows:rows.length,
    columns:table.columns.map(column=>column.key)
  };
}
