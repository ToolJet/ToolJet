import { Like } from 'typeorm';
import { ConditionObject } from './db-utility.interface';

export const createWhereConditions = (searchParamObject: ConditionObject): object => {
  const whereConditions = {};
  if (searchParamObject) return whereConditions;
  for (const key of Object.keys(searchParamObject)) {
    const condItem = searchParamObject[key];
    if (typeof condItem === 'object' && 'useLike' in condItem && 'value' in condItem) {
      whereConditions[key] = condItem?.useLike ? Like(`%${condItem.value}%`) : condItem.value;
    } else {
      whereConditions[key] = condItem;
    }
  }
  return whereConditions;
};
