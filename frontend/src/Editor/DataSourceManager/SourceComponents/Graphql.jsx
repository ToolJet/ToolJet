import React from 'react';
import Button from 'react-bootstrap/Button';

export const Graphql = ({
  optionchanged, createDataSource, options, isSaving
}) => {

  function addNewKeyValuePair(option) {
    const newPairs = [...options[option].value, ['', '']];
    optionchanged(option, newPairs);
  }

  function removeKeyValuePair(option, index) {
    options[option].value.splice(index, 1);
    optionchanged(option, options[option].value);
  }

  function keyValuePairValueChanged(e, keyIndex, option, index) {
    const value = e.target.value;
    options[option].value[index][keyIndex] = value;
    optionchanged(option, options[option].value);
  }

  return (
    <div>
      <div className="row">
        <div className="col-md-12 mb-3">
          <label className="form-label">URL</label>
          <input
            type="text"
            placeholder="https://api.example.com/v1/"
            className="form-control"
            onChange={(e) => optionchanged('url', e.target.value)}
            value={options.url.value}
          />
        </div>

        {[{name: 'URL parameters', value: 'url_params'},{name: 'Headers', value: 'headers'}].map((option) => (
        <div className="mb-3" key={option}>
          <div className="row g-2">
            <div className="col-md-2">
              <label className="form-label pt-2">{option.name}</label>
            </div>
            <div className="col-md-10">
              {(options[option.value].value || []).map((pair, index) => (
                <div className="input-group" key={index}>
                  <input
                    type="text"
                    value={pair[0]}
                    className="form-control"
                    placeholder="key"
                    autoComplete="off"
                    onChange={(e) => keyValuePairValueChanged(e, 0, option.value, index)}
                  />
                  <input
                    type="text"
                    value={pair[1]}
                    className="form-control"
                    placeholder="value"
                    autoComplete="off"
                    onChange={(e) => keyValuePairValueChanged(e, 1, option.value, index)}
                  />
                  <span
                    className="input-group-text"
                    role="button"
                    onClick={() => {
                      removeKeyValuePair(option.value, index);
                    }}
                  >x</span>
                </div>
              ))}
              <button className="btn btn-sm btn-outline-azure" onClick={() => addNewKeyValuePair(option.value)}>
                +
              </button>
            </div>
          </div>
        </div>
      ))}
      </div>


      <div className="row mt-3">
        <div className="col"></div>
        <div className="col-auto">
          <Button className="m-2" disabled={isSaving} variant="primary" onClick={createDataSource}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};
