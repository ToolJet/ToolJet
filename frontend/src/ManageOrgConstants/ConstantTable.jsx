import React, { useState } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { Tooltip } from 'react-tooltip';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';

const ConstantTable = ({
  constants = [],
  canUpdateDeleteConstant = true,
  onEditBtnClicked,
  onDeleteBtnClicked,
  isLoading = false,
}) => {
  const tableRef = React.createRef(null);
  const [showValues, setShowValues] = useState({});
  const toggleShowValue = (id) => {
    setShowValues((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const displayValue = (constant) => {
    if (typeof constant.value === 'undefined' || constant.value === null) {
      return '';
    }
    return String(constant.value).length > (canUpdateDeleteConstant ? 30 : 50)
      ? String(constant.value).substring(0, canUpdateDeleteConstant ? 30 : 50) + '...'
      : constant.value;
  };

  const calculateOffset = () => {
    const elementHeight = tableRef.current.getBoundingClientRect().top;
    return window.innerHeight - elementHeight;
  };

  return (
    <div>
      <div className="card constant-table-card" style={{ border: 'none' }}>
        <div
          className="fixedHeader table-responsive px-2"
          ref={tableRef}
          style={{ maxHeight: tableRef.current && calculateOffset() }}
        >
          <table className="table table-vcenter mt-2" disabled={true}>
            <thead>
              <tr>
                <th data-cy="workspace-variable-table-name-header">Name</th>
                <th data-cy="workspace-variable-table-value-header">Value</th>
                {canUpdateDeleteConstant && (
                  <th className="w-1" style={{ paddingRight: '16px' }}>
                    {' '}
                    <small
                      className="text-green d-flex align-items-center justify-content-end"
                      data-cy="table-encrypted-label"
                    >
                      <img
                        className="encrypted-icon me-1"
                        src="assets/images/icons/padlock.svg"
                        alt="Encrypted"
                        width="12"
                        height="12"
                      />
                      Encrypted
                    </small>
                  </th>
                )}
              </tr>
            </thead>
            {isLoading ? (
              <tbody className="w-100">
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
                {constants.map((constant) => (
                  <tr key={constant.id}>
                    <td className="p-3-constants">
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
                    <td className="text-muted p-3-constants" style={{ width: '350px' }}>
                      <a
                        className="text-reset user-email"
                        data-cy={`${constant.name.toLowerCase().replace(/\s+/g, '-')}-workspace-constant-value`}
                      >
                        {!showValues[constant.id] ? '*'.repeat(displayValue(constant).length) : displayValue(constant)}
                      </a>
                    </td>

                    {canUpdateDeleteConstant && (
                      <td className="p-3-constants">
                        <div
                          style={{ display: 'flex', justifyContent: 'space-between', gap: 5 }}
                          data-cy={`${constant.name.toLowerCase().replace(/\s+/g, '-')}-workspace-constant-update`}
                        >
                          <div
                            onClick={() => toggleShowValue(constant.id)}
                            data-cy={`${constant.name.toLowerCase().replace(/\s+/g, '-')}-constant-visibility`}
                          >
                            {!showValues[constant.id] ? (
                              <EyeHide
                                fill={
                                  darkMode
                                    ? String(constant.value)?.length
                                      ? '#D1D5DB'
                                      : '#656565'
                                    : String(constant.value)?.length
                                    ? '#384151'
                                    : '#D1D5DB'
                                }
                              />
                            ) : (
                              <EyeShow
                                fill={
                                  darkMode
                                    ? String(constant.value)?.length
                                      ? '#D1D5DB'
                                      : '#656565'
                                    : String(constant.value)?.length
                                    ? '#384151'
                                    : '#D1D5DB'
                                }
                              />
                            )}
                          </div>
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
