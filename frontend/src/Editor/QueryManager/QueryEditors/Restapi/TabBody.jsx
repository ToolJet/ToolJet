import React from 'react';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';

export default ({ options = [], currentState, theme, removeKeyValuePair, onChange }) => {
  return (
    <div className="table-responsive table-no-divider">
      <table className="table layoutfix">
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
                  <CodeHinter
                    currentState={currentState}
                    initialValue={option[0]}
                    theme={theme}
                    placeholder="key"
                    className="form-control codehinter-query-editor-input"
                    onChange={onChange('body', 0, index)}
                  />
                </td>
                <td>
                  <CodeHinter
                    currentState={currentState}
                    className="form-control codehinter-query-editor-input"
                    initialValue={option[1]}
                    theme={theme}
                    placeholder="value"
                    onChange={onChange('body', 1, index)}
                  />
                </td>
                {index > 0 && (
                  <td>
                    <span
                      role="button"
                      onClick={() => {
                        removeKeyValuePair('body', index);
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
