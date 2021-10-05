import React from 'react';
import 'codemirror/theme/duotone-light.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { changeOption } from './utils';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/hint/show-hint.css';
import _ from 'lodash';
import { useSpring, config, animated } from 'react-spring';
import useHeight from '@/_hooks/use-height-transition';
import { resolveReferences } from '@/_helpers/utils';

class Googlesheets extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: this.props.options,
    };
  }

  componentDidMount() {
    this.setState({
      options: this.props.options,
    });
  }

  changeJsonOption(option, value) {
    this.setState(
      {
        options: {
          ...this.state.options,
          [option]: JSON.parse(value),
        },
      },
      () => {
        this.props.optionsChanged(this.state.options);
      }
    );
  }

  changeOperation = (operation) => {
    this.setState(
      {
        options: {
          ...this.state.options,
          operation,
        },
      },
      () => {
        this.props.optionsChanged(this.state.options);
      }
    );
  };

  codeChange = (optionType, value) => {
    changeOption(this, optionType, value);
  };

  render() {
    const { options, currentState } = this.props;

    return (
      <div>
        {options && (
          <div>
            <div className="mb-3 mt-2">
              <label className="form-label">Operation</label>
              <SelectSearch
                options={[
                  { value: 'read', name: 'Read data from a spreadsheet' },
                  { value: 'append', name: 'Append data to a spreadsheet' },
                  { value: 'update', name: 'Update data to a spreadsheet' },
                  { value: 'info', name: 'Get spreadsheet info' },
                  { value: 'delete_row', name: 'Delete row from a spreadsheet' },
                ]}
                value={this.state.options.operation}
                search={true}
                onChange={(value) => {
                  this.changeOperation(value);
                }}
                filterOptions={fuzzySearch}
                placeholder="Select.."
              />
            </div>
            {['read', 'append', 'delete_row', 'update'].includes(this.state.options.operation) && (
              <div>
                <div className="mb-3 mt-2 row">
                  <div className="col">
                    <label className="form-label">Spreadsheet ID</label>
                    <input
                      type="text"
                      value={this.state.options.spreadsheet_id}
                      onChange={(e) => {
                        changeOption(this, 'spreadsheet_id', e.target.value);
                      }}
                      className="form-control"
                    />
                  </div>
                  {['read'].includes(this.state.options.operation) && (
                    <div className="col-auto">
                      <label className="form-label">Range</label>
                      <input
                        type="text"
                        placeholder={'A1:Z500'}
                        value={this.state.options.spreadsheet_range}
                        onChange={(e) => {
                          changeOption(this, 'spreadsheet_range', e.target.value);
                        }}
                        className="form-control"
                      />
                    </div>
                  )}
                  <div className="col-auto">
                    <label className="form-label">Sheet</label>
                    <input
                      type="text"
                      value={this.state.options.sheet}
                      onChange={(e) => {
                        changeOption(this, 'sheet', e.target.value);
                      }}
                      className="form-control"
                    />
                    <small className="text-muted">Leave blank to use first sheet</small>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {this.state.options.operation === 'append' && (
          <div className="mb-3 mt-2">
            <label className="form-label">Rows</label>
            <CodeHinter
              currentState={this.props.currentState}
              initialValue={options.rows}
              theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
              lineNumbers={true}
              className="query-hinter"
              onChange={(value) => changeOption(this, 'rows', value)}
            />
          </div>
        )}

        {this.state.options.operation === 'delete_row' && (
          <div>
            <div className="mb-3 mt-2 row">
              <div className="col">
                <label className="form-label">Delete row number</label>
                <input
                  type="text"
                  value={this.state.options.row_index}
                  onChange={(e) => {
                    changeOption(this, 'row_index', e.target.value);
                  }}
                  className="form-control"
                />
              </div>
            </div>
          </div>
        )}

        {this.state.options.operation === 'info' && (
          <div className="mb-3 mt-2">
            <label className="form-label">Spreadsheet ID</label>
            <input
              type="text"
              value={this.state.options.spreadsheet_id}
              onChange={(e) => {
                changeOption(this, 'spreadsheet_id', e.target.value);
              }}
              className="form-control"
            />
          </div>
        )}

        {this.state.options.operation === 'update' && (
          <div>
            <Googlesheets.Filter
              currentState={currentState?.queries[this.props.selectedQueryName]?.data}
              state={currentState}
              updateOptions={this.codeChange}
            />

            <Googlesheets.Code
              currentState={this.props.currentState}
              darkMode={this.props.darkMode}
              changeOption={this.codeChange}
            />
          </div>
        )}
      </div>
    );
  }
}

Googlesheets.Filter = function Filter({ currentState, state, updateOptions }) {
  const [previewData, setPreviewData] = React.useState(undefined);
  const [filterKey, setFilterKey] = React.useState('');
  const [filterValue, setFilterValue] = React.useState('');
  const [isFocused, setFocused] = React.useState(false);
  const [heightRef, currentHeight] = useHeight();
  const slideInStyles = useSpring({
    config: { ...config.stiff },
    from: { opacity: 0, height: 0 },
    to: {
      opacity: isFocused ? 1 : 0,
      height: isFocused ? currentHeight : 0,
    },
  });

  React.useEffect(() => {
    if (filterKey.length !== 0 && filterValue.length !== 0 && !_.isEmpty(currentState)) {
      const preview = currentState.filter((data) => data[filterKey] === filterValue);
      setPreviewData(() => preview);
      updateOptions('filterData', { key: filterKey, value: filterValue });
    }

    if (filterValue.length === 0) {
      setPreviewData(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, filterValue]);

  React.useEffect(() => {
    updateOptions('rowData', previewData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewData]);
  return (
    <>
      <div className="field mb-2 row">
        <label className="form-label">WHERE</label>
        <div className="col-auto">
          <input
            type="text"
            placeholder={'id'}
            value={filterKey}
            onChange={(e) => setFilterKey(e.target.value)}
            className="form-control"
          />
        </div>
        <span className="col-auto mt-2 font-weight-bold">{'='}</span>
        <div className="col-auto">
          <input
            type="text"
            placeholder={'2'}
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="form-control"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
      </div>
      <Googlesheets.PreviewData
        data={previewData}
        currentState={state}
        heightRef={heightRef}
        slideInStyles={slideInStyles}
      />
    </>
  );
};

Googlesheets.PreviewData = function PreviewData({ data, currentState, heightRef, slideInStyles }) {
  const getPreviewContent = (content, type) => {
    switch (type) {
      case 'object':
        return JSON.stringify(content);
      case 'boolean':
        return content.toString();
      default:
        return content;
    }
  };

  const getPreview = () => {
    const [preview, error] = resolveReferences(JSON.stringify(data), currentState, null, {}, true);

    if (error) {
      return (
        <animated.div style={{ ...slideInStyles, overflow: 'hidden' }}>
          <div ref={heightRef} className="dynamic-variable-preview bg-red-lt px-1 py-1">
            <div>
              <div className="heading my-1">
                <span>Error</span>
              </div>
              {error.toString()}
            </div>
          </div>
        </animated.div>
      );
    }

    const previewType = typeof preview;
    const content = getPreviewContent(preview, previewType);

    return (
      <animated.div style={{ ...slideInStyles, overflow: 'hidden' }}>
        <div ref={heightRef} className="dynamic-variable-preview bg-green-lt px-1 py-1">
          <div>
            {previewType === 'undefined' ? (
              <div className="heading my-1">
                <span>{previewType}</span>
              </div>
            ) : (
              <>{content}</>
            )}
          </div>
        </div>
      </animated.div>
    );
  };

  return getPreview();
};

Googlesheets.Code = function Code({ currentState, darkMode, changeOption = { changeOption } }) {
  function resolveToObject(string) {
    let data = string
      .replace('{', '')
      .replace('}', '')
      .split(',')
      .map((item) => item.replace(' ', '').split(':'));
    data = _.fromPairs(data);
    return _.mapValues(data, (obj) =>
      obj
        .replace(`"`, '')
        .replace(`"`, '')
        .replace(/^\s+|\s+$/g, '')
    );
  }
  function codeChange(value) {
    const _value = value ? resolveToObject(value) : value;
    changeOption('body', _value);
  }

  return (
    <div className="md-3 mt-2">
      <label className="form-label">Update Value</label>
      <CodeHinter
        currentState={currentState}
        mode="javascript"
        theme={darkMode ? 'monokai' : 'base16-light'}
        lineNumbers={true}
        className="query-hinter"
        ignoreBraces={true}
        onChange={(value) => codeChange(value)}
      />
    </div>
  );
};

export { Googlesheets };
