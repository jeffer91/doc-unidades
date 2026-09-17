import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import {
  createPeriod, listPeriods, getSectionContent, saveSectionContent,
  getActiveTemplate, saveTemplate, listMatrixRows, replaceMatrixRows,
  upsertMatrixRow, deleteMatrixRow, getStats, getDataRoot
} from './database';

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 680,
    backgroundColor: '#f5f7fa',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) win.loadURL(devUrl);
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  ipcMain.handle('periods:list', () => listPeriods());
  ipcMain.handle('periods:create', (_e, input) => createPeriod(input));
  ipcMain.handle('sections:get', (_e, args) => getSectionContent(args));
  ipcMain.handle('sections:save', (_e, args) => saveSectionContent(args));
  ipcMain.handle('templates:get', (_e, args) => getActiveTemplate(args));
  ipcMain.handle('templates:save', (_e, args) => saveTemplate(args));
  ipcMain.handle('matrices:list', (_e, args) => listMatrixRows(args));
  ipcMain.handle('matrices:replace', (_e, args) => replaceMatrixRows(args));
  ipcMain.handle('matrices:upsert', (_e, args) => upsertMatrixRow(args));
  ipcMain.handle('matrices:remove', (_e, id) => deleteMatrixRow(id));
  ipcMain.handle('stats:get', (_e, args) => getStats(args));
  ipcMain.handle('system:data-root', () => getDataRoot());
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
