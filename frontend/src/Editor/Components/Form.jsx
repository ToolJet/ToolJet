import React, { useRef, useState, useEffect } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { omit } from 'lodash';
import { restrictedChildWidgets } from '@/Editor/WidgetManager/restrictedWidgetsConfig';

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
  } = props;
  const { visibility, disabledState, borderRadius, borderColor } = styles;
  const { buttonToSubmit, loadingState } = properties;
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
    const formattedChildData = {};
    let childValidation = true;

    if (childComponents === null) {
      setExposedVariable('data', formattedChildData);
      setExposedVariable('isValid', childValidation);
      return setValidation(childValidation);
    }

    Object.keys(childComponents).forEach((childId) => {
      if (childrenData[childId]?.name) {
        formattedChildData[childrenData[childId].name] = omit(childrenData[childId], 'name');
        childValidation = childValidation && (childrenData[childId]?.isValid ?? true);
      }
    });

    setExposedVariable('data', formattedChildData);
    setExposedVariable('isValid', childValidation);
    setValidation(childValidation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenData, childComponents]);

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

  return (
    <form
      className="jet-container"
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
            restrictedChildWidgets={restrictedChildWidgets.Form}
          />
          <SubCustomDragLayer
            containerCanvasWidth={width}
            parent={id}
            parentRef={parentRef}
            currentLayout={containerProps.currentLayout}
          />
        </fieldset>
      )}
    </form>
  );
};
