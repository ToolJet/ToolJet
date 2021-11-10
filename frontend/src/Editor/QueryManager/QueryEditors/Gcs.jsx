import React from 'react';
import 'codemirror/theme/duotone-light.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { changeOption } from './utils';

class Gcs extends React.Component {
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

  render() {
    const { options } = this.state;

    return (
      <div>
        {options && (
          <div>
            <div className="mb-3 mt-2">
              <label className="form-label">Operation</label>
              <SelectSearch
                options={[
                  { value: 'get_file', name: 'Read file' },
                  { value: 'upload_file', name: 'Upload file' },
                  { value: 'list_buckets', name: 'List buckets' },
                  { value: 'list_files', name: 'List files in a bucket' },
                  { value: 'signed_url_for_get', name: 'Signed url for download' },
                  { value: 'signed_url_for_put', name: 'Signed url for upload' },
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

            {['list_files'].includes(this.state.options.operation) && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Bucket</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.bucket}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'bucket', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Prefix (optional)</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.prefix}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'prefix', value)}
                  />
                </div>
              </div>
            )}

            {['get_file'].includes(this.state.options.operation) && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Bucket</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.bucket}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'bucket', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">File name</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.file}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'file', value)}
                  />
                </div>
              </div>
            )}

            {['upload_file'].includes(this.state.options.operation) && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Bucket</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.bucket}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'bucket', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">File name</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.file}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'file', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Content Type</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.contentType}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'contentType', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Upload data</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.data}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'data', value)}
                  />
                </div>
              </div>
            )}

            {['signed_url_for_get'].includes(this.state.options.operation) && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Bucket</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.bucket}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'bucket', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">File</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.file}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'file', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Expires in</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.expiresIn || '3600'}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'expiresIn', value)}
                  />
                </div>
              </div>
            )}

            {['signed_url_for_put'].includes(this.state.options.operation) && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Bucket</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.bucket}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'bucket', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">File Name</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.key}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'file', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Expires in</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.expiresIn || '3600'}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'expiresIn', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Content Type</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.contentType}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'contentType', value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export { Gcs };
