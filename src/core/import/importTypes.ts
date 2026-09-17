export type StagingStatus='PENDING'|'VALID'|'INVALID';

export type StagingRow={
  batchId:string;
  rowNumber:number;
  data:Record<string,unknown>;
  status:StagingStatus;
  message?:string;
};

export type ImportResult={
  read:number;
  accepted:number;
  rejected:number;
  errors:string[];
};
