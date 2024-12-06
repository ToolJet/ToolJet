import React from 'react';
import { useTranslation } from 'react-i18next';
import Plus from '@/_ui/Icon/solidIcons/Plus';
import FileDelete from './Icon/FileDelete.svg';

const EmptyTabContent = ({ darkMode, addNewKeyValuePair, paramType }) => {
  const { t } = useTranslation();
  return (
    <>
      <div
        className="empty-paramlist w-100"
        style={{
          background: darkMode && 'var(--interactive-default)',
        }}
      >
        <FileDelete />
        <span>This request does not have any parameters</span>
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
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <p className="m-0 text-default">
          <Plus fill={'var(--icons-default)'} width={15} />
          <span
            style={{ marginLeft: '6px', fontWeight: '500', fontSize: '12px', lineHeight: '18px', color: '#1B1F24' }}
          >
            {t('editor.inspector.eventManager.addKeyValueParam', 'Add parameter')}
          </span>
        </p>
      </button>
    </>
  );
};

export default EmptyTabContent;
