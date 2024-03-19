import React from 'react';
import Icon from '@/_ui/Icon/solidIcons/index';
import { ToolTip } from '@/_components/ToolTip';

export const DEPRECATED_COLUMN_TYPES = [
  { label: 'Default', value: 'default', docLink: '' },
  { label: 'Badge', value: 'badge' },
  { label: 'Dropdown', value: 'dropdown' },
  { label: 'Multiple badges', value: 'badges' },
  { label: 'Tags', value: 'tags' },
  { label: 'Radio', value: 'radio' },
  { label: 'Multiselect D', value: 'multiselect' },
  { label: 'Toggle switch', value: 'toggle' },
];

export const checkIfTableColumnDeprecated = (columnType) => {
  return DEPRECATED_COLUMN_TYPES.some((ct) => ct.value === columnType);
};

export const TooltipBody = ({ columnLabel }) => {
  return (
    <div style={{ padding: '8px 4px', textAlign: 'left' }}>
      <div className="font-weight-bold mb-2">Deprecating column type</div>
      <div>{`"This column type is deprecated and will be removed in a future update.  We recommend using the new ${columnLabel} when creating applications moving forward."`}</div>
    </div>
  );
};

export const DeprecatedColumnTooltip = ({ columnType, children }) => {
  const deprecatedColumnType = DEPRECATED_COLUMN_TYPES.find((ct) => ct.value === columnType);
  return (
    <ToolTip
      message={<TooltipBody columnLabel={deprecatedColumnType?.label} />}
      show={deprecatedColumnType ?? false}
      placement="left"
    >
      {children}
    </ToolTip>
  );
};

const DeprecatedColumnTypeMsg = ({ columnType }) => {
  const deprecatedColumnType = DEPRECATED_COLUMN_TYPES.find((ct) => ct.value === columnType);
  if (!deprecatedColumnType) return null;
  return (
    <div
      className="d-flex theme-dark dark-theme"
      style={{ padding: '12px 16px', gap: '4px', backgroundColor: '#FCEEEF' }}
    >
      <span>
        <Icon name={'warning'} height={16} width={16} fill="#DB4324" />
      </span>
      <span style={{ color: '#2D343B' }}>
        This column type will be deprecated by April 2023. For migration instructions, refer to the{' '}
        <span style={{ color: '#4368E3' }}>documentation</span>
      </span>
    </div>
  );
};

export default DeprecatedColumnTypeMsg;
