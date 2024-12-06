import React from 'react';
import { useTranslation } from 'react-i18next';
import Plus from '@/_ui/Icon/solidIcons/Plus';
import FileDelete from './Icon/FileDelete.svg';

const EmptyTabContent = ({ addNewKeyValuePair, paramType }) => {
  const { t } = useTranslation();

  const paramLabel = () => {
    switch (paramType) {
      case 'url_params':
        return 'parameters';
      default:
        return paramType;
    }
  };

  return (
    <>
      <div className="empty-paramlist w-100">
        <FileDelete />
        <span>This request does not have any {paramLabel()}</span>
      </div>
      <button
        onClick={() => addNewKeyValuePair(paramType)}
        className="add-params-btn"
        id="runjs-param-add-btn"
        data-cy={`runjs-add-param-button`}
        style={{
          background: 'none',
          border: 'none',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <p className="m-0 text-default" style={{ display: 'flex', alignItems: 'center' }}>
          <Plus fill={'var(--icons-default)'} width={15} />
          <span style={{ marginLeft: '6px', fontWeight: '500', fontSize: '12px', lineHeight: '18px' }}>
            {t(
              'editor.inspector.eventManager.addKeyValueParam',
              `Add ${paramType === 'body' ? paramLabel() : paramLabel()?.slice(0, -1)}`
            )}
          </span>
        </p>
      </button>
    </>
  );
};

export default EmptyTabContent;
