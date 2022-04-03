import { is, object, number, string, array } from 'superstruct';
import _ from 'lodash';

// const createSuperstructValidationObjectFromSchema = (schema) =>
//     Object.entries(schema).map((propertyName, validation) => ({}))

export const validateProperties = (resolvedProperties, propertyDefinitions) => {
  console.log('yepski');
  console.log({resolvedProperties, propertyDefinitions})
  console.log(Object.entries(resolvedProperties).map(([propertyName, value]) =>
    [value, propertyDefinitions[propertyName]?.validation]
  ))
};
