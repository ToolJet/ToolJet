import { componentTypes } from '@/Editor/WidgetManager/components';
export function generateUIComponents(JSONSchema, advanced) {
  if (advanced) {
    if (typeof JSONSchema?.properties !== 'object' || JSONSchema?.properties == null) {
      return;
    }
    const uiComponentsDraft = [];

    // eslint-disable-next-line no-unused-vars
    Object.entries(JSONSchema?.properties).forEach(([key, value]) => {
      uiComponentsDraft.push(structuredClone(componentTypes.find((component) => component?.component == 'Text')));
      const itemType = typeResolver(value?.type);
      uiComponentsDraft.push(structuredClone(componentTypes.find((component) => component?.component == itemType)));
    });
    Object.entries(JSONSchema?.properties).forEach(([key, value], index) => {
      if (uiComponentsDraft?.length > 0 && uiComponentsDraft[index * 2 + 1]) {
        switch (typeResolver(value?.type)) {
          case 'TextInput':
            if (value?.styles?.backgroundColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor']['value'] =
                value?.styles?.backgroundColor;
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
                value?.styles?.borderRadius;
            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] = value?.styles?.textColor;
            if (value?.styles?.errorTextColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['errTextColor']['value'] =
                value?.styles?.errorTextColor;
            if (value?.styles?.borderColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderColor']['value'] =
                value?.styles?.borderColor;
            if (value?.styles?.disabledState)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
                value?.styles?.disabledState;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
                value?.styles?.visibility;
            if (value?.validation?.customRule)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule']['value'] =
                value?.validation?.customRule;
            if (value?.validation?.maxLength)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['maxLength']['value'] =
                value?.validation?.maxLength;
            if (value?.validation?.minLength)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['minLength']['value'] =
                value?.validation?.minLength;
            if (value?.validation?.regex)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['regex']['value'] = value?.validation?.regex;
            if (value?.value)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'] = value?.value;
            if (value?.placeholder)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder']['value'] = value?.placeholder;
            break;
          case 'DropDown':
            if (value?.styles?.disabledState)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
                value?.styles?.disabledState;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
                value?.styles?.visibility;
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
                value?.styles?.borderRadius;
            if (value?.styles?.justifyContent)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['justifyContent']['value'] =
                value?.styles?.justifyContent;

            if (value?.customRule)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule']['value'] = value?.customRule;

            if (value?.display_values)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['display_values']['value'] =
                value?.display_values;
            if (value?.label)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'] = value?.label;
            if (value?.value)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'] = value?.value;
            if (value?.values)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['values']['value'] = value?.values;
            if (value?.loadingState)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['loadingState']['value'] =
                value?.loadingState;
            break;
          case 'Button':
            if (value?.styles?.backgroundColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor']['value'] =
                value?.styles?.backgroundColor;
            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] = value?.styles?.textColor;
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
                value?.styles?.borderRadius;
            if (value?.styles?.borderColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderColor']['value'] =
                value?.styles?.borderColor;
            if (value?.styles?.loaderColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['loaderColor']['value'] =
                value?.styles?.loaderColor;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
                value?.styles?.visibility;
            if (value?.styles?.disabledState)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
                value?.styles?.disabledState;

            if (value?.value)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['text']['value'] = value?.value;
            break;
          case 'Text':
            if (value?.styles?.backgroundColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor']['value'] =
                value?.styles?.backgroundColor;
            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] = value?.styles?.textColor;
            if (value?.styles?.fontSize)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textSize']['value'] = value?.styles?.fontSize;
            if (value?.styles?.fontWeight)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['fontWeight']['value'] =
                value?.styles?.fontWeight;

            if (value?.value)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['text']['value'] = value?.value;
            break;
          case 'NumberInput':
            if (value?.styles?.backgroundColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor']['value'] =
                value?.styles?.backgroundColor;
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
                value?.styles?.borderRadius;
            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] = value?.styles?.textColor;
            if (value?.styles?.borderColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderColor']['value'] =
                value?.styles?.borderColor;
            if (value?.styles?.disabledState)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
                value?.styles?.disabledState;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
                value?.styles?.visibility;

            if (value?.value)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'] = value?.value;
            if (value?.maxValue)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxValue']['value'] = value?.maxValue;
            if (value?.minValue)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['minValue']['value'] = value?.minValue;
            if (value?.placeholder)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder']['value'] = value?.placeholder;
            break;

          case 'PasswordInput':
            if (value?.styles?.backgroundColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor']['value'] =
                value?.styles?.backgroundColor;
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
                value?.styles?.borderRadius;
            if (value?.styles?.disabledState)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
                value?.styles?.disabledState;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
                value?.styles?.visibility;

            if (value?.validation?.customRule)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule']['value'] =
                value?.validation?.customRule;
            if (value?.validation?.maxLength)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['maxLength']['value'] =
                value?.validation?.maxLength;
            if (value?.validation?.minLength)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['minLength']['value'] =
                value?.validation?.minLength;
            if (value?.validation?.regex)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['regex']['value'] = value?.validation?.regex;

            if (value?.placeholder)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder']['value'] = value?.placeholder;
            break;

          case 'Datepicker':
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
                value?.styles?.borderRadius;
            if (value?.styles?.disabledState)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
                value?.styles?.disabledState;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
                value?.styles?.visibility;
            if (value?.customRule)
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule']['value'] = value?.customRule;

            if (value?.value)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultValue']['value'] = value?.value;
            if (value?.disabledDates)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['disabledDates']['value'] =
                value?.disabledDates;
            if (value?.enableDate)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableDate']['value'] = value?.enableDate;
            if (value?.enableTime)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableTime']['value'] = value?.enableTime;
            if (value?.format)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['format']['value'] = value?.format;
            break;

          case 'Checkbox':
            if (value?.styles?.checkboxColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['checkboxColor']['value'] =
                value?.styles?.checkboxColor;
            if (value?.styles?.disabledState)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
                value?.styles?.disabledState;
            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] = value?.styles?.textColor;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
                value?.styles?.visibility;

            if (value?.value)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultValue']['value'] = value?.value;
            if (value?.label)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'] = value?.label;
            break;

          case 'RadioButton':
            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] = value?.styles?.textColor;
            if (value?.styles?.disabledState)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
                value?.styles?.disabledState;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
                value?.styles?.visibility;

            if (value?.displayValues)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['display_values']['value'] =
                value?.displayValues;
            if (value?.label)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'] = value?.label;
            if (value?.value)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'] = value?.value;
            if (value?.values)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['values']['value'] = value?.values;
            if (value?.visible)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['visible']['value'] = value?.visible;
            break;

          case 'ToggleSwitch':
            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] = value?.styles?.textColor;
            if (value?.styles?.disabledState)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
                value?.styles?.disabledState;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
                value?.styles?.visibility;
            if (value?.styles?.toggleSwitchColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['toggleSwitchColor']['value'] =
                value?.styles?.toggleSwitchColor;

            if (value?.value)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultValue']['value'] = value?.value;
            if (value?.label)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'] = value?.label;
            break;

          case 'TextArea':
            if (value?.styles?.disabledState)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
                value?.styles?.disabledState;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
                value?.styles?.visibility;
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
                value?.styles?.borderRadius;

            if (value?.value)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'] = value?.value;
            if (value?.placeholder)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder']['value'] = value?.placeholder;
            break;

          case 'DaterangePicker':
            if (value?.styles?.disabledState)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
                value?.styles?.disabledState;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
                value?.styles?.visibility;
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
                value?.styles?.borderRadius;

            if (value?.defaultEndDate)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultEndDate']['value'] =
                value?.defaultEndDate;
            if (value?.defaultStartDate)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultStartDate']['value'] =
                value?.defaultStartDate;
            if (value?.format)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['format']['value'] = value?.format;
            break;

          case 'Multiselect':
            if (value?.styles?.disabledState)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
                value?.styles?.disabledState;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
                value?.styles?.visibility;
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
                value?.styles?.borderRadius;

            if (value?.displayValues)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['display_values']['value'] =
                value?.displayValues;
            if (value?.label)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'] = value?.label;
            if (value?.value)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'] = value?.value;
            if (value?.values)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['values']['value'] = value?.values;
            if (value?.showAllOption)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['showAllOption']['value'] =
                value?.showAllOption;
            break;

          case 'StarRating':
            if (value?.styles?.disabledState)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
                value?.styles?.disabledState;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
                value?.styles?.visibility;
            if (value?.styles?.textColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] = value?.styles?.textColor;
            if (value?.styles?.labelColor)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['labelColor']['value'] =
                value?.styles?.labelColor;

            if (value?.allowHalfStar)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['allowHalfStar']['value'] =
                value?.allowHalfStar;
            if (value?.defaultSelected)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultSelected']['value'] =
                value?.defaultSelected;
            if (value?.label)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'] = value?.label;
            if (value?.maxRating)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxRating']['value'] = value?.maxRating;
            if (value?.tooltips)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['tooltips']['value'] = value?.tooltips;
            if (value?.visible)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['visible']['value'] = value?.visible;
            break;

          case 'FilePicker':
            if (value?.styles?.disabledState)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
                value?.styles?.disabledState;
            if (value?.styles?.visibility)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
                value?.styles?.visibility;
            if (value?.styles?.borderRadius)
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
                value?.styles?.borderRadius;

            if (value?.enableDropzone)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableDropzone']['value'] =
                value?.enableDropzone;
            if (value?.enableMultiple)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableMultiple']['value'] =
                value?.enableMultiple;
            if (value?.enablePicker)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['enablePicker']['value'] =
                value?.enablePicker;
            if (value?.fileType)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['fileType']['value'] = value?.fileType;
            if (value?.instructionText)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['instructionText']['value'] =
                value?.instructionText;
            if (value?.maxFileCount)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxFileCount']['value'] =
                value?.maxFileCount;
            if (value?.maxSize)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxSize']['value'] = value?.maxSize;
            if (value?.minSize)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['minSize']['value'] = value?.minSize;
            if (value?.parseContent)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['parseContent']['value'] =
                value?.parseContent;
            if (value?.parseFileType)
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['parseFileType']['value'] =
                value?.parseFileType;
            break;
          default:
            return;
        }
        // converting label/key as text input
        uiComponentsDraft[index * 2]['definition']['properties']['text']['value'] = value?.label ?? key;
      }
    });

    // adding title as first item
    if (JSONSchema?.title) {
      uiComponentsDraft.unshift(structuredClone(componentTypes.find((component) => component?.component == 'Text')));
      uiComponentsDraft[0]['definition']['properties']['text']['value'] = JSONSchema?.title;
      uiComponentsDraft[0]['definition']['styles']['textSize']['value'] = 20;
      uiComponentsDraft[0]['definition']['styles']['fontWeight']['value'] = 'bolder';
    }
    // adding submit button to end
    if (JSONSchema?.submitButton) {
      uiComponentsDraft.push(structuredClone(componentTypes.find((component) => component?.component == 'Button')));
      if (JSONSchema?.submitButton?.styles?.backgroundColor)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['backgroundColor']['value'] =
          JSONSchema?.submitButton?.styles?.backgroundColor;
      if (JSONSchema?.submitButton?.styles?.textColor)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['textColor']['value'] =
          JSONSchema?.submitButton?.styles?.textColor;
      if (JSONSchema?.submitButton?.styles?.borderRadius)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['borderRadius']['value'] =
          JSONSchema?.submitButton?.styles?.borderRadius;

      if (JSONSchema?.submitButton?.styles?.borderColor)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['borderColor']['value'] =
          JSONSchema?.submitButton?.styles?.borderColor;
      if (JSONSchema?.submitButton?.styles?.loaderColor)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['loaderColor']['value'] =
          JSONSchema?.submitButton?.styles?.loaderColor;
      if (JSONSchema?.submitButton?.styles?.visibility)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['visibility']['value'] =
          JSONSchema?.submitButton?.styles?.visibility;
      if (JSONSchema?.submitButton?.styles?.disabledState)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['disabledState']['value'] =
          JSONSchema?.submitButton?.styles?.disabledState;
      if (JSONSchema?.submitButton?.value)
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['properties']['text']['value'] =
          JSONSchema?.submitButton?.value;
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
    case 'numberinput':
      return 'NumberInput';
    case 'passwordinput':
      return 'PasswordInput';
    case 'datepicker':
      return 'Datepicker';
    case 'Checkbox':
      return 'checkbox';
    case 'RadioButton':
      return 'radiobutton';
    case 'ToggleSwitch':
      return 'ToggleSwitch';
    case 'TextArea':
      return 'textarea';
    case 'DaterangePicker':
      return 'daterangepicker';
    case 'Multiselect':
      return 'multiselect';
    case 'StarRating':
      return 'starrating';
    case 'FilePicker':
      return 'filepicker';
    default:
      break;
  }
};
