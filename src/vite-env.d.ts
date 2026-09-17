/// <reference types="vite/client" />

declare global {
  interface Window {
    docUnits: {
      periods: { list(): Promise<any[]>; create(input:any): Promise<any> };
      sections: { get(args:any): Promise<any>; save(args:any): Promise<boolean> };
      templates: { get(args:any): Promise<any>; save(args:any): Promise<boolean> };
      matrices: {
        list(args:any): Promise<any[]>;
        replace(args:any): Promise<{saved:number}>;
        upsert(args:any): Promise<boolean>;
        remove(id:number): Promise<boolean>;
      };
      pdf: { generate(args:any): Promise<{saved:boolean;path?:string}> };
      clipboard: { readText(): Promise<string>; writeText(text:string): Promise<boolean> };
      stats(args:any): Promise<{rows:number}>;
      system: { dataRoot(): Promise<string> };
    }
  }
}
export {};
