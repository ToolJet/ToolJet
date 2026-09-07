import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { ProgramaticallyHandleProperties } from '../../ProgramaticallyHandleProperties';
import { MAX_RATING_COUNT } from '@/AppBuilder/Widgets/NewTable/_utils/helper';

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
  const maxRatingLimitMessage = t('widget.Table.maxRatingLimit', 'Max value is {{maxRatingCount}}', {
    maxRatingCount: MAX_RATING_COUNT,
  });

  // Bumped whenever an offending value is clamped, forcing the (uncontrolled) CodeHinter to
  // remount and pick up the corrected value — a re-render alone won't refresh it when the
  // clamped value is unchanged from what's already saved (e.g. two offending entries in a row).
  const [maxRatingRemountKey, setMaxRatingRemountKey] = React.useState(0);

  const handleMaxRatingChange = (value) => {
    const isDynamicBinding = typeof value === 'string' && value.includes('{{');
    const numericValue = Number(value);
    const exceedsLimit = !isDynamicBinding && value !== '' && !isNaN(numericValue) && numericValue > MAX_RATING_COUNT;
    if (exceedsLimit) {
      toast.error(maxRatingLimitMessage);
      setMaxRatingRemountKey((key) => key + 1);
    }
    onColumnItemChange(index, 'maxRating', exceedsLimit ? String(MAX_RATING_COUNT) : value);
  };

  return (
    <div className="field" style={{ marginTop: '-8px' }}>
      <div className="px-3 mb-3">
        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Options</label>
      </div>
      <div className="field mb-2 px-3">
        <label className="">{t('widget.Table.maxRating', 'Max rating')}</label>
        <CodeHinter
          key={maxRatingRemountKey}
          currentState={currentState}
          initialValue={column?.maxRating}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          placeholder={'5'}
          onChange={handleMaxRatingChange}
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
          initialValue={column?.defaultRating}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          placeholder={'3'}
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
