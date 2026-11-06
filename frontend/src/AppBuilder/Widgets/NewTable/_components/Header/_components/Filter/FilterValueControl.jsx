import React, { useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { DatePickerRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/DatePickerRenderer';
import { RatingColumn } from '../../../DataTypes';
import { getDatePlaceholder } from '../../../../_utils/addNewRowConfig';
import { MultiOptionValue, OptionValue } from '../FilterChip';
import { isMultiPick } from '../../../../_utils/multiValue';
import { FIELD_CLASS } from './filterRowParts';

// Column types whose value is entered with a control of their own; the rest are typed (select-like columns
// are picked from their `options`)
const PICKER_TYPES = ['datepicker', 'rating'];

export const hasValuePicker = (columnType, options) => Boolean(options) || PICKER_TYPES.includes(columnType);

// The calendar, set up the way the column's cells are (format, time, timezone, unix timestamps)
const DateValue = ({ column, value, onChange, darkMode, dataCy, label }) => {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const resolve = useStore.getState().getResolvedValue;
  const isTimeChecked = resolve(column.isTimeChecked) ?? false;
  const isDateSelectionEnabled = resolve(column.isDateSelectionEnabled) ?? true;
  const isTwentyFourHrFormatEnabled = resolve(column.isTwentyFourHrFormatEnabled) ?? false;

  return (
    // `table-add-new-row-field-control` (table-component.scss) restyles the table's date input to the 36px field
    <div data-cy={dataCy} aria-label={label} className="table-add-new-row-field-control tw-flex tw-w-full">
      <DatePickerRenderer
        isEditable
        value={value}
        onChange={onChange}
        dateDisplayFormat={column.dateFormat}
        parseDateFormat={column.parseDateFormat}
        isTimeChecked={isTimeChecked}
        isDateSelectionEnabled={isDateSelectionEnabled}
        isTwentyFourHrFormatEnabled={isTwentyFourHrFormatEnabled}
        timeZoneValue={column.timeZoneValue}
        timeZoneDisplay={column.timeZoneDisplay}
        unixTimestamp={column.unixTimestamp}
        parseInUnixTimestamp={resolve(column.parseInUnixTimestamp)}
        disabledDates={resolve(column.disabledDates)}
        darkMode={darkMode}
        isInputFocused={isInputFocused}
        setIsInputFocused={setIsInputFocused}
        placeholder={getDatePlaceholder({
          dateFormat: column.dateFormat,
          isTimeChecked,
          isDateSelectionEnabled,
          isTwentyFourHrFormatEnabled,
        })}
      />
    </div>
  );
};

// The column's own rating icons (how many, stars or hearts, half steps, colours). A rating the column gives new
// rows is not a filter, so nothing is filled until one is picked.
const RatingValue = ({ id, column, value, onChange, dataCy }) => (
  <div data-cy={dataCy} className={FIELD_CLASS}>
    <RatingColumn
      isEditable
      id={id}
      column={{ ...column, defaultRating: 0 }}
      cellValue={value}
      row={{ index: 0, original: {} }}
      horizontalAlignment="left"
      handleCellValueChange={(_row, _key, rating) => onChange(String(rating))}
    />
  </div>
);

/**
 * The value of a filter, entered the way its column is: picked from the column's `options`, from a calendar (with
 * a time list when the column has time), or with the column's rating icons. The value is the string the filter
 * stores either way. Used where `hasValuePicker` is true.
 */
export const FilterValueControl = ({
  id,
  columnType,
  condition,
  column,
  options,
  value,
  onChange,
  darkMode,
  dataCy,
  label,
}) => {
  if (options) {
    const Picker = isMultiPick(columnType, condition) ? MultiOptionValue : OptionValue;
    return (
      <div className={FIELD_CLASS}>
        <Picker
          chip={{ value, placeholder: 'Select' }}
          label={label}
          options={options}
          darkMode={darkMode}
          dataCy={dataCy}
          onChange={onChange}
        />
      </div>
    );
  }
  if (columnType === 'datepicker') {
    return (
      <DateValue
        column={column ?? {}}
        value={value}
        onChange={onChange}
        darkMode={darkMode}
        dataCy={dataCy}
        label={label}
      />
    );
  }
  return <RatingValue id={id} column={column ?? {}} value={value} onChange={onChange} dataCy={dataCy} />;
};
