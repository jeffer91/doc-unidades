export type ConnectorStatus='PENDING'|'RUNNING'|'COMPLETED'|'FAILED';

export type ConnectorRun={
  connectorId:string;
  sourceName?:string;
  status:ConnectorStatus;
  readRows:number;
  acceptedRows:number;
  rejectedRows:number;
  detail?:string;
};

export type ConnectorAdapter={
  id:string;
  label:string;
  available():Promise<boolean>;
  read(input:any):Promise<any[]>;
};
