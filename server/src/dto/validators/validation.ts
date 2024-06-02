import { versions as resourceImportVersions } from '@dto/validators/resource_import/versions';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import Ajv from 'ajv';

const jsonSchemas = {
  resource_import: resourceImportVersions,
};

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

const getSchemaBasedOnAppVersion = async (version: string, schemaVersions: Record<string, any>[]) => {
  for (const schemaVersion of schemaVersions) {
    if (compareVersions(version, schemaVersion.value)) {
      return await schemaVersion.schema;
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
  const schemaVersions = jsonSchemas[schemaName];
  const schema = await getSchemaBasedOnAppVersion(version, schemaVersions);
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
