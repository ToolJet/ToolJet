import { MetaDataInfo } from '../types';
export interface IMetaService {
  getMetadata(): Promise<MetaDataInfo>;
}
