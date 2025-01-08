import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import _, { debounce, omit } from 'lodash';
import { Box } from '@/Editor/Box';
import { generateUIComponents } from './FormUtils';
import { useMounted } from '@/_hooks/use-mount';
import { onComponentClick, removeFunctionObjects } from '@/_helpers/appUtils';
import { useAppInfo } from '@/_stores/appDataStore';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import RenderSchema from './RenderSchema';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const getCanvasHeight = (height) => {
  const parsedHeight = height.includes('px') ? parseInt(height, 10) : height;

  return Math.ceil(parsedHeight);
};

// STYLE CONSTANTS
// 1. Form header
const FORM_HEADER = {
  HEIGHT: '80px',
  CANVAS_HEIGHT: 6,
};
const FORM_FOOTER = {
  HEIGHT: '80px',
  CANVAS_HEIGHT: 6,
};
export const Form = function Form(props) {
  const {
    id,
    component,
    width,
    height,
    styles,
    setExposedVariable,
    setExposedVariables,
    darkMode,
    fireEvent,
    properties,
    resetComponent = () => {},
    dataCy,
  } = props;
  const childComponents = useStore((state) => state.getChildComponents(id), shallow);
  const {
    borderRadius,
    borderColor,
    boxShadow,
    headerHeight,
    footerHeight,
    footerBackgroundColor,
    headerBackgroundColor,
  } = styles;
  const {
    buttonToSubmit,
    loadingState,
    advanced,
    JSONSchema,
    showHeader = false,
    showFooter = false,
    visibility,
    disabledState,
  } = properties;
  const backgroundColor =
    ['#fff', '#ffffffff'].includes(styles.backgroundColor) && darkMode ? '#232E3C' : styles.backgroundColor;
  const computedStyles = {
    backgroundColor,
    borderRadius: borderRadius ? parseFloat(borderRadius) : 0,
    border: `1px solid ${borderColor}`,
    height,
    display: visibility ? 'flex' : 'none',
    position: 'relative',
    boxShadow,
    flexDirection: 'column',
  };

  const formHeader = {
    flexShrink: 0,
    // height: headerHeight,
    padding: '10px 8px',
    borderBottom: '1px solid var(--border-weak)',
    backgroundColor:
      ['#fff', '#ffffffff'].includes(headerBackgroundColor) && darkMode ? '#1F2837' : headerBackgroundColor,
  };
  const formFooter = {
    flexShrink: 0,
    // height: footerHeight,
    padding: '10px 8px',
    borderTop: '1px solid var(--border-weak)',
    backgroundColor:
      ['#fff', '#ffffffff'].includes(footerBackgroundColor) && darkMode ? '#1F2837' : footerBackgroundColor,
  };
  const formContent = {
    overflow: 'hidden auto',
    display: 'flex',
    height: '100%',
    padding: '10px 8px',
  };

  const parentRef = useRef(null);
  const childDataRef = useRef({});

  const [childrenData, setChildrenData] = useState({});
  const [isValid, setValidation] = useState(true);
  const [uiComponents, setUIComponents] = useState([]);
  const mounted = useMounted();
  const canvasHeaderHeight = getCanvasHeight(headerHeight) / 10;
  const canvasFooterHeight = getCanvasHeight(footerHeight) / 10;

  useEffect(() => {
    const exposedVariables = {
      resetForm: async function () {
        resetComponent();
      },
      submitForm: async function () {
        if (isValid) {
          fireEvent('onSubmit').then(() => resetComponent());
        } else {
          fireEvent('onInvalid');
        }
      },
    };

    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extractData = (data) => {
    const result = {};

    for (const key in data) {
      const item = data[key];

      if (item.name === 'Text') {
        const textKey = item?.formKey ?? item?.text;
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
    if (mounted) resetComponent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(JSONSchema)]);

  useEffect(() => {
    advanced && setExposedVariable('children', []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced]);

  useEffect(() => {
    if (advanced) setUIComponents(generateUIComponents(JSONSchema, advanced, component?.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSONSchema, advanced]);

  const checkJsonChildrenValidtion = () => {
    const isValid = Object.values(childrenData).every((item) => item?.isValid !== false);
    return isValid;
  };

  useEffect(() => {
    let formattedChildData = {};
    let childValidation = true;
    if (!childComponents) {
      const exposedVariables = {
        data: formattedChildData,
        isValid: childValidation,
        ...(!advanced && { children: formattedChildData }),
      };

      setExposedVariables(exposedVariables);
      return setValidation(childValidation);
    }

    if (advanced) {
      formattedChildData = extractData(childrenData);
      childValidation = checkJsonChildrenValidtion();
    } else {
      Object.keys(childComponents ?? {}).forEach((childId) => {
        if (childrenData?.[childId]?.name) {
          const componentName = childComponents?.[childId]?.component?.component?.name;
          formattedChildData[componentName] = { ...omit(childrenData[childId], 'name'), id: childId };
          childValidation = childValidation && (childrenData[childId]?.isValid ?? true);
        }
      });
    }
    formattedChildData = Object.fromEntries(
      // eslint-disable-next-line no-unused-vars
      Object.entries(formattedChildData).map(([key, { formKey, ...rest }]) => [key, rest]) // removing formkey from final exposed data
    );
    const formattedChildDataClone = deepClone(formattedChildData);
    const exposedVariables = {
      ...(!advanced && { children: formattedChildDataClone }),
      data: removeFunctionObjects(formattedChildData),
      isValid: childValidation,
    };
    setExposedVariables(exposedVariables);
    setValidation(childValidation);
  }, [childrenData, advanced]);

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
      fireEvent('onSubmit').then(() => {
        debounce(() => resetComponent(), 100)();
      });
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

  function onComponentOptionChangedForSubcontainer(component, key, value, id = '') {
    if (typeof value === 'function') {
      return Promise.resolve();
    }
    onOptionChange(key, value, id, component);
  }

  function onComponentOptionsChangedForSubcontainer(component, exposedValues, id) {
    const transformedExposedValues = Object.entries(exposedValues).reduce((acc, [key, value]) => {
      if (typeof value === 'function') {
        return acc;
      }
      return { ...acc, [key]: value };
    }, {});
    onOptionsChange(transformedExposedValues, id, component);
  }

  const onOptionChange = (key, value, id, component) => {
    if (!component) {
      component = childComponents?.[id]?.component?.component;
    }
    const optionData = {
      ...(childDataRef.current[id] ?? {}),
      name: component?.name,
      [key]: value,
      formKey: component?.formKey,
    };
    childDataRef.current = { ...childDataRef.current, [id]: optionData };
    setChildrenData(childDataRef.current);
  };

  const onOptionsChange = (exposedValues, id, component) => {
    if (!component) {
      component = childComponents?.[id]?.component?.component;
    }
    Object.entries(exposedValues).forEach(([key, value]) => {
      const optionData = {
        name: component?.name,
        ...(childDataRef.current[id] ?? {}),
        [key]: value,
        formKey: component?.formKey,
      };
      childDataRef.current = { ...childDataRef.current, [id]: optionData };
    });
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
        if (e.target.className === 'real-canvas') onComponentClick(id, component);
      }} //Hack, should find a better solution - to prevent losing z index+1 when container element is clicked
    >
      {showHeader && (
        <div style={formHeader}>
          <SubContainer
            id={`${id}-header`}
            canvasHeight={canvasHeaderHeight}
            canvasWidth={width}
            allowContainerSelect={false}
            darkMode={darkMode}
            styles={{
              backgroundColor: 'transparent',
              height: headerHeight,
            }}
          />
        </div>
      )}
      <div className="jet-form-body" style={formContent}>
        {loadingState ? (
          <div className="p-2" style={{ margin: '0px auto' }}>
            <center>
              <div className="spinner-border mt-5" role="status"></div>
            </center>
          </div>
        ) : (
          <fieldset disabled={disabledState} style={{ width: '100%' }}>
            {!advanced && (
              <div className={'json-form-wrapper-disabled'} style={{ width: '100%', height: '100%' }}>
                <SubContainer
                  id={id}
                  canvasHeight={computedStyles.height}
                  canvasWidth={width}
                  onOptionChange={onOptionChange}
                  onOptionsChange={onOptionsChange}
                  styles={{ backgroundColor: computedStyles.backgroundColor }}
                  darkMode={darkMode}
                />
                {/* <SubContainer
                  parentComponent={component}
                  containerCanvasWidth={width}
                  parent={id}
                  parentRef={parentRef}
                  removeComponent={removeComponent}
                  onOptionChange={function ({ component, optionName, value, componentId }) {
                    if (componentId) {
                      onOptionChange({ component, optionName, value, componentId });
                    }
                  }}
                  currentPageId={props.currentPageId}
                  {...props}
                  {...containerProps}
                  height={'100%'} // This height is required since Subcontainer has a issue if height is provided, it stores it in the ref and never updates that ref
                />
                <SubCustomDragLayer
                  containerCanvasWidth={width}
                  parent={id}
                  parentRef={parentRef}
                  currentLayout={currentLayout}
                /> */}
              </div>
            )}
            {advanced &&
              uiComponents?.map((item, index) => {
                return (
                  <div
                    //check to avoid labels for these widgets as label is already present for them
                    className={
                      ![
                        'Checkbox',
                        'StarRating',
                        'Multiselect',
                        'DropDown',
                        'RadioButton',
                        'ToggleSwitch',
                        'ToggleSwitchV2',
                      ].includes(uiComponents?.[index + 1]?.component)
                        ? `json-form-wrapper json-form-wrapper-disabled`
                        : `json-form-wrapper  json-form-wrapper-disabled form-label-restricted`
                    }
                    key={index}
                  >
                    <div style={{ position: 'relative' }} className={`form-ele form-${id}-${index}`}>
                      <RenderSchema
                        component={item}
                        parent={id}
                        id={index}
                        darkMode={darkMode}
                        onOptionChange={onComponentOptionChangedForSubcontainer}
                        onOptionsChange={onComponentOptionsChangedForSubcontainer}
                      />
                    </div>
                    {/* <Box
                      {...props}
                      component={item}
                      id={index}
                      width={width}
                      height={item.defaultSize.height}
                      mode={mode}
                      inCanvas={true}
                      paramUpdated={paramUpdated}
                      onEvent={onEvent}
                      onComponentClick={onComponentClick}
                      darkMode={darkMode}
                      removeComponent={removeComponent}
                      // canvasWidth={width}
                      // readOnly={readOnly}
                      // customResolvables={customResolvables}
                      parentId={id}
                      getContainerProps={getContainerProps}
                      onOptionChanged={onComponentOptionChangedForSubcontainer}
                      onOptionsChanged={onComponentOptionsChanged}
                      isFromSubContainer={true}
                    /> */}
                  </div>
                );
              })}
          </fieldset>
        )}
      </div>
      {showFooter && (
        <div className="jet-form-footer" style={formFooter}>
          <SubContainer
            id={`${id}-footer`}
            canvasHeight={canvasFooterHeight}
            canvasWidth={width}
            allowContainerSelect={false}
            darkMode={darkMode}
            styles={{
              margin: 0,
              backgroundColor: 'transparent',
              height: footerHeight,
            }}
          />
        </div>
      )}
    </form>
  );
};
