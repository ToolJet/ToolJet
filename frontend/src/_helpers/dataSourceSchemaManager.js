import Ajv2020 from 'ajv';

const ajvOptions = {
  useDefaults: true,
  strict: false,
  allErrors: true,
  removeAdditional: false,
  // We disable meta-schema validation to avoid the schema being validated
  // against the official 2020-12 standard in ways that conflict with custom keywords.
  validateSchema: false,
  coerceTypes: true,
};

export default class DataSourceSchemaManager {
  constructor(schema) {
    this.schema = schema;
    this.ajv = new Ajv2020(ajvOptions);
    this.validate = this.ajv.compile(this.schema);
  }

  validateData(options) {
    const data = this._convertDataSourceOptionsToData(options);
    const valid = this.validate(data);
    if (!valid) {
      return { valid: false, errors: this.validate.errors };
    }
    return { valid: true, errors: [] };
  }

  validateDataForProperty(property, fieldValue) {

    const { errors } = this.validateData({ [property]: { value: fieldValue} });
    console.log('error: ', errors);
    
    const propertyErrors = errors?.filter(error => 
      // Check for required field errors
      (error.keyword === 'required' && error.params.missingProperty === property) ||
      // Check for datatype errors
      (error.keyword === 'type' && error.dataPath === `.${property}`) ||
      // Check for other validation errors on this property
      error.instancePath === `/${property}`
    );
  
    const errorsMessages = propertyErrors
      ?.map(error => error.message)
      ?.join(', ');
  
    return { valid: errorsMessages.length === 0, errors: errorsMessages };
  }

  getDefaults(options = {}) {
    const dataWithDefaults = { ...this._convertDataSourceOptionsToData(options) };

    // AJV does not support defaults with conditional schemas
    // https://ajv.js.org/guide/modifying-data.html#assigning-defaults
    // Create a schema without conditional properties for default value assignment
    const schemaWithoutConditionals = {
      type: this.schema.type,
      properties: { ...this.schema.properties },
    };

    // Compile the schema without conditionals to fill in default values
    const ajvForDefaults = new Ajv2020(ajvOptions);
    const applyDefaults = ajvForDefaults.compile(schemaWithoutConditionals);
    applyDefaults(dataWithDefaults);

    const encryptedProperties = this.getEncryptedProperties();

    // Combine the data with defaults and set encrypted fields to null
    const combinedData = {
      ...dataWithDefaults,
      ...Object.fromEntries(encryptedProperties.map((key) => [key, null])),
    };

    return Object.entries(combinedData).reduce((result, [key, value]) => {
      result[key] = {
        value: value,
        encrypted: encryptedProperties.includes(key),
      };
      return result;
    }, {});
  }

  getEncryptedProperties() {
    return this.schema['tj:encrypted'] || [];
  }

  getSourceMetadata() {
    const { name, kind, type } = this.schema['tj:source'];

    if (!name || !kind || !type) {
      throw new Error('Schema is missing required source metadata');
    }

    return {
      name,
      kind,
      type,
      options: this._getOptionsMetadata(),
      // Can remove exposed variables?
      exposedVariables: {
        isLoading: false,
        data: {},
        rawData: {},
      },
    };
  }

  _convertDataSourceOptionsToData(options) {
    return Object.entries(options).reduce((result, [key, { value }]) => {
      // Skip empty string values
      if (value !== '' && value !== null && value !== undefined) {
        result[key] = value;
      }
      return result;
    }, {});
  }

  _getOptionsMetadata() {
    const options = {};
    const properties = this.schema.properties || {};

    for (const [key, value] of Object.entries(properties)) {
      options[key] = { type: value.type };
      if (value.encrypted) {
        options[key].encrypted = true;
      }
    }

    return options;
  }
}
