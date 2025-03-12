export interface SearchParamItem {
  value: string;
  useLike: boolean;
}

export type ConditionObject = {
  [key: string]: SearchParamItem | boolean | string | number;
};
