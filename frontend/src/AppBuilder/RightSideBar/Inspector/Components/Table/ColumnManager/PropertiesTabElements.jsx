import React from 'react';
import { resolveReferences } from '@/_helpers/utils';
import { useTranslation } from 'react-i18next';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { EventManager } from '../../../EventManager';
import { ProgramaticallyHandleProperties } from '../ProgramaticallyHandleProperties';
import { OptionsList } from '../SelectOptionsList/OptionsList';
import { ValidationProperties } from './ValidationProperties';
import DatepickerProperties from './DatepickerProperties';
import { Option } from '@/AppBuilder/CodeBuilder/Elements/Select';
import DeprecatedColumnTypeMsg from './DeprecatedColumnTypeMsg';
import CustomSelect from '@/_ui/Select';
import defaultStyles from '@/_ui/Select/styles';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const PropertiesTabElements = ({
  column,
  index,
  darkMode,
  currentState,
  onColumnItemChange,
  getPopoverFieldSource,
  setColumnPopoverRootCloseBlocker,
  component,
  props,
  columnEventChanged,
  timeZoneOptions,
  handleEventManagerPopoverCallback,
}) => {
  const { t } = useTranslation();

  const customStylesForSelect = {
    ...defaultStyles(darkMode, '100%'),
  };

  return (
    <>
      {column.columnType && <DeprecatedColumnTypeMsg columnType={column.columnType} darkMode={darkMode} />}
      <div className="field px-3" data-cy={`dropdown-column-type`} onClick={(e) => e.stopPropagation()}>
        <label data-cy={`label-column-type`} className="form-label">
          {t('widget.Table.columnType', 'Column type')}
        </label>

        <CustomSelect
          options={[
            { label: 'String', value: 'string' },
            { label: 'Number', value: 'number' },
            { label: 'Text', value: 'text' },
            { label: 'Date Picker', value: 'datepicker' },
            { label: 'Select', value: 'select' },
            { label: 'MultiSelect', value: 'newMultiSelect' },
            { label: 'Boolean', value: 'boolean' },
            { label: 'Image', value: 'image' },
            { label: 'Link', value: 'link' },
            { label: 'JSON', value: 'json' },
            { label: 'Markdown', value: 'markdown' },
            { label: 'HTML', value: 'html' },
            // Following column types are deprecated
            { label: 'Default', value: 'default' },
            { label: 'Dropdown', value: 'dropdown' },
            { label: 'Multiselect', value: 'multiselect' },
            { label: 'Toggle switch', value: 'toggle' },
            { label: 'Radio', value: 'radio' },
            { label: 'Badge', value: 'badge' },
            { label: 'Multiple badges', value: 'badges' },
            { label: 'Tags', value: 'tags' },
          ]}
          components={{ DropdownIndicator, Option }}
          onChange={(value) => {
            onColumnItemChange(index, 'columnType', value);
          }}
          value={column.columnType}
          useCustomStyles={true}
          styles={customStylesForSelect}
          className={`column-type-table-inspector`}
        />
      </div>
      <div className="field px-3" data-cy={`input-and-label-column-name`}>
        <label data-cy={`label-column-name`} className="form-label">
          {t('widget.Table.columnName', 'Column name')}
        </label>
        <CodeHinter
          currentState={currentState}
          initialValue={column.name}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          placeholder={column.name}
          onChange={(value) => onColumnItemChange(index, 'name', value)}
          componentName={getPopoverFieldSource(column.columnType, 'name')}
          popOverCallback={(showing) => {
            setColumnPopoverRootCloseBlocker('name', showing);
          }}
        />
      </div>
      <div data-cy={`input-and-label-key`} className="field px-3">
        <label className="form-label">{t('widget.Table.key', 'Key')}</label>
        <CodeHinter
          currentState={currentState}
          initialValue={column.key}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          placeholder={column.name}
          onChange={(value) => onColumnItemChange(index, 'key', value)}
          componentName={getPopoverFieldSource(column.columnType, 'key')}
          popOverCallback={(showing) => {
            setColumnPopoverRootCloseBlocker('tableKey', showing);
          }}
        />
      </div>
      <div data-cy={`transformation-field`} className="field px-3">
        <label className="form-label">{t('widget.Table.transformationField', 'Transformation')}</label>
        <CodeHinter
          currentState={currentState}
          initialValue={column?.transformation ?? '{{cellValue}}'}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          placeholder={column.name}
          onChange={(value) => onColumnItemChange(index, 'transformation', value)}
          componentName={getPopoverFieldSource(column.columnType, 'transformation')}
          popOverCallback={(showing) => {
            setColumnPopoverRootCloseBlocker('transformation', showing);
          }}
          enablePreview={false}
        />
      </div>
      {column.columnType === 'toggle' && (
        <div className="px-3">
          <EventManager
            sourceId={props?.component?.id}
            eventSourceType="table_column"
            hideEmptyEventsAlert={true}
            eventMetaDefinition={{ events: { onChange: { displayName: 'On change' } } }}
            currentState={currentState}
            dataQueries={props.dataQueries}
            components={props.components}
            eventsChanged={(events) => columnEventChanged(column, events)}
            apps={props.apps}
            popOverCallback={(showing) => {
              handleEventManagerPopoverCallback(showing);
            }}
            pages={props.pages}
          />
        </div>
      )}
      {(column.columnType === 'dropdown' ||
        column.columnType === 'multiselect' ||
        column.columnType === 'badge' ||
        column.columnType === 'badges' ||
        column.columnType === 'radio') && (
        <div>
          <div data-cy={`input-and-label-values`} className="field mb-2 px-3">
            <label className="form-label">{t('widget.Table.values', 'Values')}</label>
            <CodeHinter
              currentState={currentState}
              initialValue={column.values}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'{{[1, 2, 3]}}'}
              onChange={(value) => onColumnItemChange(index, 'values', value)}
              componentName={getPopoverFieldSource(column.columnType, 'values')}
              popOverCallback={(showing) => {
                setColumnPopoverRootCloseBlocker('values', showing);
              }}
            />
          </div>
          <div data-cy={`input-and-label-labels`} className="field mb-2 px-3">
            <label className="form-label">{t('widget.Table.labels', 'Labels')}</label>
            <CodeHinter
              currentState={currentState}
              initialValue={column.labels}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'{{["one", "two", "three"]}}'}
              onChange={(value) => onColumnItemChange(index, 'labels', value)}
              componentName={getPopoverFieldSource(column.columnType, 'labels')}
              popOverCallback={(showing) => {
                setColumnPopoverRootCloseBlocker('labels', showing);
              }}
            />
          </div>
        </div>
      )}
      {column.columnType === 'link' && (
        <>
          <div className="field mb-2 px-3">
            <label className="form-label">Display text</label>
            <CodeHinter
              currentState={currentState}
              initialValue={column?.displayText}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'Display text'}
              onChange={(value) => onColumnItemChange(index, 'displayText', value)}
              componentName={getPopoverFieldSource(column.columnType, 'displayText')}
            />
          </div>

          <div className="border  mx-3" style={{ borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--surfaces-surface-02)', padding: '8px 12px' }}>
              <ProgramaticallyHandleProperties
                label="Link target"
                currentState={currentState}
                index={index}
                darkMode={darkMode}
                callbackFunction={onColumnItemChange}
                property="linkTarget"
                props={column}
                component={component}
                paramMeta={{
                  type: 'toggle',
                  displayName: 'Open in new tab',
                }}
                paramType="properties"
              />
            </div>
          </div>
        </>
      )}
      {column.columnType === 'number' && (
        <div className="field mb-2 px-3">
          <label className="form-label">{t('widget.Table.decimalPlaces', 'Decimal Places')}</label>
          <CodeHinter
            currentState={currentState}
            initialValue={column?.decimalPlaces}
            theme={darkMode ? 'monokai' : 'default'}
            mode="javascript"
            lineNumbers={false}
            placeholder={'{{2}}'}
            onChange={(value) => onColumnItemChange(index, 'decimalPlaces', value)}
            componentName={getPopoverFieldSource(column.columnType, 'decimalPlaces')}
            popOverCallback={(showing) => {
              setColumnPopoverRootCloseBlocker('decimalPlaces', showing);
            }}
          />
        </div>
      )}
      {!['image', 'link'].includes(column.columnType) && (
        <div className="border mx-3 column-popover-card-ui" style={{ borderRadius: '6px' }}>
          <div style={{ background: 'var(--surfaces-surface-02)', padding: '8px 12px' }}>
            <ProgramaticallyHandleProperties
              label="make editable"
              currentState={currentState}
              index={index}
              darkMode={darkMode}
              callbackFunction={onColumnItemChange}
              property="isEditable"
              props={column}
              component={component}
              paramMeta={{ type: 'toggle', displayName: 'Make editable' }}
              paramType="properties"
            />
          </div>
          {(column?.fxActiveFields?.includes('isEditable') || resolveReferences(column?.isEditable)) && (
            <ValidationProperties
              column={column}
              index={index}
              darkMode={darkMode}
              currentState={currentState}
              onColumnItemChange={onColumnItemChange}
              getPopoverFieldSource={getPopoverFieldSource}
              setColumnPopoverRootCloseBlocker={setColumnPopoverRootCloseBlocker}
            />
          )}
        </div>
      )}
      {column.columnType === 'json' && (
        <div className="border mx-3 column-popover-card-ui" style={{ borderRadius: '6px', marginTop: '-8px' }}>
          <div style={{ background: 'var(--surfaces-surface-02)', padding: '8px 12px' }}>
            <ProgramaticallyHandleProperties
              label="Indent"
              currentState={currentState}
              index={index}
              darkMode={darkMode}
              callbackFunction={onColumnItemChange}
              property="jsonIndentation"
              props={column}
              component={component}
              paramMeta={{ type: 'toggle', displayName: 'Indent' }}
              paramType="properties"
            />
          </div>
        </div>
      )}
      <div className="border mx-3 column-popover-card-ui" style={{ borderRadius: '6px', marginTop: '-8px' }}>
        <div style={{ background: 'var(--surfaces-surface-02)', padding: '8px 12px' }}>
          <ProgramaticallyHandleProperties
            label="Visibility"
            currentState={currentState}
            index={index}
            darkMode={darkMode}
            callbackFunction={onColumnItemChange}
            property="columnVisibility"
            props={column}
            component={component}
            paramMeta={{ type: 'toggle', displayName: 'Visibility' }}
            paramType="properties"
          />
        </div>
      </div>

      {['select', 'newMultiSelect', 'datepicker'].includes(column.columnType) && <hr className="mx-0 my-2" />}
      {column.columnType === 'datepicker' && (
        <div className="field" style={{ marginTop: '-24px' }}>
          <DatepickerProperties
            column={column}
            index={index}
            darkMode={darkMode}
            currentState={currentState}
            onColumnItemChange={onColumnItemChange}
            component={component}
          />
        </div>
      )}
      {['select', 'newMultiSelect'].includes(column.columnType) && (
        <OptionsList
          column={column}
          props={props}
          index={index}
          darkMode={darkMode}
          currentState={currentState}
          getPopoverFieldSource={getPopoverFieldSource}
          setColumnPopoverRootCloseBlocker={setColumnPopoverRootCloseBlocker}
          component={component}
          onColumnItemChange={onColumnItemChange}
        />
      )}
    </>
  );
};
const DropdownIndicator = (props) => {
  return (
    <div {...props}>
      {/* Your custom SVG */}
      {props.selectProps.menuIsOpen ? (
        <SolidIcon name="arrowUpTriangle" width="16" height="16" fill={'#6A727C'} />
      ) : (
        <SolidIcon name="arrowDownTriangle" width="16" height="16" fill={'#6A727C'} />
      )}
    </div>
  );
};
