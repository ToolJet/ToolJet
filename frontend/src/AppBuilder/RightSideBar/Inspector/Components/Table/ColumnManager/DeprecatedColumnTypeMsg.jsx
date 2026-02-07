import React from 'react';
import Icon from '@/_ui/Icon/solidIcons/index';
import { ToolTip } from '@/_components/ToolTip';
import i18next from 'i18next';

export const DEPRECATED_COLUMN_TYPES = [
  {
    label: i18next.t('widget.Table.columnTypes.default', 'Default'),
    value: 'default',
    docLink: '',
    currentAlternativeColumnLabel: i18next.t('widget.Table.columnTypes.string', 'String'),
  },
  {
    label: i18next.t('widget.Table.columnTypes.badge', 'Badge'),
    value: 'badge',
    currentAlternativeColumnLabel: i18next.t('widget.Table.columnTypes.multiselect', 'Multiselect'),
  },
  {
    label: i18next.t('widget.Table.columnTypes.dropdown', 'Dropdown'),
    value: 'dropdown',
    currentAlternativeColumnLabel: i18next.t('widget.Table.columnTypes.singleSelect', 'Single select'),
  },
  {
    label: i18next.t('widget.Table.columnTypes.multipleBadges', 'Multiple badges'),
    value: 'badges',
    currentAlternativeColumnLabel: i18next.t('widget.Table.columnTypes.multiselect', 'Multiselect'),
  },
  {
    label: i18next.t('widget.Table.columnTypes.tags', 'Tags'),
    value: 'tags',
    currentAlternativeColumnLabel: i18next.t('widget.Table.columnTypes.multiselect', 'Multiselect'),
  },
  {
    label: i18next.t('widget.Table.columnTypes.radio', 'Radio'),
    value: 'radio',
    currentAlternativeColumnLabel: i18next.t('widget.Table.columnTypes.singleSelect', 'Single select'),
  },
  {
    label: i18next.t('widget.Table.columnTypes.multiselect', 'Multiselect'),
    value: 'multiselect',
    currentAlternativeColumnLabel: i18next.t('widget.Table.columnTypes.multiselect', 'Multiselect'),
  },
  {
    label: i18next.t('widget.Table.columnTypes.toggleSwitch', 'Toggle switch'),
    value: 'toggle',
    currentAlternativeColumnLabel: i18next.t('widget.Table.columnTypes.singleSelect', 'Single select'),
  },
];

export const checkIfTableColumnDeprecated = (columnType) => {
  return DEPRECATED_COLUMN_TYPES.some((ct) => ct.value === columnType);
};

export const TooltipBody = ({ columnLabel, isDeprecatedStyle }) => {
  if (isDeprecatedStyle) {
    return (
      <div style={{ padding: '8px 4px', textAlign: 'left', width: '185px' }}>
        {/* <div className="font-weight-bold mb-2">Deprecating input widget type</div> */}
        <div>{i18next.t('widget.Table.deprecatedStyleMessage', 'This style will be deprecated in the future releases')}</div>
      </div>
    );
  }
  return (
    <div style={{ padding: '8px 4px', textAlign: 'left', width: '185px' }}>
      <div className="font-weight-bold mb-2">
        {i18next.t('widget.Table.deprecatedColumnTitle', 'Deprecating column type')}
      </div>
      <div>
        {i18next.t(
          'widget.Table.deprecatedColumnMessage',
          'This column type is deprecated and will be removed in a future update.  We recommend using the new {{columnLabel}} when creating applications moving forward.',
          { columnLabel }
        )}
      </div>
    </div>
  );
};

export const DeprecatedColumnTooltip = ({ columnType, children, isDeprecatedStyle }) => {
  const deprecatedColumnType = DEPRECATED_COLUMN_TYPES.find((ct) => ct.value === columnType);
  return (
    <ToolTip
      message={
        <TooltipBody
          columnLabel={deprecatedColumnType?.currentAlternativeColumnLabel}
          isDeprecatedStyle={isDeprecatedStyle}
        />
      }
      show={(deprecatedColumnType || isDeprecatedStyle) ?? false}
      placement={isDeprecatedStyle ? 'bottom' : 'left'}
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
      className="d-flex mx-3"
      style={{ padding: '12px 16px', gap: '6px', backgroundColor: '#FCEEEF', borderRadius: '6px' }}
    >
      <span>
        <Icon name={'warning'} height={16} width={16} fill="#DB4324" />
      </span>
      <span style={{ color: '#2D343B' }}>
        {i18next.t(
          'widget.Table.deprecatedColumnMessage',
          'This column type is deprecated and will be removed in a future update.  We recommend using the new {{columnLabel}} when creating applications moving forward.',
          { columnLabel: deprecatedColumnType.currentAlternativeColumnLabel }
        )}
      </span>
    </div>
  );
};

export default DeprecatedColumnTypeMsg;
