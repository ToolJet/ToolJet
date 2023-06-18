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
        const textKey = item.text.toLowerCase();
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
      // if (!typeof JSONSchema?.properties !== 'object' && JSONSchema?.properties !== null) {
      //   return;
      // }
      const uiComponentsDraft = [];
      // eslint-disable-next-line no-unused-vars
      Object.entries(JSONSchema?.properties).forEach(([key, value]) => {
        uiComponentsDraft.push(structuredClone(componentTypes.find((component) => component.component == 'Text')));
        uiComponentsDraft.push(structuredClone(componentTypes.find((component) => component.component == value?.type)));
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
                value?.styles?.disabledState;
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['visibility']['value'] =
                value?.styles?.visibility;
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['borderRadius']['value'] =
                value?.styles?.borderRadius;
              uiComponentsDraft[index * 2 + 1]['definition']['styles']['justifyContent']['value'] =
                value?.styles?.justifyContent;

              uiComponentsDraft[index * 2 + 1]['definition']['validation']['customRule']['value'] = value?.customRule;

              uiComponentsDraft[index * 2 + 1]['definition']['properties']['display_values']['value'] =
                value?.display_values;
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['label']['value'] = value?.label;
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['value']['value'] = value?.value;
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['values']['value'] = value?.values;
              uiComponentsDraft[index * 2 + 1]['definition']['properties']['loadingState']['value'] =
                value?.loadingState;
              break;
          }
          uiComponentsDraft[index * 2]['definition']['properties']['text']['value'] = key;
        }
      });
      if (JSONSchema?.title) {
        uiComponentsDraft.unshift(structuredClone(componentTypes.find((component) => component.component == 'Text')));
        uiComponentsDraft[0]['definition']['properties']['text']['value'] = JSONSchema?.title;
      }

      setUIComponents(uiComponentsDraft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(JSONSchema?.properties), advanced]);

  useEffect(() => {
    const formattedChildData = {};
    let childValidation = true;

    if (childComponents === null) {
      setExposedVariable('data', formattedChildData);
      setExposedVariable('isValid', childValidation);
      return setValidation(childValidation);
    }

    if (advanced) {
      const data = extractData(childrenData);
      setExposedVariable('data', data);
      setExposedVariable('isValid', 'childValidation');
      setValidation(childValidation);
    } else {
      Object.keys(childComponents).forEach((childId) => {
        if (childrenData[childId]?.name) {
          formattedChildData[childrenData[childId].name] = omit(childrenData[childId], 'name');
          childValidation = childValidation && (childrenData[childId]?.isValid ?? true);
        }
      });
      setExposedVariable('data', formattedChildData);
      setExposedVariable('isValid', childValidation);
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
    const optionData2 = {
      ...(childDataRef.current[componentId] ?? {}),
      name: component.name,
      [optionName]: value,
    };
    childDataRef.current = { ...childDataRef.current, [componentId]: optionData2 };
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
