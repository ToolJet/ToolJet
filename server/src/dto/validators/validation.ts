import { versions } from './versions';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import Ajv from 'ajv';
const path = require('path');
const fs = require('fs');

const compareVersions = (version1: string, version2: string) => {
  const v1 = version1.split('.').map(Number);
  const v2 = version2.split('.').map(Number);
  for (let i = 0; i < v1.length; i++) {
    if (v1[i] > v2[i]) {
      return true;
    }
    if (v1[i] < v2[i]) {
      return false;
    }
  }
  return true;
};

const getSchemaFilePath = (version: string, schemaName: string) => {
  const schemaPath = path.resolve(__dirname, `schemas/${version}/${schemaName}.json`);
  const transformedSchemaPath = schemaPath.replace('/dist/', '/');
  if (fs.existsSync(transformedSchemaPath)) {
    return transformedSchemaPath;
  }
  return null;
};

const loadSchema = (filePath: string) => {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const getSchemaBasedOnAppVersion = async (version: string, schemaVersions: string[], schemaName: string) => {
  for (const schemaVersion of schemaVersions) {
    if (compareVersions(version, schemaVersion)) {
      const schemaFilePath = getSchemaFilePath(version, schemaName);
      if (schemaFilePath) {
        return loadSchema(schemaFilePath);
      }
      return null;
    }
  }
};

const jsonValidator = (schema: Record<string, any>, data: Record<string, any>) => {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);
  validate(data);
  return validate.errors;
};

export const customValidator = async (
  data: Record<string, any>,
  schemaName: string,
  version: string
): Promise<Record<string, any>[]> => {
  const schemaVersions = versions[schemaName];
  const schema = await getSchemaBasedOnAppVersion(version, schemaVersions, schemaName);
  if (!schema) return [];
  const errors = jsonValidator(schema, data);
  return errors || [];
};

@ValidatorConstraint({ name: 'jsonSchemaValidator', async: true })
export class JsonSchemaValidator implements ValidatorConstraintInterface {
  async validate(object: any, args: ValidationArguments): Promise<boolean> {
    const schemaName = args.constraints[0];
    const version = args.constraints[1];
    const data = args.object;
    const errors = await customValidator(data, schemaName, version);
    args.constraints[2] = errors;
    return errors.length === 0;
  }

  defaultMessage(args: ValidationArguments) {
    const errors: any[] = args.constraints[2];
    const errorMessage = errors.map((error) => {
      return `Path: ${error.instancePath}\n Error:${error.message}\n`;
    });
    if (errors.length > 0) {
      return errorMessage.join('\n');
    }
    return `Validation Failed`;
  }
}
