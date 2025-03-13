import { User } from '@entities/user.entity';
import { LicenseUpdateDto } from '../dto';
import { Terms } from './terms';
import { LIMIT_TYPE } from '@modules/users/constants/lifecycle';

export interface ILicenseController {
  /**
   * Retrieves the current license settings.
   * @returns A promise that resolves to the license settings with keys converted to snake_case.
   */
  getLicense(): Promise<any>;

  /**
   * Gets the feature access based on the current license.
   * @returns A promise that resolves to the Terms object.
   */
  getFeatureAccess(): Promise<Terms>;

  /**
   * Fetches the domains associated with the license.
   * @returns A promise that resolves to an object containing domains and license status.
   */
  getDomains(): Promise<{ domains: any; licenseStatus: any }>;

  /**
   * Retrieves the terms of the license.
   * @returns A promise that resolves to an object containing the license terms.
   */
  getLicenseTerms(): Promise<{ terms: Terms }>;

  /**
   * Updates the license settings.
   * @param licenseUpdateDto - The DTO containing the update information for the license.
   * @returns A promise that resolves when the license is updated.
   */
  updateLicense(licenseUpdateDto: LicenseUpdateDto): Promise<void>;
}

export interface ILicenseAppsController {
  /**
   * Retrieves the application limits based on the current license.
   * @returns The limit of applications allowed by the license.
   */
  getLimits(): any;
}

export interface IAuditLogLicenseController {
  /**
   * Retrieves audit logs for license terms.
   * @returns A promise that should resolve to the audit logs or void if no return value is needed.
   */
  getAuditLog(): Promise<void>;

  /**
   * Gets the maximum duration for which audit logs are kept.
   * @returns A promise that resolves to the maximum duration allowed for audit logs.
   */
  getMaxDuration(): Promise<any>;
}

export interface ILicenseOrganizationController {
  /**
   * Retrieves the organization limits based on the current license.
   * @returns A promise that resolves to the limits set for the organization.
   */
  getLimits(): Promise<any>;
}

/**
 * Interface for LicenseWorkflowsController
 */
export interface ILicenseWorkflowsController {
  /**
   * Get the workflow limits.
   * @param user - The user entity.
   * @param limitFor - The limit type (instance | workspace).
   * @returns {Promise<any>} The workflow limits.
   */
  getWorkflowLimit(user: User, limitFor: string): Promise<any>;
}

/**
 * Interface for LicenseUserController
 */
export interface ILicenseUserController {
  /**
   * Get the user limits based on the type.
   * @param type - The limit type.
   * @returns {Promise<any>} The user limits.
   */
  getUserLimits(type: LIMIT_TYPE): Promise<any>;
}

/**
 * Interface for LicensePlansController
 */
export interface ILicensePlansController {
  /**
   * Get the available license plans.
   * @returns {Promise<any>} The available license plans.
   */
  plans(): Promise<any>;
}

/**
 * Interface for LicenseAuditLogsController
 */
export interface ILicenseAuditLogsController {
  /**
   * Get the audit log license terms.
   * @returns {Promise<void>} The audit log license terms.
   */
  getAuditLog(): Promise<void>;

  /**
   * Get the maximum duration for audit logs.
   * @returns {Promise<any>} The maximum duration for audit logs.
   */
  getMaxDuration(): Promise<any>;
}

/**
 * Interface for LicenseAppsController
 */
export interface ILicenseAppsController {
  /**
   * Get the application limits.
   * @returns {any} The application limits.
   */
  getLimits(): any;
}
