import { EntityManager } from 'typeorm';
import { LIMIT_TYPE } from '@modules/users/constants/lifecycle';

export interface ILicenseWorkflowsService {
  getWorkflowLimit(params: { limitFor: string; workspaceId?: string }): Promise<any>;
}

export interface ILicenseUserService {
  getUserLimitsByType(type: LIMIT_TYPE): Promise<any>;
  validateUser(manager: EntityManager): Promise<void>;
}

export abstract class LicenseTermsService {
  constructor(protected readonly licenseInitService: LicenseInitService) {}
  abstract getLicenseTerms(type?: any): Promise<any>;
}

export interface ILicenseOrganizationService {
  validateOrganization(manager: EntityManager): Promise<void>;
  limit(manager?: EntityManager): Promise<any>;
}

export abstract class LicenseInitService {
  abstract initForMigration(manager?: EntityManager): Promise<{ isValid: boolean }>;
  abstract init(): Promise<void>;
  abstract getLicenseFieldValue(type: any): any;
}

export interface ILicenseDecryptService {
  decrypt(toDecrypt: string): any;
}

export interface ILicenseCountsService {
  getUserIdWithEditPermission(manager: EntityManager): Promise<any>;
  fetchTotalEditorCount(manager: EntityManager): Promise<number>;
  fetchTotalViewerEditorCount(manager: EntityManager): Promise<{ editor: number; viewer: number }>;
  fetchTotalSuperadminCount(manager: EntityManager): Promise<number>;
  getUsersCount(isOnlyActive?: boolean, manager?: EntityManager): Promise<number>;
  fetchTotalAppCount(manager: EntityManager): Promise<number>;
  fetchTotalWorkflowsCount(workspaceId: string, manager: EntityManager): Promise<number>;
  organizationsCount(manager?: EntityManager): Promise<number>;
}

export interface ILicenseAppsService {
  getAppsLimit(): Promise<any>;
}

export interface ILicenseService {
  getLicense(): Promise<any>;
  getFeatureAccess(): Promise<any>;
  getDomains(): Promise<{ domains: any; licenseStatus: any }>;
  getLicenseTerms(): Promise<{ terms: any }>;
  updateLicense(dto: any): Promise<void>;
  plans(): Promise<{ plans: any }>;
}
