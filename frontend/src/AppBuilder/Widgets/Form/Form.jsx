import React, { useRef, useState, useEffect } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
// eslint-disable-next-line import/no-unresolved
import _, { debounce, omit } from 'lodash';
import { generateUIComponents, getBodyHeight } from './FormUtils';
import { useMounted } from '@/_hooks/use-mount';
import { onComponentClick, removeFunctionObjects } from '@/_helpers/appUtils';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import RenderSchema from './RenderSchema';
import useStore from '@/AppBuilder/_stores/store';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { shallow } from 'zustand/shallow';
import {
  CONTAINER_FORM_CANVAS_PADDING,
  SUBCONTAINER_CANVAS_BORDER_WIDTH,
} from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { HorizontalSlot } from './Components/HorizontalSlot';
import { useActiveSlot } from '@/AppBuilder/_hooks/useActiveSlot';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';

import './form.scss';

const FormComponent = (props) => {
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
    onComponentClick,
  } = props;
  const childComponents = useStore((state) => state.getChildComponents(id), shallow);
  const { borderRadius, borderColor, boxShadow, footerBackgroundColor, headerBackgroundColor } = styles;
  const {
    buttonToSubmit,
    advanced,
    JSONSchema,
    showHeader = false,
    showFooter = false,
    headerHeight = 80,
    footerHeight = 80,
    canvasHeight,
    validateOnSubmit = true,
    resetOnSubmit = true,
  } = properties;

  const { isDisabled, isVisible, isLoading } = useExposeState(
    properties.loadingState,
    properties.visibility,
    properties.disabledState,
    setExposedVariables,
    setExposedVariable
  );
  const backgroundColor =
    ['#fff', '#ffffffff'].includes(styles.backgroundColor) && darkMode ? '#232E3C' : styles.backgroundColor;

  const computedFormBodyHeight = getBodyHeight(height, showHeader, showFooter, headerHeight, footerHeight);
  const computedBorderRadius = `${borderRadius ? parseFloat(borderRadius) : 0}px`;

  const computedStyles = {
    backgroundColor,
    borderRadius: borderRadius ? parseFloat(borderRadius) : 0,
    border: `${SUBCONTAINER_CANVAS_BORDER_WIDTH}px solid ${borderColor}`,
    height,
    display: isVisible ? 'flex' : 'none',
    position: 'relative',
    boxShadow,
    flexDirection: 'column',
    clipPath: `inset(0 round ${computedBorderRadius})`,
  };

  const formContent = {
    overflow: 'hidden auto',
    display: 'flex',
    height: '100%',
    paddingTop: `${CONTAINER_FORM_CANVAS_PADDING}px`,
    paddingBottom: showFooter ? '3px' : '7px',
    paddingLeft: `${CONTAINER_FORM_CANVAS_PADDING}px`,
    paddingRight: `${CONTAINER_FORM_CANVAS_PADDING}px`,
  };

  const parentRef = useRef(null);
  const childDataRef = useRef({});

  const [childrenData, setChildrenData] = useState({});
  const [isValid, setValidation] = useState(true);
  const [uiComponents, setUIComponents] = useState([]);
  const mounted = useMounted();

  useEffect(() => {
    const exposedVariables = {
      resetForm: async function () {
        resetComponent();
      },
      submitForm: async function () {
        if (validateOnSubmit) {
          if (!isValid) {
            return fireEvent('onInvalid');
          }
        }
        fireEvent('onSubmit').then(() => resetOnSubmit && resetComponent());
      },
    };

    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetOnSubmit, validateOnSubmit]);

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
    let formData = {}; // New object to store form data

    if (!childComponents) {
      const exposedVariables = {
        data: formattedChildData,
        isValid: childValidation,
        formData, // Expose formData
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
          const componentValue = (() => {
            const childData = childrenData[childId];
            if (!childData) return null; // Default to null if childData is undefined

            if (childData.hasOwnProperty('value')) return childData.value;
            if (childData.hasOwnProperty('values')) return childData.values;
            if (childData.hasOwnProperty('file')) return childData.file;
            if (childData.hasOwnProperty('selectedDateRange')) return childData.selectedDateRange;

            return null; // Default to null if no matching key is found
          })();

          if (componentValue !== null) {
            formData[componentName] = componentValue; // Populate formData
          }
          formattedChildData[componentName] = { ...omit(childrenData[childId], 'name'), id: childId };
          childValidation = childValidation && (childrenData[childId]?.isValid ?? true);
        }
      });
    }

    formattedChildData = Object.fromEntries(
      Object.entries(formattedChildData).map(([key, { formKey, ...rest }]) => [key, rest]) // removing formKey from final exposed data
    );

    const formattedChildDataClone = deepClone(formattedChildData);
    const exposedVariables = {
      ...(!advanced && { children: formattedChildDataClone }),
      data: removeFunctionObjects(formattedChildData),
      isValid: childValidation,
      formData, // Expose formData
    };

    setExposedVariables(exposedVariables);
    setValidation(childValidation);
  }, [childrenData, advanced]);

  useEffect(() => {
    document.addEventListener('submitForm', handleFormSubmission);
    return () => document.removeEventListener('submitForm', handleFormSubmission);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buttonToSubmit, isValid, advanced, JSON.stringify(uiComponents), resetOnSubmit, validateOnSubmit]);

  const handleSubmit = (event) => {
    event.preventDefault();
  };
  const fireSubmissionEvent = () => {
    if (validateOnSubmit) {
      if (!isValid) {
        return fireEvent('onInvalid');
      }
    }
    fireEvent('onSubmit').then(() => {
      if (resetOnSubmit) {
        debounce(() => resetComponent(), 100)();
      }
    });
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

  const mode = useStore((state) => state.currentMode, shallow);
  const isEditing = mode === 'edit';

  const activeSlot = useActiveSlot(isEditing ? id : null); // Track the active slot for this widget
  const setComponentProperty = useStore((state) => state.setComponentProperty, shallow);
  // const updateContainerAutoHeight = useStore((state) => state.updateContainerAutoHeight);

  const updateHeaderSizeInStore = ({ newHeight }) => {
    const _height = parseInt(newHeight, 10);
    setComponentProperty(id, `headerHeight`, _height, 'properties', 'value', false);
  };

  const updateFooterSizeInStore = ({ newHeight }) => {
    const _height = parseInt(newHeight, 10);
    setComponentProperty(id, `footerHeight`, _height, 'properties', 'value', false);
  };

  const [canHeight, setCanHeight] = useState('100%');
  useEffect(() => {
    // const newHeight = parseInt(height, 10) - 14;

    // const autoCanvasHeight = document.querySelector(`#canvas-${id}`)?.scrollHeight;
    const wrapHeight = parseInt(computedFormBodyHeight, 10);
    // Set height to the larger value between computed body height and canvas scroll height
    const maxHeight = Math.max(wrapHeight, canvasHeight || 10);

    const roundedHeight = Math.round(maxHeight / 10) * 10;
    setCanHeight(`${roundedHeight}px`);
  }, [computedFormBodyHeight, canvasHeight]);
  const headerMaxHeight = parseInt(height, 10) - parseInt(footerHeight, 10) - 100 - 10;
  const footerMaxHeight = parseInt(height, 10) - parseInt(headerHeight, 10) - 100 - 10;
  const formFooter = {
    flexShrink: 0,
    paddingTop: '3px',
    paddingBottom: '7px',
    paddingLeft: `${CONTAINER_FORM_CANVAS_PADDING}px`,
    paddingRight: `${CONTAINER_FORM_CANVAS_PADDING}px`,
    maxHeight: `${footerMaxHeight}px`,
    backgroundColor:
      ['#fff', '#ffffffff'].includes(footerBackgroundColor) && darkMode ? '#1F2837' : footerBackgroundColor,
  };
  const formHeader = {
    flexShrink: 0,
    paddingBottom: '3px',
    paddingTop: '7px',
    paddingLeft: `${CONTAINER_FORM_CANVAS_PADDING}px`,
    paddingRight: `${CONTAINER_FORM_CANVAS_PADDING}px`,
    maxHeight: `${headerMaxHeight}px`,
    backgroundColor:
      ['#fff', '#ffffffff'].includes(headerBackgroundColor) && darkMode ? '#1F2837' : headerBackgroundColor,
  };

  return (
    <form
      className={`jet-container jet-form-widget ${advanced && 'jet-container-json-form'}`}
      id={id}
      data-cy={dataCy}
      ref={parentRef}
      style={computedStyles}
      onSubmit={handleSubmit}
      onClick={(e) => {
        if (e.target.className === 'real-canvas') onComponentClick(id, component);
      }} //Hack, should find a better solution - to prevent losing z index+1 when container element is clicked
    >
      {!advanced && showHeader && (
        <HorizontalSlot
          slotName="header"
          slotStyle={formHeader}
          isEditing={isEditing}
          id={`${id}-header`}
          height={headerHeight}
          width={width}
          darkMode={darkMode}
          isDisabled={isDisabled}
          isActive={activeSlot === `${id}-header`}
          onResize={updateHeaderSizeInStore}
        />
      )}

      <div className="jet-form-body sub-container-overflow-wrap" style={formContent}>
        {isLoading ? (
          <div className="p-2 tw-flex tw-items-center tw-justify-center" style={{ margin: '0px auto' }}>
            <div className="spinner-border" role="status"></div>
          </div>
        ) : (
          <fieldset disabled={isDisabled} style={{ width: '100%' }}>
            {!advanced && (
              <div className={'json-form-wrapper-disabled'} style={{ width: '100%', height: canHeight || '100%' }}>
                <SubContainer
                  id={id}
                  canvasHeight={parseInt(computedFormBodyHeight, 10)}
                  canvasWidth={width}
                  onOptionChange={onOptionChange}
                  onOptionsChange={onOptionsChange}
                  styles={{
                    backgroundColor: computedStyles.backgroundColor,
                    height: canHeight,
                  }}
                  darkMode={darkMode}
                  componentType="Form"
                />
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
                  </div>
                );
              })}
          </fieldset>
        )}
      </div>
      {!advanced && showFooter && (
        <HorizontalSlot
          slotName="footer"
          slotStyle={formFooter}
          isEditing={isEditing}
          id={`${id}-footer`}
          height={footerHeight}
          width={width}
          darkMode={darkMode}
          isDisabled={isDisabled}
          onResize={updateFooterSizeInStore}
          isActive={activeSlot === `${id}-footer`}
        />
      )}
    </form>
  );
};

// Avoid rendering the Form component if there are no changes in properties or
// changes are only in `generateFormFrom` as it is not required to re-render
export const Form = React.memo(FormComponent, (prevProps, nextProps) => {
  const diffInProps = diff(prevProps, nextProps) ?? {};

  if (Object.keys(diffInProps).length === 0) return true; // No changes detected, no need to re-render
  if (Object.keys(diffInProps).length === 1) {
    if (diffInProps['properties'] && diffInProps['properties']['generateFormFrom']) {
      return true; // No changes detected in childrenData, no need to re-render
    }
  }
  return false; // Changes detected, re-render the component
});
