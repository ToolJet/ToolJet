import {
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Logger } from '@nestjs/common';
import Ajv from 'ajv';
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
    return null;
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
  return null;
};

@ValidatorConstraint({ name: 'validateTooljetDatabase', async: false })
export class ValidateTooljetDatabaseConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const schemaName = 'tooljet_database';

    try {
      const latestVersion = getLatestSchemaVersion(schemaName);
      if (!latestVersion) {
        logger.error(`No schema version found for ${schemaName}`);
        return false;
      }

      const schema = loadSchema(latestVersion, schemaName);
      if (!schema) {
        logger.error(`Failed to load schema for version ${latestVersion}`);
        return false;
      }

      const validate = ajv.compile(schema);
      const isValid = validate(value);

      if (!isValid) {
        logger.error('Validation errors:', JSON.stringify(validate.errors));
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in ValidateTooljetDatabase:', error);
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'ToolJet Database is not valid. Please ensure it matches the expected format.';
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
