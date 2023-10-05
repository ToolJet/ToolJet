import React from 'react';

export default ({ options, addNewKeyValuePair, removeKeyValuePair, keyValuePairValueChanged }) => {
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
        ody>
        {options.map((option, index) => {
          return (
            <tr key={index}>
              <td>
                <input
                  type="text"
                  value={option[0]}
                  placeholder="key"
                  autoComplete="off"
                  className="form-control no-border"
                  onChange={(e) => keyValuePairValueChanged(e.target.value, 0, index)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={option[1]}
                  placeholder="value"
                  autoComplete="off"
                  className="form-control no-border"
                  onChange={(e) => keyValuePairValueChanged(e.target.value, 1, index)}
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
                  <button className="btn btn-sm btn-primary" onClick={addNewKeyValuePair}>
                    Add
                  </button>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
    </div >
  );
};
