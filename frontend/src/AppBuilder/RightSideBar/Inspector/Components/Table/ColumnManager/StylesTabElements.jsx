import React from 'react';
import { useTranslation } from 'react-i18next';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { Color } from '../../../Elements/Color';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import AlignLeft from '@/_ui/Icon/solidIcons/AlignLeft';
import AlignCenter from '@/_ui/Icon/solidIcons/AlignCenter';
import AlignRight from '@/_ui/Icon/solidIcons/AlignRight';
import { ProgramaticallyHandleProperties } from '../ProgramaticallyHandleProperties';
import { Select } from '@/Editor/CodeBuilder/Elements/Select';

export const StylesTabElements = ({
  column,
  index,
  darkMode,
  currentState,
  onColumnItemChange,
  getPopoverFieldSource,
  component,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="field  d-flex custom-gap-12 align-items-center align-self-stretch justify-content-between px-3">
        <label className="d-flex align-items-center" style={{ flex: '1 1 0' }}>
          {column.columnType !== 'boolean' && column.columnType !== 'image'
            ? t('widget.Table.textAlignment', 'Text Alignment')
            : 'Alignment'}
        </label>
        <ToggleGroup
          onValueChange={(_value) => onColumnItemChange(index, 'horizontalAlignment', _value)}
          defaultValue={column?.horizontalAlignment || 'left'}
          style={{ width: '58%' }}
        >
          <ToggleGroupItem value="left">
            <AlignLeft width={14} />
          </ToggleGroupItem>
          <ToggleGroupItem value="center">
            <AlignCenter width={14} />
          </ToggleGroupItem>
          <ToggleGroupItem value="right">
            <AlignRight width={14} />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {column.columnType === 'toggle' && (
        <div>
          <div className="field px-3">
            <Color
              param={{ name: 'Active color' }}
              paramType="properties"
              componentMeta={{ properties: { color: { displayName: 'Active color' } } }}
              definition={{ value: column.activeColor || '#3c92dc' }}
              onChange={(name, value, color) => onColumnItemChange(index, 'activeColor', color)}
              shouldFlexDirectionBeRow={true}
            />
          </div>
        </div>
      )}
      {column.columnType === 'image' && (
        <>
          <div data-cy={`input-and-label-border-radius`} className="field px-3">
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
          <div data-cy={`input-and-label-object-fit`} className="field px-3">
            <label className="form-label">{t('widget.Table.imageFit', 'Image fit')}</label>
            <Select
              className={'select-search'}
              meta={{
                options: [
                  { label: 'Cover', value: 'cover' },
                  { label: 'Contain', value: 'contain' },
                  { label: 'Fill', value: 'fill' },
                ],
              }}
              value={column.objectFit}
              search={true}
              closeOnSelect={true}
              onChange={(value) => {
                onColumnItemChange(index, 'objectFit', value);
              }}
              fuzzySearch
              placeholder={t('Select') + '...'}
              width={'100%'}
            />
          </div>
        </>
      )}
      {column.columnType === 'boolean' && (
        <div className="d-flex flex-column custom-gap-16">
          <div className="field px-3">
            <Color
              param={{ name: 'Checked' }}
              paramType="properties"
              componentMeta={{ properties: { color: { displayName: 'Checked' } } }}
              definition={{ value: column?.toggleOnBg ? column.toggleOnBg : darkMode ? '#849DFF' : '#3A5CCC' }}
              onChange={(name, value, color) => onColumnItemChange(index, 'toggleOnBg', color)}
              shouldFlexDirectionBeRow={true}
            />
          </div>
          <div className="field px-3">
            <Color
              param={{ name: 'Unchecked' }}
              paramType="properties"
              componentMeta={{ properties: { color: { displayName: 'Unchecked' } } }}
              definition={{ value: column?.toggleOffBg ? column.toggleOffBg : darkMode ? '#3A3F42' : '#D7DBDF' }}
              onChange={(name, value, color) => onColumnItemChange(index, 'toggleOffBg', color)}
              shouldFlexDirectionBeRow={true}
            />
          </div>
        </div>
      )}

      {[
        'string',
        'default',
        undefined,
        'number',
        'json',
        'markdown',
        'html',
        'boolean',
        'select',
        'text',
        'newMultiSelect',
        'datepicker',
      ].includes(column.columnType) && (
        <>
          {column.columnType !== 'boolean' && (
            <div data-cy={`input-and-label-text-color`} className="field px-3">
              <ProgramaticallyHandleProperties
                label="Text color"
                currentState={currentState}
                index={index}
                darkMode={darkMode}
                callbackFunction={onColumnItemChange}
                property="textColor"
                props={column}
                component={component}
                paramMeta={{ type: 'color', displayName: 'Text color' }}
                paramType="properties"
              />
            </div>
          )}
          <div className="field px-3" data-cy={`input-and-label-cell-background-color`}>
            <ProgramaticallyHandleProperties
              label="Cell color"
              currentState={currentState}
              index={index}
              darkMode={darkMode}
              callbackFunction={onColumnItemChange}
              property="cellBackgroundColor"
              props={column}
              component={component}
              paramMeta={{ type: 'color', displayName: 'Cell color' }}
              paramType="properties"
            />
          </div>
        </>
      )}

      {column.columnType === 'link' && (
        <>
          <div data-cy={`input-and-label-text-color`} className="field px-3">
            <ProgramaticallyHandleProperties
              label="Text color"
              currentState={currentState}
              index={index}
              darkMode={darkMode}
              callbackFunction={onColumnItemChange}
              property="linkColor"
              props={column}
              component={component}
              paramMeta={{ type: 'color', displayName: 'Text color' }}
              paramType="properties"
            />
          </div>
          <div className="field px-3" data-cy={`input-and-label-cell-background-color`}>
            <ProgramaticallyHandleProperties
              label="Underline color"
              currentState={currentState}
              index={index}
              darkMode={darkMode}
              callbackFunction={onColumnItemChange}
              property="underlineColor"
              props={column}
              component={component}
              paramMeta={{ type: 'color', displayName: 'Underline color' }}
              paramType="properties"
            />
          </div>
          <div className="d-flex px-3 flex-column custom-gap-16">
            <div
              data-cy={`input-overflow`}
              className="field  d-flex custom-gap-12 align-items-center align-self-stretch"
            >
              <label data-cy={`label-overflow`} className="d-flex align-items-center" style={{ flex: '1 1 0' }}>
                Show underline
              </label>
              <ToggleGroup
                onValueChange={(_value) => onColumnItemChange(index, 'underline', _value)}
                defaultValue={column.underline || 'hover'}
                style={{ flex: '1 1 0' }}
              >
                <ToggleGroupItem value="hover">Hover</ToggleGroupItem>
                <ToggleGroupItem value="always">Always</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </>
      )}
    </>
  );
};
