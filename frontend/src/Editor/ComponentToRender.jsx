import React, { useCallback } from 'react';
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
import { Kanban } from './Components/Kanban/Kanban';
import { Steps } from './Components/Steps';
import { TreeSelect } from './Components/TreeSelect';
import { Icon } from './Components/Icon';
import { Link } from './Components/Link';
import { Form } from './Components/Form/Form';
import { BoundedBox } from './Components/BoundedBox/BoundedBox';
import '@/_styles/custom.scss';

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
  Kanban,
  Steps,
  TreeSelect,
  Link,
  Icon,
  Form,
  BoundedBox,
};

const ComponentToRender = React.memo(
  ({
    onComponentClick,
    onComponentOptionChanged,
    currentState,
    onEvent,
    id,
    paramUpdated,
    width,
    changeCanDrag,
    onComponentOptionsChanged,
    height,
    component,
    containerProps,
    darkMode,
    removeComponent,
    canvasWidth,
    properties,
    exposedVariables,
    styles,
    setExposedVariable,
    setExposedVariables,
    fireEvent,
    validate,
    parentId,
    customResolvables,
    variablesExposedForPreview,
    exposeToCodeHinter,
    mode,
    resetComponent,
    childComponents,
    setProperty,
  }) => {
    // console.log('parent render');
    // const _renderButton = useCallback(
    //   () => (
    //     <Button
    //       id={id}
    //       properties={properties}
    //       // height={height}
    //       // // exposedVariables={exposedVariables}
    //       styles={styles}
    //       setExposedVariable={() => {}}
    //       // fireEvent={fireEvent}
    //       // dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
    //     />
    //   ),
    //   [properties, styles, id]
    // );
    const _componentToRender = () => {
      switch (component.component) {
        case 'Button':
          return (
            <Button
              id={id}
              properties={properties}
              height={height}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              fireEvent={fireEvent}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Image':
          return (
            <Image
              width={width}
              height={height}
              component={component}
              properties={properties}
              styles={styles}
              fireEvent={fireEvent}
              parentId={parentId}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Text':
          return (
            <Text
              height={height}
              properties={properties}
              styles={styles}
              darkMode={darkMode}
              setExposedVariable={setExposedVariable}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'TextInput':
          return (
            <TextInput
              height={height}
              component={component}
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              darkMode={darkMode}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );
        case 'NumberInput':
          return (
            <NumberInput
              height={height}
              properties={properties}
              styles={styles}
              setExposedVariable={setExposedVariable}
              darkMode={darkMode}
              fireEvent={fireEvent}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Table':
          return (
            <Table
              id={id}
              width={width}
              height={height}
              component={component}
              onComponentClick={onComponentClick}
              currentState={currentState}
              onEvent={onEvent}
              paramUpdated={paramUpdated}
              changeCanDrag={changeCanDrag}
              onComponentOptionChanged={onComponentOptionChanged}
              onComponentOptionsChanged={onComponentOptionsChanged}
              darkMode={darkMode}
              fireEvent={fireEvent}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              styles={styles}
              properties={properties}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={setProperty}
              mode={mode}
              exposedVariables={exposedVariables}
            />
          );
        case 'TextArea':
          return (
            <TextArea
              height={height}
              properties={properties}
              styles={styles}
              setExposedVariable={setExposedVariable}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Container':
          return (
            <Container
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Tabs':
          return (
            <NumberInput
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'RichTextEditor':
          return (
            <RichTextEditor
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'DropDown':
          return (
            <DropDown
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Checkbox':
          return (
            <Checkbox
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Datepicker':
          return (
            <Datepicker
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'DaterangePicker':
          return (
            <DaterangePicker
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Multiselect':
          return (
            <Multiselect
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Modal':
          return (
            <Modal
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Chart':
          return (
            <Chart
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Map':
          return (
            <Map
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'QrScanner':
          return (
            <QrScanner
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'ToggleSwitch':
          return (
            <ToggleSwitch
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'RadioButton':
          return (
            <RadioButton
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'StarRating':
          return (
            <NumberInput
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Divider':
          return (
            <Divider
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'FilePicker':
          return (
            <FilePicker
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'PasswordInput':
          return (
            <PasswordInput
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Calendar':
          return (
            <Calendar
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'IFrame':
          return (
            <IFrame
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'CodeEditor':
          return (
            <CodeEditor
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Listview':
          return (
            <NumberInput
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Timer':
          return (
            <Timer
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Statistics':
          return (
            <Statistics
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Pagination':
          return (
            <Pagination
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Tags':
          return (
            <Tags
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Spinner':
          return (
            <Spinner
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'CircularProgressBar':
          return (
            <CircularProgressBar
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'RangeSlider':
          return (
            <RangeSlider
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Timeline':
          return (
            <Timeline
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'SvgImage':
          return (
            <SvgImage
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Html':
          return (
            <Html
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'ButtonGroup':
          return (
            <ButtonGroup
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'CustomComponent':
          return (
            <CustomComponent
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'VerticalDivider':
          return (
            <VerticalDivider
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'PDF':
          return (
            <PDF
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'ColorPicker':
          return (
            <ColorPicker
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'KanbanBoard':
          return (
            <KanbanBoard
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Kanban':
          return (
            <Kanban
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Steps':
          return (
            <Steps
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'TreeSelect':
          return (
            <TreeSelect
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Link':
          return (
            <Link
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Icon':
          return (
            <Icon
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'Form':
          return (
            <Form
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        case 'BoundedBox':
          return (
            <BoundedBox
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
              properties={properties}
              exposedVariables={exposedVariables}
              styles={styles}
              setExposedVariable={setExposedVariable}
              setExposedVariables={setExposedVariables}
              fireEvent={fireEvent}
              validate={validate}
              parentId={parentId}
              customResolvables={customResolvables}
              variablesExposedForPreview={variablesExposedForPreview}
              exposeToCodeHinter={exposeToCodeHinter}
              setProperty={(property, value) => {
                paramUpdated(id, property, { value });
              }}
              mode={mode}
              resetComponent={resetComponent}
              childComponents={childComponents}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
            />
          );

        default:
          <></>;
      }
    };

    return <>{_componentToRender()}</>;
  }
);

export default ComponentToRender;
