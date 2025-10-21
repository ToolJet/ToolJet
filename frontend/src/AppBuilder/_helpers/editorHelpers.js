import React, { lazy, Suspense } from 'react';
// import { Button } from '@/Editor/Components/Button';
// import { Image } from '@/Editor/Components/Image/Image';
// import { Text } from '@/Editor/Components/Text';
// // import { Table } from '@/Editor/Components/Table/Table';
// // import { Table } from '@/AppBuilder/Widgets/Table/Table';
import { Table } from '@/AppBuilder/Widgets/NewTable/Table';

// import { TextInput } from '@/AppBuilder/Widgets/TextInput';
// import { TextArea } from '@/AppBuilder/Widgets/TextArea';
// import { NumberInput } from '@/AppBuilder/Widgets/NumberInput';
// import { RichTextEditor } from '@/Editor/Components/RichTextEditor';
// import { DropDown } from '@/Editor/Components/DropDown';
// import { DropdownV2 } from '@/Editor/Components/DropdownV2/DropdownV2';
// import { Checkbox } from '@/Editor/Components/Checkbox';
// import { Datepicker } from '@/Editor/Components/Datepicker';
// import { DatetimePickerV2 } from '@/AppBuilder/Widgets/Date/DatetimePickerV2';
// import { PopoverMenu } from '@/AppBuilder/Widgets/PopoverMenu/PopoverMenu';
// import { DatePickerV2 } from '@/AppBuilder/Widgets/Date/DatePickerV2';
// import { TimePicker } from '@/AppBuilder/Widgets/Date/TimePicker';
// import { DaterangePicker } from '@/AppBuilder/Widgets/Date/DaterangePicker';
// import { Multiselect } from '@/Editor/Components/Multiselect';
// import { MultiselectV2 } from '@/Editor/Components/MultiselectV2/MultiselectV2';
// // import { Modal } from '@/Editor/Components/Modal';
// import { Chart } from '@/Editor/Components/Chart';
// import { Map as MapComponent } from '@/Editor/Components/Map/Map';
// import { QrScanner } from '@/Editor/Components/QrScanner/QrScanner';
// import { ToggleSwitch } from '@/Editor/Components/Toggle';
// import { ToggleSwitchV2 } from '@/Editor/Components/ToggleV2';
// import { RadioButton } from '@/Editor/Components/RadioButton';
// import { RadioButtonV2 } from '@/Editor/Components/RadioButtonV2/RadioButtonV2';
// import { Rating as StarRating } from '@/AppBuilder/Widgets/Rating/Rating';
// import { Divider } from '@/Editor/Components/Divider';
// import { FilePicker } from '@/Editor/Components/FilePicker';
// import { PasswordInput } from '@/AppBuilder/Widgets/PasswordInput';
// import { EmailInput } from '@/AppBuilder/Widgets/EmailInput';
// import { PhoneInput } from '@/AppBuilder/Widgets/PhoneCurrency/PhoneInput';
// import { CurrencyInput } from '@/AppBuilder/Widgets/PhoneCurrency/CurrencyInput';
// // import { Calendar } from '@/Editor/Components/Calendar';
// // import { Listview } from '@/Editor/Components/Listview';
// import { IFrame } from '@/Editor/Components/IFrame';
// import { CodeEditor } from '@/Editor/Components/CodeEditor';
// import { Timer } from '@/Editor/Components/Timer';
// import { Statistics } from '@/Editor/Components/Statistics';
// import { Pagination } from '@/Editor/Components/Pagination';
// import { Tags } from '@/Editor/Components/Tags/Tags';
// import { Spinner } from '@/Editor/Components/Spinner';
// import { CircularProgressBar } from '@/Editor/Components/CirularProgressbar';
// import { RangeSlider } from '@/AppBuilder/Widgets/RangeSlider';
// import { RangeSliderV2 } from '@/AppBuilder/Widgets/RangeSliderV2';
// import { Timeline } from '@/Editor/Components/Timeline';
// import { SvgImage } from '@/Editor/Components/SvgImage';
// import { Html } from '@/Editor/Components/Html';
// import { ButtonGroup } from '@/Editor/Components/ButtonGroup';
// import { CustomComponent } from '@/Editor/Components/CustomComponent/CustomComponent';
// import { VerticalDivider } from '@/Editor/Components/VerticalDivider';
// import { ColorPicker } from '@/Editor/Components/ColorPicker';
// import { KanbanBoard } from '@/Editor/Components/KanbanBoard/KanbanBoard';
// // import { Kanban } from '@/Editor/Components/Kanban/Kanban';
// import { Steps } from '@/Editor/Components/Steps';
// import { TreeSelect } from '@/Editor/Components/TreeSelect';
// import { Icon } from '@/Editor/Components/Icon';
// import { Link } from '@/Editor/Components/Link/Link';
// import { Form } from '@/Editor/Components/Form/Form';
// import { BoundedBox } from '@/Editor/Components/BoundedBox/BoundedBox';
// import { Container } from '@/AppBuilder/Widgets/Container/Container';
// import { Listview } from '@/AppBuilder/Widgets/Listview';
// import { Tabs } from '@/AppBuilder/Widgets/Tabs';
// import { Kanban } from '@/AppBuilder/Widgets/Kanban/Kanban';
// import { Form } from '@/AppBuilder/Widgets/Form/Form';
// import { Modal } from '@/AppBuilder/Widgets/Modal';
// import { ModalV2 } from '@/AppBuilder/Widgets/ModalV2/ModalV2';
// import { Calendar } from '@/AppBuilder/Widgets/Calendar/Calendar';
// import { ModuleContainer, ModuleViewer } from '@/modules/Modules/components';
// import { Chat } from '@/AppBuilder/Widgets/Chat';

import { isPDFSupported } from '@/_helpers/appUtils';
// import './requestIdleCallbackPolyfill';

// Lazy load all components with webpack magic comments for chunk naming
const Button = lazy(() =>
  import(/* webpackChunkName: "widget-button" */ '@/Editor/Components/Button').then((m) => ({ default: m.Button }))
);
const Image = lazy(() =>
  import(/* webpackChunkName: "widget-image" */ '@/Editor/Components/Image/Image').then((m) => ({ default: m.Image }))
);
const Text = lazy(() =>
  import(/* webpackChunkName: "widget-text" */ '@/Editor/Components/Text').then((m) => ({ default: m.Text }))
);
// const Table = lazy(() =>
//   import(/* webpackChunkName: "widget-table" */ '@/AppBuilder/Widgets/NewTable/Table').then((m) => ({
//     default: m.Table,
//   }))
// );
const TextInput = lazy(() =>
  import(/* webpackChunkName: "widget-text-input" */ '@/AppBuilder/Widgets/TextInput').then((m) => ({
    default: m.TextInput,
  }))
);
const TextArea = lazy(() =>
  import(/* webpackChunkName: "widget-text-area" */ '@/AppBuilder/Widgets/TextArea').then((m) => ({
    default: m.TextArea,
  }))
);
const NumberInput = lazy(() =>
  import(/* webpackChunkName: "widget-number-input" */ '@/AppBuilder/Widgets/NumberInput').then((m) => ({
    default: m.NumberInput,
  }))
);
const RichTextEditor = lazy(() =>
  import(/* webpackChunkName: "widget-rich-text-editor" */ '@/Editor/Components/RichTextEditor').then((m) => ({
    default: m.RichTextEditor,
  }))
);
const DropDown = lazy(() =>
  import(/* webpackChunkName: "widget-dropdown" */ '@/Editor/Components/DropDown').then((m) => ({
    default: m.DropDown,
  }))
);
const DropdownV2 = lazy(() =>
  import(/* webpackChunkName: "widget-dropdown-v2" */ '@/Editor/Components/DropdownV2/DropdownV2').then((m) => ({
    default: m.DropdownV2,
  }))
);
const Checkbox = lazy(() =>
  import(/* webpackChunkName: "widget-checkbox" */ '@/Editor/Components/Checkbox').then((m) => ({
    default: m.Checkbox,
  }))
);
const Datepicker = lazy(() =>
  import(/* webpackChunkName: "widget-datepicker" */ '@/Editor/Components/Datepicker').then((m) => ({
    default: m.Datepicker,
  }))
);
const DatetimePickerV2 = lazy(() =>
  import(/* webpackChunkName: "widget-datetime-picker-v2" */ '@/AppBuilder/Widgets/Date/DatetimePickerV2').then(
    (m) => ({ default: m.DatetimePickerV2 })
  )
);
const PopoverMenu = lazy(() =>
  import(/* webpackChunkName: "widget-popover-menu" */ '@/AppBuilder/Widgets/PopoverMenu/PopoverMenu').then((m) => ({
    default: m.PopoverMenu,
  }))
);
const DatePickerV2 = lazy(() =>
  import(/* webpackChunkName: "widget-date-picker-v2" */ '@/AppBuilder/Widgets/Date/DatePickerV2').then((m) => ({
    default: m.DatePickerV2,
  }))
);
const TimePicker = lazy(() =>
  import(/* webpackChunkName: "widget-time-picker" */ '@/AppBuilder/Widgets/Date/TimePicker').then((m) => ({
    default: m.TimePicker,
  }))
);
const DaterangePicker = lazy(() =>
  import(/* webpackChunkName: "widget-daterange-picker" */ '@/AppBuilder/Widgets/Date/DaterangePicker').then((m) => ({
    default: m.DaterangePicker,
  }))
);
const Multiselect = lazy(() =>
  import(/* webpackChunkName: "widget-multiselect" */ '@/Editor/Components/Multiselect').then((m) => ({
    default: m.Multiselect,
  }))
);
const MultiselectV2 = lazy(() =>
  import(/* webpackChunkName: "widget-multiselect-v2" */ '@/Editor/Components/MultiselectV2/MultiselectV2').then(
    (m) => ({ default: m.MultiselectV2 })
  )
);
const Chart = lazy(() =>
  import(/* webpackChunkName: "widget-chart" */ '@/Editor/Components/Chart').then((m) => ({ default: m.Chart }))
);
const MapComponent = lazy(() =>
  import(/* webpackChunkName: "widget-map" */ '@/Editor/Components/Map/Map').then((m) => ({ default: m.Map }))
);
const QrScanner = lazy(() =>
  import(/* webpackChunkName: "widget-qr-scanner" */ '@/Editor/Components/QrScanner/QrScanner').then((m) => ({
    default: m.QrScanner,
  }))
);
const ToggleSwitch = lazy(() =>
  import(/* webpackChunkName: "widget-toggle-switch" */ '@/Editor/Components/Toggle').then((m) => ({
    default: m.ToggleSwitch,
  }))
);
const ToggleSwitchV2 = lazy(() =>
  import(/* webpackChunkName: "widget-toggle-switch-v2" */ '@/Editor/Components/ToggleV2').then((m) => ({
    default: m.ToggleSwitchV2,
  }))
);
const RadioButton = lazy(() =>
  import(/* webpackChunkName: "widget-radio-button" */ '@/Editor/Components/RadioButton').then((m) => ({
    default: m.RadioButton,
  }))
);
const RadioButtonV2 = lazy(() =>
  import(/* webpackChunkName: "widget-radio-button-v2" */ '@/Editor/Components/RadioButtonV2/RadioButtonV2').then(
    (m) => ({ default: m.RadioButtonV2 })
  )
);
const StarRating = lazy(() =>
  import(/* webpackChunkName: "widget-rating" */ '@/AppBuilder/Widgets/Rating/Rating').then((m) => ({
    default: m.Rating,
  }))
);
const Divider = lazy(() =>
  import(/* webpackChunkName: "widget-divider" */ '@/Editor/Components/Divider').then((m) => ({ default: m.Divider }))
);
const FilePicker = lazy(() =>
  import(/* webpackChunkName: "widget-file-picker" */ '@/Editor/Components/FilePicker').then((m) => ({
    default: m.FilePicker,
  }))
);
const PasswordInput = lazy(() =>
  import(/* webpackChunkName: "widget-password-input" */ '@/AppBuilder/Widgets/PasswordInput').then((m) => ({
    default: m.PasswordInput,
  }))
);
const EmailInput = lazy(() =>
  import(/* webpackChunkName: "widget-email-input" */ '@/AppBuilder/Widgets/EmailInput').then((m) => ({
    default: m.EmailInput,
  }))
);
const PhoneInput = lazy(() =>
  import(/* webpackChunkName: "widget-phone-input" */ '@/AppBuilder/Widgets/PhoneCurrency/PhoneInput').then((m) => ({
    default: m.PhoneInput,
  }))
);
const CurrencyInput = lazy(() =>
  import(/* webpackChunkName: "widget-currency-input" */ '@/AppBuilder/Widgets/PhoneCurrency/CurrencyInput').then(
    (m) => ({ default: m.CurrencyInput })
  )
);
const IFrame = lazy(() =>
  import(/* webpackChunkName: "widget-iframe" */ '@/Editor/Components/IFrame').then((m) => ({ default: m.IFrame }))
);
const CodeEditor = lazy(() =>
  import(/* webpackChunkName: "widget-code-editor" */ '@/Editor/Components/CodeEditor').then((m) => ({
    default: m.CodeEditor,
  }))
);
const Timer = lazy(() =>
  import(/* webpackChunkName: "widget-timer" */ '@/Editor/Components/Timer').then((m) => ({ default: m.Timer }))
);
const Statistics = lazy(() =>
  import(/* webpackChunkName: "widget-statistics" */ '@/Editor/Components/Statistics').then((m) => ({
    default: m.Statistics,
  }))
);
const Pagination = lazy(() =>
  import(/* webpackChunkName: "widget-pagination" */ '@/Editor/Components/Pagination').then((m) => ({
    default: m.Pagination,
  }))
);
const Tags = lazy(() =>
  import(/* webpackChunkName: "widget-tags" */ '@/Editor/Components/Tags/Tags').then((m) => ({ default: m.Tags }))
);
const Spinner = lazy(() =>
  import(/* webpackChunkName: "widget-spinner" */ '@/Editor/Components/Spinner').then((m) => ({ default: m.Spinner }))
);
const CircularProgressBar = lazy(() =>
  import(/* webpackChunkName: "widget-circular-progress" */ '@/Editor/Components/CirularProgressbar').then((m) => ({
    default: m.CircularProgressBar,
  }))
);
const RangeSlider = lazy(() =>
  import(/* webpackChunkName: "widget-range-slider" */ '@/AppBuilder/Widgets/RangeSlider').then((m) => ({
    default: m.RangeSlider,
  }))
);
const RangeSliderV2 = lazy(() =>
  import(/* webpackChunkName: "widget-range-slider-v2" */ '@/AppBuilder/Widgets/RangeSliderV2').then((m) => ({
    default: m.RangeSliderV2,
  }))
);
const Timeline = lazy(() =>
  import(/* webpackChunkName: "widget-timeline" */ '@/Editor/Components/Timeline').then((m) => ({
    default: m.Timeline,
  }))
);
const SvgImage = lazy(() =>
  import(/* webpackChunkName: "widget-svg-image" */ '@/Editor/Components/SvgImage').then((m) => ({
    default: m.SvgImage,
  }))
);
const Html = lazy(() =>
  import(/* webpackChunkName: "widget-html" */ '@/Editor/Components/Html').then((m) => ({ default: m.Html }))
);
const ButtonGroup = lazy(() =>
  import(/* webpackChunkName: "widget-button-group" */ '@/Editor/Components/ButtonGroup').then((m) => ({
    default: m.ButtonGroup,
  }))
);
const CustomComponent = lazy(() =>
  import(/* webpackChunkName: "widget-custom-component" */ '@/Editor/Components/CustomComponent/CustomComponent').then(
    (m) => ({ default: m.CustomComponent })
  )
);
const VerticalDivider = lazy(() =>
  import(/* webpackChunkName: "widget-vertical-divider" */ '@/Editor/Components/VerticalDivider').then((m) => ({
    default: m.VerticalDivider,
  }))
);
const ColorPicker = lazy(() =>
  import(/* webpackChunkName: "widget-color-picker" */ '@/Editor/Components/ColorPicker').then((m) => ({
    default: m.ColorPicker,
  }))
);
const KanbanBoard = lazy(() =>
  import(/* webpackChunkName: "widget-kanban-board" */ '@/Editor/Components/KanbanBoard/KanbanBoard').then((m) => ({
    default: m.KanbanBoard,
  }))
);
const Steps = lazy(() =>
  import(/* webpackChunkName: "widget-steps" */ '@/Editor/Components/Steps').then((m) => ({ default: m.Steps }))
);
const TreeSelect = lazy(() =>
  import(/* webpackChunkName: "widget-tree-select" */ '@/Editor/Components/TreeSelect').then((m) => ({
    default: m.TreeSelect,
  }))
);
const Icon = lazy(() =>
  import(/* webpackChunkName: "widget-icon" */ '@/Editor/Components/Icon').then((m) => ({ default: m.Icon }))
);
const Link = lazy(() =>
  import(/* webpackChunkName: "widget-link" */ '@/Editor/Components/Link/Link').then((m) => ({ default: m.Link }))
);
const BoundedBox = lazy(() =>
  import(/* webpackChunkName: "widget-bounded-box" */ '@/Editor/Components/BoundedBox/BoundedBox').then((m) => ({
    default: m.BoundedBox,
  }))
);
const Container = lazy(() =>
  import(/* webpackChunkName: "widget-container" */ '@/AppBuilder/Widgets/Container/Container').then((m) => ({
    default: m.Container,
  }))
);
const Listview = lazy(() =>
  import(/* webpackChunkName: "widget-listview" */ '@/AppBuilder/Widgets/Listview').then((m) => ({
    default: m.Listview,
  }))
);
const Tabs = lazy(() =>
  import(/* webpackChunkName: "widget-tabs" */ '@/AppBuilder/Widgets/Tabs').then((m) => ({ default: m.Tabs }))
);
const Kanban = lazy(() =>
  import(/* webpackChunkName: "widget-kanban" */ '@/AppBuilder/Widgets/Kanban/Kanban').then((m) => ({
    default: m.Kanban,
  }))
);
const Form = lazy(() =>
  import(/* webpackChunkName: "widget-form" */ '@/AppBuilder/Widgets/Form/Form').then((m) => ({ default: m.Form }))
);
const Modal = lazy(() =>
  import(/* webpackChunkName: "widget-modal" */ '@/AppBuilder/Widgets/Modal').then((m) => ({ default: m.Modal }))
);
const ModalV2 = lazy(() =>
  import(/* webpackChunkName: "widget-modal-v2" */ '@/AppBuilder/Widgets/ModalV2/ModalV2').then((m) => ({
    default: m.ModalV2,
  }))
);
const Calendar = lazy(() =>
  import(/* webpackChunkName: "widget-calendar" */ '@/AppBuilder/Widgets/Calendar/Calendar').then((m) => ({
    default: m.Calendar,
  }))
);
const Chat = lazy(() =>
  import(/* webpackChunkName: "widget-chat" */ '@/AppBuilder/Widgets/Chat').then((m) => ({ default: m.Chat }))
);

// Module components
const ModuleContainer = lazy(() =>
  import(/* webpackChunkName: "widget-module-container" */ '@/modules/Modules/components').then((m) => ({
    default: m.ModuleContainer,
  }))
);
const ModuleViewer = lazy(() =>
  import(/* webpackChunkName: "widget-module-viewer" */ '@/modules/Modules/components').then((m) => ({
    default: m.ModuleViewer,
  }))
);

export function memoizeFunction(func) {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

export const getComponentByName = (componentName) => {
  switch (componentName) {
    case 'Button':
      return Button;
    case 'Image':
      return Image;
    case 'Text':
      return Text;
    case 'TextInput':
      return TextInput;
    case 'NumberInput':
      return NumberInput;
    case 'Table':
      return Table;
    case 'TextArea':
      return TextArea;
    case 'Container':
      return Container;
    case 'Tabs':
      return Tabs;
    case 'RichTextEditor':
      return RichTextEditor;
    case 'DropDown':
      return DropDown;
    case 'DropdownV2':
      return DropdownV2;
    case 'Checkbox':
      return Checkbox;
    case 'Datepicker':
      return Datepicker;
    case 'DatetimePickerV2':
      return DatetimePickerV2;
    case 'DaterangePicker':
      return DaterangePicker;
    case 'DatePickerV2':
      return DatePickerV2;
    case 'TimePicker':
      return TimePicker;
    case 'Multiselect':
      return Multiselect;
    case 'MultiselectV2':
      return MultiselectV2;
    case 'Modal':
      return Modal;
    case 'ModalV2':
      return ModalV2;
    case 'Chart':
      return Chart;
    case 'Map':
      return MapComponent;
    case 'QrScanner':
      return QrScanner;
    case 'ToggleSwitch':
      return ToggleSwitch;
    case 'RadioButton':
      return RadioButton;
    case 'RadioButtonV2':
      return RadioButtonV2;
    case 'StarRating':
      return StarRating;
    case 'Divider':
      return Divider;
    case 'FilePicker':
      return FilePicker;
    case 'PasswordInput':
      return PasswordInput;
    case 'EmailInput':
      return EmailInput;
    case 'PhoneInput':
      return PhoneInput;
    case 'CurrencyInput':
      return CurrencyInput;
    case 'Calendar':
      return Calendar;
    case 'IFrame':
      return IFrame;
    case 'CodeEditor':
      return CodeEditor;
    case 'Listview':
      return Listview;
    case 'Timer':
      return Timer;
    case 'Statistics':
      return Statistics;
    case 'Pagination':
      return Pagination;
    case 'Tags':
      return Tags;
    case 'Spinner':
      return Spinner;
    case 'CircularProgressBar':
      return CircularProgressBar;
    case 'RangeSlider':
      return RangeSlider;
    case 'RangeSliderV2':
      return RangeSliderV2;
    case 'Timeline':
      return Timeline;
    case 'SvgImage':
      return SvgImage;
    case 'Html':
      return Html;
    case 'ButtonGroup':
      return ButtonGroup;
    case 'CustomComponent':
      return CustomComponent;
    case 'VerticalDivider':
      return VerticalDivider;
    case 'ColorPicker':
      return ColorPicker;
    case 'KanbanBoard':
      return KanbanBoard;
    case 'Kanban':
      return Kanban;
    case 'Steps':
      return Steps;
    case 'TreeSelect':
      return TreeSelect;
    case 'Link':
      return Link;
    case 'Icon':
      return Icon;
    case 'Form':
      return Form;
    case 'BoundedBox':
      return BoundedBox;
    case 'ToggleSwitchV2':
      return ToggleSwitchV2;
    case 'Chat':
      return Chat;
    case 'ModuleContainer':
      return ModuleContainer;
    case 'ModuleViewer':
      return ModuleViewer;
    case 'PopoverMenu':
      return PopoverMenu;
    default:
      return null;
  }
};

export const AllComponents = {
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
  DropdownV2,
  Checkbox,
  Datepicker,
  DatetimePickerV2,
  DaterangePicker,
  DatePickerV2,
  TimePicker,
  Multiselect,
  MultiselectV2,
  Modal,
  ModalV2,
  Chart,
  Map: MapComponent,
  QrScanner,
  ToggleSwitch,
  RadioButton,
  RadioButtonV2,
  StarRating,
  Divider,
  FilePicker,
  PasswordInput,
  EmailInput,
  PhoneInput,
  CurrencyInput,
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
  RangeSliderV2,
  Timeline,
  SvgImage,
  Html,
  ButtonGroup,
  CustomComponent,
  VerticalDivider,
  ColorPicker,
  KanbanBoard,
  Kanban,
  Steps,
  TreeSelect,
  Link,
  Icon,
  Form,
  BoundedBox,
  ToggleSwitchV2,
  Chat,
  ModuleContainer,
  ModuleViewer,
  PopoverMenu,
};
if (isPDFSupported()) {
  AllComponents.PDF = await import('@/Editor/Components/PDF').then((module) => module.PDF);
}

export const getComponentToRender = (componentName) => {
  const shouldHideWidget = componentName === 'PDF' && !isPDFSupported();
  if (shouldHideWidget) return null;
  return AllComponents[componentName];
};

export function isOnlyLayoutUpdate(diffState) {
  const componentDiff = Object.keys(diffState).filter((key) => diffState[key]?.layouts && !diffState[key]?.component);

  return componentDiff.length > 0;
}

function findNotations(jsString) {
  const dotNotationRegex = /(\w+)\.(\w+(\.\w+)*)/g;
  const matches = [];
  let match;

  while ((match = dotNotationRegex.exec(jsString)) !== null) {
    matches.push({
      base: match[1],
      accessors: match[2].split('.'),
    });
  }

  return matches;
}

function convertToBracketNotation(base, accessors) {
  return `${base}${accessors.map((accessor) => `['${accessor}']`).join('')}`;
}

function verifyDotAndBracketNotations(jsString) {
  if (
    !(
      jsString.includes('components.') ||
      jsString.includes('globals.') ||
      jsString.includes('queries.') ||
      jsString.includes('page.') ||
      jsString.includes('variables.') ||
      jsString.includes('constants.')
    )
  ) {
    return false;
  }

  const notations = findNotations(jsString);

  for (const { base, accessors } of notations) {
    const dotNotation = `${base}.${accessors.join('.')}`;
    const bracketNotation = convertToBracketNotation(base, accessors);

    if (jsString.includes(dotNotation) && !jsString.includes(bracketNotation)) {
      return false;
    }
  }

  return true;
}

function findReferenceInComponent(node, changedCurrentState) {
  if (!node) return false;

  try {
    if (typeof node === 'object') {
      for (let key in node) {
        const value = node[key];
        if (
          typeof value === 'string' &&
          ((value.includes('{{') && value.includes('}}')) || value.includes('%%client'))
        ) {
          // Check if the referenced entity is in the state

          if (changedCurrentState.some((state) => value.includes(state) || verifyDotAndBracketNotations(value))) {
            return true;
          }
        } else if (typeof value === 'object') {
          const found = findReferenceInComponent(value, changedCurrentState);

          if (found) return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.log('error', { error });

    return false;
  }
}

// Function to find which component ids contain the references
export function findComponentsWithReferences(components, changedCurrentState) {
  const componentIdsWithReferences = [];

  if (!components) return componentIdsWithReferences;

  Object.entries(components).forEach(([componentId, componentData]) => {
    const hasReference = findReferenceInComponent(componentData, changedCurrentState);
    if (hasReference) {
      componentIdsWithReferences.push(componentId);
    }
  });

  return componentIdsWithReferences;
}

//* TaskManager to track and manage scheduled tasks
//Todo: Move this to a separate file

class TaskManager {
  constructor() {
    this.tasks = new Set();
  }

  addTask(taskId) {
    this.tasks.add(taskId);
  }

  cancelTask(taskId) {
    window.cancelIdleCallback(taskId);
    this.tasks.delete(taskId);
  }

  clearAllTasks() {
    for (let taskId of this.tasks) {
      window.cancelIdleCallback(taskId);
    }
    this.tasks.clear();
  }
}

const taskManager = new TaskManager();

export function handleLowPriorityWork(callback, timeout = null, immediate = false) {
  if (immediate) {
    callback();
  } else {
    const options = timeout ? { timeout } : {};
    const taskId = window.requestIdleCallback((deadline) => {
      if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
        callback();
      } else {
        // Yield back to the browser and reschedule the task
        handleLowPriorityWork(callback, timeout);
      }
    }, options);
    taskManager.addTask(taskId);
  }
}

// Clear all tasks on a page switch or similar action
export function clearAllQueuedTasks() {
  taskManager.clearAllTasks();
}

export function generatePath(obj, targetKey, currentPath = '') {
  for (const key in obj) {
    const newPath = currentPath ? currentPath + '.' + key : key;

    if (key === targetKey) {
      return newPath;
    }

    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const result = generatePath(obj[key], targetKey, newPath);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

export function checkAndExtractEntityId(errorString) {
  const regex = /"([a-f0-9-]+)"/;
  const match = errorString.match(regex);
  if (match && match[1]) {
    return {
      entityId: match[1],
      message: 'The last component is not saved, so the last action is also not saved.',
    };
  }
  return {
    entityId: null,
    message: 'No entity ID found in the error message.',
  };
}

export const computeCanvasContainerHeight = (queryPanelHeight, isDraggingQueryPane) => {
  // 45 = (height of header)
  // 85 = (the height of the query panel header when minimised) + (height of header)
  return `calc(${100}% - ${isDraggingQueryPane ? 0 : Math.max(queryPanelHeight + 45, 85)}px)`;
};
