import { componentTypes } from '@/Editor/WidgetManager/components';
import {
  resolveGeneralProperties,
  resolveGeneralStyles,
  resolveProperties,
  resolveStyles,
} from '@/AppBuilder/_utils/component-properties-resolution';
import { validateProperties } from '@/AppBuilder/_utils/component-properties-validation';
const shouldAddBoxShadowAndVisibility = ['TextInput', 'PasswordInput', 'NumberInput', 'Text'];

const resolvedComponentTypes = {};

const resolveDefinition = (component) => {
  const componentMeta = component;

  const resolvedProperties = resolveProperties(component, {}, null, {});

  const resolvedStyles = resolveStyles(component, {}, null, {});

  const resolvedGeneralProperties = resolveGeneralProperties(component, {}, null, {});

  const resolvedGeneralStyles = resolveGeneralStyles(component, {}, null, {});

  const [validatedProperties, propertyErrors] = component.validate
    ? validateProperties(resolvedProperties, componentMeta.properties)
    : [resolvedProperties, []];

  if (shouldAddBoxShadowAndVisibility.includes(component.component)) {
    validatedProperties.visibility = validatedProperties.visibility !== false ? true : false;
  }

  const [validatedStyles, styleErrors] = component.validate
    ? validateProperties(resolvedStyles, componentMeta.styles)
    : [resolvedStyles, []];

  if (!shouldAddBoxShadowAndVisibility.includes(component.component)) {
    validatedStyles.visibility = validatedStyles.visibility !== false ? true : false;
  }

  const [validatedGeneralProperties, generalPropertiesErrors] = component.validate
    ? validateProperties(resolvedGeneralProperties, componentMeta.general)
    : [resolvedGeneralProperties, []];

  const [validatedGeneralStyles, generalStylesErrors] = component.validate
    ? validateProperties(resolvedGeneralStyles, componentMeta.generalStyles)
    : [resolvedGeneralStyles, []];

  const obj = {
    ...component.definition,
    properties: validatedProperties,
    styles: validatedStyles,
    general: validatedGeneralProperties,
    generalStyles: validatedGeneralStyles,
  };
  return obj;
};

const getComponentDefinition = (componentType) => {
  let data = structuredClone(componentTypes.find((component) => component?.component == componentType));
  if (componentType in resolvedComponentTypes) {
    data.definition = structuredClone(resolvedComponentTypes[componentType]);
  } else {
    resolvedComponentTypes[componentType] = resolveDefinition(data);
    data.definition = structuredClone(resolvedComponentTypes[componentType]);
  }
  return data;
};

export function generateUIComponents(JSONSchema, advanced, componentName = '') {
  if (advanced) {
    if (typeof JSONSchema?.properties !== 'object' || JSONSchema?.properties == null) {
      return;
    }
    const uiComponentsDraft = [];
    // eslint-disable-next-line no-unused-vars
    Object.entries(JSONSchema?.properties).forEach(([key, value]) => {
      const itemType = typeResolver(value?.type);
      if (itemType) {
        uiComponentsDraft.push(getComponentDefinition('Text'));
        uiComponentsDraft.push(getComponentDefinition(itemType));
        //only add if there is a valid item type
      } else {
        // useCurrentStateStore.getState().actions.setErrors({
        //   [componentName]: {
        //     type: 'component',
        //     data: {
        //       message: `JSON Schema consists of invalid input type: ${value?.type}`,
        //       status: 'Failed',
        //     },
        //   },
        // });
        uiComponentsDraft.push(undefined);
        uiComponentsDraft.push(undefined);
      }
    });
    Object.entries(JSONSchema?.properties).forEach(([key, value], index) => {
      if (uiComponentsDraft?.length > 0 && uiComponentsDraft[index * 2 + 1]) {
        switch (typeResolver(value?.type)) {
          case 'TextInput':
            if (value?.styles?.backgroundColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor'] =
                value?.styles?.backgroundColor;
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius'] = value?.styles?.borderRadius;
            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor'] = value?.styles?.textColor;
            if (value?.styles?.errorTextColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['errTextColor'] = value?.styles?.errorTextColor;
            if (value?.styles?.borderColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderColor'] = value?.styles?.borderColor;
            if (value?.styles?.disabled)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState'] = value?.styles?.disabled;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility'] = validBooleanChecker(
                value?.styles?.visibility
              );

            if (value?.validation?.customRule)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule'] =
                value?.validation?.customRule;
            if (value?.validation?.maxLength)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['maxLength'] = value?.validation?.maxLength;
            if (value?.validation?.minLength)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['minLength'] = value?.validation?.minLength;
            if (value?.validation?.regex)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['regex'] = value?.validation?.regex;
            if (value?.value) uiComponentsDraft[index * 2 + 1]['definition']['properties']['value'] = value?.value;
            if (value?.placeholder)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder'] = value?.placeholder;
            // prevent label from showing up in text input, because it is already shown in the text component. (Defaults to "Label" if not updated explicitly with an empty string)
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['label'] = '';
            break;
          case 'DropDown':
            if (value?.styles?.disabled)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState'] = value?.styles?.disabled;
            if (value?.styles?.visibility) {
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility'] = validBooleanChecker(
                value?.styles?.visibility
              );
            }
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius'] = value?.styles?.borderRadius;
            if (value?.styles?.justifyContent)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['justifyContent'] =
                value?.styles?.justifyContent;
            if (value?.validation?.customRule)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule'] = value?.customRule;
            if (value?.displayValues)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['display_values'] = value?.displayValues;
            if (value?.label) uiComponentsDraft[index * 2 + 1]['definition']['properties']['label'] = value?.label;
            if (value?.value) uiComponentsDraft[index * 2 + 1]['definition']['properties']['value'] = value?.value;
            if (value?.values) uiComponentsDraft[index * 2 + 1]['definition']['properties']['values'] = value?.values;
            if (value?.loading)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['loadingState'] = value?.loading;
            break;
          case 'Button':
            if (value?.styles?.backgroundColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor'] =
                value?.styles?.backgroundColor;
            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor'] = value?.styles?.textColor;
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius'] = value?.styles?.borderRadius;
            if (value?.styles?.borderColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderColor'] = value?.styles?.borderColor;
            if (value?.styles?.loaderColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['loaderColor'] = value?.styles?.loaderColor;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility'] = validBooleanChecker(
                value?.styles?.visibility
              );

            if (value?.styles?.disabled)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState'] = value?.styles?.disabled;
            if (value?.value) uiComponentsDraft[index * 2 + 1]['definition']['properties']['text'] = value?.value;
            break;
          case 'Text':
            if (value?.styles?.backgroundColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor'] =
                value?.styles?.backgroundColor;
            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor'] = value?.styles?.textColor;
            if (value?.styles?.fontSize)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textSize'] = value?.styles?.fontSize;
            if (value?.styles?.fontWeight)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['fontWeight'] = value?.styles?.fontWeight;
            if (value?.value) uiComponentsDraft[index * 2 + 1]['definition']['properties']['text'] = value?.value;
            break;
          case 'NumberInput':
            if (value?.styles?.backgroundColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor'] =
                value?.styles?.backgroundColor;
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius'] = value?.styles?.borderRadius;
            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor'] = value?.styles?.textColor;
            if (value?.styles?.borderColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderColor'] = value?.styles?.borderColor;
            if (value?.styles?.disabled)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState'] = value?.styles?.disabled;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility'] = validBooleanChecker(
                value?.styles?.visibility
              );

            if (value?.value) uiComponentsDraft[index * 2 + 1]['definition']['properties']['value'] = value?.value;
            else uiComponentsDraft[index * 2 + 1]['definition']['properties']['value'] = null;

            if (value?.maxValue)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxValue'] = value?.maxValue;
            if (value?.minValue)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['minValue'] = value?.minValue;
            if (value?.placeholder)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder'] = value?.placeholder;
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['label'] = '';
            break;

          case 'PasswordInput':
            if (value?.styles?.backgroundColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor'] =
                value?.styles?.backgroundColor;
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius'] = value?.styles?.borderRadius;
            if (value?.styles?.disabled)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState'] = value?.styles?.disabled;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility'] = validBooleanChecker(
                value?.styles?.visibility
              );

            if (value?.validation?.customRule)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule'] =
                value?.validation?.customRule;
            if (value?.validation?.maxLength)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['maxLength'] = value?.validation?.maxLength;
            if (value?.validation?.minLength)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['minLength'] = value?.validation?.minLength;
            if (value?.validation?.regex)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['regex'] = value?.validation?.regex;
            if (value?.placeholder)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder'] = value?.placeholder;
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['label'] = '';

            break;
          case 'Datepicker':
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius'] = value?.styles?.borderRadius;
            if (value?.styles?.disabled)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState'] = value?.styles?.disabled;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility'] = validBooleanChecker(
                value?.styles?.visibility
              );
            if (value?.validation?.customRule)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule'] =
                value?.validation?.customRule;
            if (value?.value)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultValue'] = value?.value;
            if (value?.disabledDates)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['disabledDates'] = value?.disabledDates;
            if (value?.enableDate)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableDate'] = value?.enableDate;
            if (value?.enableTime)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableTime'] = value?.enableTime;
            if (value?.format) uiComponentsDraft[index * 2 + 1]['definition']['properties']['format'] = value?.format;
            break;
          case 'Checkbox':
            if (value?.styles?.checkboxColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['checkboxColor'] = value?.styles?.checkboxColor;
            if (value?.styles?.disabled)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState'] = value?.styles?.disabled;
            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor'] = value?.styles?.textColor;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility'] = validBooleanChecker(
                value?.styles?.visibility
              );

            if (value?.value)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultValue'] = value?.value;
            if (value?.label) uiComponentsDraft[index * 2 + 1]['definition']['properties']['label'] = value?.label;
            break;

          case 'RadioButton':
            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor'] = value?.styles?.textColor;
            if (value?.styles?.disabled)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState'] = value?.styles?.disabled;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility'] = validBooleanChecker(
                value?.styles?.visibility
              );

            if (value?.displayValues)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['display_values'] = value?.displayValues;
            if (value?.label) uiComponentsDraft[index * 2 + 1]['definition']['properties']['label'] = value?.label;
            if (value?.value) uiComponentsDraft[index * 2 + 1]['definition']['properties']['value'] = value?.value;
            if (value?.values) uiComponentsDraft[index * 2 + 1]['definition']['properties']['value'] = value?.values;
            break;
          case 'ToggleSwitch':
            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor'] = value?.styles?.textColor;
            if (value?.styles?.disabled)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState'] = value?.styles?.disabled;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility'] = validBooleanChecker(
                value?.styles?.visibility
              );

            if (value?.styles?.toggleSwitchColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['toggleSwitchColor'] =
                value?.styles?.toggleSwitchColor;

            if (value?.value)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultValue'] = value?.value;
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['label'] = value?.label;
            break;

          case 'TextArea':
            if (value?.styles?.disabled)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState'] = value?.styles?.disabled;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility'] = validBooleanChecker(
                value?.styles?.visibility
              );

            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius'] = value?.styles?.borderRadius;
            if (value?.value) uiComponentsDraft[index * 2 + 1]['definition']['properties']['value'] = value?.value;
            else uiComponentsDraft[index * 2 + 1]['definition']['properties']['value'] = null;

            if (value?.placeholder)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder'] = value?.placeholder;
            break;
          case 'DaterangePicker':
            if (value?.styles?.disabled)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState'] = value?.styles?.disabled;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility'] = validBooleanChecker(
                value?.styles?.visibility
              );

            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius'] = value?.styles?.borderRadius;
            if (value?.defaultEndDate)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultEndDate'] = value?.defaultEndDate;
            if (value?.defaultStartDate)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultStartDate'] =
                value?.defaultStartDate;
            if (value?.format) uiComponentsDraft[index * 2 + 1]['definition']['properties']['format'] = value?.format;
            break;
          case 'Multiselect':
            if (value?.styles?.disabled)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState'] = value?.styles?.disabled;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility'] = validBooleanChecker(
                value?.styles?.visibility
              );

            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius'] = value?.styles?.borderRadius;
            if (value?.displayValues)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['display_values'] = value?.displayValues;
            if (value?.label) uiComponentsDraft[index * 2 + 1]['definition']['properties']['label'] = value?.label;
            if (value?.value) uiComponentsDraft[index * 2 + 1]['definition']['properties']['value'] = value?.value;
            if (value?.values) uiComponentsDraft[index * 2 + 1]['definition']['properties']['values'] = value?.values;
            if (value?.showAllOption)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['showAllOption'] = value?.showAllOption;
            break;
          case 'StarRating':
            if (value?.styles?.disabled)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState'] = value?.styles?.disabled;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility'] = validBooleanChecker(
                value?.styles?.visibility
              );

            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor'] = value?.styles?.textColor;
            if (value?.styles?.labelColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['labelColor'] = value?.styles?.labelColor;
            if (value?.allowHalfStar)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['allowHalfStar'] = value?.allowHalfStar;
            if (value?.defaultSelected)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultSelected'] = value?.defaultSelected;
            if (value?.label) uiComponentsDraft[index * 2 + 1]['definition']['properties']['label'] = value?.label;
            if (value?.maxRating)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxRating'] = value?.maxRating;
            if (value?.tooltips)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['tooltips'] = value?.tooltips;
            break;
          case 'FilePicker':
            if (value?.styles?.disabled)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState'] = value?.styles?.disabled;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility'] = validBooleanChecker(
                value?.styles?.visibility
              );

            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius'] = value?.styles?.borderRadius;
            if (value?.enableDropzone)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableDropzone'] = value?.enableDropzone;
            if (value?.enableMultiple)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableMultiple'] = value?.enableMultiple;
            if (value?.enablePicker)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['enablePicker'] = value?.enablePicker;
            if (value?.fileType)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['fileType'] = value?.fileType;
            if (value?.instructionText)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['instructionText'] = value?.instructionText;
            if (value?.maxFileCount)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxFileCount'] = value?.maxFileCount;
            if (value?.maxSize)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxSize'] = value?.maxSize;
            if (value?.minSize)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['minSize'] = value?.minSize;
            if (value?.parseContent)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['parseContent'] = value?.parseContent;
            if (value?.parseFileType)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['parseFileType'] = value?.parseFileType;
            break;
          default:
            return;
        }
        // converting label/key as text ui element/component
        uiComponentsDraft[index * 2]['definition']['properties']['text'] = value?.label ?? key;
        uiComponentsDraft[index * 2]['formKey'] = key;
      }
    });
    // adding title as first item
    if (JSONSchema?.title) {
      uiComponentsDraft.unshift(getComponentDefinition('Text'));
      uiComponentsDraft[0]['definition']['properties']['text'] = JSONSchema?.title;
      uiComponentsDraft[0]['definition']['styles']['textSize'] = 20;
      uiComponentsDraft[0]['definition']['styles']['fontWeight'] = 'bolder';
    }
    // adding submit button to end
    if (JSONSchema?.submitButton) {
      uiComponentsDraft.push(getComponentDefinition('Button'));
      if (JSONSchema?.submitButton?.styles?.backgroundColor)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['backgroundColor'] =
          JSONSchema?.submitButton?.styles?.backgroundColor;
      if (JSONSchema?.submitButton?.styles?.textColor)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['textColor'] =
          JSONSchema?.submitButton?.styles?.textColor;
      if (JSONSchema?.submitButton?.styles?.borderRadius)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['borderRadius'] =
          JSONSchema?.submitButton?.styles?.borderRadius;
      if (JSONSchema?.submitButton?.styles?.borderColor)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['borderColor'] =
          JSONSchema?.submitButton?.styles?.borderColor;
      if (JSONSchema?.submitButton?.styles?.loaderColor)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['loaderColor'] =
          JSONSchema?.submitButton?.styles?.loaderColor;
      if (JSONSchema?.submitButton?.styles?.visibility)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['visibility'] = validBooleanChecker(
          JSONSchema?.submitButton?.styles?.visibility
        );

      if (JSONSchema?.submitButton?.styles?.disabled)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['disabledState'] =
          JSONSchema?.submitButton?.styles?.disabled;
      if (JSONSchema?.submitButton?.value)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['properties']['text'] =
          JSONSchema?.submitButton?.value;
      if (JSONSchema?.submitButton?.loading)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['properties']['loadingState'] =
          JSONSchema?.submitButton?.loading;
    }
    // filtering out undefined items
    return uiComponentsDraft.filter(function (element) {
      return element !== undefined;
    });
  }
}
const typeResolver = (type) => {
  switch (type) {
    case 'textinput':
      return 'TextInput';
    case 'dropdown':
      return 'DropDown';
    case 'button':
      return 'Button';
    case 'text':
      return 'Text';
    case 'number':
      return 'NumberInput';
    case 'password':
      return 'PasswordInput';
    case 'datepicker':
      return 'Datepicker';
    case 'checkbox':
      return 'Checkbox';
    case 'radio':
      return 'RadioButton';
    case 'toggle':
      return 'ToggleSwitch';
    case 'textarea':
      return 'TextArea';
    case 'daterangepicker':
      return 'DaterangePicker';
    case 'multiselect':
      return 'Multiselect';
    case 'starrating':
      return 'StarRating';
    case 'filepicker':
      return 'FilePicker';
    default:
      return null;
  }
};

const validBooleanChecker = (input) => {
  if (/^(true|false)$/i.test(input) == true) return JSON.parse(input);
  return true;
};

export const getBodyHeight = (height, showHeader, showFooter, headerHeight = 60, footerHeight = 60) => {
  let modalHeight = height ? parseInt(height, 10) : 0;
  let parsedHeaderHeight = showHeader ? parseInt(headerHeight, 10) : 0;
  let parsedFooterHeight = showFooter ? parseInt(footerHeight, 10) : 0;

  if (showHeader) {
    // 10 is header padding
    modalHeight = modalHeight - parsedHeaderHeight - 10;
  }
  if (showFooter) {
    // 14 is footer padding
    modalHeight = modalHeight - parsedFooterHeight - 14;
  }

  const rounded = Math.ceil(modalHeight / 10) * 10;

  console.log('rounded', rounded)
  return `${Math.max(rounded - 20, 40)}px`;
};
