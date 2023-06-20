export function generateUIComponents(JSONSchema, advanced, componentTypes) {
  if (advanced) {
    if (typeof JSONSchema?.properties !== 'object' || JSONSchema?.properties == null) {
      return;
    }
    const uiComponentsDraft = [];

    // eslint-disable-next-line no-unused-vars
    Object.entries(JSONSchema?.properties).forEach(([key, value]) => {
      uiComponentsDraft.push(structuredClone(componentTypes.find((component) => component?.component == 'Text')));
      uiComponentsDraft.push(structuredClone(componentTypes.find((component) => component?.component == value?.type)));
    });
    Object.entries(JSONSchema?.properties).forEach(([key, value], index) => {
      if (uiComponentsDraft?.length > 0 && uiComponentsDraft[index * 2 + 1]) {
        switch (value?.type) {
          case 'TextInput':
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor']['value'] =
              value?.styles?.backgroundColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
              value?.styles?.borderRadius ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] =
              value?.styles?.textColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['errTextColor']['value'] =
              value?.styles?.errorTextColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['errTextColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderColor']['value'] =
              value?.styles?.borderColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
              value?.styles?.disabledState ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
              value?.styles?.visibility ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule']['value'] =
              value?.validation?.customRule ||
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['validation']['maxLength']['value'] =
              value?.validation?.maxLength ||
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['maxLength']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['validation']['minLength']['value'] =
              value?.validation?.minLength ||
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['minLength']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['validation']['regex']['value'] =
              value?.validation?.regex ||
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['regex']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'] =
              value?.value || uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder']['value'] =
              value?.placeholder ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder']['value'];
            break;
          case 'DropDown':
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
              value?.styles?.disabledState ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
              value?.styles?.visibility ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
              value?.styles?.borderRadius ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['justifyContent']['value'] =
              value?.styles?.justifyContent ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['justifyContent']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule']['value'] =
              value?.customRule || uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['properties']['display_values']['value'] =
              value?.display_values ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['display_values']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'] =
              value?.label || uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'] =
              value?.value || uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['values']['value'] =
              value?.values || uiComponentsDraft[index * 2 + 1]['definition']['properties']['values']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['loadingState']['value'] =
              value?.loadingState ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['loadingState']['value'];
            break;
          case 'Button':
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor']['value'] =
              value?.styles?.backgroundColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] =
              value?.styles?.textColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
              value?.styles?.borderRadius ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderColor']['value'] =
              value?.styles?.borderColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['loaderColor']['value'] =
              value?.styles?.loaderColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['loaderColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
              value?.styles?.visibility ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
              value?.styles?.disabledState ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['properties']['text']['value'] = value?.text;
            break;
          case 'Text':
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor']['value'] =
              value?.styles?.backgroundColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] =
              value?.styles?.textColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['textSize']['value'] =
              value?.styles?.fontSize || uiComponentsDraft[index * 2 + 1]['definition']['styles']['textSize']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['fontWeight']['value'] =
              value?.styles?.fontWeight ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['fontWeight']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['properties']['text']['value'] =
              value?.text || uiComponentsDraft[index * 2 + 1]['definition']['properties']['text']['value'];
            break;
          case 'NumberInput':
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor']['value'] =
              value?.styles?.backgroundColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
              value?.styles?.borderRadius ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] =
              value?.styles?.textColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderColor']['value'] =
              value?.styles?.borderColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
              value?.styles?.disabledState ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
              value?.styles?.visibility ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'] =
              value?.value || uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxValue']['value'] =
              value?.maxValue || uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxValue']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['minValue']['value'] =
              value?.minValue || uiComponentsDraft[index * 2 + 1]['definition']['properties']['minValue']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder']['value'] =
              value?.placeholder ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder']['value'];
            break;

          case 'PasswordInput':
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor']['value'] =
              value?.styles?.backgroundColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['backgroundColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
              value?.styles?.borderRadius ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
              value?.styles?.disabledState ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
              value?.styles?.visibility ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule']['value'] =
              value?.validation?.customRule ||
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['validation']['maxLength']['value'] =
              value?.validation?.maxLength ||
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['maxLength']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['validation']['minLength']['value'] =
              value?.validation?.minLength ||
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['minLength']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['validation']['regex']['value'] =
              value?.validation?.regex ||
              uiComponentsDraft[index * 2 + 1]['definition']['validation']['regex']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder']['value'] =
              value?.placeholder ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder']['value'];
            break;

          case 'Datepicker':
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
              value?.styles?.borderRadius ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
              value?.styles?.disabledState ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
              value?.styles?.visibility ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule']['value'] =
              value?.customRule || uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultValue']['value'] =
              value?.defaultValue ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultValue']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['disabledDates']['value'] =
              value?.disabledDates ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['disabledDates']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableDate']['value'] =
              value?.enableDate || uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableDate']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableTime']['value'] =
              value?.enableTime || uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableTime']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['format']['value'] =
              value?.format || uiComponentsDraft[index * 2 + 1]['definition']['properties']['format']['value'];
            break;

          case 'Checkbox':
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['checkboxColor']['value'] =
              value?.styles?.checkboxColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['checkboxColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
              value?.styles?.disabledState ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] =
              value?.styles?.textColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
              value?.styles?.visibility ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultValue']['value'] =
              value?.defaultValue ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultValue']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'] =
              value?.label || uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'];
            break;

          case 'RadioButton':
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] =
              value?.styles?.textColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
              value?.styles?.disabledState ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
              value?.styles?.visibility ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['properties']['display_values']['value'] =
              value?.display_values ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['display_values']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'] =
              value?.label || uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'] =
              value?.value || uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['values']['value'] =
              value?.values || uiComponentsDraft[index * 2 + 1]['definition']['properties']['values']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['visible']['value'] =
              value?.visible || uiComponentsDraft[index * 2 + 1]['definition']['properties']['visible']['value'];
            break;

          case 'ToggleSwitch':
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] =
              value?.styles?.textColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
              value?.styles?.disabledState ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
              value?.styles?.visibility ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['toggleSwitchColor']['value'] =
              value?.styles?.toggleSwitchColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['toggleSwitchColor']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultValue']['value'] =
              value?.defaultValue ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultValue']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'] =
              value?.label || uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'];
            break;

          case 'TextArea':
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
              value?.styles?.disabledState ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
              value?.styles?.visibility ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
              value?.styles?.borderRadius ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'] =
              value?.value || uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder']['value'] =
              value?.placeholder ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['placeholder']['value'];
            break;

          case 'DaterangePicker':
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
              value?.styles?.disabledState ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
              value?.styles?.visibility ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
              value?.styles?.borderRadius ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultEndDate']['value'] =
              value?.defaultEndDate ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultEndDate']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultStartDate']['value'] =
              value?.defaultStartDate ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultStartDate']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['format']['value'] =
              value?.format || uiComponentsDraft[index * 2 + 1]['definition']['properties']['format']['value'];
            break;

          case 'Multiselect':
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
              value?.styles?.disabledState ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
              value?.styles?.visibility ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
              value?.styles?.borderRadius ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['properties']['display_values']['value'] =
              value?.display_values ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['display_values']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'] =
              value?.label || uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'] =
              value?.value || uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['values']['value'] =
              value?.values || uiComponentsDraft[index * 2 + 1]['definition']['properties']['values']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['showAllOption']['value'] =
              value?.showAllOption ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['showAllOption']['value'];
            break;

          case 'StarRating':
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
              value?.styles?.disabledState ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
              value?.styles?.visibility ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] =
              value?.styles?.textColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['labelColor']['value'] =
              value?.styles?.labelColor ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['labelColor']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['properties']['allowHalfStar']['value'] =
              value?.allowHalfStar ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['allowHalfStar']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultSelected']['value'] =
              value?.defaultSelected ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultSelected']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'] =
              value?.label || uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxRating']['value'] =
              value?.maxRating || uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxRating']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['tooltips']['value'] =
              value?.tooltips || uiComponentsDraft[index * 2 + 1]['definition']['properties']['tooltips']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['visible']['value'] =
              value?.visible || uiComponentsDraft[index * 2 + 1]['definition']['properties']['visible']['value'];
            break;

          case 'FilePicker':
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'] =
              value?.styles?.disabledState ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['disabledState']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
              value?.styles?.visibility ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
              value?.styles?.borderRadius ||
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'];

            uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableDropzone']['value'] =
              value?.enableDropzone ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableDropzone']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableMultiple']['value'] =
              value?.enableMultiple ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableMultiple']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['enablePicker']['value'] =
              value?.enablePicker ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['enablePicker']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['fileType']['value'] =
              value?.fileType || uiComponentsDraft[index * 2 + 1]['definition']['properties']['fileType']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['instructionText']['value'] =
              value?.instructionText ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['instructionText']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxFileCount']['value'] =
              value?.maxFileCount ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxFileCount']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxSize']['value'] =
              value?.maxSize || uiComponentsDraft[index * 2 + 1]['definition']['properties']['maxSize']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['minSize']['value'] =
              value?.minSize || uiComponentsDraft[index * 2 + 1]['definition']['properties']['minSize']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['parseContent']['value'] =
              value?.parseContent ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['parseContent']['value'];
            uiComponentsDraft[index * 2 + 1]['definition']['properties']['parseFileType']['value'] =
              value?.parseFileType ||
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['parseFileType']['value'];
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
      uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['backgroundColor']['value'] =
        JSONSchema?.submitButton?.styles?.backgroundColor ||
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['backgroundColor']['value'];

      uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['textColor']['value'] =
        JSONSchema?.submitButton?.styles?.textColor ||
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['textColor']['value'];
      uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['borderRadius']['value'] =
        JSONSchema?.submitButton?.styles?.borderRadius ||
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['borderRadius']['value'];
      uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['borderColor']['value'] =
        JSONSchema?.submitButton?.styles?.borderColor ||
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['borderColor']['value'];
      uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['loaderColor']['value'] =
        JSONSchema?.submitButton?.styles?.loaderColor ||
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['loaderColor']['value'];
      uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['visibility']['value'] =
        JSONSchema?.submitButton?.styles?.visibility ||
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['visibility']['value'];
      uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['disabledState']['value'] =
        JSONSchema?.submitButton?.styles?.disabledState ||
        uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['styles']['disabledState']['value'];
      uiComponentsDraft[uiComponentsDraft.length - 1]['definition']['properties']['text']['value'] =
        JSONSchema?.submitButton?.text;
    }
    // filtering out undefined items
    return uiComponentsDraft.filter(function (element) {
      return element !== undefined;
    });
  }
}
