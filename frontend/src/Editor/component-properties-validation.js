const { type, number, string, array, any, optional, assert, boolean, union, size, pattern } = require('superstruct');
import _ from 'lodash';

const generateSchemaFromValidationDefinition = (definition) => {
  let schema;

  switch (definition?.type ?? '') {
    case 'string': {
      schema = string();
      if (definition?.pattern) schema = pattern(schema, RegExp(definition.pattern, 'i'));
      break;
    }
    case 'number': {
      schema = number();
      break;
    }
    case 'boolean': {
      schema = boolean();
      break;
    }
    case 'union': {
      schema = union(definition.schemas?.map((subSchema) => generateSchemaFromValidationDefinition(subSchema)));
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
      schema = type(obJectSchema);
      break;
    }
    default:
      schema = any();
  }

  if (definition?.size) {
    const minSize = definition.size?.min ?? 0;
    const maxSize = definition.size?.max ?? Infinity;
    schema = size(schema, minSize, maxSize);
  }

  return definition.optional ? optional(schema) : schema;
};

const validate = (value, schema, _defaultValue) => {
  let valid = true;
  const errors = [];

  try {
    assert(value, schema);
  } catch (structError) {
    valid = false;
    errors.push(structError.message);
  }

  if (_.isUndefined(value)) {
    valid = false;
    errors.push("Received 'undefined'");
  }

  return [valid, errors];
};

export const validateProperties = (resolvedProperties, propertyDefinitions) => {
  let allErrors = [];
  const coercedProperties = Object.fromEntries(
    Object.entries(resolvedProperties ?? {}).map(([propertyName, value]) => {
      const validationDefinition = propertyDefinitions[propertyName]?.validation?.schema;
      const defaultValue = propertyDefinitions[propertyName]?.validation?.defaultValue;

      const schema = _.isUndefined(validationDefinition)
        ? any()
        : generateSchemaFromValidationDefinition(validationDefinition);

      const [_valid, errors] = propertyName ? validate(value, schema, defaultValue) : [true, []];

      if (!_.isUndefined(propertyName)) {
        allErrors = [
          ...allErrors,
          ...errors.map((message) => ({ property: propertyDefinitions[propertyName]?.displayName, message })),
        ];
      }

      // return [propertyName, _valid ? value : defaultValue];
      // uncomment the above line and comment the below line to enable coercing to default values
      return [propertyName, value];
    })
  );
  return [coercedProperties, allErrors];
};

export const validateProperty = (resolvedProperty, propertyDefinitions, paramName) => {
  const validationDefinition = propertyDefinitions?.validation?.schema;
  const value = resolvedProperty?.[paramName];
  const defaultValue = propertyDefinitions?.validation?.defaultValue;

  const schema = _.isUndefined(validationDefinition)
    ? any()
    : generateSchemaFromValidationDefinition(validationDefinition);
  const [_valid, errors] = paramName ? validate(value, schema, defaultValue) : [true, []];
  return [_valid, errors];
};
