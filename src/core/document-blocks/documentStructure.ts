import type { DocumentBlock, DocumentConfig } from '../types/model';

export type DocumentMatrixDescriptor = {
  matrixId: string;
  label: string;
  required: boolean;
  source: 'summary' | 'section' | 'field';
};

export function collectDocumentMatrices(document:DocumentConfig):DocumentMatrixDescriptor[]{
  const map=new Map<string,DocumentMatrixDescriptor>();
  for(const item of document.summaryItems??[]){
    map.set(item.matrixId,{matrixId:item.matrixId,label:item.label,required:item.required!==false,source:'summary'});
  }
  for(const section of document.sections??[]){
    if(section.kind==='matrix'&&section.matrixId&&!map.has(section.matrixId)){
      map.set(section.matrixId,{matrixId:section.matrixId,label:section.label,required:section.required!==false,source:'section'});
    }
  }
  for(const field of document.fields??[]){
    const matrixId=field.source?.matrixId;
    if(matrixId&&!map.has(matrixId)){
      map.set(matrixId,{matrixId,label:`Fuente de ${field.label}`,required:field.required!==false,source:'field'});
    }
  }
  return [...map.values()];
}

export function buildDefaultBlocks(document:DocumentConfig):DocumentBlock[]{
  if(document.blocks?.length)return document.blocks;
  return document.sections
    .filter(section=>section.kind!=='info'&&section.kind!=='cover')
    .map<DocumentBlock>(section=>({
      id:`BLOCK_${section.id}`,
      kind:section.kind==='matrix'?'table':'text',
      sectionId:section.id,
      title:section.label,
      matrixId:section.matrixId,
      required:section.required!==false,
      includeInPdf:true
    }));
}
