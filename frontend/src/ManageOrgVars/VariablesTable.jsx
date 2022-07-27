import React from 'react';

export default class VariablesTable extends React.Component {
  constructor(props) {
    super(props);

    this.tableRef = React.createRef(null);
  }

  calculateOffset() {
    const elementHeight = this.tableRef.current.getBoundingClientRect().top;
    return window.innerHeight - elementHeight;
  }

  render() {
    const { isLoading, variables } = this.props;
    return (
      <div className="container-xl">
        <div className="card">
          <div
            className="card-table fixedHeader table-responsive table-bordered"
            ref={this.tableRef}
            style={{ maxHeight: this.tableRef.current && this.calculateOffset() }}
          >
            <table data-testid="variablesTable" className="table table-vcenter" disabled={true}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                  <th>Type</th>
                  {(this.props.canUpdateVariable || this.props.canDeleteVariable) && <th className="w-1"></th>}
                </tr>
              </thead>
              {isLoading ? (
                <tbody className="w-100" style={{ minHeight: '300px' }}>
                  {Array.from(Array(4)).map((_item, index) => (
                    <tr key={index}>
                      <td className="col-4 p-3">
                        <div className="skeleton-line w-10"></div>
                      </td>
                      <td className="col-2 p-3">
                        <div className="skeleton-line"></div>
                      </td>
                      <td className="col-2 p-3">
                        <div className="skeleton-line"></div>
                      </td>
                      <td className="text-muted col-auto col-1 pt-3">
                        <div className="skeleton-line"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  {variables.map((variable) => (
                    <tr key={variable.id}>
                      <td>
                        <span>{variable.variable_name}</span>
                      </td>
                      <td className="text-muted">
                        <a className="text-reset user-email">
                          {variable.encrypted ? (
                            <small className="text-green">
                              <img
                                className="encrypted-icon"
                                src="/assets/images/icons/padlock.svg"
                                width="12"
                                height="12"
                              />
                              <span className="text-success mx-2">secret</span>
                            </small>
                          ) : (
                            variable.value
                          )}
                        </a>
                      </td>
                      <td className="text-muted">
                        <small className="user-status">{variable.variable_type}</small>
                      </td>
                      {(this.props.canUpdateVariable || this.props.canDeleteVariable) && (
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 5 }}>
                            {this.props.canUpdateVariable && (
                              <button
                                className="btn btn-sm btn-org-env"
                                onClick={() => this.props.onEditBtnClicked(variable)}
                              >
                                <div>
                                  <img
                                    data-tip="Update"
                                    className="svg-icon"
                                    src="/assets/images/icons/edit.svg"
                                    width="15"
                                    height="15"
                                    style={{
                                      cursor: 'pointer',
                                    }}
                                  ></img>
                                </div>
                              </button>
                            )}
                            {this.props.canDeleteVariable && (
                              <button
                                className="btn btn-sm btn-org-env"
                                onClick={() => this.props.onDeleteBtnClicked(variable)}
                              >
                                <div>
                                  <img
                                    data-tip="Delete"
                                    className="svg-icon"
                                    src="/assets/images/icons/query-trash-icon.svg"
                                    width="15"
                                    height="15"
                                    style={{
                                      cursor: 'pointer',
                                    }}
                                  />
                                </div>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </div>
      </div>
    );
  }
}
