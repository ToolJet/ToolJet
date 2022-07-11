import React, { useEffect, useState } from 'react';
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
import { Statistics } from './Components/Statistics';
import { Pagination } from './Components/Pagination';
import { Tags } from './Components/Tags';
import { Spinner } from './Components/Spinner';
import { CircularProgressBar } from './Components/CirularProgressbar';
import { renderTooltip } from '@/_helpers/appUtils';
import { RangeSlider } from './Components/RangeSlider';
import { Timeline } from './Components/Timeline';
import { SvgImage } from './Components/SvgImage';
import { Html } from './Components/Html';
import { ButtonGroup } from './Components/ButtonGroup';
import { CustomComponent } from './Components/CustomComponent/CustomComponent';
import { VerticalDivider } from './Components/verticalDivider';
import { PDF } from './Components/PDF';
import { ColorPicker } from './Components/ColorPicker';
import { KanbanBoard } from './Components/KanbanBoard/KanbanBoard';
import { Steps } from './Components/Steps';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import '@/_styles/custom.scss';
import {
  resolveProperties,
  resolveStyles,
  resolveGeneralProperties,
  resolveGeneralStyles,
} from './component-properties-resolution';
import { validateWidget } from '@/_helpers/utils';

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
  Statistics,
  Pagination,
  Tags,
  Spinner,
  CircularProgressBar,
  RangeSlider,
  Timeline,
  SvgImage,
  Html,
  ButtonGroup,
  CustomComponent,
  VerticalDivider,
  PDF,
  ColorPicker,
  KanbanBoard,
  Steps,
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
  dataQueries,
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
  const [renderCount, setRenderCount] = useState(0);
  const [renderStartTime, setRenderStartTime] = useState(new Date());

  const resolvedProperties = resolveProperties(component, currentState, null, customResolvables);
  const resolvedStyles = resolveStyles(component, currentState, null, customResolvables);
  const resolvedGeneralProperties = resolveGeneralProperties(component, currentState, null, customResolvables);
  const resolvedGeneralStyles = resolveGeneralStyles(component, currentState, null, customResolvables);
  resolvedStyles.visibility = resolvedStyles.visibility !== false ? true : false;

  useEffect(() => {
    setRenderCount(renderCount + 1);
    if (renderCount > 10) {
      setRenderCount(0);
      const currentTime = new Date();
      const timeDifference = Math.abs(currentTime - renderStartTime);
      if (timeDifference < 1000) {
        throw Error;
      }
      setRenderStartTime(currentTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ resolvedProperties, resolvedStyles })]);

  let exposedVariables = currentState?.components[component.name] ?? {};

  const fireEvent = (eventName, options) => {
    if (mode === 'edit' && eventName === 'onClick') {
      onComponentClick(id, component);
    }
    onEvent(eventName, { ...options, customVariables: { ...customResolvables }, component });
  };
  const validate = (value) =>
    validateWidget({
      ...{ widgetValue: value },
      ...{ validationObject: component.definition.validation, currentState },
      customResolveObjects: customResolvables,
    });

  return (
    <OverlayTrigger
      placement={inCanvas ? 'auto' : 'top'}
      delay={{ show: 500, hide: 0 }}
      trigger={inCanvas && !resolvedGeneralProperties.tooltip?.trim() ? null : ['hover', 'focus']}
      overlay={(props) =>
        renderTooltip({ props, text: inCanvas ? `${resolvedGeneralProperties.tooltip}` : `${component.description}` })
      }
    >
      <div
        style={{ ...styles, backgroundColor, boxShadow: resolvedGeneralStyles?.boxShadow }}
        role={preview ? 'BoxPreview' : 'Box'}
      >
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
            setExposedVariable={(variable, value) => onComponentOptionChanged(component, variable, value)}
            registerAction={(actionName, func, paramHandles = []) => {
              if (Object.keys(exposedVariables).includes(actionName)) return Promise.resolve();
              else {
                func.paramHandles = paramHandles;
                return onComponentOptionChanged(component, actionName, func);
              }
            }}
            fireEvent={fireEvent}
            validate={validate}
            parentId={parentId}
            customResolvables={customResolvables}
            dataQueries={dataQueries}
          ></ComponentToRender>
        ) : (
          <div className="m-1" style={{ height: '76px', width: '76px', marginLeft: '18px' }}>
            <div
              className="component-image-holder p-2 d-flex flex-column justify-content-center"
              style={{ height: '100%' }}
              data-cy="widget-list"
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
    </OverlayTrigger>
  );
};
