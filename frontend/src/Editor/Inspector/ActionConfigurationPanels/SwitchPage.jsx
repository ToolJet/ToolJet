import React, { useState, useEffect } from 'react';
import Select from '@/_ui/Select';
import defaultStyles from '@/_ui/Select/styles';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { useTranslation } from 'react-i18next';

export function SwitchPage({ getPages, event, handlerChanged, eventIndex, darkMode }) {
  const queryParamChangeHandler = (index, key, value) => {
    event.queryParams[index][key] = value;
    handlerChanged(eventIndex, 'queryParams', event.queryParams);
  };
  const { t } = useTranslation();

  const addQueryParam = () => {
    if (!event.queryParams) {
      event.queryParams = [];
      handlerChanged(eventIndex, 'queryParams', event.queryParams);
    }

    event.queryParams.push(['', '']);
    handlerChanged(eventIndex, 'queryParams', event.queryParams);
    setNumberOfQueryparams(numberOfQueryParams + 1);
  };

  const deleteQueryParam = (index) => {
    event.queryParams.splice(index, 1);
    handlerChanged(eventIndex, 'queryParams', event.queryParams);
    setNumberOfQueryparams(numberOfQueryParams - 1);
  };

  const [numberOfQueryParams, setNumberOfQueryparams] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (event.queryParams) {
      setNumberOfQueryparams(event.queryParams.length);
    }
  });

  const styles = {
    ...defaultStyles(darkMode),
    menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
    menuList: (base) => ({
      ...base,
    }),
  };

  return (
    <div className="p-1 switch-page" data-cy={`switch-page-label-and-input`}>
      <label className="form-label mt-1">{t('globals.page', 'Page')}</label>
      <Select
        options={getPages()}
        search={true}
        value={event.pageId}
        onChange={(value) => {
          handlerChanged(eventIndex, 'pageId', value);
        }}
        placeholder={t('globals.select', 'Select') + '...'}
        styles={styles}
        useMenuPortal={false}
        className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
        useCustomStyles={true}
      />
      <label className="form-label mt-2">Query params</label>

      {Array(numberOfQueryParams)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="row input-group mt-1">
            <div className="col">
              <CodeHinter
                initialValue={event.queryParams[index][0]}
                onChange={(value) => queryParamChangeHandler(index, 0, value)}
                mode="javascript"
                className="form-control codehinter-query-editor-input"
                height={30}
                cyLabel={`query-param-key`}
              />
            </div>
            <div className="col">
              <CodeHinter
                initialValue={event.queryParams[index][1]}
                onChange={(value) => queryParamChangeHandler(index, 1, value)}
                mode="javascript"
                className="form-control codehinter-query-editor-input"
                height={30}
                cyLabel={`query-param-value`}
              />
            </div>
            <span className="btn-sm col-auto my-1" role="button" onClick={() => deleteQueryParam(index)}>
              x
            </span>
          </div>
        ))}

      <button
        className="btn btn-sm btn-outline-azure mt-2 mx-0 mb-0"
        onClick={addQueryParam}
        data-cy={`button-add-query-param`}
      >
        +
      </button>
    </div>
  );
}
