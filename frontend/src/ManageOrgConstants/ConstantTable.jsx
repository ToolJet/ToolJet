import React from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

const ConstantTable = ({
  constants = [],
  canUpdateVariable = true,
  canDeleteVariable = true,
  onEditBtnClicked,
  onDeleteBtnClicked,
  isLoading = false,
}) => {
  const tableRef = React.createRef(null);

  const calculateOffset = () => {
    const elementHeight = tableRef.current.getBoundingClientRect().top;

    return window.innerHeight - elementHeight;
  };

  const variables = constants;

  return (
    <div className="container-xl">
      <div className="card" style={{ border: 'none' }}>
        <div
          className="fixedHeader table-responsive px-2"
          ref={tableRef}
          style={{ maxHeight: tableRef.current && calculateOffset() }}
        >
          <table className="table table-vcenter variables-table-wrapper" disabled={true}>
            <thead>
              <tr>
                <th data-cy="workspace-variable-table-name-header">Name</th>
                <th data-cy="workspace-variable-table-value-header">Value</th>

                {(canUpdateVariable || canDeleteVariable) && <th className="w-1"></th>}
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
                      <span data-cy={`${variable.name.toLowerCase().replace(/\s+/g, '-')}-workspace-variable-name`}>
                        {variable.name}
                      </span>
                    </td>
                    <td className="text-muted">
                      <a
                        className="text-reset user-email"
                        data-cy={`${variable.name.toLowerCase().replace(/\s+/g, '-')}-workspace-variable-value`}
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
                              secret
                            </span>
                          </small>
                        ) : (
                          variable.values[0].value
                        )}
                      </a>
                    </td>

                    {(canUpdateVariable || canDeleteVariable) && (
                      <td>
                        <div
                          style={{ display: 'flex', justifyContent: 'space-between', gap: 5 }}
                          data-cy={`${variable.name.toLowerCase().replace(/\s+/g, '-')}-workspace-variable-update`}
                        >
                          {canUpdateVariable && (
                            <td>
                              <ButtonSolid
                                variant="secondary"
                                style={{ minWidth: '100px' }}
                                className="workspace-user-archive-btn tj-text-xsm"
                                leftIcon="editrectangle"
                                fill="#3b5ccc"
                                iconWidth="12"
                                onClick={() => onEditBtnClicked(variable)}
                                data-cy="button-user-status-change"
                              >
                                Edit
                              </ButtonSolid>
                            </td>
                          )}
                          {canDeleteVariable && (
                            <td>
                              <ButtonSolid
                                variant="dangerSecondary"
                                style={{ minWidth: '100px' }}
                                className="workspace-user-archive-btn tj-text-xsm"
                                leftIcon="trash"
                                fill="#E54D2E"
                                iconWidth="12"
                                onClick={() => onDeleteBtnClicked(variable)}
                                data-cy="button-user-status-change"
                              >
                                Delete
                              </ButtonSolid>
                            </td>
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
};

export default ConstantTable;
