import React from 'react';
import { useTranslation } from 'react-i18next';
import CodeHinter from '@/AppBuilder/CodeEditor';
import ReactDatePicker from 'react-datepicker';
import moment from 'moment';
import Timepicker from '@/ToolJetUI/Timepicker/Timepicker';
import CustomDatePickerHeader from '@/AppBuilder/Widgets/Table/CustomDatePickerHeader';
import { resolveReferences } from '@/_helpers/utils';
import cx from 'classnames';

const getDate = (date, format) => {
  const dateMomentInstance = date && moment(date, format);
  if (dateMomentInstance && dateMomentInstance.isValid()) {
    return dateMomentInstance.toDate();
  } else {
    return null;
  }
};

export const ValidationProperties = ({
  column,
  index,
  darkMode,
  currentState,
  onColumnItemChange,
  getPopoverFieldSource,
  setColumnPopoverRootCloseBlocker,
}) => {
  const { t } = useTranslation();
  const columnType = column.columnType;

  const getValidationList = (columnType) => {
    switch (columnType) {
      case 'string':
      case undefined:
      case 'default':
      case 'text': {
        const properties = [];
        if (column.columnType !== 'text') {
          properties.push({
            property: 'regex',
            dateCy: 'input-and-label-regex',
            label: 'Regex',
            placeholder: `${/^[\w\s\d]+$/i}`,
          });
        }
        properties.push(
          [
            {
              property: 'minLength',
              dateCy: 'input-and-label-min-length',
              label: 'Min length',
              placeholder: 'Enter min length',
            },
            {
              property: 'maxLength',
              dateCy: 'input-and-label-max-length',
              label: 'Max length',
              placeholder: 'Enter max length',
            },
          ],

          {
            property: 'customRule',
            dateCy: 'input-and-label-custom-rule',
            label: 'Custom rule',
            placeholder: 'eg. {{ 1 < 2 }}',
          }
        );

        return properties;
      }
      case 'number':
        return [
          { property: 'regex', dateCy: 'input-and-label-regex', label: 'Regex', placeholder: `${/^[\w\s\d]+$/i}` },
          [
            {
              property: 'minValue',
              dateCy: 'input-and-label-min-value',
              label: 'Min value',
              placeholder: 'Enter min value',
            },
            {
              property: 'maxValue',
              dateCy: 'input-and-label-max-value',
              label: 'Max value',
              placeholder: 'Enter max value',
            },
          ],
          {
            property: 'customRule',
            dateCy: 'input-and-label-custom-rule',
            label: 'Custom rule',
            placeholder: 'eg. {{ 1 < 2 }}',
          },
        ];
      case 'dropdown':
      case 'select':
      case 'newMultiSelect':
        return [
          {
            property: 'customRule',
            dateCy: 'input-and-label-custom-rule',
            label: 'Custom rule',
            placeholder: 'eg. {{ 1 < 2 }}',
          },
        ];
      case 'datepicker': {
        const isTimeChecked = resolveReferences(column?.isTimeChecked);
        let properties = [];
        properties.push([
          {
            property: 'minDate',
            dateCy: 'input-and-label-min-date',
            label: 'Minimum date',
            placeholder: 'MM/DD/YYYY',
            fieldType: 'datepicker',
          },
          {
            property: 'maxDate',
            dateCy: 'input-and-label-max-date',
            label: 'Maximum date',
            placeholder: 'MM/DD/YYYY',
            fieldType: 'datepicker',
          },
        ]);

        if (isTimeChecked) {
          properties.push([
            {
              property: 'minTime',
              dateCy: 'input-and-label-min-time',
              label: 'Minimum time',
              placeholder: 'HH:mm',
              fieldType: 'timepicker',
            },
            {
              property: 'maxTime',
              dateCy: 'input-and-label-max-time',
              label: 'Maximum time',
              placeholder: 'HH:mm',
              fieldType: 'timepicker',
            },
          ]);
        }
        properties.push({
          property: 'disabledDates',
          dateCy: 'input-and-label-custom-rule',
          label: 'Disabled dates',
          placeholder: '{{[]}}',
        });

        properties.push({
          property: 'customRule',
          dateCy: 'input-and-label-custom-rule',
          label: 'Custom rule',
          placeholder: 'eg. {{ 1 < 2 }}',
        });

        return properties;
      }

      default:
        return [];
    }
  };
  const validationsList = getValidationList(columnType);

  if (validationsList.length < 1) {
    return '';
  }

  const renderAsPerFieldType = (validation) => {
    switch (validation.fieldType) {
      case 'datepicker':
        return (
          <div
            data-cy={validation.dataCy}
            className="field flex-fill inspector-validation-date-picker"
            key={validation.property}
          >
            <label className="form-label">{t(`widget.Table.${validation.property}`, validation.label)}</label>
            <ReactDatePicker
              selected={getDate(column?.[validation.property], 'MM/DD/YYYY')}
              onChange={(date) => onColumnItemChange(index, validation.property, moment(date).format('MM/DD/YYYY'))}
              showTimeSelectOnly={validation.showOnlyTime}
              placeholderText={validation?.placeholder ?? ''}
              renderCustomHeader={(headerProps) => <CustomDatePickerHeader {...headerProps} />}
              popperClassName={cx('tj-table-datepicker', {
                'theme-dark dark-theme': darkMode,
              })}
            />
          </div>
        );
      case 'timepicker':
        return (
          <div
            data-cy={validation.dataCy}
            className="field flex-fill inspector-validation-date-picker"
            key={validation.property}
          >
            <label className="form-label">{t(`widget.Table.${validation.property}`, validation.label)}</label>
            <Timepicker
              selected={getDate(column?.[validation.property], 'HH:mm')}
              onChange={(date) => onColumnItemChange(index, validation.property, moment(date).format('HH:mm'))}
              placeholderText={validation?.placeholder ?? ''}
              timeFormat={'HH:mm'}
              darkMode={darkMode}
            />
          </div>
        );
      default:
        return (
          <div
            data-cy={validation.dataCy}
            className="field flex-fill"
            key={validation.property}
            style={
              validation?.property === 'minValue' || //for number & string
              validation?.property === 'maxValue' ||
              validation?.property === 'minLength' ||
              validation?.property === 'maxLength'
                ? { width: '50%' }
                : null
            }
          >
            <label className="form-label">{t(`widget.Table.${validation.property}`, validation.label)}</label>
            <CodeHinter
              currentState={currentState}
              initialValue={column?.[validation.property]}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={validation?.placeholder ?? ''}
              onChange={(value) => onColumnItemChange(index, validation.property, value)}
              componentName={getPopoverFieldSource(column.columnType, validation.property)}
              popOverCallback={(showing) => {
                setColumnPopoverRootCloseBlocker(validation.property, showing);
              }}
            />
          </div>
        );
    }
  };

  return (
    <div className="optional-properties-when-editable-true">
      <div className="d-flex flex-column custom-gap-8">
        {validationsList.map((validation) => {
          if (Array.isArray(validation)) {
            return (
              <div className="d-flex align-item-start align-self-stretch custom-gap-8" key={validation.property}>
                {validation.map((validation) => {
                  {
                    return renderAsPerFieldType(validation);
                  }
                })}
              </div>
            );
          } else {
            return renderAsPerFieldType(validation);
          }
        })}
      </div>
    </div>
  );
};
