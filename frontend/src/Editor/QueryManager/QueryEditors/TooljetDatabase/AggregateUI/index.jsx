import React, { useContext, useMemo } from 'react';
import { NoCondition } from './NoConditionUI';
import './style.scss'; // Ensure the path is correct based on your project structure
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { isEmpty } from 'lodash';
import { SelectBox } from './Select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import { v4 as uuidv4 } from 'uuid';

export const AggregateUi = () => {
  const { columns, listRowsOptions, limitOptionChanged, handleOptionsChange, offsetOptionChanged } =
    useContext(TooljetDatabaseContext);

  const addNewAggregateOption = () => {
    const currentAggregates = { ...(listRowsOptions?.aggregates || {}) };
    const uniqueId = uuidv4();
    const newAggregate = { aggregateFx: '', column: '' };
    const updatedAggregates = {
      ...currentAggregates,
      [uniqueId]: newAggregate,
    };
    handleOptionsChange('aggregates', updatedAggregates);
  };
  const columnAccessorsOptions = useMemo(() => {
    return columns.map((column) => {
      return {
        label: column.accessor,
        value: column.accessor,
      };
    });
  }, [columns]);

  console.log('abc::', listRowsOptions, columns, columnAccessorsOptions);
  return (
    <div className="d-flex mb-2">
      <label className="form-label" data-cy="label-column-filter">
        Aggregate
      </label>
      <div className="field-container col ">
        {isEmpty(listRowsOptions?.aggregates || {}) && <NoCondition />}
        {listRowsOptions?.aggregates &&
          !isEmpty(listRowsOptions?.aggregates) &&
          Object.entries(listRowsOptions.aggregates).map(([aggregateKey, aggregateDetails]) => {
            return (
              <div key={aggregateKey} className="d-flex flex-row">
                <SelectBox
                  width="25%"
                  height="32"
                  value={aggregateDetails.aggregateFx}
                  options={[
                    { label: 'Sum', value: 'sum', description: 'Sum of all values in this column' },
                    { label: 'Count', value: 'count', description: 'Count number of not null values in this column' },
                  ]}
                />
                <div style={{ flex: '1' }}>
                  <SelectBox
                    height="32"
                    width="100%"
                    value={aggregateDetails.column}
                    options={columnAccessorsOptions}
                  />
                </div>
                <div
                  style={{ width: '32px', minWidth: '32px' }}
                  className="d-flex justify-content-center align-items-center"
                >
                  <SolidIcon name="trash" width="16" fill="var(--slate9)" />
                </div>
              </div>
            );
          })}

        <ButtonSolid
          variant="ghostBlue"
          size="sm"
          onClick={() => {
            addNewAggregateOption();
          }}
          className={isEmpty(listRowsOptions?.aggregates || {}) ? '' : 'mt-2'}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5.34554 10.0207C5.15665 10.0207 4.99832 9.95678 4.87054 9.829C4.74276 9.70123 4.67887 9.54289 4.67887 9.354V5.854H1.17887C0.989985 5.854 0.831651 5.79011 0.703874 5.66234C0.576096 5.53456 0.512207 5.37623 0.512207 5.18734C0.512207 4.99845 0.576096 4.84012 0.703874 4.71234C0.831651 4.58456 0.989985 4.52067 1.17887 4.52067H4.67887V1.02067C4.67887 0.831782 4.74276 0.673448 4.87054 0.54567C4.99832 0.417893 5.15665 0.354004 5.34554 0.354004C5.53443 0.354004 5.69276 0.417893 5.82054 0.54567C5.94832 0.673448 6.01221 0.831782 6.01221 1.02067V4.52067H9.51221C9.7011 4.52067 9.85943 4.58456 9.98721 4.71234C10.115 4.84012 10.1789 4.99845 10.1789 5.18734C10.1789 5.37623 10.115 5.53456 9.98721 5.66234C9.85943 5.79011 9.7011 5.854 9.51221 5.854H6.01221V9.354C6.01221 9.54289 5.94832 9.70123 5.82054 9.829C5.69276 9.95678 5.53443 10.0207 5.34554 10.0207Z"
              fill="#466BF2"
            />
          </svg>
          &nbsp;Add Condition
        </ButtonSolid>
      </div>
    </div>
  );
};
