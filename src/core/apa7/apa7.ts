export type ApaTableMeta={number:number;title:string;note?:string};
export type ApaFigureMeta={number:number;title:string;note?:string};

export function apaTableLabel(meta:ApaTableMeta){
  return {number:`Tabla ${meta.number}`,title:meta.title,note:meta.note?.trim()||''};
}

export function apaFigureLabel(meta:ApaFigureMeta){
  return {number:`Figura ${meta.number}`,title:meta.title,note:meta.note?.trim()||''};
}

export function apaBodyRules(){
  return {
    fontFamily:'Arial',
    fontSizePt:11,
    lineHeight:2,
    paragraphAlign:'justify' as const,
    tableVerticalLines:false,
    figureNumbering:'independent' as const,
    tableNumbering:'independent' as const
  };
}
