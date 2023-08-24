import React from 'react';
import { withTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Tooltip } from 'react-tooltip';

class VariablesTable extends React.Component {
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
        <div className="card workspace-variable-table-card">
          <div
            className="card-table fixedHeader table-responsive table-bordered"
            ref={this.tableRef}
            style={{ maxHeight: this.tableRef.current && this.calculateOffset() }}
          >
            <table
              data-testid="variablesTable"
              className="table table-vcenter variables-table-wrapper"
              disabled={true}
              data-cy="workspace-variable-table"
            >
              <thead>
                <tr>
                  <th data-cy="workspace-variable-table-name-header">
                    {this.props.t('header.organization.menus.manageSSO.environmentVar.variableTable.name', 'Name')}
                  </th>
                  <th data-cy="workspace-variable-table-value-header">
                    {this.props.t('header.organization.menus.manageSSO.environmentVar.variableTable.value', 'Value')}
                  </th>
                  <th data-cy="workspace-variable-table-type-header">
                    {this.props.t('header.organization.menus.manageSSO.environmentVar.variableTable.type', 'Type')}
                  </th>
                  {this.props.canDeleteVariable && <th className="w-1"></th>}
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
                        <span
                          data-cy={`${variable.variable_name
                            .toLowerCase()
                            .replace(/\s+/g, '-')}-workspace-variable-name`}
                        >
                          {variable.variable_name}
                        </span>
                      </td>
                      <td className="text-muted">
                        <a
                          className="text-reset user-email"
                          data-cy={`${variable.variable_name
                            .toLowerCase()
                            .replace(/\s+/g, '-')}-workspace-variable-value`}
                        >
                          {variable.encrypted ? (
                            <small className="text-green">
                              <img
                                className="encrypted-icon"
                                src="assets/images/icons/padlock.svg"
                                width="12"
                                height="12"
                                data-cy="encrypted-workspace-variable-icon"
                              />
                              <span className="text-success mx-2" data-cy="encrypted-workspace-variable-text">
                                {this.props.t(
                                  'header.organization.menus.manageSSO.environmentVar.variableTable.secret',
                                  'secret'
                                )}
                              </span>
                            </small>
                          ) : (
                            variable.value
                          )}
                        </a>
                      </td>
                      <td className="text-muted">
                        <small
                          className="user-status"
                          data-cy={`${variable.variable_name
                            .toLowerCase()
                            .replace(/\s+/g, '-')}-workspace-variable-type`}
                        >
                          {variable.variable_type}
                        </small>
                      </td>
                      {this.props.canDeleteVariable && (
                        <td>
                          <div
                            style={{ display: 'flex', justifyContent: 'space-between', gap: 5 }}
                            data-cy={`${variable.variable_name
                              .toLowerCase()
                              .replace(/\s+/g, '-')}-workspace-variable-update`}
                          >
                            {this.props.canDeleteVariable && (
                              <>
                                <button
                                  className="btn btn-sm btn-org-env"
                                  onClick={() => this.props.onDeleteBtnClicked(variable)}
                                  data-cy={`${variable.variable_name
                                    .toLowerCase()
                                    .replace(/\s+/g, '-')}-workspace-variable-delete-button`}
                                >
                                  <div>
                                    <SolidIcon name="trash" width="14" />
                                  </div>
                                </button>
                                <Tooltip id="tooltip-for-delete" className="tooltip" />
                              </>
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
export default withTranslation()(VariablesTable);
