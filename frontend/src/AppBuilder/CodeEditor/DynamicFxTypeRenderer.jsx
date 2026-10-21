import React, { useMemo } from 'react';
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
import { Datepicker } from '../CodeBuilder/Elements/Datepicker';
import TableRowHeightInput from '../CodeBuilder/Elements/TableRowHeightInput';
import DropdownMenu from '../CodeBuilder/Elements/DropdownMenu';
import { TimePicker } from '../CodeBuilder/Elements/TimePicker';
import { Query } from '../CodeBuilder/Elements/Query';
import ColorSwatches from '@/modules/Appbuilder/components/ColorSwatches';
import { ThemeDefaultContext, followsTheme, useThemeValue } from './themeDefault';

const AllElements = {
  Color,
  ColorSwatches,
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
  Datepicker,
  TimePicker,
  DropdownMenu,
  Query,
};

export const DynamicFxTypeRenderer = ({ paramType, ...restProps }) => {
  const componentType = FxParamTypeMapping[paramType];
  const DynamicComponent = AllElements[componentType];
  // A UI 2.0 widget's blank colour or radius style follows the theme; the field shows it (themeDefault.js). The
  // provider is always there, so setting a value does not remount the field (and close its open picker).
  const { component, componentId, paramName, value, darkMode } = restProps;
  const themed = followsTheme({ component, paramName, paramType, value });
  const themeValue = useThemeValue(themed, componentId, component, paramName, darkMode);
  const themeDefault = useMemo(() => (themed ? { value: themeValue } : null), [themed, themeValue]);

  return (
    <ThemeDefaultContext.Provider value={themeDefault}>
      <DynamicComponent {...restProps} />
    </ThemeDefaultContext.Provider>
  );
};
