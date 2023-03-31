import React, { useState } from 'react';
import SelectSearch from 'react-select-search';
import Collapse from 'react-bootstrap/Collapse';
// eslint-disable-next-line import/no-unresolved
import { useTranslation } from 'react-i18next';

export const QuerySelector = ({ param, definition, eventOptionUpdated, dataQueries, extraData, eventMeta }) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  function onChange(value) {
    const query = dataQueries.find((dataquery) => dataquery.id === value);
    eventOptionUpdated(param, 'queryId', query.id, extraData);
    eventOptionUpdated(param, 'queryName', query.name, extraData);
  }

  if (definition === undefined) {
    definition = {};
  }

  if (definition.options === undefined) {
    definition.options = {};
  }

  return (
    <div className="field mb-3 mt-1 px-2">
      <label className="form-label" role="button" onClick={() => setOpen(!open)}>
        <div className="row">
          <div className="col">{eventMeta.displayName}</div>
          <div className={`col-auto events-toggle ${open ? 'events-toggle-active' : ''}`}>
            <span className="toggle-icon"></span>
          </div>
        </div>
      </label>
      <Collapse in={open}>
        <div id="collapse">
          <div className="field mb-2 mt-1">
            <SelectSearch
              options={dataQueries.map((query) => {
                return { name: query.name, value: query.id };
              })}
              value={definition.options.queryId}
              search={true}
              onChange={(value) => {
                onChange(value);
              }}
              fuzzySearch
              placeholder={t('globals.select', 'Select') + '...'}
            />
          </div>
        </div>
      </Collapse>
    </div>
  );
};
