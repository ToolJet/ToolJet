import { buttonConfig } from './button';
import { tableConfig } from './table';
import { chartConfig } from './chart';
import { modalConfig } from './modal';
import { modalV2Config } from './modalV2';
import { formConfig } from './form';
import { textinputConfig } from './textinput';
import { numberinputConfig } from './numberinput';
import { passinputConfig } from './passwordinput';
import { datepickerConfig } from './datepicker';
import { checkboxConfig } from './checkbox';
import { radiobuttonConfig } from './radiobutton';
import { radiobuttonV2Config } from './radioButtonV2';
import { toggleswitchConfig } from './toggleswitch';
import { toggleSwitchV2Config } from './toggleswitchv2';
import { textareaConfig } from './textarea';
import { daterangepickerConfig } from './daterangepicker';
import { textConfig } from './text';
import { imageConfig } from './image';
import { containerConfig } from './container';
import { dropdownConfig } from './dropdown';
import { dropdownV2Config } from './dropdownV2';
import { multiselectConfig } from './multiselect';
import { multiselectV2Config } from './multiselectV2';
import { richtextareaConfig } from './richtextarea';
import { mapConfig } from './map';
import { qrscannerConfig } from './qrscanner';
import { starratingConfig } from './starrating';
import { dividerConfig } from './divider';
import { filepickerConfig } from './filepicker';
import { calendarConfig } from './calendar';
import { iframeConfig } from './iframe';
import { codeEditorConfig } from './codeEditor';
import { tabsConfig } from './tabs';
import { timerConfig } from './timer';
import { listviewConfig } from './listview';
import { tagsConfig } from './tags';
import { paginationConfig } from './pagination';
import { circularProgressbarConfig } from './circularProgressbar';
import { spinnerConfig } from './spinner';
import { statisticsConfig } from './statistics';
import { rangeSliderConfig } from './rangeslider';
import { timelineConfig } from './timeline';
import { svgImageConfig } from './svgImage';
import { htmlConfig } from './html';
import { verticalDividerConfig } from './verticalDivider';
import { customComponentConfig } from './customComponent';
import { buttonGroupConfig } from './buttonGroup';
import { pdfConfig } from './pdf';
import { stepsConfig } from './steps';
import { kanbanConfig } from './kanban';
import { colorPickerConfig } from './colorPicker';
import { treeSelectConfig } from './treeSelect';
import { linkConfig } from './link';
import { iconConfig } from './icon';
import { boundedBoxConfig } from './boundedBox';
import { kanbanBoardConfig } from './kanbanBoard';
import { datetimePickerV2Config } from './datetimepickerV2';
import { datePickerV2Config } from './datepickerV2';
import { timePickerConfig } from './timepicker';
import { moduleContainerConfig } from './moduleContainer';
import { moduleViewerConfig } from './moduleViewer';
import { emailinputConfig } from './emailinput';
import { phoneinputConfig } from './phoneinput';
import { currencyinputConfig } from './currencyinput';
import { rangeSliderV2Config } from './rangesliderV2';

const widgets = {
  buttonConfig,
  tableConfig,
  chartConfig,
  modalConfig, //!Depreciated
  modalV2Config,
  formConfig,
  textinputConfig,
  numberinputConfig,
  passinputConfig,
  datepickerConfig, //!Depreciated
  datetimePickerV2Config,
  datePickerV2Config,
  timePickerConfig,
  emailinputConfig,
  phoneinputConfig,
  currencyinputConfig,
  checkboxConfig,
  radiobuttonConfig, //!Depreciated
  radiobuttonV2Config,
  toggleswitchConfig, //!Depreciated
  toggleSwitchV2Config,
  textareaConfig, //! Deprecated
  daterangepickerConfig,
  textConfig,
  imageConfig,
  containerConfig,
  dropdownConfig, //!Depreciated
  dropdownV2Config,
  multiselectConfig,
  multiselectV2Config, //!Depreciated
  richtextareaConfig,
  mapConfig,
  qrscannerConfig,
  starratingConfig,
  dividerConfig,
  filepickerConfig,
  calendarConfig,
  iframeConfig,
  codeEditorConfig,
  tabsConfig,
  timerConfig,
  listviewConfig,
  tagsConfig,
  paginationConfig,
  circularProgressbarConfig,
  spinnerConfig,
  statisticsConfig,
  rangeSliderConfig,
  rangeSliderV2Config,
  timelineConfig,
  svgImageConfig,
  htmlConfig,
  verticalDividerConfig,
  customComponentConfig,
  buttonGroupConfig,
  pdfConfig,
  stepsConfig,
  kanbanConfig,
  kanbanBoardConfig, //!Depreciated
  colorPickerConfig,
  treeSelectConfig,
  linkConfig,
  iconConfig,
  boundedBoxConfig,
  moduleContainerConfig,
  moduleViewerConfig
};

const universalProps = {
  properties: {},
  general: {
    tooltip: { type: 'code', displayName: 'Tooltip', validation: { schema: { type: 'string' } } },
  },
  others: {},
  events: {},
  styles: {},
  validate: true,
  generalStyles: {
    boxShadow: { type: 'boxShadow', displayName: 'Box Shadow' },
  },
  definition: {
    others: {},
    events: [],
    styles: {},
    generalStyles: {
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};

const combineProperties = (widget, universal, isArray = false) => {
  return {
    ...universal,
    ...widget,
    properties: { ...universal.properties, ...widget.properties },
    general: { ...universal.general, ...widget.general },
    others: { ...universal.others, ...widget.others },
    events: isArray ? [...universal.events, ...widget.events] : { ...universal.events, ...widget.events },
    styles: { ...universal.styles, ...widget.styles },
    generalStyles: { ...universal.generalStyles, ...widget.generalStyles },
    exposedVariables: { ...universal.exposedVariables, ...widget.exposedVariables },
  };
};

export const componentTypes = Object.values(widgets).map((widget) => {
  return {
    ...combineProperties(widget, universalProps),
    definition: combineProperties(widget.definition, universalProps.definition, true),
  };
});

export default widgets;
