import React, { useMemo } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { LOCALE_HINT } from '../lib/locale';
import { cn } from '../lib/cn';
import {
  FONT_LABELS,
  FONT_VALUES,
  colorFor,
  fontStack,
  px,
  recordItems,
  styleVars,
} from '../lib/ui2/display/lists/model';
import { Chip, InlineProgress, RecordAvatar, onKeyActivate } from '../lib/ui2/display/lists/parts';
import { useRecordSelection } from '../lib/ui2/display/lists/useRecordSelection';
import { LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { RowsSkel } from '../lib/ui2/loading/shapes';
import { TOKEN, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-display-lists.css';

const DENSITY: Record<string, number> = { compact: 28, default: 36, comfortable: 40 };

// UI 2.0's Record list: compact rows of an avatar, a title over a meta line, a status chip, a progress bar and a
// trailing value.
export const RecordList = () => {
  const [data] = ToolJet.useStateArray({
    name: 'data',
    label: 'Data',
    initialValue: [
      { id: 1, customer: 'Harbor Bistro', contact: 'Maya Chen', due: '2026-10-14', status: 'Paid', total: 1240 },
      {
        id: 2,
        customer: 'Northwind Florists',
        contact: 'Owen Hart',
        due: '2026-10-16',
        status: 'Pending',
        total: 386.5,
      },
      { id: 3, customer: 'Juniper Dental', contact: 'Priya Nair', due: '2026-10-09', status: 'Overdue', total: 2915 },
      { id: 4, customer: 'Copper Kettle Cafe', contact: 'Leo Martins', due: '2026-10-21', status: 'Paid', total: 742 },
    ],
  });
  const [titleField] = ToolJet.useStateString({ name: 'titleField', label: 'Title field', initialValue: 'customer' });
  const [avatarField] = ToolJet.useStateString({
    name: 'avatarField',
    label: 'Avatar field (image URL or a name; empty uses the title)',
    initialValue: '',
  });
  const [metaFields] = ToolJet.useStateString({
    name: 'metaFields',
    label: "Meta fields (comma list; 'total|currency', 'due|date:Due {}')",
    initialValue: 'contact, due|date:Due {}',
  });
  const [statusField] = ToolJet.useStateString({
    name: 'statusField',
    label: 'Status field (a chip toned by its words)',
    initialValue: 'status',
  });
  const [progressField] = ToolJet.useStateString({
    name: 'progressField',
    label: 'Progress field (a percentage, 0 to 100)',
    initialValue: '',
  });
  const [valueField] = ToolJet.useStateString({
    name: 'valueField',
    label: 'Trailing value field',
    initialValue: 'total',
  });
  const [valueFormat] = ToolJet.useStateEnumeration({
    name: 'valueFormat',
    label: 'Trailing value format',
    enumDefinition: ['auto', 'number', 'currency', 'percent', 'compact', 'date', 'datetime'],
    initialValue: 'currency',
  });
  const [currency] = ToolJet.useStateString({
    name: 'currency',
    label: 'Currency (ISO code, e.g. USD)',
    initialValue: 'USD',
  });
  const [locale] = ToolJet.useStateString({
    name: 'locale',
    label: 'Locale',
    description: LOCALE_HINT,
    initialValue: '',
  });
  // The pack's own: a colour per status value, over the chip's tone from its words.
  const [statusColors] = ToolJet.useStateObject({ name: 'statusColors', label: 'Status colors', initialValue: {} });
  const [idField] = ToolJet.useStateString({ name: 'idField', label: 'Id field', initialValue: 'id' });
  const [showAvatar] = ToolJet.useStateBoolean({ name: 'showAvatar', label: 'Show avatar', initialValue: true });
  const [avatarShape] = ToolJet.useStateEnumeration({
    name: 'avatarShape',
    label: 'Avatar shape',
    enumDefinition: ['circle', 'rounded'],
    initialValue: 'circle',
    inspector: 'switch',
  });
  const [density] = ToolJet.useStateEnumeration({
    name: 'density',
    label: 'Density',
    enumDefinition: ['compact', 'default', 'comfortable'],
    initialValue: 'default',
    inspector: 'switch',
  });
  const [showDividers] = ToolJet.useStateBoolean({ name: 'showDividers', label: 'Show dividers', initialValue: true });
  const [listStyle] = ToolJet.useStateEnumeration({
    name: 'listStyle',
    label: 'List style',
    enumDefinition: ['card', 'plain'],
    initialValue: 'card',
    inspector: 'switch',
  });
  const [highlightSelected] = ToolJet.useStateBoolean({
    name: 'highlightSelected',
    label: 'Highlight the selected row',
    initialValue: true,
  });
  const [emptyText] = ToolJet.useStateString({
    name: 'emptyText',
    label: 'Empty text',
    initialValue: 'Nothing here yet',
  });
  const [, setSelectedItemId] = ToolJet.useStateString({
    name: 'selectedItemId',
    initialValue: '',
    inspector: 'hidden',
  });
  const [, setSelectedItem] = ToolJet.useStateObject({ name: 'selectedItem', initialValue: {}, inspector: 'hidden' });
  const [, setSelectedItemIndex] = ToolJet.useStateNumber({
    name: 'selectedItemIndex',
    initialValue: -1,
    inspector: 'hidden',
  });
  const onItemClicked = ToolJet.useEventCallback({ name: 'onItemClicked' });
  const background = useThemeColor('backgroundColor', 'List background', TOKEN.surface);
  const borderColor = useThemeColor('borderColor', 'Border and divider color', TOKEN.border);
  const titleColor = useThemeColor('titleColor', 'Title and value color', TOKEN.text);
  const textColor = useThemeColor('textColor', 'Meta line color', TOKEN.mutedText);
  const accent = useThemeColor('accentColor', 'Selected row accent', TOKEN.brand);
  const radius = useThemeRadius('borderRadius', 'List radius');
  const titleFont = ToolJet.useStyleEnumeration({
    name: 'titleFontFamily',
    label: 'Title typeface',
    enumDefinition: FONT_VALUES,
    enumLabels: FONT_LABELS,
    initialValue: 'theme',
  });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ role: 'recordlist', fit: true, loading: 'own', defaultWidth: 20, defaultHeight: 34 });

  const rows = useMemo(
    () =>
      recordItems(data, {
        titleField,
        avatarField,
        metaFields,
        statusField,
        progressField,
        valueField,
        valueFormat,
        currency,
        locale,
        idField,
      }),
    [
      data,
      titleField,
      avatarField,
      metaFields,
      statusField,
      progressField,
      valueField,
      valueFormat,
      currency,
      locale,
      idField,
    ]
  );
  // The id field's own value, as UI 2.0 exposes it (a number stays a number).
  const { selectedKey, pick, clear } = useRecordSelection(
    rows,
    (row) => row[idField || 'id'],
    { setItem: setSelectedItem, setId: (id) => setSelectedItemId(id as string), setIndex: setSelectedItemIndex },
    onItemClicked
  );
  // Clicking the selected record again unselects it, with no click event, and clearSelection does the same from an event
  // (team testing, 2026-10-29: a selection could not be undone).
  const click = (row: (typeof rows)[number]) => (highlightSelected && selectedKey === row.key ? clear() : pick(row));
  ToolJet.useAction({ name: 'clearSelection', displayName: 'Clear selection' }, () => clear());
  const card = listStyle !== 'plain';
  const size = DENSITY[density] ?? DENSITY.default;
  const vars = styleVars([
    [background, '--lk-bg'],
    [borderColor, '--lk-border'],
    [titleColor, '--lk-title'],
    [textColor, '--lk-fg'],
    [accent, '--lk-accent'],
    [radius, '--lk-radius', px],
    [titleFont, '--lk-title-font', fontStack],
  ]);

  return (
    <LoadingFrame
      loading={ld.loading}
      minHeight={160}
      look={
        ld.skeleton ? (
          <RowsSkel
            count={Math.min(rows.length || 4, 8)}
            avatar={showAvatar !== false}
            rounded={avatarShape === 'rounded'}
          />
        ) : (
          <LoadingBox />
        )
      }
    >
      <div className="ui u2l-root" style={vars}>
        <div
          className={cn(
            'u2l-records',
            card ? 'is-card' : 'is-plain',
            `is-${density}`,
            highlightSelected && 'can-select',
            rows.length === 0 && 'is-empty'
          )}
        >
          {rows.length === 0 ? (
            <p className="u2l-empty-text">{emptyText || 'Nothing here yet'}</p>
          ) : (
            <ul role="list">
              {rows.map((row, i) => {
                const isSelected = highlightSelected && selectedKey === row.key;
                const tint = row.status ? colorFor(row.status, statusColors) : undefined;
                return (
                  <li key={row.key}>
                    <div
                      role="button"
                      tabIndex={0}
                      className={cn('u2l-record', showDividers && i > 0 && 'has-divider', isSelected && 'is-selected')}
                      data-selected={isSelected || undefined}
                      onClick={() => click(row)}
                      onKeyDown={onKeyActivate(() => click(row))}
                    >
                      {showAvatar ? (
                        <RecordAvatar src={row.image} name={row.avatarName} size={size} shape={avatarShape} />
                      ) : null}
                      <div className="u2l-record-main">
                        <span className="u2l-record-title" title={row.title}>
                          {row.title}
                        </span>
                        {row.meta ? <span className="u2l-record-meta">{row.meta}</span> : null}
                        {row.progress !== null ? (
                          <InlineProgress pct={row.progress} className="u2l-record-progress" />
                        ) : null}
                      </div>
                      {row.status ? (
                        <span
                          className="u2l-record-status"
                          style={tint ? ({ ['--u2l-tone' as string]: tint } as React.CSSProperties) : undefined}
                        >
                          <Chip value={row.status} />
                        </span>
                      ) : null}
                      {row.value ? <span className="u2l-record-value">{row.value}</span> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </LoadingFrame>
  );
};
