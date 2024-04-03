import { Button } from '@/Editor/Components/Button';
import { Image } from '@/Editor/Components/Image';
import { Text } from '@/Editor/Components/Text';
import { Table } from '@/Editor/Components/Table/Table';
import { TextInput } from '@/Editor/Components/TextInput';
import { NumberInput } from '@/Editor/Components/NumberInput';
import { TextArea } from '@/Editor/Components/TextArea';
import { Container } from '@/Editor/Components/Container';
import { Tabs } from '@/Editor/Components/Tabs';
import { RichTextEditor } from '@/Editor/Components/RichTextEditor';
import { DropDown } from '@/Editor/Components/DropDown';
import { Checkbox } from '@/Editor/Components/Checkbox';
import { Datepicker } from '@/Editor/Components/Datepicker';
import { DaterangePicker } from '@/Editor/Components/DaterangePicker';
import { Multiselect } from '@/Editor/Components/Multiselect';
import { Modal } from '@/Editor/Components/Modal';
import { Chart } from '@/Editor/Components/Chart';
// import { Map } from '@/Editor/Components/Map/Map';
import { QrScanner } from '@/Editor/Components/QrScanner/QrScanner';
import { ToggleSwitch } from '@/Editor/Components/Toggle';
import { RadioButton } from '@/Editor/Components/RadioButton';
import { StarRating } from '@/Editor/Components/StarRating';
import { Divider } from '@/Editor/Components/Divider';
import { FilePicker } from '@/Editor/Components/FilePicker';
import { PasswordInput } from '@/Editor/Components/PasswordInput';
import { Calendar } from '@/Editor/Components/Calendar';
import { Listview } from '@/Editor/Components/Listview';
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
import { Kanban } from '@/Editor/Components/Kanban/Kanban';
import { Steps } from '@/Editor/Components/Steps';
import { TreeSelect } from '@/Editor/Components/TreeSelect';
import { Icon } from '@/Editor/Components/Icon';
import { Link } from '@/Editor/Components/Link';
import { Form } from '@/Editor/Components/Form/Form';
import { BoundedBox } from '@/Editor/Components/BoundedBox/BoundedBox';

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
  Checkbox,
  Datepicker,
  DaterangePicker,
  Multiselect,
  Modal,
  Chart,
  // Map,
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

export const getComponentToRender = (componentName) => {
  return AllComponents[componentName];
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

export function handleLowPriorityWork(callback, timeout = null) {
  const options = timeout ? { timeout } : {};
  window.requestIdleCallback(callback, options);
}
