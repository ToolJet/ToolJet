import { EntityManager } from 'typeorm';
import { LIMIT_TYPE } from '@modules/users/constants/lifecycle';
import LicenseBase from '../configs/LicenseBase';
import { User } from '@entities/user.entity';

export interface ILicenseWorkflowsService {
  getWorkflowLimit(params: { limitFor: string; workspaceId?: string }): Promise<any>;
}

export interface ILicenseUserService {
  getUserLimitsByType(type: LIMIT_TYPE, organizationId: string): Promise<any>;
  validateUser(manager: EntityManager, organizationId: string): Promise<void>;
}

export abstract class LicenseTermsService {
  constructor(protected readonly licenseInitService: LicenseInitService) {}
  abstract getLicenseTermsInstance(type: any): Promise<any>;
  abstract getLicenseTerms(type: any, organizationId: string): Promise<any>;
  abstract getOrganizationLicense(organizationId: string): Promise<any>;
}

export interface ILicenseOrganizationService {
  validateOrganization(manager: EntityManager, organizationId: string): Promise<void>;
  limit(organizationId: string, manager?: EntityManager): Promise<any>;
}

export abstract class LicenseInitService {
  abstract initForMigration(manager?: EntityManager): Promise<{ isValid: boolean }>;
  abstract init(): Promise<void>;
  abstract initForCloud(): Promise<void>;
  abstract getLicenseFieldValue(type: any, licenseInstance: LicenseBase): any;
}

export interface ILicenseDecryptService {
  decrypt(toDecrypt: string): any;
}

export interface ILicenseCountsService {
  getUserIdWithEditPermission(organizationId: string, manager: EntityManager): Promise<any>;
  fetchTotalEditorCount(organizationId: string, manager: EntityManager): Promise<number>;
  fetchTotalViewerEditorCount(
    organizationId: string,
    manager: EntityManager
  ): Promise<{ editor: number; viewer: number }>;
  fetchTotalSuperadminCount(manager: EntityManager): Promise<number>;
  getUsersCount(organizationId: string, isOnlyActive?: boolean, manager?: EntityManager): Promise<number>;
  fetchTotalAppCount(organizationId: string, manager: EntityManager): Promise<number>;
  fetchTotalWorkflowsCount(workspaceId: string, manager: EntityManager): Promise<number>;
  organizationsCount(manager?: EntityManager): Promise<number>;
  fetchTotalAppCount(organizationId: string, manager: EntityManager): Promise<number>;
}

export interface ILicenseAppsService {
  getAppsLimit(organizationId: string): Promise<any>;
}

export interface ILicenseService {
  getLicense(): Promise<any>;
  getFeatureAccess(organizationId: string): Promise<any>;
  getDomains(organizationId: string): Promise<{ domains: any; licenseStatus: any }>;
  getLicenseTerms(organizationId: string): Promise<{ terms: any }>;
  updateLicense(dto: any, user: User): Promise<void>;
  plans(): Promise<{ plans: any }>;
}
