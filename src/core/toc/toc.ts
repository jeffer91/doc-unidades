export type TocEntry={
  label:string;
  page:number;
  level?:1|2|3;
};

export function normalizeTocEntries(entries:TocEntry[]){
  return entries.filter(entry=>entry.label.trim()&&entry.page>0).map(entry=>({...entry,level:entry.level??1}));
}
