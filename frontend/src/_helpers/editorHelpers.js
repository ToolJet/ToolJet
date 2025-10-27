// import { Button } from '@/AppBuilder/Widgets/Components/Button';
// import { Image } from '@/AppBuilder/Widgets/Components/Image/Image';
// import { Text } from '@/AppBuilder/Widgets/Components/Text';
// import { Table } from '@/AppBuilder/Widgets/Components/Table/Table';
// import { TextInput } from '@/AppBuilder/Widgets/Components/TextInput';
// import { NumberInput } from '@/AppBuilder/Widgets/Components/NumberInput';
// import { TextArea } from '@/AppBuilder/Widgets/Components/TextArea';

// import { Container } from '@/AppBuilder/Widgets/Components/Container';
// import { Tabs } from '@/AppBuilder/Widgets/Components/Tabs';
// import { RichTextEditor } from '@/AppBuilder/Widgets/Components/RichTextEditor';
// import { DropDown } from '@/AppBuilder/Widgets/Components/DropDown';
// import { DropdownV2 } from '@/AppBuilder/Widgets/Components/DropdownV2/DropdownV2';
// import { Checkbox } from '@/AppBuilder/Widgets/Components/Checkbox';
// import { Datepicker } from '@/AppBuilder/Widgets/Components/Datepicker';
// import { DaterangePicker } from '@/AppBuilder/Widgets/Components/DaterangePicker';
// import { Multiselect } from '@/AppBuilder/Widgets/Components/Multiselect';
// import { MultiselectV2 } from '@/AppBuilder/Widgets/Components/MultiselectV2/MultiselectV2';
// import { Modal } from '@/AppBuilder/Widgets/Components/Modal';
// import { Chart } from '@/AppBuilder/Widgets/Components/Chart';
// import { Map as MapComponent } from '@/AppBuilder/Widgets/Components/Map/Map';
// import { QrScanner } from '@/AppBuilder/Widgets/Components/QrScanner/QrScanner';
// import { ToggleSwitch } from '@/AppBuilder/Widgets/Components/Toggle';
// import { ToggleSwitchV2 } from '@/AppBuilder/Widgets/Components/ToggleV2';

// import { RadioButton } from '@/AppBuilder/Widgets/Components/RadioButton';
// import { StarRating } from '@/AppBuilder/Widgets/Components/StarRating';
// import { Divider } from '@/AppBuilder/Widgets/Components/Divider';
// import { FilePicker } from '@/AppBuilder/Widgets/Components/FilePicker';
// import { PasswordInput } from '@/AppBuilder/Widgets/Components/PasswordInput';
// import { Calendar } from '@/AppBuilder/Widgets/Components/Calendar';
// import { Listview } from '@/AppBuilder/Widgets/Components/Listview';
// import { IFrame } from '@/AppBuilder/Widgets/Components/IFrame';
// import { CodeEditor } from '@/AppBuilder/Widgets/Components/CodeEditor';
// import { Timer } from '@/AppBuilder/Widgets/Components/Timer';
// import { Statistics } from '@/AppBuilder/Widgets/Components/Statistics';
// import { Pagination } from '@/AppBuilder/Widgets/Components/Pagination';
// import { Tags } from '@/AppBuilder/Widgets/Components/Tags';
// import { Spinner } from '@/AppBuilder/Widgets/Components/Spinner';
// import { CircularProgressBar } from '@/AppBuilder/Widgets/Components/CirularProgressbar';
// import { RangeSlider } from '@/AppBuilder/Widgets/Components/RangeSlider';
// import { Timeline } from '@/AppBuilder/Widgets/Components/Timeline';
// import { SvgImage } from '@/AppBuilder/Widgets/Components/SvgImage';
// import { Html } from '@/AppBuilder/Widgets/Components/Html';
// import { ButtonGroup } from '@/AppBuilder/Widgets/Components/ButtonGroup';
// import { CustomComponent } from '@/AppBuilder/Widgets/Components/CustomComponent/CustomComponent';
// import { VerticalDivider } from '@/AppBuilder/Widgets/Components/verticalDivider';
// import { ColorPicker } from '@/AppBuilder/Widgets/Components/ColorPicker';
// import { KanbanBoard } from '@/AppBuilder/Widgets/Components/KanbanBoard/KanbanBoard';
// import { Kanban } from '@/AppBuilder/Widgets/Components/Kanban/Kanban';
// import { Steps } from '@/AppBuilder/Widgets/Components/Steps';
// import { TreeSelect } from '@/AppBuilder/Widgets/Components/TreeSelect';
// import { Icon } from '@/AppBuilder/Widgets/Components/Icon';
// import { Link } from '@/AppBuilder/Widgets/Components/Link';
// import { Form } from '@/AppBuilder/Widgets/Components/Form/Form';
// import { BoundedBox } from '@/AppBuilder/Widgets/Components/BoundedBox/BoundedBox';
// import { isPDFSupported } from '@/_helpers/appUtils';
import './requestIdleCallbackPolyfill';

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

// export const AllComponents = {
//   Button,
//   Image,
//   Text,
//   TextInput,
//   NumberInput,
//   Table,
//   TextArea,
//   Container,
//   Tabs,
//   RichTextEditor,
//   DropDown,
//   DropdownV2,
//   Checkbox,
//   Datepicker,
//   DaterangePicker,
//   Multiselect,
//   MultiselectV2,
//   Modal,
//   Chart,
//   Map: MapComponent,
//   QrScanner,
//   ToggleSwitch,
//   RadioButton,
//   StarRating,
//   Divider,
//   FilePicker,
//   PasswordInput,
//   Calendar,
//   IFrame,
//   CodeEditor,
//   Listview,
//   Timer,
//   Statistics,
//   Pagination,
//   Tags,
//   Spinner,
//   CircularProgressBar,
//   RangeSlider,
//   Timeline,
//   SvgImage,
//   Html,
//   ButtonGroup,
//   CustomComponent,
//   VerticalDivider,
//   ColorPicker,
//   KanbanBoard,
//   Kanban,
//   Steps,
//   TreeSelect,
//   Link,
//   Icon,
//   Form,
//   BoundedBox,
//   ToggleSwitchV2,
// };
// if (isPDFSupported()) {
//   AllComponents.PDF = await import('@/AppBuilder/Widgets/Components/PDF').then((module) => module.PDF);
// }

// export const getComponentToRender = (componentName) => {
//   const shouldHideWidget = componentName === 'PDF' && !isPDFSupported();
//   if (shouldHideWidget) return null;
//   return AllComponents[componentName];
// };

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
