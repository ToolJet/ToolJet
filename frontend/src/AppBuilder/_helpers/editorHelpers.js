import { Button } from '@/AppBuilder/Widgets/Button';
import { Image } from '@/AppBuilder/Widgets/Image/Image';
import { Text } from '@/AppBuilder/Widgets/Text';
import { Table } from '@/AppBuilder/Widgets/NewTable/Table';
import { AudioRecorder } from '@/AppBuilder/Widgets/AudioRecorder/AudioRecorder';
import { TextInput } from '@/AppBuilder/Widgets/TextInput';
import { TextArea } from '@/AppBuilder/Widgets/TextArea';
import { NumberInput } from '@/AppBuilder/Widgets/NumberInput';
import { RichTextEditor } from '@/AppBuilder/Widgets/RichTextEditor';
import { DropDown } from '@/AppBuilder/Widgets/DropDown';
import { DropdownV2 } from '@/AppBuilder/Widgets/DropdownV2/DropdownV2';
import { Checkbox } from '@/AppBuilder/Widgets/Checkbox';
import { Datepicker } from '@/AppBuilder/Widgets/Datepicker';
import { DatetimePickerV2 } from '@/AppBuilder/Widgets/Date/DatetimePickerV2';
import { PopoverMenu } from '@/AppBuilder/Widgets/PopoverMenu/PopoverMenu';
import { DatePickerV2 } from '@/AppBuilder/Widgets/Date/DatePickerV2';
import { TimePicker } from '@/AppBuilder/Widgets/Date/TimePicker';
import { DaterangePicker } from '@/AppBuilder/Widgets/Date/DaterangePicker';
import { Multiselect } from '@/AppBuilder/Widgets/Multiselect';
import { MultiselectV2 } from '@/AppBuilder/Widgets/MultiselectV2/MultiselectV2';
import { TagsInput } from '@/AppBuilder/Widgets/TagsInput/TagsInput';
import { Chart } from '@/AppBuilder/Widgets/Chart';
import { Map as MapComponent } from '@/AppBuilder/Widgets/Map/Map';
import { QrScanner } from '@/AppBuilder/Widgets/QrScanner/QrScanner';
import { ToggleSwitch } from '@/AppBuilder/Widgets/Toggle';
import { ToggleSwitchV2 } from '@/AppBuilder/Widgets/ToggleV2';
import { RadioButton } from '@/AppBuilder/Widgets/RadioButton';
import { RadioButtonV2 } from '@/AppBuilder/Widgets/RadioButtonV2/RadioButtonV2';
import { Rating as StarRating } from '@/AppBuilder/Widgets/Rating/Rating';
import { Divider } from '@/AppBuilder/Widgets/Divider';
import { FilePicker } from '@/AppBuilder/Widgets/FilePicker';
import { PasswordInput } from '@/AppBuilder/Widgets/PasswordInput';
import { EmailInput } from '@/AppBuilder/Widgets/EmailInput';
import { PhoneInput } from '@/AppBuilder/Widgets/PhoneCurrency/PhoneInput';
import { CurrencyInput } from '@/AppBuilder/Widgets/PhoneCurrency/CurrencyInput';
import { IFrame } from '@/AppBuilder/Widgets/IFrame';
import { CodeEditor } from '@/AppBuilder/Widgets/CodeEditor';
import { Timer } from '@/AppBuilder/Widgets/Timer';
import { Statistics } from '@/AppBuilder/Widgets/Statistics';
import { Pagination } from '@/AppBuilder/Widgets/Pagination';
import { Tags } from '@/AppBuilder/Widgets/Tags/Tags';
import { Spinner } from '@/AppBuilder/Widgets/Spinner';
import { CircularProgressBar } from '@/AppBuilder/Widgets/CirularProgressbar';
import { RangeSlider } from '@/AppBuilder/Widgets/RangeSlider';
import { RangeSliderV2 } from '@/AppBuilder/Widgets/RangeSliderV2';
import { Timeline } from '@/AppBuilder/Widgets/Timeline';
import { SvgImage } from '@/AppBuilder/Widgets/SvgImage';
import { Html } from '@/AppBuilder/Widgets/Html';
import { ButtonGroup } from '@/AppBuilder/Widgets/ButtonGroup';
import { CustomComponent } from '@/AppBuilder/Widgets/CustomComponent/CustomComponent';
import { VerticalDivider } from '@/AppBuilder/Widgets/VerticalDivider';
import { ColorPicker } from '@/AppBuilder/Widgets/ColorPicker';
import { KanbanBoard } from '@/AppBuilder/Widgets/KanbanBoard/KanbanBoard';
import { Steps } from '@/AppBuilder/Widgets/Steps';
import { TreeSelect } from '@/AppBuilder/Widgets/TreeSelect';
import { Icon } from '@/AppBuilder/Widgets/Icon';
import { Link } from '@/AppBuilder/Widgets/Link/Link';
// import { Form } from '@/AppBuilder/Widgets/Form/Form';
import { BoundedBox } from '@/AppBuilder/Widgets/BoundedBox/BoundedBox';
import { isPDFSupported } from '@/_helpers/appUtils';
import { Container } from '@/AppBuilder/Widgets/Container/Container';
import { Listview } from '@/AppBuilder/Widgets/Listview/Listview';
import { Tabs } from '@/AppBuilder/Widgets/Tabs';
import { Kanban } from '@/AppBuilder/Widgets/Kanban/Kanban';
import { Form } from '@/AppBuilder/Widgets/Form/Form';
import { Modal } from '@/AppBuilder/Widgets/Modal';
import { ModalV2 } from '@/AppBuilder/Widgets/ModalV2/ModalV2';
import { Calendar } from '@/AppBuilder/Widgets/Calendar/Calendar';
import { ModuleContainer, ModuleViewer } from '@/modules/Modules/components';
import { Chat } from '@/AppBuilder/Widgets/Chat';
import { Camera } from '@/AppBuilder/Widgets/Camera/Camera';

import { APP_HEADER_HEIGHT, QUERY_PANE_HEIGHT } from '../AppCanvas/appCanvasConstants';

// import './requestIdleCallbackPolyfill';

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
  TagsInput,
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
  AudioRecorder,
  Camera,
};
if (isPDFSupported()) {
  AllComponents.PDF = await import('@/AppBuilder/Widgets/PDF').then((module) => module.PDF);
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
