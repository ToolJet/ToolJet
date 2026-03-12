import { EncryptionService } from '@modules/encryption/service';
import { CredentialsService } from '@modules/encryption/services/credentials.service';
import { AppVersion } from '@entities/app_version.entity';
import { Organization } from '@entities/organization.entity';
import { EntityManager } from 'typeorm';
import { Credential } from '@entities/credential.entity';

export enum WHITE_LABELLING_SETTINGS {
  WHITE_LABEL_LOGO = 'WHITE_LABEL_LOGO',
  WHITE_LABEL_TEXT = 'WHITE_LABEL_TEXT',
  WHITE_LABEL_FAVICON = 'WHITE_LABEL_FAVICON',
}

export function addWait(milliseconds) {
  const date = Date.now();
  let currentDate;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

export class MigrationProgress {
  private progress = 0;
  constructor(
    private fileName: string,
    private totalCount: number
  ) {}

  show() {
    this.progress++;
    console.log(`${this.fileName} Progress ${Math.round((this.progress / this.totalCount) * 100)} %`);
  }
}

export const updateCurrentEnvironmentId = async (manager: EntityManager, migrationName = '') => {
  const organizations = await manager.find(Organization, {
    select: ['id', 'appEnvironments'],
    relations: ['appEnvironments'],
  });

  const migrationProgress = new MigrationProgress(migrationName, organizations.length);

  for (const organization of organizations) {
    const productionEnvironment = organization.appEnvironments.find((appEnvironment) => appEnvironment.isDefault);
    const developmentEnvironment = organization.appEnvironments.find((appEnvironment) => appEnvironment.priority === 1);
    const apps = await manager.query('select id, current_version_id from apps where organization_id = $1', [
      organization.id,
    ]);

    for (const { current_version_id, id } of apps) {
      const appVersions = await manager.query('select id from app_versions where app_id = $1', [id]);
      for (const appVersion of appVersions) {
        console.log('Updating app version =>', appVersion.id);
        let envToUpdate = developmentEnvironment.id;

        if (current_version_id && current_version_id === appVersion.id) {
          envToUpdate = productionEnvironment.id;
        }
        await manager.update(
          AppVersion,
          { id: appVersion.id },
          {
            currentEnvironmentId: envToUpdate,
          }
        );
      }
    }
    migrationProgress.show();
  }
};

function convertToArrayOfKeyValuePairs(options): Array<object> {
  if (!options) return;
  return Object.keys(options).map((key) => {
    return {
      key: key,
      value: options[key]['value'],
      encrypted: options[key]['encrypted'],
      credential_id: options[key]['credential_id'],
    };
  });
}

export async function filterEncryptedFromOptions(
  options: Array<object>,
  encryptionService: EncryptionService,
  credentialService?: CredentialsService,
  copyEncryptedValues = false,
  entityManager?: EntityManager
) {
  const kvOptions = convertToArrayOfKeyValuePairs(options);

  if (!kvOptions) return;

  const parsedOptions = {};

  for (const option of kvOptions) {
    if (option['encrypted']) {
      const value = copyEncryptedValues ? await credentialService.getValue(option['credential_id']) : '';
      const credential = await createCredential(value, encryptionService, entityManager);

      parsedOptions[option['key']] = {
        credential_id: credential.id,
        encrypted: option['encrypted'],
      };
    } else {
      parsedOptions[option['key']] = {
        value: option['value'],
        encrypted: false,
      };
    }
  }

  return parsedOptions;
}

async function createCredential(
  value: string,
  encryptionService: EncryptionService,
  entityManager: EntityManager
): Promise<Credential> {
  const credentialRepository = entityManager.getRepository(Credential);
  const newCredential = credentialRepository.create({
    valueCiphertext: await encryptionService.encryptColumnValue('credentials', 'value', value),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const credential = await credentialRepository.save(newCredential);
  return credential;
}

export const processDataInBatches = async <T>(
  entityManager: EntityManager,
  getData: (entityManager: EntityManager, skip: number, take: number) => Promise<T[]>,
  processBatch: (entityManager: EntityManager, data: T[]) => Promise<void>,
  batchSize = 1000
): Promise<void> => {
  let skip = 0;
  let data: T[];

  do {
    data = await getData(entityManager, skip, batchSize);
    skip += batchSize;

    if (data.length > 0) {
      await processBatch(entityManager, data);
    }
  } while (data.length === batchSize);
};

/**
 * Deletes app history entries for affected app versions when a migration
 * modifies the structure of components, pages, queries, or global settings.
 * This prevents corruption when users try to restore from incompatible history.
 *
 * @param entityManager - TypeORM entity manager
 * @param options - Object containing either appVersionIds or componentIds
 * @param migrationName - Name of the migration for logging purposes
 */
export const deleteAppHistoryForStructuralMigration = async (
  entityManager: EntityManager,
  options: {
    appVersionIds?: string[];
    componentIds?: string[];
  },
  migrationName = ''
): Promise<void> => {
  console.log(`[${migrationName}] Starting app history cleanup for structural migration`);

  try {
    let appVersionIds = options.appVersionIds;

    // If componentIds are provided but not appVersionIds, get appVersionIds from components
    if (!appVersionIds && options.componentIds && options.componentIds.length > 0) {
      console.log(`[${migrationName}] Resolving app version IDs from ${options.componentIds.length} component IDs`);

      // Use raw query for better performance with large datasets
      const result = await entityManager.query(
        `
        SELECT DISTINCT p.app_version_id
        FROM components c
        INNER JOIN pages p ON c.page_id = p.id
        WHERE c.id = ANY($1)
        `,
        [options.componentIds]
      );

      appVersionIds = result.map((row: any) => row.app_version_id);
      console.log(`[${migrationName}] Found ${appVersionIds.length} app versions from components`);
    }

    if (!appVersionIds || appVersionIds.length === 0) {
      console.log(`[${migrationName}] No app versions to clean up history for`);
      return;
    }

    // Use raw query for better performance when deleting large amounts of data
    // Process in batches to avoid query timeout and memory issues
    const batchSize = 1000;
    let totalDeleted = 0;

    for (let i = 0; i < appVersionIds.length; i += batchSize) {
      const batch = appVersionIds.slice(i, i + batchSize);

      const result = await entityManager.query(
        `
        DELETE FROM app_history 
        WHERE app_version_id = ANY($1)
        `,
        [batch]
      );

      const deleted = result[1] || 0; // PostgreSQL returns [query result, affected rows]
      totalDeleted += deleted;

      console.log(`[${migrationName}] Batch ${Math.floor(i / batchSize) + 1}: Deleted ${deleted} history entries`);
    }

    console.log(
      `[${migrationName}] Completed: Deleted ${totalDeleted} app history entries for ${appVersionIds.length} app versions`
    );
  } catch (error) {
    console.error(`[${migrationName}] Failed to delete app history:`, error);
    throw error;
  }
};
