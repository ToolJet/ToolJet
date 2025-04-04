import { Button } from '@/Editor/Components/Button';
import { Image } from '@/Editor/Components/Image/Image';
import { Text } from '@/Editor/Components/Text';
// import { Table } from '@/Editor/Components/Table/Table';
import { Table } from '@/AppBuilder/Widgets/Table/Table';

import { TextInput } from '@/AppBuilder/Widgets/TextInput';
import { TextArea } from '@/AppBuilder/Widgets/TextArea';
import { NumberInput } from '@/AppBuilder/Widgets/NumberInput';
import { RichTextEditor } from '@/Editor/Components/RichTextEditor';
import { DropDown } from '@/Editor/Components/DropDown';
import { DropdownV2 } from '@/Editor/Components/DropdownV2/DropdownV2';
import { Checkbox } from '@/Editor/Components/Checkbox';
import { Datepicker } from '@/Editor/Components/Datepicker';
import { DatetimePickerV2 } from '@/AppBuilder/Widgets/Date/DatetimePickerV2';
import { DatePickerV2 } from '@/AppBuilder/Widgets/Date/DatePickerV2';
import { TimePicker } from '@/AppBuilder/Widgets/Date/TimePicker';
import { DaterangePicker } from '@/AppBuilder/Widgets/Date/DaterangePicker';
import { Multiselect } from '@/Editor/Components/Multiselect';
import { MultiselectV2 } from '@/Editor/Components/MultiselectV2/MultiselectV2';
// import { Modal } from '@/Editor/Components/Modal';
import { Chart } from '@/Editor/Components/Chart';
import { Map as MapComponent } from '@/Editor/Components/Map/Map';
import { QrScanner } from '@/Editor/Components/QrScanner/QrScanner';
import { ToggleSwitch } from '@/Editor/Components/Toggle';
import { ToggleSwitchV2 } from '@/Editor/Components/ToggleV2';
import { RadioButton } from '@/Editor/Components/RadioButton';
import { RadioButtonV2 } from '@/Editor/Components/RadioButtonV2/RadioButtonV2';
import { StarRating } from '@/Editor/Components/StarRating';
import { Divider } from '@/Editor/Components/Divider';
import { FilePicker } from '@/Editor/Components/FilePicker';
import { PasswordInput } from '@/AppBuilder/Widgets/PasswordInput';
import { EmailInput } from '@/AppBuilder/Widgets/EmailInput';
import { PhoneInput } from '@/AppBuilder/Widgets/PhoneCurrency/PhoneInput';
import { CurrencyInput } from '@/AppBuilder/Widgets/PhoneCurrency/CurrencyInput';
// import { Calendar } from '@/Editor/Components/Calendar';
// import { Listview } from '@/Editor/Components/Listview';
import { IFrame } from '@/Editor/Components/IFrame';
import { CodeEditor } from '@/Editor/Components/CodeEditor';
import { Timer } from '@/Editor/Components/Timer';
import { Statistics } from '@/Editor/Components/Statistics';
import { Pagination } from '@/Editor/Components/Pagination';
import { Tags } from '@/Editor/Components/Tags';
import { Spinner } from '@/Editor/Components/Spinner';
import { CircularProgressBar } from '@/Editor/Components/CirularProgressbar';
import { RangeSlider } from '@/Editor/Components/RangeSlider';
import { Timeline } from '@/Editor/Components/Timeline';
import { SvgImage } from '@/Editor/Components/SvgImage';
import { Html } from '@/Editor/Components/Html';
import { ButtonGroup } from '@/Editor/Components/ButtonGroup';
import { CustomComponent } from '@/Editor/Components/CustomComponent/CustomComponent';
import { VerticalDivider } from '@/Editor/Components/verticalDivider';
import { ColorPicker } from '@/Editor/Components/ColorPicker';
import { KanbanBoard } from '@/Editor/Components/KanbanBoard/KanbanBoard';
// import { Kanban } from '@/Editor/Components/Kanban/Kanban';
import { Steps } from '@/Editor/Components/Steps';
import { TreeSelect } from '@/Editor/Components/TreeSelect';
import { Icon } from '@/Editor/Components/Icon';
import { Link } from '@/Editor/Components/Link';
// import { Form } from '@/Editor/Components/Form/Form';
import { BoundedBox } from '@/Editor/Components/BoundedBox/BoundedBox';
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

/**
 * Update the canvas background with the given parameters
 * @param {Object} params The parameters to update the canvas background with
 * @param {string} params.canvasBackgroundColor The new background color
 * @param {string} params.backgroundFxQuery The new background color formula
 * @param {boolean} [isUpdate=false] Whether to update the background color without
 *  re-calculating it from the given formula.
 */
export const updateCanvasBackground = ({ canvasBackgroundColor, backgroundFxQuery }, isUpdate = false) => {
  const { setCanvasBackground } = useEditorStore.getState().actions;

  /**
   * If the background color should be updated, update it with the given parameters
   */
  if (isUpdate) {
    return setCanvasBackground({
      backgroundFxQuery,
      canvasBackgroundColor,
    });
  }

  /**
   * If the background color formula is not empty, calculate the new background color
   * and update it if it has changed
   */
  if (backgroundFxQuery !== '') {
    const computedBackgroundColor = resolveWidgetFieldValue(
      useEditorStore.getState().canvasBackground?.backgroundFxQuery
    );

    /**
     * If the computed background color is different from the current one, update it
     */
    if (computedBackgroundColor !== canvasBackgroundColor) {
      setCanvasBackground({
        ...useEditorStore.getState().canvasBackground,
        canvasBackgroundColor: computedBackgroundColor,
      });
    }
  }
};

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
