import type { ReferenceDefinition } from '../types/model';

export function verifiedReferences(references:ReferenceDefinition[]|undefined){
  return (references??[]).filter(reference=>reference.verified===true);
}

export function findReference(references:ReferenceDefinition[]|undefined,citationKey:string){
  return (references??[]).find(reference=>reference.citationKey===citationKey);
}

export function validateReferences(references:ReferenceDefinition[]|undefined){
  const errors:string[]=[];
  const seen=new Set<string>();
  for(const reference of references??[]){
    if(!reference.citationKey.trim())errors.push('Existe una referencia sin clave de cita.');
    if(!reference.referenceText.trim())errors.push(`La referencia ${reference.citationKey||reference.id} no tiene texto bibliográfico.`);
    if(seen.has(reference.citationKey))errors.push(`Clave de cita duplicada: ${reference.citationKey}.`);
    seen.add(reference.citationKey);
  }
  return errors;
}
