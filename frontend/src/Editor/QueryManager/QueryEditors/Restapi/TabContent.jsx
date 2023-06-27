import React from 'react';
import { useTranslation } from 'react-i18next';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';
import AddRectangle from '../../../../_ui/Icon/bulkIcons/AddRectangle';
import Remove from '../../../../_ui/Icon/solidIcons/Remove';

export default ({
  options = [],
  currentState,
  theme,
  onChange,
  jsonBody,
  onJsonBodyChange,
  componentName,
  removeKeyValuePair,
  paramType,
  tabType,
  bodyToggle,
  addNewKeyValuePair,
}) => {
  const { t } = useTranslation();
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div className="tab-content-wrapper">
      {!bodyToggle &&
        options.map((option, index) => {
          return (
            <>
              <div className="row-container query-manager-border-color" key={index}>
                <div className="fields-container mb-2">
                  {/* <div className="d-flex justify-content-center align-items-center query-number">{index + 1}</div> */}
                  <div className="field col-4 overflow-hidden border-top border-bottom border-start rounded-start">
                    <CodeHinter
                      currentState={currentState}
                      initialValue={option[0]}
                      theme={theme}
                      height={'32px'}
                      placeholder="Key"
                      onChange={onChange(paramType, 0, index)}
                      componentName={`${componentName}/${tabType}::key::${index}`}
                    />
                  </div>
                  <div className="field col overflow-hidden border rounded-end">
                    <CodeHinter
                      currentState={currentState}
                      initialValue={option[1]}
                      theme={theme}
                      height={'32px'}
                      placeholder="Value"
                      onChange={onChange(paramType, 1, index)}
                      componentName={`${componentName}/${tabType}::value::${index}`}
                    />
                  </div>
                  <button
                    className="d-flex justify-content-center align-items-center delete-field-option bg-transparent border-0"
                    role="button"
                    onClick={() => {
                      removeKeyValuePair(paramType, index);
                    }}
                  >
                    {/* <span className="rest-api-delete-field-option query-icon-wrapper d-flex">
                      <svg
                        width="auto"
                        height="auto"
                        viewBox="0 0 18 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M5.58579 0.585786C5.96086 0.210714 6.46957 0 7 0H11C11.5304 0 12.0391 0.210714 12.4142 0.585786C12.7893 0.960859 13 1.46957 13 2V4H15.9883C15.9953 3.99993 16.0024 3.99993 16.0095 4H17C17.5523 4 18 4.44772 18 5C18 5.55228 17.5523 6 17 6H16.9201L15.9997 17.0458C15.9878 17.8249 15.6731 18.5695 15.1213 19.1213C14.5587 19.6839 13.7957 20 13 20H5C4.20435 20 3.44129 19.6839 2.87868 19.1213C2.32687 18.5695 2.01223 17.8249 2.00035 17.0458L1.07987 6H1C0.447715 6 0 5.55228 0 5C0 4.44772 0.447715 4 1 4H1.99054C1.9976 3.99993 2.00466 3.99993 2.0117 4H5V2C5 1.46957 5.21071 0.960859 5.58579 0.585786ZM3.0868 6L3.99655 16.917C3.99885 16.9446 4 16.9723 4 17C4 17.2652 4.10536 17.5196 4.29289 17.7071C4.48043 17.8946 4.73478 18 5 18H13C13.2652 18 13.5196 17.8946 13.7071 17.7071C13.8946 17.5196 14 17.2652 14 17C14 16.9723 14.0012 16.9446 14.0035 16.917L14.9132 6H3.0868ZM11 4H7V2H11V4ZM6.29289 10.7071C5.90237 10.3166 5.90237 9.68342 6.29289 9.29289C6.68342 8.90237 7.31658 8.90237 7.70711 9.29289L9 10.5858L10.2929 9.29289C10.6834 8.90237 11.3166 8.90237 11.7071 9.29289C12.0976 9.68342 12.0976 10.3166 11.7071 10.7071L10.4142 12L11.7071 13.2929C12.0976 13.6834 12.0976 14.3166 11.7071 14.7071C11.3166 15.0976 10.6834 15.0976 10.2929 14.7071L9 13.4142L7.70711 14.7071C7.31658 15.0976 6.68342 15.0976 6.29289 14.7071C5.90237 14.3166 5.90237 13.6834 6.29289 13.2929L7.58579 12L6.29289 10.7071Z"
                          fill="#DB4324"
                        />
                      </svg>
                    </span> */}
                    <Remove fill="#11181C" />
                  </button>
                </div>
              </div>
            </>
          );
        })}
      {bodyToggle ? (
        <div>
          <CodeHinter
            currentState={currentState}
            initialValue={jsonBody}
            mode="javascript"
            theme={darkMode ? 'monokai' : 'base16-light'}
            height={'300px'}
            className="query-hinter"
            ignoreBraces={false}
            onChange={(value) => onJsonBodyChange(value)}
            componentName={`${componentName}/${tabType}`}
          />
        </div>
      ) : (
        <div className="d-flex" style={{ maxHeight: '32px' }}>
          <button
            className={`d-flex align-items-center justify-content-center add-tabs bg-transparent border-0 color-light-indigo-09`}
            style={{ background: darkMode ? 'inherit' : '#F8F9FA', height: '32px' }}
            onClick={() => addNewKeyValuePair(paramType)}
            role="button"
          >
            <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
            &nbsp;&nbsp;{t('editor.inspector.eventManager.addKeyValueParam', 'Add more')}
          </button>
          <div className="col" style={{ flex: '1', background: darkMode ? '' : '#ffffff' }}></div>
        </div>
      )}
    </div>
  );
};
