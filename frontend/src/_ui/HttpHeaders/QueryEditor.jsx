import React from 'react';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';

export default ({ options, addNewKeyValuePair, removeKeyValuePair, keyValuePairValueChanged }) => {
  return (
    <div>
      {options.map((option, index) => {
        return (
          <div className="d-flex gap-2" key={index}>
            <div className="d-flex justify-content-between gap-2 w-100">
              <div className="w-100">
                <CodeHinter
                  initialValue={option[0]}
                  height="32px"
                  placeholder="key"
                  onChange={(value) => keyValuePairValueChanged(value, 0, index)}
                  componentName={`HttpHeaders::key::${index}`}
                />
              </div>
              <div className="w-100">
                <CodeHinter
                  initialValue={option[1]}
                  height="32px"
                  placeholder="value"
                  onChange={(value) => keyValuePairValueChanged(value, 1, index)}
                  componentName={`HttpHeaders::value::${index}`}
                />
              </div>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => removeKeyValuePair(index)}>
              <img src="assets/images/icons/trash-light.svg" className="h-3" />
            </button>
          </div>
        );
      })}
      <button type="button" className="btn btn-primary" onClick={addNewKeyValuePair}>
        + Add header
      </button>
    </div>
  );
};
