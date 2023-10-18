import React from 'react';
import SelectSearch from 'react-select-search';
import { useTranslation } from 'react-i18next';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';
import { Color } from '../../Elements/Color';

export const StylesTabElements = ({
  column,
  index,
  darkMode,
  currentState,
  onColumnItemChange,
  getPopoverFieldSource,
  setColumnPopoverRootCloseBlocker,
  component,
}) => {
  const { t } = useTranslation();

  return (
    <div className="column-style-tab">
      <div className="field mb-2">
        <label className="form-label">{t('widget.Table.horizontalAlignment', 'Horizontal Alignment')}</label>
        <SelectSearch
          className={'select-search'}
          options={[
            { name: 'Left', value: 'left' },
            { name: 'Center', value: 'center' },
            { name: 'Right', value: 'right' },
          ]}
          value={column?.horizontalAlignment ?? 'left'}
          search={true}
          closeOnSelect={true}
          onChange={(value) => {
            onColumnItemChange(index, 'horizontalAlignment', value);
          }}
          fuzzySearch
          placeholder={t('globals.select', 'Select') + '...'}
        />
      </div>
      {(column.columnType === 'string' || column.columnType === undefined || column.columnType === 'default') && (
        <div>
          <div data-cy={`input-overflow`} className="field mb-2">
            <label data-cy={`label-overflow`} className="form-label">
              {t('widget.Table.overflow', 'Overflow')}
            </label>
            <SelectSearch
              className={'select-search'}
              options={[
                { name: 'Wrap', value: 'wrap' },
                { name: 'Scroll', value: 'scroll' },
                { name: 'Hide', value: 'hide' },
              ]}
              value={column.textWrap}
              search={true}
              closeOnSelect={true}
              onChange={(value) => {
                onColumnItemChange(index, 'textWrap', value);
              }}
              fuzzySearch
              placeholder={t('globals.select', 'Select') + '...'}
            />
          </div>
          <div data-cy={`input-and-label-text-color`} className="field mb-2">
            <label className="form-label">{t('widget.Table.textColor', 'Text color')}</label>
            <CodeHinter
              currentState={currentState}
              initialValue={column.textColor}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'Text color of the cell'}
              onChange={(value) => onColumnItemChange(index, 'textColor', value)}
              componentName={getPopoverFieldSource(column.columnType, 'textColor')}
              fieldMeta={column}
              component={component}
              popOverCallback={(showing) => {
                setColumnPopoverRootCloseBlocker('textColor', showing);
              }}
            />
          </div>
          <div className="field mb-2" data-cy={`input-and-label-cell-background-color`}>
            <label className="form-label">{t('widget.Table.cellBgColor', 'Cell Background Color')}</label>
            <CodeHinter
              currentState={currentState}
              initialValue={column.cellBackgroundColor ?? 'inherit'}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={''}
              onChange={(value) => onColumnItemChange(index, 'cellBackgroundColor', value)}
              componentName={getPopoverFieldSource(column.columnType, 'cellBackgroundColor')}
              popOverCallback={(showing) => {
                setColumnPopoverRootCloseBlocker('cellBackgroundColor', showing);
              }}
            />
          </div>
        </div>
      )}
      {column.columnType === 'toggle' && (
        <div>
          <div className="field mb-2">
            <Color
              param={{ name: 'Active color' }}
              paramType="properties"
              componentMeta={{ properties: { color: { displayName: 'Active color' } } }}
              definition={{ value: column.activeColor || '#3c92dc' }}
              onChange={(name, value, color) => onColumnItemChange(index, 'activeColor', color)}
            />
          </div>
        </div>
      )}
      {column.columnType === 'image' && (
        <>
          <div data-cy={`input-and-label-border-radius`} className="field mb-2">
            <label className="form-label">{t('widget.Table.borderRadius', 'Border radius')}</label>
            <CodeHinter
              currentState={currentState}
              initialValue={column.borderRadius}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={''}
              onChange={(value) => onColumnItemChange(index, 'borderRadius', value)}
              componentName={getPopoverFieldSource(column.columnType, 'borderRadius')}
            />
          </div>
          <div data-cy={`input-and-label-width`} className="field mb-2">
            <label className="form-label">{t('widget.Table.width', 'Width')}</label>
            <CodeHinter
              currentState={currentState}
              initialValue={column.width}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={''}
              onChange={(value) => onColumnItemChange(index, 'width', value)}
              componentName={getPopoverFieldSource(column.columnType, 'width')}
            />
          </div>
          <div data-cy={`input-and-label-height`} className="field mb-2">
            <label className="form-label">{t('widget.Table.height', 'Height')}</label>
            <CodeHinter
              currentState={currentState}
              initialValue={column.height}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={''}
              onChange={(value) => onColumnItemChange(index, 'height', value)}
              componentName={getPopoverFieldSource(column.columnType, 'height')}
            />
          </div>
          <div data-cy={`input-and-label-object-fit`} className="field mb-2">
            <label className="form-label">{t('widget.Table.objectFit', 'Object fit')}</label>
            <SelectSearch
              className={'select-search'}
              options={[
                { name: 'Cover', value: 'cover' },
                { name: 'Contain', value: 'contain' },
                { name: 'Fill', value: 'fill' },
              ]}
              value={column.objectFit}
              search={true}
              closeOnSelect={true}
              onChange={(value) => {
                onColumnItemChange(index, 'objectFit', value);
              }}
              fuzzySearch
              placeholder={t('Select') + '...'}
            />
          </div>
        </>
      )}
    </div>
  );
};
