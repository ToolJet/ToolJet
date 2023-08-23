import React from 'react';
import Input from '../Input';

export default ({ options, addNewKeyValuePair, removeKeyValuePair, keyValuePairValueChanged, workspaceConstants }) => {
  return (
    <div className="table-responsive table-no-divider">
      <table className="table table-vcenter">
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {options.map((option, index) => {
            return (
              <tr key={index}>
                <td>
                  <Input
                    type="text"
                    className="form-control no-border"
                    onChange={(e) => keyValuePairValueChanged(e.target.value, 0, index)}
                    value={option[0]}
                    workspaceConstants={workspaceConstants}
                    placeholder="key"
                    autoComplete="off"
                  />
                </td>
                <td>
                  <Input
                    type="text"
                    value={option[1]}
                    placeholder="value"
                    autoComplete="off"
                    className="form-control no-border"
                    onChange={(e) => keyValuePairValueChanged(e.target.value, 1, index)}
                    workspaceConstants={workspaceConstants}
                  />
                </td>
                {index > 0 && (
                  <td>
                    <span
                      role="button"
                      onClick={() => {
                        removeKeyValuePair(index);
                      }}
                    >
                      x
                    </span>
                  </td>
                )}
                {index === 0 && (
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={addNewKeyValuePair}
                    >
                      Add
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
