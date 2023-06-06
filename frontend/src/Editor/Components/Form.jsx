import React, { useRef, useState, useEffect } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import _, { omit } from 'lodash';
import { Box } from '../Box';
import { componentTypes } from '@/Editor/WidgetManager/components';
import { v4 as uuidv4 } from 'uuid';

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
    allComponents,
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
  // const layoutData = true ? layouts[currentLayout] || defaultData : defaultData;

  const [childrenData, setChildrenData] = useState({});
  const [isValid, setValidation] = useState(true);
  const [comp, setComp] = useState([]);

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

  useEffect(() => {
    if (!Array.isArray(JSONSchema)) {
      return;
    }
    const arr = [];
    JSONSchema?.map((item, index) => {
      let comp = JSON.parse(JSON.stringify(componentTypes.find((component) => component.component == item?.type)));
      comp = { ...comp, id: uuidv4() };
      arr.push(comp);
      setComp(arr);
    });
  }, []);

  useEffect(() => {
    if (!Array.isArray(JSONSchema)) {
      return;
    }
    JSONSchema?.map((item, index) => {
      if (comp.length) {
        if (comp[index]) {
          switch (item.type) {
            case 'Button':
              comp[index]['definition']['styles']['backgroundColor']['value'] = item?.styles?.backgroundColor;
              comp[index]['definition']['styles']['textColor']['value'] = item?.styles?.textColor;
              comp[index]['definition']['styles']['borderRadius']['value'] = item?.styles?.borderRadius;
              comp[index]['definition']['styles']['borderColor']['value'] = item?.styles?.borderColor;
              comp[index]['definition']['styles']['loaderColor']['value'] = item?.styles?.loaderColor;
              comp[index]['definition']['styles']['visibility']['value'] = item?.styles?.visibility;
              comp[index]['definition']['styles']['disabledState']['value'] = item?.styles?.disabledState;

              comp[index]['definition']['properties']['text']['value'] = item?.text;
              break;
            case 'Text':
              comp[index]['definition']['styles']['backgroundColor']['value'] = item?.styles?.backgroundColor;
              comp[index]['definition']['styles']['textColor']['value'] = item?.styles?.textColor;
              comp[index]['definition']['styles']['textSize']['value'] = item?.styles?.fontSize;

              comp[index]['definition']['properties']['text']['value'] = item?.text;
              break;
            case 'TextInput':
              comp[index]['definition']['styles']['backgroundColor']['value'] = item?.styles?.backgroundColor;
              comp[index]['definition']['styles']['borderRadius']['value'] = item?.styles?.borderRadius;
              comp[index]['definition']['styles']['textColor']['value'] = item?.styles?.textColor;
              comp[index]['definition']['styles']['errTextColor']['value'] = item?.styles?.errorTextColor;
              comp[index]['definition']['styles']['borderColor']['value'] = item?.styles?.borderColor;
              comp[index]['definition']['styles']['disabledState']['value'] = item?.styles?.disabledState;
              comp[index]['definition']['styles']['visibility']['value'] = item?.styles?.visibility;

              comp[index]['definition']['validation']['customRule']['value'] = item?.validation?.customRule;
              comp[index]['definition']['validation']['maxLength']['value'] = item?.validation?.maxLength;
              comp[index]['definition']['validation']['minLength']['value'] = item?.validation?.minLength;
              comp[index]['definition']['validation']['regex']['value'] = item?.validation?.regex;

              comp[index]['definition']['properties']['value']['value'] = item?.value;
              comp[index]['definition']['properties']['placeholder']['value'] = item?.placeholder;
              break;
            case 'NumberInput':
              comp[index]['definition']['styles']['backgroundColor']['value'] = item?.styles?.backgroundColor;
              comp[index]['definition']['styles']['borderRadius']['value'] = item?.styles?.borderRadius;
              comp[index]['definition']['styles']['textColor']['value'] = item?.styles?.textColor;
              comp[index]['definition']['styles']['errTextColor']['value'] = item?.styles?.errorTextColor;
              comp[index]['definition']['styles']['borderColor']['value'] = item?.styles?.borderColor;
              comp[index]['definition']['styles']['disabledState']['value'] = item?.styles?.disabledState;
              comp[index]['definition']['styles']['visibility']['value'] = item?.styles?.visibility;

              comp[index]['definition']['properties']['value']['value'] = item?.value;
              comp[index]['definition']['properties']['maxValue']['value'] = item?.maxValue;
              comp[index]['definition']['properties']['minValue']['value'] = item?.minValue;
              comp[index]['definition']['properties']['placeholder']['value'] = item?.placeholder;
              break;

            case 'PasswordInput':
              comp[index]['definition']['styles']['backgroundColor']['value'] = item?.styles?.backgroundColor;
              comp[index]['definition']['styles']['borderRadius']['value'] = item?.styles?.borderRadius;
              comp[index]['definition']['styles']['disabledState']['value'] = item?.styles?.disabledState;
              comp[index]['definition']['styles']['visibility']['value'] = item?.styles?.visibility;

              comp[index]['definition']['validation']['customRule']['value'] = item?.validation?.customRule;
              comp[index]['definition']['validation']['maxLength']['value'] = item?.validation?.maxLength;
              comp[index]['definition']['validation']['minLength']['value'] = item?.validation?.minLength;
              comp[index]['definition']['validation']['regex']['value'] = item?.validation?.regex;

              comp[index]['definition']['properties']['placeholder']['value'] = item?.placeholder;
              break;

            case 'Datepicker':
              comp[index]['definition']['styles']['borderRadius']['value'] = item?.styles?.borderRadius;
              comp[index]['definition']['styles']['disabledState']['value'] = item?.styles?.disabledState;
              comp[index]['definition']['styles']['visibility']['value'] = item?.styles?.visibility;

              comp[index]['definition']['validation']['customRule']['value'] = item?.customRule;

              comp[index]['definition']['properties']['defaultValue']['value'] = item?.defaultValue;
              comp[index]['definition']['properties']['disabledDates']['value'] = item?.disabledDates;
              comp[index]['definition']['properties']['enableDate']['value'] = item?.enableDate;
              comp[index]['definition']['properties']['enableTime']['value'] = item?.enableTime;
              comp[index]['definition']['properties']['format']['value'] = item?.format;

              break;

            case 'Checkbox':
              comp[index]['definition']['styles']['checkboxColor']['value'] = item?.styles?.checkboxColor;
              comp[index]['definition']['styles']['disabledState']['value'] = item?.styles?.disabledState;
              comp[index]['definition']['styles']['textColor']['value'] = item?.styles?.textColor;
              comp[index]['definition']['styles']['visibility']['value'] = item?.styles?.visibility;

              comp[index]['definition']['properties']['defaultValue']['value'] = item?.defaultValue;
              comp[index]['definition']['properties']['label']['value'] = item?.label;

              break;

            case 'RadioButton':
              comp[index]['definition']['styles']['textColor']['value'] = item?.styles?.textColor;
              comp[index]['definition']['styles']['disabledState']['value'] = item?.styles?.disabledState;
              comp[index]['definition']['styles']['visibility']['value'] = item?.styles?.visibility;

              comp[index]['definition']['properties']['display_values']['value'] = item?.display_values;
              comp[index]['definition']['properties']['label']['value'] = item?.label;
              comp[index]['definition']['properties']['value']['value'] = item?.value;
              comp[index]['definition']['properties']['values']['value'] = item?.values;
              comp[index]['definition']['properties']['visible']['value'] = item?.visible;
              break;

            case 'ToggleSwitch':
              comp[index]['definition']['styles']['textColor']['value'] = item?.styles?.textColor;
              comp[index]['definition']['styles']['disabledState']['value'] = item?.styles?.disabledState;
              comp[index]['definition']['styles']['visibility']['value'] = item?.styles?.visibility;
              comp[index]['definition']['styles']['toggleSwitchColor']['value'] = item?.styles?.toggleSwitchColor;

              comp[index]['definition']['properties']['defaultValue']['value'] = item?.defaultValue;
              comp[index]['definition']['properties']['label']['value'] = item?.label;

              break;

            case 'TextArea':
              comp[index]['definition']['styles']['disabledState']['value'] = item?.styles?.disabledState;
              comp[index]['definition']['styles']['visibility']['value'] = item?.styles?.visibility;
              comp[index]['definition']['styles']['borderRadius']['value'] = item?.styles?.borderRadius;

              comp[index]['definition']['properties']['value']['value'] = item?.value;
              comp[index]['definition']['properties']['placeholder']['value'] = item?.placeholder;

              break;

            case 'DaterangePicker':
              comp[index]['definition']['styles']['disabledState']['value'] = item?.styles?.disabledState;
              comp[index]['definition']['styles']['visibility']['value'] = item?.styles?.visibility;
              comp[index]['definition']['styles']['borderRadius']['value'] = item?.styles?.borderRadius;

              comp[index]['definition']['properties']['defaultEndDate']['value'] = item?.defaultEndDate;
              comp[index]['definition']['properties']['defaultStartDate']['value'] = item?.defaultStartDate;
              comp[index]['definition']['properties']['format']['value'] = item?.format;

              break;

            case 'DropDown':
              comp[index]['definition']['styles']['disabledState']['value'] = item?.styles?.disabledState;
              comp[index]['definition']['styles']['visibility']['value'] = item?.styles?.visibility;
              comp[index]['definition']['styles']['borderRadius']['value'] = item?.styles?.borderRadius;
              comp[index]['definition']['styles']['justifyContent']['value'] = item?.styles?.justifyContent;

              comp[index]['definition']['validation']['customRule']['value'] = item?.customRule;

              comp[index]['definition']['properties']['display_values']['value'] = item?.display_values;
              comp[index]['definition']['properties']['label']['value'] = item?.label;
              comp[index]['definition']['properties']['value']['value'] = item?.value;
              comp[index]['definition']['properties']['values']['value'] = item?.values;
              comp[index]['definition']['properties']['loadingState']['value'] = item?.loadingState;
              break;

            case 'Multiselect':
              comp[index]['definition']['styles']['disabledState']['value'] = item?.styles?.disabledState;
              comp[index]['definition']['styles']['visibility']['value'] = item?.styles?.visibility;
              comp[index]['definition']['styles']['borderRadius']['value'] = item?.styles?.borderRadius;

              comp[index]['definition']['properties']['display_values']['value'] = item?.display_values;
              comp[index]['definition']['properties']['label']['value'] = item?.label;
              comp[index]['definition']['properties']['value']['value'] = item?.value;
              comp[index]['definition']['properties']['values']['value'] = item?.values;
              comp[index]['definition']['properties']['showAllOption']['value'] = item?.showAllOption;
              break;

            case 'StarRating':
              comp[index]['definition']['styles']['disabledState']['value'] = item?.styles?.disabledState;
              comp[index]['definition']['styles']['visibility']['value'] = item?.styles?.visibility;
              comp[index]['definition']['styles']['textColor']['value'] = item?.styles?.textColor;
              comp[index]['definition']['styles']['labelColor']['value'] = item?.styles?.labelColor;

              comp[index]['definition']['properties']['allowHalfStar']['value'] = item?.allowHalfStar;
              comp[index]['definition']['properties']['defaultSelected']['value'] = item?.defaultSelected;
              comp[index]['definition']['properties']['label']['value'] = item?.label;
              comp[index]['definition']['properties']['maxRating']['value'] = item?.maxRating;
              comp[index]['definition']['properties']['tooltips']['value'] = item?.tooltips;
              comp[index]['definition']['properties']['visible']['value'] = item?.visible;

              break;

            case 'FilePicker':
              comp[index]['definition']['styles']['disabledState']['value'] = item?.styles?.disabledState;
              comp[index]['definition']['styles']['visibility']['value'] = item?.styles?.visibility;
              comp[index]['definition']['styles']['borderRadius']['value'] = item?.styles?.borderRadius;

              comp[index]['definition']['properties']['enableDropzone']['value'] = item?.enableDropzone;
              comp[index]['definition']['properties']['enableMultiple']['value'] = item?.enableMultiple;
              comp[index]['definition']['properties']['enablePicker']['value'] = item?.enablePicker;
              comp[index]['definition']['properties']['fileType']['value'] = item?.fileType;
              comp[index]['definition']['properties']['instructionText']['value'] = item?.instructionText;
              comp[index]['definition']['properties']['maxFileCount']['value'] = item?.maxFileCount;
              comp[index]['definition']['properties']['maxSize']['value'] = item?.maxSize;
              comp[index]['definition']['properties']['minSize']['value'] = item?.minSize;
              comp[index]['definition']['properties']['parseContent']['value'] = item?.parseContent;
              comp[index]['definition']['properties']['parseFileType']['value'] = item?.parseFileType;
              break;

            default:
              break;
          }
        }
      }
    });
  }, [JSONSchema]);

  useEffect(() => {
    const formattedChildData = {};
    let childValidation = true;

    if (childComponents === null) {
      setExposedVariable('data', formattedChildData);
      setExposedVariable('isValid', childValidation);
      return setValidation(childValidation);
    }
    if (!advanced) {
      Object.keys(childComponents).forEach((childId) => {
        if (childrenData[childId]?.name) {
          formattedChildData[childrenData[childId].name] = omit(childrenData[childId], 'name');
          childValidation = childValidation && (childrenData[childId]?.isValid ?? true);
        }
      });

      setExposedVariable('data', formattedChildData);
      setExposedVariable('isValid', childValidation);
      setValidation(childValidation);
    } else {
      setExposedVariable('data', 'formattedChildData');
      setExposedVariable('isValid', 'childValidation');
      setValidation(childValidation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenData, childComponents, advanced]);

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
  }, [buttonToSubmit, isValid]);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const handleFormSubmission = ({ detail: { buttonComponentId } }) => {
    if (buttonToSubmit === buttonComponentId) {
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
    if (componentId) {
      const optionData = {
        ...(childDataRef.current[componentId] ?? {}),
        name: component.name,
        [optionName]: value,
      };

      childDataRef.current = { ...childDataRef.current, [componentId]: optionData };
      setChildrenData(childDataRef.current);
    }
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
      }} //Hack, should find a better solution - to prevent losing z index when container element is clicked
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
            comp.map((item) => (
              <div className="json-form-wrapper" key={item.id}>
                <Box
                  component={item}
                  id={item.id}
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
            ))}
        </fieldset>
      )}
    </form>
  );
};
