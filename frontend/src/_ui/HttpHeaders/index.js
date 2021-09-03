import React from 'react';

export default ({ getter, options = [], optionchanged }) => {
  function addNewKeyValuePair() {
    const newPairs = [...options, ['', '']];
    optionchanged(getter, newPairs);
  }

  function removeKeyValuePair(index) {
    options.splice(index, 1);
    optionchanged(getter, options);
  }

  function keyValuePairValueChanged(e, keyIndex, index) {
    if (options.length - 1 === index) {
      setTimeout(() => {
        addNewKeyValuePair();
      }, 100);
    }
    const value = e.target.value;
    options[index][keyIndex] = value;
    optionchanged(getter, options);
  }

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
                  <input
                    type="text"
                    value={option[0]}
                    placeholder="key"
                    autoComplete="off"
                    className="form-control no-border"
                    onChange={(e) => keyValuePairValueChanged(e, 0, index)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control no-border"
                    placeholder="value"
                    autoComplete="off"
                    onChange={(e) => keyValuePairValueChanged(e, 1, index)}
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
