import React, { useState } from 'react';
import Information from '@/_ui/Icon/solidIcons/Information';
import { ToolTip } from '@/_components/ToolTip';
import DropDownIcon from '../LeftSidebar/icons/dropdown.svg';
import DropUp from '../LeftSidebar/icons/dropup.svg';
import BlueTick from '../LeftSidebar/icons/bluetick.svg';
import { copyClipboard, getServerUrl } from '../utils';

function DropDown(props) {
  const {
    title,
    content,
    open,
    contentData,
    containerStyle,
    mt,
    setOpen,
    handleDropdownChange,
    index,
    editorSessionActions,
    editorSession,
  } = props;
  const [dropDownValue, setDropDownValue] = useState(null);
  const serverUrl = getServerUrl();

  const curlData = editorSession?.parameters?.reduce((result, { key }) => {
    if (!result.hasOwnProperty(key)) {
      result[key] = '';
    }
    return result;
  }, {});

  const dataString = JSON.stringify(curlData);

  const dropdownIcon = open ? <DropUp /> : <DropDownIcon />;
  const CopyUrl = `${serverUrl}/v2/webhooks/workflows/${editorSession?.app.id}/trigger?environment=${editorSession?.currentWebhookEnvironment}`;
  const copyCurl = `curl -X POST --url "${serverUrl}/v2/webhooks/workflows/${editorSession?.app.id}/trigger?environment=${editorSession?.currentWebhookEnvironment}" --data '${dataString}' -H "Content-Type: application/json" -H "Authorization: Bearer ${editorSession?.workflowToken}"`;

  const handleGetDropdown = (index, item) => {
    if (item === 'Copy URL') {
      copyClipboard(CopyUrl);
      setDropDownValue('Copied');
      setTimeout(() => {
        setDropDownValue('Copy');
      }, 2000);
      setOpen(!open);
    } else if (item === 'Copy as cURL') {
      copyClipboard(copyCurl);
      setDropDownValue('Copied');
      setTimeout(() => {
        setDropDownValue('Copy');
      }, 2000);
      setOpen(!open);
    } else if (
      item === 'string' ||
      item === 'number' ||
      item === 'object' ||
      item === 'array' ||
      item === 'boolean' ||
      item === 'null'
    ) {
      handleDropdownChange(index, item);
      setDropDownValue(item);
      setOpen(!open);
    } else {
      setDropDownValue(item);
      editorSessionActions?.getWebhookEnvironment(item);
      setOpen(!open);
    }
  };

  const renderContentWithIcon = (content, defaultValue) => {
    const dataName = content && content[0].toUpperCase() + content.substring(1);
    if (content === 'Copy URL' || content === 'Copy as cURL') {
      return <div className="dropdowns p-2 rounded">{content}</div>;
    } else if (
      content === 'string' ||
      content === 'number' ||
      content === 'object' ||
      content === 'array' ||
      content === 'boolean' ||
      content === 'null'
    ) {
      return (
        <div className="dropdowns p-2 rounded d-flex align-items-center justify-content-between">
          {content}
          {dropDownValue !== null && content === dropDownValue && <BlueTick />}
          {dropDownValue === null && defaultValue === content && <BlueTick />}
        </div>
      );
    } else {
      return (
        <div className="dropdowns p-2 rounded d-flex align-items-center justify-content-between">
          {dataName}
          {dropDownValue !== null && content === dropDownValue && <BlueTick />}
          {dropDownValue === null && defaultValue === dataName && <BlueTick />}
        </div>
      );
    }
  };

  return (
    <div className={`environment-block ${mt}`}>
      {title !== '' && title === 'Environment' ? (
        <ToolTip
          message="Select the environment here to update the webhook endpoint URL to copy accordingly."
          placement="right"
        >
          <div style={{ width: '100px' }} className="d-flex align-items-center justify-content-between">
            <strong>{title}</strong>
            <div style={{ cursor: 'pointer' }}>
              <Information width={20} fill={'#C1C8CD'} />
            </div>
          </div>
        </ToolTip>
      ) : null}
      <div className="position-relative">
        <div
          className="environment d-flex align-items-center justify-content-between p-2 cursor-pointer"
          style={containerStyle}
          onClick={() => setOpen(!open)}
        >
          {dropDownValue === 'development' || dropDownValue === 'staging' || dropDownValue === 'production' ? (
            <p className="mb-0">
              {(dropDownValue && dropDownValue[0].toUpperCase() + dropDownValue.substring(1)) || content}
            </p>
          ) : (
            <p className="mb-0">{dropDownValue || content}</p>
          )}
          {dropdownIcon}
        </div>
        {open && (
          <div
            className={`${
              content === 'Development'
                ? 'dropDown-content-env position-absolute rounded'
                : 'dropDown-content position-absolute rounded'
            }`}
          >
            {contentData.map((dataItem, i) => {
              const dataName = dataItem.name && dataItem.name[0].toUpperCase() + dataItem.name.substring(1);
              return (
                <div
                  className={`${
                    dataItem.name === dropDownValue ||
                    (dropDownValue === null && content === dataName) ||
                    dataItem.name === content
                      ? 'selected cursor-pointer position-relative'
                      : 'cursor-pointer position-relative'
                  }`}
                  key={i}
                  onClick={() => handleGetDropdown(index, dataItem.name)}
                >
                  {renderContentWithIcon(dataItem.name, content)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default DropDown;
