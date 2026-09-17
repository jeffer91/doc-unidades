import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('docUnits', {
  periods: {
    list: () => ipcRenderer.invoke('periods:list'),
    create: (input: any) => ipcRenderer.invoke('periods:create', input)
  },
  sections: {
    get: (args: any) => ipcRenderer.invoke('sections:get', args),
    save: (args: any) => ipcRenderer.invoke('sections:save', args)
  },
  templates: {
    get: (args: any) => ipcRenderer.invoke('templates:get', args),
    save: (args: any) => ipcRenderer.invoke('templates:save', args)
  },
  matrices: {
    list: (args: any) => ipcRenderer.invoke('matrices:list', args),
    replace: (args: any) => ipcRenderer.invoke('matrices:replace', args),
    upsert: (args: any) => ipcRenderer.invoke('matrices:upsert', args),
    remove: (id: number) => ipcRenderer.invoke('matrices:remove', id)
  },
  stats: (args:any) => ipcRenderer.invoke('stats:get', args),
  system: {
    dataRoot: () => ipcRenderer.invoke('system:data-root')
  }
});
