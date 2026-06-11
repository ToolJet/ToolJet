import { MetaDataInfo } from '../types';
export interface IMetadataController {
  getMetadata(): Promise<MetaDataInfo>;
}
