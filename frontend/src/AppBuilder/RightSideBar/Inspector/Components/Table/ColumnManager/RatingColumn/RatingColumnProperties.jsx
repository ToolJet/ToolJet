import React from 'react';
import { useTranslation } from 'react-i18next';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { ProgramaticallyHandleProperties } from '../../ProgramaticallyHandleProperties';

const RatingColumnProperties = ({
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
    <div className="field" style={{ marginTop: '-8px' }}>
      <div className="px-3 mb-3">
        <label className="form-label" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          Options
        </label>
      </div>
      <div className="field mb-2 px-3">
        <label className="">{t('widget.Table.maxRating', 'Max rating')}</label>
        <CodeHinter
          currentState={currentState}
          initialValue={column?.maxRating || '{{5}}'}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          placeholder={'{{5}}'}
          onChange={(value) => onColumnItemChange(index, 'maxRating', value)}
          componentName={getPopoverFieldSource(column.columnType, 'maxRating')}
          popOverCallback={(showing) => {
            setColumnPopoverRootCloseBlocker('maxRating', showing);
          }}
        />
      </div>
      <div className="field mb-2 px-3">
        <label className="form-label">{t('widget.Table.defaultRating', 'Default rating')}</label>
        <CodeHinter
          currentState={currentState}
          initialValue={column?.defaultRating || '{{3}}'}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          placeholder={'{{3}}'}
          onChange={(value) => onColumnItemChange(index, 'defaultRating', value)}
          componentName={getPopoverFieldSource(column.columnType, 'defaultRating')}
          popOverCallback={(showing) => {
            setColumnPopoverRootCloseBlocker('defaultRating', showing);
          }}
        />
      </div>
      <div className="field mb-2 px-3">
        <ProgramaticallyHandleProperties
          label="Allow half rating"
          initialValue={column?.allowHalfStar || '{{false}}'}
          currentState={currentState}
          index={index}
          darkMode={darkMode}
          callbackFunction={onColumnItemChange}
          property="allowHalfStar"
          props={column}
          component={component}
          paramMeta={{ type: 'toggle', displayName: 'Allow half rating' }}
          paramType="properties"
        />
      </div>
    </div>
  );
};

export default RatingColumnProperties;
