import React from 'react';
import { resolve, findProp } from '@/_helpers/utils';
import Skeleton from 'react-loading-skeleton';

export const Table = function Table({ id, component, onComponentClick, currentState, onEvent }) {
  const backgroundColor = component.definition.styles.backgroundColor.value;
  const color = component.definition.styles.textColor.value;
  const columns = component.definition.properties.columns.value;
  const actions = component.definition.properties.actions || { value: [] };

  const loadingStateProperty = component.definition.properties.loadingState;

  let loadingState = false;
  if (loadingStateProperty && currentState) {
    loadingState = resolve(loadingStateProperty.value, currentState);
  }

  console.log('currentState', currentState);

  let data = [];
  if (currentState) {
    data = resolve(component.definition.properties.data.value, currentState, []);
    console.log('resolved param', data);
  }

  function findColumnValue(row, column) {
    if (column.key) {
      return findProp(row, column.key);
    } else {
      return findProp(row, column.name);
    }
  }

  // Quick fix, need to remove later
  data = data ? data : [];

  const computedStyles = {
    backgroundColor,
    color,
  };

  return (
    <div
      class="table-responsive table-bordered"
      style={{ ...computedStyles, width: '700px' }}
      onClick={() => onComponentClick(id, component)}
    >
      <table class="table table-vcenter table-nowrap">
        <thead>
          <tr>
            {columns.map((column) => (
              <th>{column.name}</th>
            ))}
            {actions.value.length > 0 && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr
              onClick={(e) => {
                e.stopPropagation();
                onEvent('onRowClicked', { component, data: row });
              }}
            >
              {columns.map((column) => (
                <td>{findColumnValue(row, column)}</td>
              ))}

              {actions.value.length > 0 && (
                <td>
                  {actions.value.map((action) => (
                    <button
                      class="btn btn-sm m-1 btn-light"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEvent('onTableActionButtonClicked', { component, data: row, action });
                      }}
                    >
                      {action.buttonText}
                    </button>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
        {/* <div className="table-footer p-2">
                    Records 1-10 of 242
                </div> */}
      </table>

      {loadingState && (
        <div style={{ width: '100%' }} className="p-5">
          <Skeleton count={5} />
        </div>
      )}
    </div>
  );
};
