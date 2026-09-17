import type { DocumentConfig } from '../types/model';
import { collectDocumentMatrices } from '../document-blocks/documentStructure';

export type DocumentValidationResult={
  valid:boolean;
  pending:string[];
};

export function validateDocumentConfiguration(document:DocumentConfig):DocumentValidationResult{
  const pending:string[]=[];
  if(!document.sections?.length)pending.push('El documento no tiene secciones configuradas.');
  for(const matrix of collectDocumentMatrices(document)){
    if(!matrix.matrixId.trim())pending.push(`La matriz ${matrix.label} no tiene identificador.`);
  }
  for(const field of document.fields??[]){
    if(field.kind!=='system'&&!field.source?.matrixId)pending.push(`El campo {{${field.key}}} no tiene fuente configurada.`);
  }
  return {valid:pending.length===0,pending};
}
