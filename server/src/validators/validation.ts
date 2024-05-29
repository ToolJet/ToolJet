import { versions as appImportVersions } from 'src/validators/app_import/versions';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import Ajv from 'ajv';

const jsonSchemas = {
  app_import: appImportVersions,
};

const compareVersions = (version1, version2) => {
  const v1 = version1.split('.').map(Number);
  const v2 = version2.split('.').map(Number);
  for (let i = 0; i < v1.length; i++) {
    if (v1[i] > v2[i]) {
      return 1;
    }
    if (v1[i] < v2[i]) {
      return -1;
    }
  }
  return 1;
};

const getSchemaBasedOnVersion = async (version, schemaVersions) => {
  let schema;
  for (const schemaVersion of schemaVersions) {
    if (compareVersions(version, schemaVersion.value) === 1) {
      return await schemaVersion.schema;
    }
  }
  return schema;
};

const jsonValidator = (schema, data) => {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  validate(data);
  return validate.errors;
};

export const customValidator = async (data: any, schemaName: any, version: any): Promise<any> => {
  const schemaVersions = jsonSchemas[schemaName];
  const schema = await getSchemaBasedOnVersion(version, schemaVersions);
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
