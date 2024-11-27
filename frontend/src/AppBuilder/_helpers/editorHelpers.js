import { Button } from '@/AppBuilder/Widgets/Button';
import { Image } from '@/AppBuilder/Widgets/Image';
import { Text } from '@/AppBuilder/Widgets/Text/Text';
import { Table } from '@/AppBuilder/Widgets/Table/Table';

import { TextInput } from '@/AppBuilder/Widgets/TextInput';
import { NumberInput } from '@/AppBuilder/Widgets/NumberInput';
import { TextArea } from '@/AppBuilder/Widgets/TextArea';
import { RichTextEditor } from '@/AppBuilder/Widgets/RichTextEditor';
import { DropDown } from '@/AppBuilder/Widgets/DropDown';
import { DropdownV2 } from '@/AppBuilder/Widgets/DropdownV2/DropdownV2';
import { Checkbox } from '@/AppBuilder/Widgets/Checkbox';
import { Datepicker } from '@/AppBuilder/Widgets/Datepicker/Datepicker';
import { DaterangePicker } from '@/AppBuilder/Widgets/DaterangePicker';
import { Multiselect } from '@/AppBuilder/Widgets/Multiselect';
import { MultiselectV2 } from '@/AppBuilder/Widgets/MultiselectV2/MultiselectV2';

import { Chart } from '@/AppBuilder/Widgets/Chart';
import { Map as MapComponent } from '@/AppBuilder/Widgets/Map/Map';
import { QrScanner } from '@/AppBuilder/Widgets/QrScanner/QrScanner';
import { ToggleSwitch } from '@/AppBuilder/Widgets/Toggle';
import { ToggleSwitchV2 } from '@/AppBuilder/Widgets/ToggleV2';

import { RadioButton } from '@/AppBuilder/Widgets/RadioButton';
import { RadioButtonV2 } from '@/AppBuilder/Widgets/RadioButtonV2/RadioButtonV2';
import { StarRating } from '@/AppBuilder/Widgets/StarRating';
import { Divider } from '@/AppBuilder/Widgets/Divider';
import { FilePicker } from '@/AppBuilder/Widgets/FilePicker';
import { PasswordInput } from '@/AppBuilder/Widgets/PasswordInput';

import { IFrame } from '@/AppBuilder/Widgets/IFrame';
import { CodeEditor } from '@/AppBuilder/Widgets/CodeEditor';
import { Timer } from '@/AppBuilder/Widgets/Timer';
import { Statistics } from '@/AppBuilder/Widgets/Statistics';
import { Pagination } from '@/AppBuilder/Widgets/Pagination';
import { Tags } from '@/AppBuilder/Widgets/Tags';
import { Spinner } from '@/AppBuilder/Widgets/Spinner';
import { CircularProgressBar } from '@/AppBuilder/Widgets/CirularProgressbar';
import { RangeSlider } from '@/AppBuilder/Widgets/RangeSlider';
import { Timeline } from '@/AppBuilder/Widgets/Timeline';
import { SvgImage } from '@/AppBuilder/Widgets/SvgImage';
import { Html } from '@/AppBuilder/Widgets/Html';
import { ButtonGroup } from '@/AppBuilder/Widgets/ButtonGroup';
import { CustomComponent } from '@/AppBuilder/Widgets/CustomComponent/CustomComponent';
import { VerticalDivider } from '@/AppBuilder/Widgets/verticalDivider';
import { ColorPicker } from '@/AppBuilder/Widgets/ColorPicker';
import { KanbanBoard } from '@/AppBuilder/Widgets/KanbanBoard/KanbanBoard';
import { Steps } from '@/AppBuilder/Widgets/Steps';
import { TreeSelect } from '@/AppBuilder/Widgets/TreeSelect';
import { Icon } from '@/AppBuilder/Widgets/Icon';
import { Link } from '@/AppBuilder/Widgets/Link';
import { BoundedBox } from '@/AppBuilder/Widgets/BoundedBox/BoundedBox';
import { isPDFSupported } from '@/_helpers/appUtils';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { useEditorStore } from '@/_stores/editorStore';

import { Container } from '@/AppBuilder/Widgets/Container';
import { Listview } from '@/AppBuilder/Widgets/Listview';
import { Tabs } from '@/AppBuilder/Widgets/Tabs';
import { Kanban } from '@/AppBuilder/Widgets/Kanban/Kanban';
import { Form } from '@/AppBuilder/Widgets/Form/Form';
import { Modal } from '@/AppBuilder/Widgets/Modal';
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
  DaterangePicker,
  Multiselect,
  MultiselectV2,
  Modal,
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
