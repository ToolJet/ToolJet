import React from 'react';
import { Button } from './Components/Button';
import { Image } from './Components/Image';
import { Text } from './Components/Text';
import { Table } from './Components/Table/Table';
import { TextInput } from './Components/TextInput';
import { NumberInput } from './Components/NumberInput';
import { TextArea } from './Components/TextArea';
import { Container } from './Components/Container';
import { Tabs } from './Components/Tabs';
import { RichTextEditor } from './Components/RichTextEditor';
import { DropDown } from './Components/DropDown';
import { Checkbox } from './Components/Checkbox';
import { Datepicker } from './Components/Datepicker';
import { DaterangePicker } from './Components/DaterangePicker';
import { Multiselect } from './Components/Multiselect';
import { Modal } from './Components/Modal';
import { Chart } from './Components/Chart';
import { Map } from './Components/Map/Map';
import { QrScanner } from './Components/QrScanner/QrScanner';
import { ToggleSwitch } from './Components/Toggle';
import { RadioButton } from './Components/RadioButton';
import { StarRating } from './Components/StarRating';
import { Divider } from './Components/Divider';
import { FilePicker } from './Components/FilePicker';
import { PasswordInput } from './Components/PasswordInput';
import { Calendar } from './Components/Calendar';
import { Listview } from './Components/Listview';
import { IFrame } from './Components/IFrame';
import { CodeEditor } from './Components/CodeEditor';
import { Timer } from './Components/Timer';
import { Pagination } from './Components/Pagination';
import { Tags } from './Components/Tags';
import { renderTooltip } from '../_helpers/appUtils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import '@/_styles/custom.scss';
import { resolveProperties, resolveStyles } from './component-properties-resolution';
import { validateWidget } from '@/_helpers/utils';
import ErrorBoundary from './ErrorBoundary';

const AllComponents = {
  Button,
  Image,
  Text,
  TextInput,
  NumberInput,
  Table,
  TextArea,
  Container,
  Tabs,
  RichTextEditor,
  DropDown,
  Checkbox,
  Datepicker,
  DaterangePicker,
  Multiselect,
  Modal,
  Chart,
  Map,
  QrScanner,
  ToggleSwitch,
  RadioButton,
  StarRating,
  Divider,
  FilePicker,
  PasswordInput,
  Calendar,
  IFrame,
  CodeEditor,
  Listview,
  Timer,
  Pagination,
  Tags,
};

export const Box = function Box({
  id,
  width,
  height,
  yellow,
  preview,
  component,
  inCanvas,
  onComponentClick,
  onEvent,
  currentState,
  onComponentOptionChanged,
  onComponentOptionsChanged,
  paramUpdated,
  changeCanDrag,
  containerProps,
  darkMode,
  removeComponent,
  canvasWidth,
  mode,
  customResolvables,
  parentId,
  allComponents,
  extraProps,
}) {
  const backgroundColor = yellow ? 'yellow' : '';

  let styles = {
    height: '100%',
    padding: '1px',
  };

  if (inCanvas) {
    styles = {
      ...styles,
    };
  }

  const ComponentToRender = AllComponents[component.component];
  const resolvedProperties = resolveProperties(component, currentState, null, customResolvables);
  const resolvedStyles = resolveStyles(component, currentState, null, customResolvables);
  resolvedStyles.visibility = resolvedStyles.visibility !== false ? true : false;

  let exposedVariables = {};

  if (component.parent) {
    const parentComponent = allComponents[component.parent];
    const isListView = parentComponent?.component?.component === 'Listview';

    if (isListView) {
      const itemsAtIndex = currentState?.components[parentId]?.data[extraProps.listviewItemIndex];
      exposedVariables = itemsAtIndex !== undefined ? itemsAtIndex[component.name] || {} : {};
    } else {
      exposedVariables = currentState?.components[component.name] ?? {};
    }
  } else {
    exposedVariables = currentState?.components[component.name] ?? {};
  }

  const fireEvent = (eventName, options) => {
    if (mode === 'edit' && eventName === 'onClick') {
      onComponentClick(id, component);
    }
    onEvent(eventName, { ...options, component });
  };
  const validate = (value) =>
    validateWidget({
      ...{ widgetValue: value },
      ...{ validationObject: component.definition.validation, currentState },
    });

  return (
    <OverlayTrigger
      placement="top"
      delay={{ show: 500, hide: 0 }}
      trigger={!inCanvas ? ['hover', 'focus'] : null}
      overlay={(props) => renderTooltip({ props, text: `${component.description}` })}
    >
      <ErrorBoundary showFallback={mode === 'edit'}>
        <div style={{ ...styles, backgroundColor }} role={preview ? 'BoxPreview' : 'Box'}>
          {inCanvas ? (
            <ComponentToRender
              onComponentClick={onComponentClick}
              onComponentOptionChanged={onComponentOptionChanged}
              currentState={currentState}
              onEvent={onEvent}
              id={id}
              paramUpdated={paramUpdated}
              width={width}
              changeCanDrag={changeCanDrag}
              onComponentOptionsChanged={onComponentOptionsChanged}
              height={height}
              component={component}
              containerProps={containerProps}
              darkMode={darkMode}
              removeComponent={removeComponent}
              canvasWidth={canvasWidth}
              properties={resolvedProperties}
              exposedVariables={exposedVariables}
              styles={resolvedStyles}
              setExposedVariable={(variable, value) => onComponentOptionChanged(component, variable, value, extraProps)}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
            ></ComponentToRender>
          ) : (
            <div className="m-1" style={{ height: '76px', width: '76px', marginLeft: '18px' }}>
              <div
                className="component-image-holder p-2 d-flex flex-column justify-content-center"
                style={{ height: '100%' }}
              >
                <center>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundSize: 'contain',
                      backgroundImage: `url(/assets/images/icons/widgets/${component.name.toLowerCase()}.svg)`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  ></div>
                </center>
                <span className="component-title">{component.displayName}</span>
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </OverlayTrigger>
  );
};
