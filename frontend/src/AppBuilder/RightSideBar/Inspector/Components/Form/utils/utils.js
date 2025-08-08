import React from 'react';
import WidgetIcon from '@/../assets/images/icons/widgets';
import { DATATYPE_TO_COMPONENT, JSON_DIFFERENCE, INPUT_COMPONENTS_FOR_FORM } from '../constants';
import { startCase, omit, uniqBy } from 'lodash';
import { getFieldDataFromComponent } from './fieldOperations';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';

export const buildOptions = (options = []) => {
  if (Array.isArray(options))
    return options
      .map((option, index) => {
        // Ignore non-primitive data types (objects or arrays)
        if (typeof option === 'object' && option !== null) {
          return null;
        }
        return {
          label: String(option),
          value: index,
          disable: { value: false },
          visible: { value: true },
          default: { value: false },
        };
      })
      .filter(Boolean);
};

export const ensureHandlebars = (value) => {
  if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
    return value; // Already has handlebars
  }
  return `{{${value}}}`;
};

// Helper function to check if a value is considered "true"
export const isTrueValue = (value) => {
  if (value === true) return true;
  if (typeof value === 'string') {
    const trimmedValue = value.trim().toLowerCase();
    // Check for "{{true}}" format or just "true"
    return trimmedValue === '{{true}}' || trimmedValue === 'true';
  }
  return false;
};

export const isPropertyFxControlled = (property) => {
  return property && typeof property === 'object' && property.fxActive === true;
};

export const isValidJSONObject = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
  } catch (e) {
    return false;
  }
};

export const getDataType = (value) => {
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return 'date';
    return 'string';
  }
  if (typeof value === 'object' && value !== null) return 'object';
  return typeof value;
};

export const buildFieldObject = (key, value, label, jsonDifferences) => {
  const dataType = getDataType(value);

  return {
    key,
    name: key,
    label: startCase(label) || startCase(key),
    value: dataType === 'number' || dataType === 'boolean' ? ensureHandlebars(value) : value,
    dataType,
    componentType: DATATYPE_TO_COMPONENT[dataType] || 'TextInput',
    mandatory: { value: false },
    selected: false,
    isCustomField: false,
    isNew: jsonDifferences.isNew.includes(key),
    isRemoved: jsonDifferences.isRemoved.includes(key),
    isExisting: jsonDifferences.isExisting.includes(key),
  };
};

export const parseDataAndBuildFields = (data, jsonDifferences = JSON_DIFFERENCE) => {
  const obj = data || {};
  const result = [];

  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedKeys = Object.keys(value);
      if (nestedKeys.length === 0) {
        return;
      }

      nestedKeys.forEach((nestedKey) => {
        const nestedValue = value[nestedKey];
        if (
          typeof nestedValue === 'object' &&
          nestedValue !== null &&
          !Array.isArray(nestedValue) &&
          Object.keys(nestedValue).length === 0
        ) {
          return;
        }

        result.push(buildFieldObject(`${key}.${nestedKey}`, nestedValue, nestedKey, jsonDifferences));
      });
    } else {
      result.push(buildFieldObject(key, value, key, jsonDifferences));
    }
  });

  return result;
};

export const findNextElementTop = (childComponents, currentLayout = 'desktop', componentsToBeIgnored = []) => {
  const defaultTop = 0;

  if (!childComponents || typeof childComponents !== 'object' || Object.keys(childComponents).length === 0) {
    return defaultTop;
  }

  try {
    let highestTop = -1;
    let lastComponent = null;

    Object.entries(childComponents).forEach(([componentId, component]) => {
      if (componentsToBeIgnored.includes(componentId)) {
        return;
      }

      const currentTop = component?.component?.layouts?.[currentLayout]?.top || 0;

      if (currentTop > highestTop) {
        highestTop = currentTop;
        lastComponent = component;
      }
    });

    if (
      lastComponent &&
      lastComponent.component &&
      lastComponent.component.layouts &&
      lastComponent.component.layouts[currentLayout]
    ) {
      const { top = 0, height = 0 } = lastComponent.component.layouts[currentLayout];

      return top + height;
    }

    return defaultTop;
  } catch (error) {
    console.error('Error finding last element position:', error);
    return defaultTop;
  }
};

export const getComponentIcon = (componentType, darkMode) => {
  if (!componentType) return null;

  const component = componentTypeDefinitionMap[componentType];

  const iconName = component.name.toLowerCase();
  return <WidgetIcon name={iconName} version={component?.version} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />;
};

export const getInputTypeOptions = (darkMode) => {
  const constructOptions = (component) => {
    return {
      label: component.displayName,
      value: component.component,
      leadingIcon: (
        <WidgetIcon
          name={component.name.toLowerCase()}
          version={component?.version}
          fill={darkMode ? '#3A3F42' : '#D7DBDF'}
          width="16"
        />
      ),
    };
  };

  return INPUT_COMPONENTS_FOR_FORM.reduce((options, component) => {
    options[component] = constructOptions(componentTypeDefinitionMap[component]);
    return options;
  }, {});
};

export const constructFeildForSave = (field) => {
  const { key, value, dataType, componentType, mandatory, selected, isCustomField } = field;

  return {
    key,
    value: dataType === 'number' || dataType === 'boolean' ? ensureHandlebars(value) : value,
    dataType,
    componentType,
    mandatory: mandatory?.value || false,
    selected: selected?.value || false,
    isCustomField: isCustomField || false,
  };
};

const extractKeys = (json, parentKey = '') => {
  if (!json || typeof json !== 'object') return [];

  return Object.keys(json).reduce((keys, key) => {
    const currentKey = parentKey ? `${parentKey}.${key}` : key;
    const value = json[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return [...keys, currentKey, ...extractKeys(value, currentKey)];
    }

    return [...keys, currentKey];
  }, []);
};

export const analyzeJsonDifferences = (newJson, existingJson) => {
  if (!newJson) return JSON_DIFFERENCE;

  const newKeys = extractKeys(newJson);
  const existingKeys = extractKeys(existingJson);

  return {
    isExisting: newKeys.filter((key) => existingKeys.includes(key)),
    isNew: newKeys.filter((key) => !existingKeys.includes(key)),
    isRemoved: existingKeys.filter((key) => !newKeys.includes(key)),
  };
};

export const mergeFieldsWithComponentDefinition = (fields, getComponentDefinition) => {
  return fields
    .map((field) => {
      if (field.componentId) {
        const componentData = getFieldDataFromComponent(field.componentId, getComponentDefinition);

        if (!componentData) {
          return null;
        }

        return {
          ...field,
          label: componentData?.label || field.label || '',
          name: componentData?.name || field.name || '',
          value: componentData?.value || field.value || '',
          mandatory: componentData?.mandatory || field.mandatory || false,
          visibility: componentData?.visibility || field.visibility || false,
          selected: componentData?.selected || field.selected || false,
          placeholder: componentData?.placeholder || field.placeholder || '',
          componentType: componentData?.componentType || field.componentType || 'TextInput',
        };
      }
      return field;
    })
    .filter((field) => field !== null);
};

export const mergeFormFieldsWithNewData = (existingFields, newFields) => {
  if (!existingFields || existingFields.length === 0) return newFields;

  const existingFieldsMap = {};
  existingFields.forEach((field) => {
    if (field.key) {
      existingFieldsMap[field.key] = field;
    }
  });

  return newFields.map((newField) => {
    if (newField.isNew || !existingFieldsMap[newField.key]) {
      return newField;
    }
    return {
      ...newField,
      ...omit(existingFieldsMap[newField.key], ['isNew']),
    };
  });
};

export const cleanupFormFields = (fields) => {
  return uniqBy(
    fields.filter((field) => !!field.componentId),
    'componentId'
  ).map((field) => ({
    componentId: field.componentId,
    isCustomField: field.isCustomField,
    dataType: field.dataType,
    key: field.key,
  }));
};

export const findFirstKeyValuePairWithPath = (data, basePath = '') => {
  let current = data;
  let pathSegments = [];

  if (data === null || data === undefined || data?.length === 0) {
    return {
      value: data,
      path: basePath,
    };
  }

  while (Array.isArray(current) && current.length > 0) {
    pathSegments.push('[0]');
    current = current[0];
  }

  if (current && typeof current === 'object' && !Array.isArray(current)) {
    // Inject path segments before the closing "}}"
    const insertAt = basePath.lastIndexOf('}}');
    const fullPath =
      insertAt !== -1
        ? basePath.slice(0, insertAt) + pathSegments.join('') + basePath.slice(insertAt)
        : basePath + pathSegments.join('');

    return {
      value: current,
      path: fullPath,
    };
  }

  return {
    value: null,
    path: null,
  };
};

export const mergeArrays = (arr1, arr2) => {
  const map = new Map();

  // Add all from arr1
  arr1.forEach((item) => map.set(item.isCustomField ? item.componentId : item.key, item));

  // Overwrite/add from arr2
  arr2.forEach((item) => map.set(item.isCustomField ? item.componentId : item.key, item));

  return Array.from(map.values());
};
