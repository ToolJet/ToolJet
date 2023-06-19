import React, { useRef, useState, useEffect } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import _, { omit } from 'lodash';
import { Box } from '../Box';
import { componentTypes } from '@/Editor/WidgetManager/components';
export const Form = function Form(props) {
  const {
    id,
    component,
    width,
    height,
    containerProps,
    removeComponent,
    styles,
    setExposedVariable,
    darkMode,
    currentState,
    fireEvent,
    properties,
    registerAction,
    resetComponent,
    childComponents,
    onEvent,
    dataCy,
    paramUpdated,
  } = props;
  const { visibility, disabledState, borderRadius, borderColor } = styles;
  const { buttonToSubmit, loadingState, advanced, JSONSchema } = properties;
  const backgroundColor =
    ['#fff', '#ffffffff'].includes(styles.backgroundColor) && darkMode ? '#232E3C' : styles.backgroundColor;
  const computedStyles = {
    backgroundColor,
    borderRadius: borderRadius ? parseFloat(borderRadius) : 0,
    border: `1px solid ${borderColor}`,
    height,
    display: visibility ? 'flex' : 'none',
    position: 'relative',
    overflow: 'hidden auto',
  };

  const parentRef = useRef(null);
  const childDataRef = useRef({});

  const [childrenData, setChildrenData] = useState({});
  const [isValid, setValidation] = useState(true);
  const [uiComponents, setUIComponents] = useState([]);

  registerAction('resetForm', async function () {
    resetComponent();
  });
  registerAction(
    'submitForm',
    async function () {
      if (isValid) {
        onEvent('onSubmit', { component }).then(() => resetComponent());
      } else {
        fireEvent('onInvalid');
      }
    },
    [isValid]
  );

  const extractData = (data) => {
    const result = {};

    for (const key in data) {
      const item = data[key];

      if (item.name === 'Text') {
        const textKey = item?.text?.toLowerCase();
        const nextItem = data[parseInt(key) + 1];

        if (nextItem && nextItem.name !== 'Text') {
          result[textKey] = { ...nextItem };
          delete result[textKey].name;
        }
      }
    }

    return result;
  };

  useEffect(() => {
    if (advanced) {
      if (typeof JSONSchema?.properties !== 'object' || JSONSchema?.properties == null) {
        return;
      }
      const uiComponentsDraft = [];

      // eslint-disable-next-line no-unused-vars
      Object.entries(JSONSchema?.properties).forEach(([key, value]) => {
        uiComponentsDraft.push(structuredClone(componentTypes.find((component) => component?.component == 'Text')));
        uiComponentsDraft.push(
          structuredClone(componentTypes.find((component) => component?.component == value?.type))
        );
      });
      Object.entries(JSONSchema?.properties).forEach(([key, value], index) => {
        if (uiComponentsDraft?.length > 0 && uiComponentsDraft[index * 2 + 1]) {
          switch (value.type) {
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
                value?.customRule ||
                uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule']['value'];

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
                value?.styles?.backgroundColor;
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textColor']['value'] = value?.styles?.textColor;
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['textSize']['value'] = value?.styles?.fontSize;

              uiComponentsDraft[index * 2 + 1]['definition']['properties']['text']['value'] = value?.text;
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
                value?.customRule ||
                uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule']['value'];

              uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultValue']['value'] =
                value?.defaultValue ||
                uiComponentsDraft[index * 2 + 1]['definition']['properties']['defaultValue']['value'];
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['disabledDates']['value'] =
                value?.disabledDates ||
                uiComponentsDraft[index * 2 + 1]['definition']['properties']['disabledDates']['value'];
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableDate']['value'] =
                value?.enableDate ||
                uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableDate']['value'];
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableTime']['value'] =
                value?.enableTime ||
                uiComponentsDraft[index * 2 + 1]['definition']['properties']['enableTime']['value'];
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
          }
          uiComponentsDraft[index * 2]['definition']['properties']['text']['value'] = key;
        }
      });
      if (JSONSchema?.title) {
        uiComponentsDraft.unshift(structuredClone(componentTypes.find((component) => component?.component == 'Text')));
        uiComponentsDraft[0]['definition']['properties']['text']['value'] = JSONSchema?.title;
      }
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

      setUIComponents(uiComponentsDraft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(JSONSchema), advanced]);

  const checkJsonChildrenValidtion = () => {
    for (const key in childrenData) {
      if (childrenData[key]?.isValid == false) return false;
    }
    return true;
  };

  useEffect(() => {
    let formattedChildData = {};
    let childValidation = true;

    if (childComponents === null) {
      setExposedVariable('data', formattedChildData);
      setExposedVariable('isValid', childValidation);
      return setValidation(childValidation);
    }

    if (advanced) {
      formattedChildData = extractData(childrenData);
      childValidation = checkJsonChildrenValidtion();
    } else {
      Object.keys(childComponents).forEach((childId) => {
        if (childrenData[childId]?.name) {
          formattedChildData[childrenData[childId].name] = omit(childrenData[childId], 'name');
          childValidation = childValidation && (childrenData[childId]?.isValid ?? true);
        }
      });
    }
    setExposedVariable('data', formattedChildData);
    setExposedVariable('isValid', childValidation);
    setValidation(childValidation);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenData, childComponents, advanced, JSON.stringify(JSONSchema)]);

  useEffect(() => {
    const childIds = Object.keys(childrenData);
    Object.entries(currentState.components).forEach(([name, value]) => {
      if (childIds.includes(value.id) && name !== childrenData[value.id]?.name) {
        childDataRef.current = {
          ...childDataRef.current,
          [value.id]: { ...childDataRef.current[value.id], name: name },
        };
      }
    });
    if (Object.keys(diff(childrenData, childDataRef.current).length !== 0)) {
      setChildrenData(childDataRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState.components]);

  useEffect(() => {
    document.addEventListener('submitForm', handleFormSubmission);
    return () => document.removeEventListener('submitForm', handleFormSubmission);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buttonToSubmit, isValid, advanced]);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const handleFormSubmission = ({ detail: { buttonComponentId } }) => {
    if (!advanced) {
      if (buttonToSubmit === buttonComponentId) {
        if (isValid) {
          onEvent('onSubmit', { component }).then(() => resetComponent());
        } else {
          fireEvent('onInvalid');
        }
      }
    } else {
      if (isValid) {
        onEvent('onSubmit', { component }).then(() => resetComponent());
      } else {
        fireEvent('onInvalid');
      }
    }
  };
  function onComponentOptionChangedForSubcontainer(component, optionName, value, componentId = '') {
    if (typeof value === 'function' && _.findKey({}, optionName)) {
      return Promise.resolve();
    }
    onOptionChange({ component, optionName, value, componentId });
    return containerProps.onComponentOptionChanged(component, optionName, value);
  }

  const onOptionChange = ({ component, optionName, value, componentId }) => {
    const optionData = {
      ...(childDataRef.current[componentId] ?? {}),
      name: component.name,
      [optionName]: value,
    };
    childDataRef.current = { ...childDataRef.current, [componentId]: optionData };
    setChildrenData(childDataRef.current);
  };
  return (
    <form
      className={`jet-container ${advanced && 'jet-container-json-form'}`}
      id={id}
      data-cy={dataCy}
      ref={parentRef}
      style={computedStyles}
      onSubmit={handleSubmit}
      onClick={(e) => {
        if (e.target.className === 'real-canvas') containerProps.onComponentClick(id, component);
      }} //Hack, should find a better solution - to prevent losing z index+1 when container element is clicked
    >
      {loadingState ? (
        <div className="p-2" style={{ margin: '0px auto' }}>
          <center>
            <div className="spinner-border mt-5" role="status"></div>
          </center>
        </div>
      ) : (
        <fieldset disabled={disabledState}>
          {!advanced && (
            <>
              <SubContainer
                parentComponent={component}
                containerCanvasWidth={width}
                parent={id}
                {...containerProps}
                parentRef={parentRef}
                removeComponent={removeComponent}
                onOptionChange={function ({ component, optionName, value, componentId }) {
                  if (componentId) {
                    const optionData = {
                      ...(childDataRef.current[componentId] ?? {}),
                      name: component.name,
                      [optionName]: value,
                    };
                    childDataRef.current = { ...childDataRef.current, [componentId]: optionData };
                    setChildrenData(childDataRef.current);
                  }
                }}
              />
              <SubCustomDragLayer
                containerCanvasWidth={width}
                parent={id}
                parentRef={parentRef}
                currentLayout={containerProps.currentLayout}
              />
            </>
          )}
          {advanced &&
            uiComponents.map((item, index) => {
              return (
                <div className="json-form-wrapper" key={index}>
                  <Box
                    component={item}
                    id={index}
                    width={width}
                    mode={containerProps.mode}
                    inCanvas={true}
                    paramUpdated={paramUpdated}
                    onEvent={onEvent}
                    onComponentOptionChanged={onComponentOptionChangedForSubcontainer}
                    onComponentOptionsChanged={containerProps.onComponentOptionsChanged}
                    onComponentClick={containerProps.onComponentClick}
                    currentState={currentState}
                    containerProps={containerProps}
                    darkMode={darkMode}
                    removeComponent={removeComponent}
                    parentId={id}
                    allComponents={containerProps.allComponents}
                    sideBarDebugger={containerProps.sideBarDebugger}
                    childComponents={childComponents}
                  />
                </div>
              );
            })}
        </fieldset>
      )}
    </form>
  );
};
