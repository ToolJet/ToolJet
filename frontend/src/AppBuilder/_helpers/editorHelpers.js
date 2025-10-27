import React, { lazy, Suspense } from 'react';
import { Button } from '@/AppBuilder/Widgets/Components/Button';
import { Image } from '@/AppBuilder/Widgets/Components/Image/Image';
import { Text } from '@/AppBuilder/Widgets/Components/Text';
// import { Table } from '@/AppBuilder/Widgets/Components/Table/Table';
// import { Table } from '@/AppBuilder/Widgets/Table/Table';
import { Table } from '@/AppBuilder/Widgets/NewTable/Table';

import { TextInput } from '@/AppBuilder/Widgets/TextInput';
import { TextArea } from '@/AppBuilder/Widgets/TextArea';
import { NumberInput } from '@/AppBuilder/Widgets/NumberInput';
import { RichTextEditor } from '@/AppBuilder/Widgets/Components/RichTextEditor';
import { DropDown } from '@/AppBuilder/Widgets/Components/DropDown';
import { DropdownV2 } from '@/AppBuilder/Widgets/Components/DropdownV2/DropdownV2';
import { Checkbox } from '@/AppBuilder/Widgets/Components/Checkbox';
import { Datepicker } from '@/AppBuilder/Widgets/Components/Datepicker';
import { DatetimePickerV2 } from '@/AppBuilder/Widgets/Date/DatetimePickerV2';
import { PopoverMenu } from '@/AppBuilder/Widgets/PopoverMenu/PopoverMenu';
import { DatePickerV2 } from '@/AppBuilder/Widgets/Date/DatePickerV2';
import { TimePicker } from '@/AppBuilder/Widgets/Date/TimePicker';
import { DaterangePicker } from '@/AppBuilder/Widgets/Date/DaterangePicker';
import { Multiselect } from '@/AppBuilder/Widgets/Components/Multiselect';
import { MultiselectV2 } from '@/AppBuilder/Widgets/Components/MultiselectV2/MultiselectV2';
// import { Modal } from '@/AppBuilder/Widgets/Components/Modal';
import { Chart } from '@/AppBuilder/Widgets/Components/Chart';
import { Map as MapComponent } from '@/AppBuilder/Widgets/Components/Map/Map';
import { QrScanner } from '@/AppBuilder/Widgets/Components/QrScanner/QrScanner';
import { ToggleSwitch } from '@/AppBuilder/Widgets/Components/Toggle';
import { ToggleSwitchV2 } from '@/AppBuilder/Widgets/Components/ToggleV2';
import { RadioButton } from '@/AppBuilder/Widgets/Components/RadioButton';
import { RadioButtonV2 } from '@/AppBuilder/Widgets/Components/RadioButtonV2/RadioButtonV2';
import { Rating as StarRating } from '@/AppBuilder/Widgets/Rating/Rating';
import { Divider } from '@/AppBuilder/Widgets/Components/Divider';
import { FilePicker } from '@/AppBuilder/Widgets/Components/FilePicker';
import { PasswordInput } from '@/AppBuilder/Widgets/PasswordInput';
import { EmailInput } from '@/AppBuilder/Widgets/EmailInput';
import { PhoneInput } from '@/AppBuilder/Widgets/PhoneCurrency/PhoneInput';
import { CurrencyInput } from '@/AppBuilder/Widgets/PhoneCurrency/CurrencyInput';
// import { Calendar } from '@/AppBuilder/Widgets/Components/Calendar';
// import { Listview } from '@/AppBuilder/Widgets/Components/Listview';
import { IFrame } from '@/AppBuilder/Widgets/Components/IFrame';
import { CodeEditor } from '@/AppBuilder/Widgets/Components/CodeEditor';
import { Timer } from '@/AppBuilder/Widgets/Components/Timer';
import { Statistics } from '@/AppBuilder/Widgets/Components/Statistics';
import { Pagination } from '@/AppBuilder/Widgets/Components/Pagination';
import { Tags } from '@/AppBuilder/Widgets/Components/Tags/Tags';
import { Spinner } from '@/AppBuilder/Widgets/Components/Spinner';
import { CircularProgressBar } from '@/AppBuilder/Widgets/Components/CirularProgressbar';
import { RangeSlider } from '@/AppBuilder/Widgets/RangeSlider';
import { RangeSliderV2 } from '@/AppBuilder/Widgets/RangeSliderV2';
import { Timeline } from '@/AppBuilder/Widgets/Components/Timeline';
import { SvgImage } from '@/AppBuilder/Widgets/Components/SvgImage';
import { Html } from '@/AppBuilder/Widgets/Components/Html';
import { ButtonGroup } from '@/AppBuilder/Widgets/Components/ButtonGroup';
import { CustomComponent } from '@/AppBuilder/Widgets/Components/CustomComponent/CustomComponent';
import { VerticalDivider } from '@/AppBuilder/Widgets/Components/VerticalDivider';
import { ColorPicker } from '@/AppBuilder/Widgets/Components/ColorPicker';
import { KanbanBoard } from '@/AppBuilder/Widgets/Components/KanbanBoard/KanbanBoard';
// import { Kanban } from '@/AppBuilder/Widgets/Components/Kanban/Kanban';
import { Steps } from '@/AppBuilder/Widgets/Components/Steps';
import { TreeSelect } from '@/AppBuilder/Widgets/Components/TreeSelect';
import { Icon } from '@/AppBuilder/Widgets/Components/Icon';
import { Link } from '@/AppBuilder/Widgets/Components/Link/Link';
// import { Form } from '@/AppBuilder/Widgets/Components/Form/Form';
import { BoundedBox } from '@/AppBuilder/Widgets/Components/BoundedBox/BoundedBox';
import { isPDFSupported } from '@/_helpers/appUtils';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { useEditorStore } from '@/_stores/editorStore';
import { Container } from '@/AppBuilder/Widgets/Container/Container';
import { Listview } from '@/AppBuilder/Widgets/Listview';
import { Tabs } from '@/AppBuilder/Widgets/Tabs';
import { Kanban } from '@/AppBuilder/Widgets/Kanban/Kanban';
import { Form } from '@/AppBuilder/Widgets/Form/Form';
import { Modal } from '@/AppBuilder/Widgets/Modal';
import { ModalV2 } from '@/AppBuilder/Widgets/ModalV2/ModalV2';
import { Calendar } from '@/AppBuilder/Widgets/Calendar/Calendar';
import { ModuleContainer, ModuleViewer } from '@/modules/Modules/components';
import { Chat } from '@/AppBuilder/Widgets/Chat';

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
  AllComponents.PDF = await import('@/AppBuilder/Widgets/Components/PDF').then((module) => module.PDF);
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
