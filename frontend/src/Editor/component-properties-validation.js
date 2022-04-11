// eslint-disable-next-line import/no-unresolved
import { object, number, string, array, any, optional, assert } from 'superstruct';
import _ from 'lodash';

const generateSchemaFromValidationDefinition = (definition) => {
  let schema;

  switch (definition.type) {
    case 'string': {
      schema = string();
      break;
    }
    case 'number': {
      schema = number();
      break;
    }
    case 'array': {
      const elementSchema = generateSchemaFromValidationDefinition(definition.element ?? {});
      schema = array(elementSchema);
      break;
    }
    case 'object': {
      const obJectSchema = Object.fromEntries(
        Object.entries(definition.object ?? {}).map(([key, value]) => {
          const generatedSchema = generateSchemaFromValidationDefinition(value);
          return [key, generatedSchema];
        })
      );
      schema = object(obJectSchema);
      break;
    }
    default:
      schema = any();
  }

  return definition.required ? schema : optional(schema);
};

const validate = (value, schema) => {
  let valid = true;
  const errors = [];

  try {
    assert(value, schema);
  } catch (structError) {
    valid = false;
    errors.push(structError.message);
  }

  return [valid, errors];
};

export const validateProperties = (resolvedProperties, propertyDefinitions) => {
  let allErrors = [];
  const coercedProperties = Object.fromEntries(
    Object.entries(resolvedProperties ?? {}).map(([propertyName, value]) => {
      const validationDefinition = propertyDefinitions[propertyName]?.validation ?? {};
      const schema = generateSchemaFromValidationDefinition(validationDefinition);

      const [valid, errors] = validate(value, schema);

      allErrors = [
        ...allErrors,
        ...errors.map((message) => ({ property: propertyDefinitions[propertyName]?.displayName, message })),
      ];
      return [propertyName, valid ? value : validationDefinition.default];
    })
  );
  return [coercedProperties, allErrors];
};
