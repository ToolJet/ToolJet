import { resolveReferences } from '@/_helpers/utils';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CodeHinter } from '../../../../CodeBuilder/CodeHinter';

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
          properties.push({ property: 'regex', dateCy: 'input-and-label-regex', label: 'Regex' });
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
          { property: 'regex', dateCy: 'input-and-label-regex', label: 'Regex' },
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
        return [{ property: 'customRule', dateCy: 'input-and-label-custom-rule', label: 'Custom rule' }];
      case 'datepicker': {
        const properties = [];
        properties.push(
          [
            {
              property: 'minDate',
              dateCy: 'input-and-label-min-date',
              label: 'Min date',
              placeholder: 'MM/DD/YYYY',
            },
            {
              property: 'maxDate',
              dateCy: 'input-and-label-max-date',
              label: 'Max date',
              placeholder: 'MM/DD/YYYY',
            },
          ],
          [
            {
              property: 'minTime',
              dateCy: 'input-and-label-min-time',
              label: 'Min time',
              placeholder: 'HH:mm',
            },
            {
              property: 'maxTime',
              dateCy: 'input-and-label-max-time',
              label: 'Max time',
              placeholder: 'HH:mm',
            },
          ],
          {
            property: 'disbaledDates',
            dateCy: 'input-and-label-custom-rule',
            label: 'Disabled dates',
            placeholder: '{{[]}}',
          },
          {
            property: 'customRule',
            dateCy: 'input-and-label-custom-rule',
            label: 'Custom rule',
            placeholder: 'eg. {{ 1 < 2 }}',
          }
        );

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

  return (
    <div className="optional-properties-when-editable-true">
      {/* <div data-cy={`header-validation`} className="validation-text tj-text tj-text-xsm font-weight-500">
        {t('widget.Table.validation', 'Validation')}
      </div> */}
      <div className="d-flex flex-column custom-gap-8">
        {validationsList.map((validation) => {
          if (Array.isArray(validation)) {
            return (
              <div className="d-flex align-item-start align-self-stretch custom-gap-3" key={validation.property}>
                {validation.map((singleValidation) => {
                  return (
                    <div data-cy={singleValidation.dataCy} className="field flex-fill" key={singleValidation.property}>
                      <label className="form-label">
                        {t(`widget.Table.${singleValidation.property}`, singleValidation.label)}
                      </label>
                      <CodeHinter
                        currentState={currentState}
                        initialValue={column?.[singleValidation.property]}
                        theme={darkMode ? 'monokai' : 'default'}
                        mode="javascript"
                        lineNumbers={false}
                        placeholder={singleValidation?.placeholder ?? ''}
                        onChange={(value) => onColumnItemChange(index, singleValidation.property, value)}
                        componentName={getPopoverFieldSource(column.columnType, singleValidation.property)}
                        popOverCallback={(showing) => {
                          setColumnPopoverRootCloseBlocker(singleValidation.property, showing);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          } else {
            return (
              <div data-cy={validation.dateCy} className="field" key={validation.property}>
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
        })}
      </div>
    </div>
  );
};
