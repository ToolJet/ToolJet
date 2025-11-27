import { AppModule } from '@modules/app/module';
import { NestFactory } from '@nestjs/core';
import { EntityManager } from 'typeorm';
import * as readline from 'readline';
import { DualKeyEncryptionService } from '../src/modules/encryption/rotation.service';
import { Credential } from '../src/entities/credential.entity';
import { OrgEnvironmentConstantValue } from '../src/entities/org_environment_constant_values.entity';
import { SSOConfigs } from '../src/entities/sso_config.entity';
import { OrganizationTjdbConfigurations } from '../src/entities/organization_tjdb_configurations.entity';
import { UserDetails } from '../src/entities/user_details.entity';
import { getEnvVars } from './database-config-utils';

// Load environment variables from .env file
const ENV_VARS = getEnvVars();
Object.keys(ENV_VARS).forEach((key) => {
  if (process.env[key] === undefined) {
    process.env[key] = ENV_VARS[key];
  }
});

/**
 * LOCKBOX_MASTER_KEY Rotation Script
 *
 * This script rotates the LOCKBOX_MASTER_KEY by decrypting all encrypted data
 * with the old key and re-encrypting it with a new key.
 *
 * Usage:
 *   npm run rotate:keys -- --dry-run  # Test without making changes
 *   npm run rotate:keys                # Perform actual rotation
 *
 * Environment Variables Required:
 *   OLD_LOCKBOX_MASTER_KEY   - Current/old master key (64 hex chars)
 *   LOCKBOX_MASTER_KEY       - New master key to rotate to (64 hex chars)
 *
 * IMPORTANT:
 *   - Stop the application before running this script
 *   - Backup the database before running
 *   - Test with --dry-run first in staging
 *   - After rotation, remove OLD_LOCKBOX_MASTER_KEY from .env and restart
 */

class RotationProgress {
  private totalTables = 5;
  private completedTables = 0;
  private currentTable = '';
  private currentTableRows = 0;
  private currentTableTotal = 0;

  startTable(tableName: string, totalRows: number): void {
    this.currentTable = tableName;
    this.currentTableRows = 0;
    this.currentTableTotal = totalRows;
    console.log(`\n[${this.completedTables + 1}/${this.totalTables}] Processing ${tableName} (${totalRows} rows)...`);
  }

  incrementRow(): void {
    this.currentTableRows++;
    if (this.currentTableRows % 10 === 0 || this.currentTableRows === this.currentTableTotal) {
      const percent = this.currentTableTotal > 0 ? ((this.currentTableRows / this.currentTableTotal) * 100).toFixed(1) : '0.0';
      process.stdout.write(`\r  Progress: ${this.currentTableRows}/${this.currentTableTotal} (${percent}%)`);
    }
  }

  completeTable(): void {
    this.completedTables++;
    console.log(`\n  ✓ ${this.currentTable} completed`);
  }

  complete(): void {
    console.log(`\n✓ All ${this.totalTables} tables rotated successfully`);
  }
}

async function bootstrap() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     LOCKBOX_MASTER_KEY Rotation Script                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Parse command-line arguments
  const isDryRun = process.argv.includes('--dry-run');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE: No changes will be made\n');
  } else {
    console.log('⚠️  PRODUCTION MODE: Changes will be committed\n');
  }

  try {
    // Pre-flight checks
    console.log('Step 1: Pre-flight validation...');
    validateEnvironment();
    console.log('✓ Environment variables validated');

    // Test encryption keys
    const oldKey = process.env.OLD_LOCKBOX_MASTER_KEY!;
    const newKey = process.env.LOCKBOX_MASTER_KEY!;
    const dualKeyService = new DualKeyEncryptionService(oldKey, newKey);

    console.log('\nStep 2: Testing encryption keys...');
    await dualKeyService.testEncryptionCycle(oldKey, 'OLD_LOCKBOX_MASTER_KEY');
    console.log('✓ Old key validated');
    await dualKeyService.testEncryptionCycle(newKey, 'LOCKBOX_MASTER_KEY');
    console.log('✓ New key validated');

    const keyInfo = dualKeyService.getKeyInfo();
    if (!keyInfo.keysAreDifferent) {
      throw new Error('OLD and NEW keys are identical. Please provide different keys.');
    }
    console.log('✓ Keys are different');

    // Backup confirmation (skip in dry-run)
    if (!isDryRun) {
      console.log('\nStep 3: Backup confirmation...');
      await promptBackupConfirmation();
    } else {
      console.log('\nStep 3: Backup confirmation (skipped in dry-run)');
    }

    // Initialize NestJS application context
    console.log('\nStep 4: Connecting to database...');
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }), {
      logger: ['error', 'warn'],
    });
    const entityManager = nestApp.get(EntityManager);
    console.log('✓ Database connection established');

    // Start rotation
    console.log('\n' + '═'.repeat(60));
    console.log('Starting rotation process...');
    console.log('═'.repeat(60));

    const progress = new RotationProgress();
    const queryRunner = entityManager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Rotate all tables
      await rotateCredentials(queryRunner.manager, dualKeyService, progress, isDryRun);
      await rotateOrgConstants(queryRunner.manager, dualKeyService, progress, isDryRun);
      await rotateSSOConfigs(queryRunner.manager, dualKeyService, progress, isDryRun);
      await rotateTJDBConfigs(queryRunner.manager, dualKeyService, progress, isDryRun);
      await rotateUserDetails(queryRunner.manager, dualKeyService, progress, isDryRun);

      progress.complete();

      // Verify rotation
      if (!isDryRun) {
        console.log('\nStep 5: Verifying rotation...');
        await verifyRotation(queryRunner.manager, newKey);
        console.log('✓ Rotation verified successfully');
      }

      // Commit or rollback
      if (isDryRun) {
        console.log('\n🔍 DRY RUN: Rolling back all changes...');
        await queryRunner.rollbackTransaction();
        console.log('✓ Changes rolled back');
      } else {
        console.log('\nStep 6: Committing changes...');
        await queryRunner.commitTransaction();
        console.log('✓ Changes committed to database');
      }
    } catch (error) {
      console.error('\n❌ ERROR during rotation:', error.message);
      console.log('\nRolling back all changes...');
      await queryRunner.rollbackTransaction();
      console.log('✓ Changes rolled back');
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Cleanup
    await nestApp.close();

    // Success message
    console.log('\n' + '═'.repeat(60));
    if (isDryRun) {
      console.log('✓ DRY RUN COMPLETED SUCCESSFULLY');
      console.log('\nNo changes were made. Run without --dry-run to perform rotation.');
    } else {
      console.log('✓ ROTATION COMPLETED SUCCESSFULLY');
      console.log('\n⚠️  IMPORTANT NEXT STEPS:');
      console.log('1. Update your .env file:');
      console.log('   - Remove OLD_LOCKBOX_MASTER_KEY (no longer needed)');
      console.log('   - Keep LOCKBOX_MASTER_KEY as is (already the new key)');
      console.log('2. Restart your application');
    }
    console.log('═'.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ROTATION FAILED:', error.message);
    console.error('\nThe database has not been modified.');
    process.exit(1);
  }
}

function validateEnvironment(): void {
  if (!process.env.OLD_LOCKBOX_MASTER_KEY) {
    throw new Error('OLD_LOCKBOX_MASTER_KEY environment variable is not set');
  }

  if (!process.env.LOCKBOX_MASTER_KEY) {
    throw new Error('LOCKBOX_MASTER_KEY environment variable is not set');
  }

  // Validate format (64 hex characters)
  const hexRegex = /^[0-9a-fA-F]{64}$/;

  if (!hexRegex.test(process.env.OLD_LOCKBOX_MASTER_KEY)) {
    throw new Error('OLD_LOCKBOX_MASTER_KEY must be exactly 64 hexadecimal characters (0-9, a-f, A-F)');
  }

  if (!hexRegex.test(process.env.LOCKBOX_MASTER_KEY)) {
    throw new Error('LOCKBOX_MASTER_KEY must be exactly 64 hexadecimal characters (0-9, a-f, A-F)');
  }

  // Ensure keys are different
  if (process.env.OLD_LOCKBOX_MASTER_KEY === process.env.LOCKBOX_MASTER_KEY) {
    throw new Error('LOCKBOX_MASTER_KEY must be different from OLD_LOCKBOX_MASTER_KEY');
  }
}

async function promptBackupConfirmation(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question(
      '⚠️  Have you backed up the database? This operation cannot be undone. (yes/no): ',
      (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'yes') {
          console.log('✓ Backup confirmed');
          resolve();
        } else {
          reject(new Error('Database backup not confirmed. Aborting rotation.'));
        }
      }
    );
  });
}

// Table 1: credentials
async function rotateCredentials(
  entityManager: EntityManager,
  dualKeyService: DualKeyEncryptionService,
  progress: RotationProgress,
  dryRun: boolean
): Promise<void> {
  const credentials = await entityManager.find(Credential);
  progress.startTable('credentials', credentials.length);

  for (const cred of credentials) {
    if (!cred.valueCiphertext) {
      progress.incrementRow();
      continue; // Skip nulls
    }

    try {
      // Decrypt with old key
      const plainValue = await dualKeyService.decryptWithOldKey('credentials', 'value', cred.valueCiphertext);

      // Encrypt with new key
      const newCiphertext = await dualKeyService.encryptWithNewKey('credentials', 'value', plainValue);

      if (!dryRun) {
        cred.valueCiphertext = newCiphertext;
        await entityManager.save(cred);
      }

      progress.incrementRow();
    } catch (error) {
      throw new Error(`Failed to rotate credential ${cred.id}: ${error.message}`);
    }
  }

  progress.completeTable();
}

// Table 2: org_environment_constant_values
async function rotateOrgConstants(
  entityManager: EntityManager,
  dualKeyService: DualKeyEncryptionService,
  progress: RotationProgress,
  dryRun: boolean
): Promise<void> {
  const constants = await entityManager.find(OrgEnvironmentConstantValue, {
    relations: ['organizationConstant'],
  });
  progress.startTable('org_environment_constant_values', constants.length);

  for (const constant of constants) {
    if (!constant.value) {
      progress.incrementRow();
      continue;
    }

    try {
      const orgId = constant.organizationConstant.organizationId;

      // Decrypt with old key (using orgId as column param)
      const plainValue = await dualKeyService.decryptWithOldKey('org_environment_constant_values', orgId, constant.value);

      // Encrypt with new key
      const newCiphertext = await dualKeyService.encryptWithNewKey('org_environment_constant_values', orgId, plainValue);

      if (!dryRun) {
        constant.value = newCiphertext;
        await entityManager.save(constant);
      }

      progress.incrementRow();
    } catch (error) {
      throw new Error(`Failed to rotate org constant ${constant.id}: ${error.message}`);
    }
  }

  progress.completeTable();
}

// Table 3: sso_configs
async function rotateSSOConfigs(
  entityManager: EntityManager,
  dualKeyService: DualKeyEncryptionService,
  progress: RotationProgress,
  dryRun: boolean
): Promise<void> {
  const ssoConfigs = await entityManager.find(SSOConfigs);
  progress.startTable('sso_configs', ssoConfigs.length);

  for (const config of ssoConfigs) {
    if (!config.configs) {
      progress.incrementRow();
      continue;
    }

    try {
      const configsObj = typeof config.configs === 'string' ? JSON.parse(config.configs) : config.configs;
      let modified = false;

      // Find all fields containing "secret" (case-insensitive)
      for (const [key, value] of Object.entries(configsObj)) {
        if (key.toLowerCase().includes('secret') && typeof value === 'string' && value.length > 0) {
          try {
            // Decrypt with old key
            const plainValue = await dualKeyService.decryptWithOldKey('ssoConfigs', key, value);

            // Encrypt with new key
            const newCiphertext = await dualKeyService.encryptWithNewKey('ssoConfigs', key, plainValue);

            configsObj[key] = newCiphertext;
            modified = true;
          } catch (error) {
            // If decryption fails, the field might not be encrypted or already using new key
            console.warn(`  ⚠️  Could not decrypt SSO config ${config.id} field "${key}": ${error.message}`);
          }
        }
      }

      if (modified && !dryRun) {
        config.configs = configsObj;
        await entityManager.save(config);
      }

      progress.incrementRow();
    } catch (error) {
      throw new Error(`Failed to rotate SSO config ${config.id}: ${error.message}`);
    }
  }

  progress.completeTable();
}

// Table 4: organization_tjdb_configurations
async function rotateTJDBConfigs(
  entityManager: EntityManager,
  dualKeyService: DualKeyEncryptionService,
  progress: RotationProgress,
  dryRun: boolean
): Promise<void> {
  const configs = await entityManager.find(OrganizationTjdbConfigurations);
  progress.startTable('organization_tjdb_configurations', configs.length);

  for (const config of configs) {
    if (!config.pgPassword) {
      progress.incrementRow();
      continue;
    }

    try {
      // Decrypt with old key
      const plainPassword = await dualKeyService.decryptWithOldKey(
        'organization_tjdb_configurations',
        'pg_password',
        config.pgPassword
      );

      // Encrypt with new key
      const newCiphertext = await dualKeyService.encryptWithNewKey(
        'organization_tjdb_configurations',
        'pg_password',
        plainPassword
      );

      if (!dryRun) {
        config.pgPassword = newCiphertext;
        await entityManager.save(config);
      }

      progress.incrementRow();
    } catch (error) {
      throw new Error(`Failed to rotate TJDB config ${config.id}: ${error.message}`);
    }
  }

  progress.completeTable();
}

// Table 5: user_details
async function rotateUserDetails(
  entityManager: EntityManager,
  dualKeyService: DualKeyEncryptionService,
  progress: RotationProgress,
  dryRun: boolean
): Promise<void> {
  const userDetails = await entityManager.find(UserDetails);
  progress.startTable('user_details', userDetails.length);

  for (const detail of userDetails) {
    if (!detail.userMetadata) {
      progress.incrementRow();
      continue;
    }

    try {
      // Decrypt with old key
      const plainMetadata = await dualKeyService.decryptWithOldKey('user_details', 'userMetadata', detail.userMetadata);

      // Encrypt with new key
      const newCiphertext = await dualKeyService.encryptWithNewKey('user_details', 'userMetadata', plainMetadata);

      if (!dryRun) {
        detail.userMetadata = newCiphertext;
        await entityManager.save(detail);
      }

      progress.incrementRow();
    } catch (error) {
      throw new Error(`Failed to rotate user detail ${detail.id}: ${error.message}`);
    }
  }

  progress.completeTable();
}

async function verifyRotation(entityManager: EntityManager, newKey: string): Promise<void> {
  const testService = new DualKeyEncryptionService(newKey, newKey);

  // Test credentials
  const credential = await entityManager.findOne(Credential, { where: {} });
  if (credential?.valueCiphertext) {
    await testService.decryptWithOldKey('credentials', 'value', credential.valueCiphertext);
    console.log('  ✓ Credentials table verified');
  }

  // Test org constants
  const orgConstant = await entityManager.findOne(OrgEnvironmentConstantValue, {
    where: {},
    relations: ['organizationConstant'],
  });
  if (orgConstant?.value) {
    const orgId = orgConstant.organizationConstant.organizationId;
    await testService.decryptWithOldKey('org_environment_constant_values', orgId, orgConstant.value);
    console.log('  ✓ Organization constants table verified');
  }

  // Test SSO configs
  const ssoConfig = await entityManager.findOne(SSOConfigs, { where: {} });
  if (ssoConfig?.configs) {
    const configsObj = typeof ssoConfig.configs === 'string' ? JSON.parse(ssoConfig.configs) : ssoConfig.configs;
    for (const [key, value] of Object.entries(configsObj)) {
      if (key.toLowerCase().includes('secret') && typeof value === 'string' && value.length > 0) {
        await testService.decryptWithOldKey('ssoConfigs', key, value);
        break;
      }
    }
    console.log('  ✓ SSO configs table verified');
  }

  // Test TJDB configs
  const tjdbConfig = await entityManager.findOne(OrganizationTjdbConfigurations, { where: {} });
  if (tjdbConfig?.pgPassword) {
    await testService.decryptWithOldKey('organization_tjdb_configurations', 'pg_password', tjdbConfig.pgPassword);
    console.log('  ✓ TJDB configurations table verified');
  }

  // Test user details
  const userDetail = await entityManager.findOne(UserDetails, { where: {} });
  if (userDetail?.userMetadata) {
    await testService.decryptWithOldKey('user_details', 'userMetadata', userDetail.userMetadata);
    console.log('  ✓ User details table verified');
  }
}

// Run the script
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
