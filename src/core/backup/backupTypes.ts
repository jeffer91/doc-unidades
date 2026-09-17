export type BackupManifest={
  format:'DOC-UNIDADES-BACKUP';
  version:1;
  createdAt:string;
  databaseFile:string;
  folders:string[];
};

export const BACKUP_FOLDERS=['data','archivos','plantillas','exportaciones'] as const;
