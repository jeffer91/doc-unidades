export type PeriodContext={
  id:number;
  period_key:string;
  start_month:number;
  start_year:number;
  end_month:number;
  end_year:number;
  status:string;
};

export function samePeriod(a:PeriodContext|undefined|null,b:PeriodContext|undefined|null){
  return Boolean(a&&b&&a.id===b.id);
}
