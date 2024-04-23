import { lazy } from 'react';
import { Button } from '@/Editor/Components/Button';
import { TextArea } from '@/Editor/Components/TextArea';
import { Container } from '@/Editor/Components/Container';
import { Tabs } from '@/Editor/Components/Tabs';
import { DropDown } from '@/Editor/Components/DropDown';
import { Checkbox } from '@/Editor/Components/Checkbox';
import { Multiselect } from '@/Editor/Components/Multiselect';
import { Modal } from '@/Editor/Components/Modal';
import { ToggleSwitch } from '@/Editor/Components/Toggle';
import { RadioButton } from '@/Editor/Components/RadioButton';
import { StarRating } from '@/Editor/Components/StarRating';
import { Divider } from '@/Editor/Components/Divider';
import { Table } from '@/Editor/Components/Table/Table';
import { Listview } from '@/Editor/Components/Listview';
import { IFrame } from '@/Editor/Components/IFrame';
import { CodeEditor } from '@/Editor/Components/CodeEditor';
import { Timer } from '@/Editor/Components/Timer';
import { Statistics } from '@/Editor/Components/Statistics';
import { Pagination } from '@/Editor/Components/Pagination';
import { Tags } from '@/Editor/Components/Tags';
import { Spinner } from '@/Editor/Components/Spinner';
import { CircularProgressBar } from '@/Editor/Components/CirularProgressbar';
import { Timeline } from '@/Editor/Components/Timeline';
import { SvgImage } from '@/Editor/Components/SvgImage';
import { Html } from '@/Editor/Components/Html';
import { ButtonGroup } from '@/Editor/Components/ButtonGroup';
import { CustomComponent } from '@/Editor/Components/CustomComponent/CustomComponent';
import { VerticalDivider } from '@/Editor/Components/verticalDivider';
import { KanbanBoard } from '@/Editor/Components/KanbanBoard/KanbanBoard';
import { Kanban } from '@/Editor/Components/Kanban/Kanban';
import { Steps } from '@/Editor/Components/Steps';
import { Link } from '@/Editor/Components/Link';
import { Form } from '@/Editor/Components/Form/Form';
import { isPDFSupported } from '@/_helpers/appUtils';

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

const Chart = lazy(() => import('@/Editor/Components/Chart'));
const PDF = lazy(() => import('@/Editor/Components/PDF'));
const FilePicker = lazy(() => import('@/Editor/Components/FilePicker'));
const Icon = lazy(() => import('@/Editor/Components/Icon'));
const TextInput = lazy(() => import('@/Editor/Components/TextInput'));
const NumberInput = lazy(() => import('@/Editor/Components/NumberInput'));
const PasswordInput = lazy(() => import('@/Editor/Components/PasswordInput'));
const RichTextEditor = lazy(() => import('@/Editor/Components/RichTextEditor'));
const Calendar = lazy(() => import('@/Editor/Components/Calendar'));
const Datepicker = lazy(() => import('@/Editor/Components/Datepicker'));
const DaterangePicker = lazy(() => import('@/Editor/Components/DaterangePicker'));
const Text = lazy(() => import('@/Editor/Components/Text'));
const Image = lazy(() => import('@/Editor/Components/Image'));
const RangeSlider = lazy(() => import('@/Editor/Components/RangeSlider'));
const TreeSelect = lazy(() => import('@/Editor/Components/TreeSelect'));
const ColorPicker = lazy(() => import('@/Editor/Components/ColorPicker'));
const QrScanner = lazy(() => import('@/Editor/Components/QrScanner/QrScanner'));
const BoundedBox = lazy(() => import('@/Editor/Components/BoundedBox/BoundedBox'));
const MapComponent = lazy(() => import('@/Editor/Components/Map/Map'));

export const AllComponents = {
  Button,
  TextArea,
  Container,
  Tabs,
  DropDown,
  Checkbox,
  Multiselect,
  Modal,
  ToggleSwitch,
  RadioButton,
  StarRating,
  Divider,
  Table,
  IFrame,
  CodeEditor,
  Listview,
  Timer,
  Statistics,
  Pagination,
  Tags,
  Spinner,
  CircularProgressBar,
  Timeline,
  SvgImage,
  Html,
  ButtonGroup,
  CustomComponent,
  VerticalDivider,
  KanbanBoard,
  Kanban,
  Steps,
  Link,
  Form,
};

export const getComponentToRender = (componentName) => {
  const shouldHideWidget = componentName === 'PDF' && !isPDFSupported();
  if (shouldHideWidget) return null;
  switch (componentName) {
    case 'Text':
      return Text;
    case 'Image':
      return Image;
    case 'TextInput':
      return TextInput;
    case 'NumberInput':
      return NumberInput;
    case 'PasswordInput':
      return PasswordInput;
    case 'Chart':
      return Chart;
    case 'PDF':
      return PDF;
    case 'FilePicker':
      return FilePicker;
    case 'Icon':
      return Icon;
    case 'RichTextEditor':
      return RichTextEditor;
    case 'QrScanner':
      return QrScanner;
    case 'Calendar':
      return Calendar;
    case 'DaterangePicker':
      return DaterangePicker;
    case 'Datepicker':
      return Datepicker;
    case 'RangeSlider':
      return RangeSlider;
    case 'ColorPicker':
      return ColorPicker;
    case 'TreeSelect':
      return TreeSelect;
    case 'BoundedBox':
      return BoundedBox;
    case 'Map':
      return MapComponent;
    default:
      return AllComponents[componentName];
  }
};

export function isOnlyLayoutUpdate(diffState) {
  const componentDiff = Object.keys(diffState).filter((key) => diffState[key]?.layouts && !diffState[key]?.component);

  return componentDiff.length > 0;
}

function findReferenceInComponent(node, changedCurrentState) {
  if (!node) return false;

  try {
    if (typeof node === 'object') {
      for (let key in node) {
        const value = node[key];
        if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
          // Check if the referenced entity is in the state
          if (changedCurrentState.some((state) => value.includes(state))) {
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

export function handleLowPriorityWork(callback, timeout = null, immediate = false) {
  if (immediate) {
    callback();
  }

  const options = timeout ? { timeout } : {};
  window.requestIdleCallback(callback, options);
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
