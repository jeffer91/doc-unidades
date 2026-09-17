import type { ProcessConfig } from '../types/model';
import { collectDocumentMatrices } from '../document-blocks/documentStructure';

export type DiagnosticIssue={level:'warning'|'error';scope:string;message:string};

export function diagnoseProcesses(processes:ProcessConfig[]){
  const issues:DiagnosticIssue[]=[];
  for(const process of processes){
    for(const document of process.documents){
      const scope=`${process.unit}/${process.id}/${document.id}`;
      if(!document.sections.length)issues.push({level:'error',scope,message:'Documento sin secciones.'});
      const ids=new Set<string>();
      for(const section of document.sections){
        if(ids.has(section.id))issues.push({level:'error',scope,message:`Sección duplicada: ${section.id}.`});
        ids.add(section.id);
      }
      for(const matrix of collectDocumentMatrices(document)){
        if(!matrix.matrixId.includes('.'))issues.push({level:'warning',scope,message:`Matriz con identificador poco específico: ${matrix.matrixId}.`});
      }
    }
  }
  return issues;
}
