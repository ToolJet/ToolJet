import {
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Logger } from '@nestjs/common';
import Ajv, { ErrorObject } from 'ajv';
import * as path from 'path';
import * as fs from 'fs';
import { ImportResourcesDto } from '@dto/import-resources.dto';

const ajv = new Ajv({ allErrors: true, coerceTypes: true });
const logger = new Logger('TooljetDatabaseSchemaValidator');

const getSchemaDirectory = (): string => {
  const isProduction = process.env.NODE_ENV == 'production';
  const buildExists = __dirname.includes('dist');

  const baseDir = isProduction && buildExists ? path.join(__dirname) : __dirname.replace('/dist/', '/');

  return path.join(baseDir, 'schemas');
};

export const getLatestSchemaVersion = (schemaName: string): string | null => {
  const schemasDir = getSchemaDirectory();

  if (!fs.existsSync(schemasDir)) {
    console.error(`Schemas directory not found: ${schemasDir}`);
    throw new Error('ToolJet database schema validation: Schema directory were not found');
  }

  const versions = fs
    .readdirSync(schemasDir)
    .filter((dir) => fs.statSync(path.join(schemasDir, dir)).isDirectory())
    .filter((dir) => fs.existsSync(path.join(schemasDir, dir, `${schemaName}.json`)))
    .sort((a, b) => {
      const versionA = a.split('.').map(Number);
      const versionB = b.split('.').map(Number);
      for (let i = 0; i < versionA.length; i++) {
        if (versionA[i] !== versionB[i]) {
          return versionB[i] - versionA[i];
        }
      }
      return 0;
    });

  return versions[0] || null;
};

export const loadSchema = (version: string, schemaName: string): Record<string, any> | null => {
  const schemasDir = getSchemaDirectory();
  const schemaPath = path.join(schemasDir, version, `${schemaName}.json`);

  if (fs.existsSync(schemaPath)) {
    return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  }
  console.error(`Schema file not found: ${schemaPath}`);
  throw new Error(`ToolJet database schema validation: Schema file not found`);
};

const SCHEMA_NAME = 'tooljet_database';

function tooljetDatabaseSchemaErrors(value: unknown): ErrorObject[] {
  const latestVersion = getLatestSchemaVersion(SCHEMA_NAME);
  if (!latestVersion) {
    logger.error(`No schema version found for ${SCHEMA_NAME}`);
    throw new Error(`ToolJet database schema validation: Schema versions were not found`);
  }

  const schema = loadSchema(latestVersion, SCHEMA_NAME);
  if (!schema) {
    logger.error(`Failed to load schema for version ${latestVersion}`);
    throw new Error(`Failed to load ToolJet database validation schema for version ${latestVersion}`);
  }

  const validate = ajv.compile(schema);
  return validate(value) ? [] : (validate.errors ?? []);
}

/**
 * `data_type` carries an `enum` of the types ToolJet Database supports, so "unsupported column
 * type" is now the likeliest reason an import fails here. Naming the offending path is what makes
 * that recoverable - the generic fallback leaves the reason only in the server log.
 *
 * Descends into an array itself rather than validating one: the decorator is applied with
 * `each: true`, so class-validator runs `validate` per item but hands the message the whole array,
 * and validating that against a per-table schema only ever reports "must be object".
 */
function describeSchemaErrors(value: unknown): string {
  const tables = Array.isArray(value) ? value : [value];

  return tables
    .flatMap((table, index) =>
      tooljetDatabaseSchemaErrors(table).map((error) => {
        const allowed = error.params?.allowedValues as string[] | undefined;
        const location = error.instancePath || 'schema';
        const path = tables.length > 1 ? `table ${index} ${location}` : location;
        return allowed ? `${path} ${error.message} (${allowed.join(', ')})` : `${path} ${error.message}`;
      })
    )
    .slice(0, 5)
    .join('; ');
}

@ValidatorConstraint({ name: 'validateTooljetDatabase', async: false })
export class ValidateTooljetDatabaseConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    try {
      const errors = tooljetDatabaseSchemaErrors(value);
      if (errors.length) {
        logger.error('Validation errors:', JSON.stringify(errors));
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in ValidateTooljetDatabase:', error);
      throw error;
    }
  }

  /**
   * Revalidated rather than carried over from `validate`: class-validator reuses one constraint
   * instance across requests, so stashing the errors on `this` would let concurrent imports report
   * each other's failures.
   */
  defaultMessage(args: ValidationArguments) {
    const generic = 'ToolJet Database is not valid. Please ensure it matches the expected format.';

    try {
      const detail = describeSchemaErrors(args.value);
      return detail ? `ToolJet Database is not valid: ${detail}` : generic;
    } catch {
      return generic;
    }
  }
}

export function ValidateTooljetDatabaseSchema(validationOptions?: ValidationOptions) {
  return function (object: ImportResourcesDto, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidateTooljetDatabaseConstraint,
    });
  };
}

export function ValidateTooljetDatabaseImportSchema(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidateTooljetDatabaseConstraint,
    });
  };
}
