import { Metadata } from '@entities/metadata.entity';
import { MetadataType } from '@modules/meta/types';
import { EntityManager } from 'typeorm';
import { FinishInstallationParams } from '@modules/meta/types';
export interface IMetaUtilService {
  getMetaData(): Promise<Metadata>;
  finishOnboarding(params: object): Promise<void> | void;
  saveMetadataToDB(metadataDto: MetadataType): Promise<void>;
  fetchMetadata(): Promise<any>;
  finishInstallation(params: FinishInstallationParams): Promise<any>;
  sendTelemetryData(metadata: Metadata): Promise<any>;
  fetchDatasourcesByKindCount(manager: EntityManager): Promise<Record<string, number>>;
}
