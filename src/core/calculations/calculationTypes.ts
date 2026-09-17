export type CalculationOperation='count'|'count_unique'|'percentage_where'|'average'|'sum'|'join_unique';

export type CalculationTrace={
  operation:CalculationOperation;
  sourceMatrix:string;
  filter?:Record<string,unknown>;
  numerator?:number;
  denominator?:number;
  recordsUsed:number;
  result:unknown;
};
