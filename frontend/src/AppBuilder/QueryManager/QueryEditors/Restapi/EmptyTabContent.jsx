import React from 'react';
import { useTranslation } from 'react-i18next';
import Plus from '@/_ui/Icon/solidIcons/Plus';
import FileDelete from './Icon/FileDelete.svg';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';

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
      <div className="empty-paramlist w-100" data-cy={generateCypressDataCy(`empty-${paramType}`)}>
        <FileDelete />
        <span data-cy={generateCypressDataCy(`empty-${paramType}-message`)}>
          This request does not have any {paramLabel()}
        </span>
      </div>
      <button
        onClick={() => addNewKeyValuePair(paramType)}
        className="add-params-btn empty-paramlist-btn"
        id="runjs-param-add-btn"
        data-cy={generateCypressDataCy(`add-${paramType}-button`)}
      >
        <p className="m-0 text-default">
          <Plus fill={'var(--icons-default)'} width={15} />
          <span>
            {t(
              'editor.inspector.eventManager.addKeyValueParam',
              `Add ${paramType === 'body' ? paramLabel() : paramLabel()?.slice(0, -1)}`,
              {
                parameter: paramType === 'body' ? paramLabel() : paramLabel()?.slice(0, -1),
              }
            )}
          </span>
        </p>
      </button>
    </>
  );
};

export default EmptyTabContent;
