import React, { useRef, useState, useEffect } from 'react';
import { SubCustomDragLayer } from '@/Editor/SubCustomDragLayer';
import { SubContainer } from '@/Editor/SubContainer';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import _, { omit } from 'lodash';
import { Box } from '@/Editor/Box';
import { generateUIComponents } from './FormUtils';

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
        const textKey = item?.keyValue ?? item?.text;
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
    setUIComponents(generateUIComponents(JSONSchema, advanced));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(JSONSchema), advanced]);

  const checkJsonChildrenValidtion = () => {
    const isValid = Object.values(childrenData).every((item) => item?.isValid !== false);
    return isValid;
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
    formattedChildData = Object.fromEntries(
      // eslint-disable-next-line no-unused-vars
      Object.entries(formattedChildData).map(([key, { keyValue, ...rest }]) => [key, rest])
    );

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
  }, [buttonToSubmit, isValid, advanced, JSON.stringify(uiComponents)]);

  const handleSubmit = (event) => {
    event.preventDefault();
  };
  const fireSubmissionEvent = () => {
    if (isValid) {
      onEvent('onSubmit', { component }).then(() => resetComponent());
    } else {
      fireEvent('onInvalid');
    }
  };

  const handleFormSubmission = ({ detail: { buttonComponentId } }) => {
    if (!advanced) {
      if (buttonToSubmit === buttonComponentId) {
        fireSubmissionEvent();
      }
    } else if (buttonComponentId == uiComponents.length - 1 && JSONSchema.hasOwnProperty('submitButton')) {
      fireSubmissionEvent();
    }
  };
  function onComponentOptionChangedForSubcontainer(component, optionName, value, componentId = '') {
    if (typeof value === 'function' && _.findKey({}, optionName)) {
      return Promise.resolve();
    }
    onOptionChange({ component, optionName, value, componentId });
    return containerProps.onComponentOptionChanged(component, optionName, value);
  }
  function findKeyByLabel(obj, label) {
    const keys = Object.keys(obj);
    return keys.find((key) => obj[key].label === label);
  }
  const onOptionChange = ({ component, optionName, value, componentId }) => {
    let keyValue = JSONSchema?.properties && findKeyByLabel(JSONSchema.properties, value);

    const optionData = {
      ...(childDataRef.current[componentId] ?? {}),
      name: component.name,
      [optionName]: value,
      keyValue: keyValue, //adding this to use as exposed key
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
                    onOptionChange({ component, optionName, value, componentId });
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
            uiComponents?.map((item, index) => {
              return (
                <div
                  //check to avoid labels for these widgets as label is already present for them
                  className={
                    !['Checkbox', 'StarRating', 'Multiselect', 'DropDown', 'RadioButton', 'ToggleSwitch'].includes(
                      uiComponents?.[index + 1]?.component
                    )
                      ? `json-form-wrapper`
                      : `json-form-wrapper  form-label-restricted`
                  }
                  key={index}
                >
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
