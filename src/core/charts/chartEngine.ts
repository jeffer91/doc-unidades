import type { ChartType } from '../types/model';

export type ChartRecommendationInput={
  categories:number;
  labelsLong?:boolean;
  timeSeries?:boolean;
  percentages?:boolean;
  totalsOneHundred?:boolean;
  stacked?:boolean;
};

export function recommendChartType(input:ChartRecommendationInput):ChartType|null{
  if(input.timeSeries)return 'line';
  if(input.stacked)return 'stacked_bar';
  if(input.percentages&&input.totalsOneHundred&&input.categories>1&&input.categories<=5)return 'pie';
  if(input.categories>0&&input.labelsLong)return 'horizontal_bar';
  if(input.categories>1)return 'bar';
  return null;
}

export function shouldUseChart(input:ChartRecommendationInput){
  return recommendChartType(input)!==null;
}
