import React from 'react';
import { FxParamTypeMapping } from './utils';
import { Color } from '../CodeBuilder/Elements/Color';
import { Json } from '../CodeBuilder/Elements/Json';
import { Select } from '../CodeBuilder/Elements/Select';
import { Toggle } from '../CodeBuilder/Elements/Toggle';
import { AlignButtons } from '../CodeBuilder/Elements/AlignButtons';
import { Number } from '../CodeBuilder/Elements/Number';
import { BoxShadow } from '../CodeBuilder/Elements/BoxShadow';
import ClientServerSwitch from '../CodeBuilder/Elements/ClientServerSwitch';
import Switch from '../CodeBuilder/Elements/Switch';
import Checkbox from '../CodeBuilder/Elements/Checkbox';
import Slider from '../CodeBuilder/Elements/Slider';
import { Input } from '../CodeBuilder/Elements/Input';
import { Icon } from '../CodeBuilder/Elements/Icon';
import { Visibility } from '../CodeBuilder/Elements/Visibility';
import { NumberInput } from '../CodeBuilder/Elements/NumberInput';
import TableRowHeightInput from '../CodeBuilder/Elements/TableRowHeightInput';

const AllElements = {
  Color,
  Json,
  Toggle,
  Select,
  AlignButtons,
  Number,
  BoxShadow,
  ClientServerSwitch,
  Switch,
  Checkbox,
  Slider,
  Input,
  Icon,
  Visibility,
  NumberInput,
  TableRowHeightInput,
};

export const DynamicFxTypeRenderer = ({ paramType, ...restProps }) => {
  const componentType = FxParamTypeMapping[paramType];
  const DynamicComponent = AllElements[componentType];

  return <DynamicComponent {...restProps} />;
};
