import { lazy } from 'react';
import { Button } from '@/AppBuilder/Widgets/Button';
import { Text } from '@/AppBuilder/Widgets/Text';
import { AudioRecorder } from '@/AppBuilder/Widgets/AudioRecorder/AudioRecorder';
import { TextInput } from '@/AppBuilder/Widgets/TextInput';
import { TextArea } from '@/AppBuilder/Widgets/TextArea';
import { NumberInput } from '@/AppBuilder/Widgets/NumberInput';
import { DropDown } from '@/AppBuilder/Widgets/DropDown';
import { DropdownV2 } from '@/AppBuilder/Widgets/DropdownV2/DropdownV2';
import { Checkbox } from '@/AppBuilder/Widgets/Checkbox/Checkbox';
import { Datepicker } from '@/AppBuilder/Widgets/Datepicker';
import { DatetimePickerV2 } from '@/AppBuilder/Widgets/Date/DatetimePickerV2';
import { PopoverMenu } from '@/AppBuilder/Widgets/PopoverMenu/PopoverMenu';
import { DatePickerV2 } from '@/AppBuilder/Widgets/Date/DatePickerV2';
import { TimePicker } from '@/AppBuilder/Widgets/Date/TimePicker';
import { DaterangePicker } from '@/AppBuilder/Widgets/Date/DaterangePicker';
import { Multiselect } from '@/AppBuilder/Widgets/Multiselect';
import { MultiselectV2 } from '@/AppBuilder/Widgets/MultiselectV2/MultiselectV2';
import { ToggleSwitch } from '@/AppBuilder/Widgets/Toggle';
import { ToggleSwitchV2 } from '@/AppBuilder/Widgets/ToggleV2';

import { RadioButton } from '@/AppBuilder/Widgets/RadioButton';
import { RadioButtonV2 } from '@/AppBuilder/Widgets/RadioButtonV2/RadioButtonV2';
import { Rating as StarRating } from '@/AppBuilder/Widgets/Rating/Rating';
import { Divider } from '@/AppBuilder/Widgets/Divider';
import { FileInput } from '@/AppBuilder/Widgets/FileInput';
import { FileButton } from '@/AppBuilder/Widgets/FileButton/FileButton';
import { PasswordInput } from '@/AppBuilder/Widgets/PasswordInput';
import { EmailInput } from '@/AppBuilder/Widgets/EmailInput';
import { PhoneInput } from '@/AppBuilder/Widgets/PhoneCurrency/PhoneInput';
import { CurrencyInput } from '@/AppBuilder/Widgets/PhoneCurrency/CurrencyInput';
import { IFrame } from '@/AppBuilder/Widgets/IFrame';
import { Timer } from '@/AppBuilder/Widgets/Timer';
import { Statistics } from '@/AppBuilder/Widgets/Statistics';
import { Pagination } from '@/AppBuilder/Widgets/Pagination/Pagination';
import { Tags } from '@/AppBuilder/Widgets/Tags/Tags';
import { Spinner } from '@/AppBuilder/Widgets/Spinner';
import { CircularProgressBar } from '@/AppBuilder/Widgets/CircularProgressBar/CirularProgressbar';
import { RangeSlider } from '@/AppBuilder/Widgets/RangeSlider';
import { RangeSliderV2 } from '@/AppBuilder/Widgets/RangeSliderV2';
import { Timeline } from '@/AppBuilder/Widgets/Timeline';
import { SvgImage } from '@/AppBuilder/Widgets/SvgImage';
import { Html } from '@/AppBuilder/Widgets/Html';
import { ButtonGroup } from '@/AppBuilder/Widgets/ButtonGroup';
import { ButtonGroupV2 } from '@/AppBuilder/Widgets/ButtonGroupV2/ButtonGroupV2';
import { CustomComponent } from '@/AppBuilder/Widgets/CustomComponent/CustomComponent';
import { VerticalDivider } from '@/AppBuilder/Widgets/VerticalDivider';
import { Steps } from '@/AppBuilder/Widgets/Steps';
import { Link } from '@/AppBuilder/Widgets/Link/Link';
import { BoundedBox } from '@/AppBuilder/Widgets/BoundedBox/BoundedBox';
import { isPDFSupported } from '@/_helpers/appUtils';

import { Form } from '@/AppBuilder/Widgets/Form/Form';
import { Container } from '@/AppBuilder/Widgets/Container/Container';
import { FlexContainer } from '@/AppBuilder/Widgets/FlexContainer/FlexContainer';
import { Listview } from '@/AppBuilder/Widgets/Listview/Listview';
import { Tabs } from '@/AppBuilder/Widgets/Tabs/Tabs';
import { Kanban } from '@/AppBuilder/Widgets/Kanban/Kanban';
import { Modal } from '@/AppBuilder/Widgets/Modal';
import { ModalV2 } from '@/AppBuilder/Widgets/ModalV2/ModalV2';
import { ProgressBar } from '@/AppBuilder/Widgets/Progressbar/Progressbar';
import { Camera } from '@/AppBuilder/Widgets/Camera/Camera';
import { Accordion } from '@/AppBuilder/Widgets/Accordion/Accordion';
import { ReorderableList } from '@/AppBuilder/Widgets/ReorderableList/ReorderableList';
import { JSONEditor } from '@/AppBuilder/Widgets/JSONEditor/JSONEditor';
import { JSONExplorer } from '@/AppBuilder/Widgets/JSONExplorer/JSONExplorer';
import { Navigation } from '@/AppBuilder/Widgets/Navigation';

// Lazy load module components to reduce viewer bundle size
const ModuleContainer = lazy(() =>
  import('@/modules/Modules/components').then((m) => ({ default: m.ModuleContainer }))
);
const ModuleViewer = lazy(() => import('@/modules/Modules/components').then((m) => ({ default: m.ModuleViewer })));

import { APP_HEADER_HEIGHT, QUERY_PANE_HEIGHT } from '../AppCanvas/appCanvasConstants';

// import './requestIdleCallbackPolyfill';

const Icon = lazy(() => import('@/AppBuilder/Widgets/Icon'));
const Table = lazy(() => import('@/AppBuilder/Widgets/NewTable/Table'));
const KanbanBoard = lazy(() => import('@/AppBuilder/Widgets/KanbanBoard/KanbanBoard'));
const ColorPicker = lazy(() => import('@/AppBuilder/Widgets/ColorPicker/ColorPicker'));
const CodeEditor = lazy(() => import('@/AppBuilder/Widgets/CodeEditor'));
const Calendar = lazy(() => import('@/AppBuilder/Widgets/Calendar/Calendar'));
const Chart = lazy(() => import('@/AppBuilder/Widgets/Chart'));
const Chat = lazy(() => import('@/AppBuilder/Widgets/Chat'));
const FilePicker = lazy(() => import('@/AppBuilder/Widgets/FilePicker'));
const Image = lazy(() => import('@/AppBuilder/Widgets/Image/Image'));
const MapComponent = lazy(() => import('@/AppBuilder/Widgets/Map/Map'));
const PDF = lazy(() => import('@/AppBuilder/Widgets/PDF'));
const QrScanner = lazy(() => import('@/AppBuilder/Widgets/QrScanner/QrScanner'));
const RichTextEditor = lazy(() => import('@/AppBuilder/Widgets/RichTextEditor'));
const TreeSelect = lazy(() => import('@/AppBuilder/Widgets/TreeSelect/TreeSelect'));
const Cascader = lazy(() => import('@/AppBuilder/Widgets/Cascader/Cascader'));
const TagsInput = lazy(() => import('@/AppBuilder/Widgets/TagsInput/TagsInput'));
const KeyValuePair = lazy(() => import('@/AppBuilder/Widgets/KeyValuePair/KeyValuePair'));
const LibraryComponent = lazy(() => import('@/AppBuilder/Widgets/LibraryComponent'));
// Ant Design pack (experiment): one lazy chunk shared by all eight widgets.
const AntButton = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntButton }))
);
const AntInput = lazy(() => import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntInput })));
const AntSelect = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntSelect }))
);
const AntDatePicker = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntDatePicker }))
);
const AntTable = lazy(() => import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntTable })));
const AntCard = lazy(() => import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntCard })));
const AntTag = lazy(() => import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntTag })));
const AntStatistic = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntStatistic }))
);
const AntTitle = lazy(() => import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntTitle })));
const AntText = lazy(() => import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntText })));
const AntDescriptions = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntDescriptions }))
);
const AntList = lazy(() => import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntList })));
const AntBadge = lazy(() => import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntBadge })));
const AntAvatar = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntAvatar }))
);
const AntProgress = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntProgress }))
);
const AntTimeline = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntTimeline }))
);
const AntEmpty = lazy(() => import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntEmpty })));
const AntTextArea = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntTextArea }))
);
const AntInputNumber = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntInputNumber }))
);
const AntRangePicker = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntRangePicker }))
);
const AntCheckbox = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntCheckbox }))
);
const AntSwitch = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntSwitch }))
);
const AntSegmented = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntSegmented }))
);
const AntAlert = lazy(() => import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntAlert })));
const AntSteps = lazy(() => import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntSteps })));
const AntBreadcrumb = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntBreadcrumb }))
);
const AntDivider = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesign').then((m) => ({ default: m.AntDivider }))
);
// Second batch and charts: their own lazy chunks, so the chart library only loads for apps with a chart.
const AntRadio = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntRadio }))
);
const AntSlider = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntSlider }))
);
const AntRate = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntRate }))
);
const AntTimePicker = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntTimePicker }))
);
const AntAutoComplete = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntAutoComplete }))
);
const AntCascader = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntCascader }))
);
const AntTreeSelect = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntTreeSelect }))
);
const AntColorPicker = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntColorPicker }))
);
const AntUpload = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntUpload }))
);
const AntTree = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntTree }))
);
const AntCollapse = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntCollapse }))
);
const AntImage = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntImage }))
);
const AntCalendar = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntCalendar }))
);
const AntQRCode = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntQRCode }))
);
const AntSkeleton = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntSkeleton }))
);
const AntResult = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntResult }))
);
const AntPagination = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntDesignMore').then((m) => ({ default: m.AntPagination }))
);
const AntLineChart = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntCharts').then((m) => ({ default: m.AntLineChart }))
);
const AntColumnChart = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntCharts').then((m) => ({ default: m.AntColumnChart }))
);
const AntPieChart = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntCharts').then((m) => ({ default: m.AntPieChart }))
);
const AntGaugeChart = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntCharts').then((m) => ({ default: m.AntGaugeChart }))
);
const AntFunnelChart = lazy(() =>
  import('@/AppBuilder/Widgets/AntDesign/AntCharts').then((m) => ({ default: m.AntFunnelChart }))
);
// shadcn/ui pack (experiment): widgets in one lazy chunk, charts (Recharts) in another.
const ShadButton = lazy(() => import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadButton })));
const ShadAlert = lazy(() => import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadAlert })));
const ShadBreadcrumb = lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadBreadcrumb }))
);
const ShadHeading = lazy(() => import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadHeading })));
const ShadText = lazy(() => import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadText })));
const ShadTable = lazy(() => import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadTable })));
const ShadStat = lazy(() => import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadStat })));
const ShadBadge = lazy(() => import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadBadge })));
const ShadAvatar = lazy(() => import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadAvatar })));
const ShadProgress = lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadProgress }))
);
const ShadSeparator = lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadSeparator }))
);
const ShadSkeleton = lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadSkeleton }))
);
const ShadAccordion = lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadAccordion }))
);
const ShadEmpty = lazy(() => import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadEmpty })));
const ShadInput = lazy(() => import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadInput })));
const ShadTextarea = lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadTextarea }))
);
const ShadSelect = lazy(() => import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadSelect })));
const ShadCheckbox = lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadCheckbox }))
);
const ShadSwitch = lazy(() => import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadSwitch })));
const ShadRadioGroup = lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadRadioGroup }))
);
const ShadSlider = lazy(() => import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadSlider })));
const ShadDatePicker = lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadDatePicker }))
);
const ShadToggleGroup = lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/Shadcn').then((m) => ({ default: m.ShadToggleGroup }))
);
const ShadAreaChart = lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/ShadCharts').then((m) => ({ default: m.ShadAreaChart }))
);
const ShadBarChart = lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/ShadCharts').then((m) => ({ default: m.ShadBarChart }))
);
const ShadPieChart = lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/ShadCharts').then((m) => ({ default: m.ShadPieChart }))
);
const ShadKanban = lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/ShadKanban').then((m) => ({ default: m.ShadKanban }))
);
const ShadTabs = lazy(() => import('@/AppBuilder/Widgets/Shadcn/ShadTabs').then((m) => ({ default: m.ShadTabs })));
const ShadListView = lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/ShadListView').then((m) => ({ default: m.ShadListView }))
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

export const AllComponents = {
  Button,
  Image,
  Text,
  TextInput,
  NumberInput,
  Table,
  TextArea,
  RichTextEditor,
  DropDown,
  DropdownV2,
  Cascader,
  Checkbox,
  Datepicker,
  DatetimePickerV2,
  DaterangePicker,
  DatePickerV2,
  TimePicker,
  Multiselect,
  MultiselectV2,
  Chart,
  Map: MapComponent,
  QrScanner,
  ToggleSwitch,
  RadioButton,
  RadioButtonV2,
  StarRating,
  Divider,
  FilePicker,
  FileInput,
  FileButton,
  PasswordInput,
  EmailInput,
  PhoneInput,
  CurrencyInput,
  IFrame,
  CodeEditor,
  Timer,
  Statistics,
  Pagination,
  Tags,
  Spinner,
  LibraryComponent,
  AntButton,
  AntInput,
  AntSelect,
  AntDatePicker,
  AntTable,
  AntCard,
  AntTag,
  AntStatistic,
  AntTitle,
  AntText,
  AntDescriptions,
  AntList,
  AntBadge,
  AntAvatar,
  AntProgress,
  AntTimeline,
  AntEmpty,
  AntTextArea,
  AntInputNumber,
  AntRangePicker,
  AntCheckbox,
  AntSwitch,
  AntSegmented,
  AntAlert,
  AntSteps,
  AntBreadcrumb,
  AntDivider,
  AntRadio,
  AntSlider,
  AntRate,
  AntTimePicker,
  AntAutoComplete,
  AntCascader,
  AntTreeSelect,
  AntColorPicker,
  AntUpload,
  AntTree,
  AntCollapse,
  AntImage,
  AntCalendar,
  AntQRCode,
  AntSkeleton,
  AntResult,
  AntPagination,
  AntLineChart,
  AntColumnChart,
  AntPieChart,
  AntGaugeChart,
  AntFunnelChart,
  ShadButton,
  ShadAlert,
  ShadBreadcrumb,
  ShadHeading,
  ShadText,
  ShadTable,
  ShadStat,
  ShadBadge,
  ShadAvatar,
  ShadProgress,
  ShadSeparator,
  ShadSkeleton,
  ShadAccordion,
  ShadEmpty,
  ShadInput,
  ShadTextarea,
  ShadSelect,
  ShadCheckbox,
  ShadSwitch,
  ShadRadioGroup,
  ShadSlider,
  ShadDatePicker,
  ShadToggleGroup,
  ShadAreaChart,
  ShadBarChart,
  ShadPieChart,
  ShadKanban,
  ShadTabs,
  ShadListView,
  CircularProgressBar,
  RangeSlider,
  RangeSliderV2,
  Timeline,
  SvgImage,
  Html,
  ButtonGroup,
  ButtonGroupV2,
  CustomComponent,
  VerticalDivider,
  ColorPicker,
  KanbanBoard,
  Steps,
  TreeSelect,
  Link,
  Icon,
  BoundedBox,
  ToggleSwitchV2,
  Chat,
  PopoverMenu,
  Form,
  Calendar,
  Container,
  FlexContainer,
  Listview,
  Tabs,
  Kanban,
  Modal,
  ModalV2,
  ModuleContainer,
  ModuleViewer,
  ProgressBar,
  TagsInput,
  AudioRecorder,
  Camera,
  Accordion,
  ReorderableList,
  JSONEditor,
  JSONExplorer,
  KeyValuePair,
  Navigation,
};
if (isPDFSupported()) {
  AllComponents.PDF = PDF;
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
  return `calc(${100}% - ${
    isDraggingQueryPane ? 0 : Math.max(queryPanelHeight + APP_HEADER_HEIGHT, APP_HEADER_HEIGHT + QUERY_PANE_HEIGHT)
  }px)`;
};
