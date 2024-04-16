import React from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { Tooltip } from 'react-tooltip';

const ConstantTable = ({
  constants = [],
  canUpdateDeleteConstant = true,
  onEditBtnClicked,
  onDeleteBtnClicked,
  isLoading = false,
}) => {
  const tableRef = React.createRef(null);

  const calculateOffset = () => {
    const elementHeight = tableRef.current.getBoundingClientRect().top;
    return window.innerHeight - elementHeight;
  };

  return (
    <div className="container-xl">
      <div className="card constant-table-card" style={{ border: 'none' }}>
        <div
          className="fixedHeader table-responsive px-2"
          ref={tableRef}
          style={{ maxHeight: tableRef.current && calculateOffset() }}
        >
          <table className="table table-vcenter constant-table-wrapper mt-2" disabled={true}>
            <thead>
              <tr>
                <th data-cy="workspace-variable-table-name-header">Name</th>
                <th data-cy="workspace-variable-table-value-header">Value</th>
                {canUpdateDeleteConstant && <th className="w-1"></th>}
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
                <Tooltip id="tooltip-for-org-constant-cell" />
                {constants.map((constant) => (
                  <tr key={constant.id}>
                    <td className="p-3">
                      <span
                        data-cy={`${constant.name.toLowerCase().replace(/\s+/g, '-')}-workspace-constant-name`}
                        data-tooltip-id="tooltip-for-org-constant-cell"
                        className="tj-text"
                      >
                        {String(constant.name).length > 30
                          ? String(constant.name).substring(0, 30) + '...'
                          : constant.name}
                      </span>
                    </td>
                    <td className="text-muted p-3">
                      <a
                        className="text-reset user-email"
                        data-cy={`${constant.name.toLowerCase().replace(/\s+/g, '-')}-workspace-constant-value`}
                        data-tooltip-id="tooltip-for-org-constant-cell"
                        data-tooltip-content={constant.value}
                        data-tooltip-offset={5}
                        data-tooltip-place={constant.value.length > 50 ? 'right' : 'bottom'}
                      >
                        {String(constant.value).length > (canUpdateDeleteConstant ? 30 : 50)
                          ? String(constant.value).substring(0, canUpdateDeleteConstant ? 30 : 50) + '...'
                          : constant.value}
                      </a>
                    </td>

                    {canUpdateDeleteConstant && (
                      <td className="p-3">
                        <div
                          style={{ display: 'flex', justifyContent: 'space-between', gap: 5 }}
                          data-cy={`${constant.name.toLowerCase().replace(/\s+/g, '-')}-workspace-constant-update`}
                        >
                          <ButtonSolid
                            variant="secondary"
                            style={{ minWidth: '100px' }}
                            className="workspace-user-archive-btn tj-text-xsm"
                            leftIcon="editrectangle"
                            fill="#3b5ccc"
                            iconWidth="12"
                            onClick={() => onEditBtnClicked(constant)}
                            data-cy={`${constant.name.toLowerCase().replace(/\s+/g, '-')}-edit-button`}
                          >
                            Edit
                          </ButtonSolid>

                          <ButtonSolid
                            variant="dangerSecondary"
                            style={{ minWidth: '100px' }}
                            className="workspace-user-archive-btn tj-text-xsm"
                            leftIcon="trash"
                            fill="#E54D2E"
                            iconWidth="12"
                            onClick={() => onDeleteBtnClicked(constant)}
                            data-cy={`${constant.name.toLowerCase().replace(/\s+/g, '-')}-delete-button`}
                          >
                            Delete
                          </ButtonSolid>
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
