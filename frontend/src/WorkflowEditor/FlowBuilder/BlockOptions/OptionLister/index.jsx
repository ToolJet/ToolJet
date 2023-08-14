import React from 'react';
import IfIcon from '../../../../../assets/images/icons/if.svg';
import './styles.scss';
import DataSourceIcon from '../../DataSourceIcon';

const kindToLabelMapping = {
  restapi: 'REST API',
  runjs: 'JavaScript',
  tooljetdb: 'ToolJet DB',
};

function OptionLister(props) {
  const { sources, onOptionClick } = props;

  return (
    <>
      {sources.map((source) => {
        if (source.kind === 'workflows') return null;
        return (
          <div
            className="option-source-card"
            key={`${source.id}-${source.kind}`}
            onClick={() => onOptionClick(source.kind, source.id, source.plugin_id)}
          >
            <DataSourceIcon source={source} />
            <div data-cy={`${String(source.name).toLocaleLowerCase().replace(/\s+/g, '-')}-add-query-card`}>
              {' '}
              {kindToLabelMapping[source.kind] ?? source.name}
            </div>
          </div>
        );
      })}
      <div className="option-source-card" key={`if-key`} onClick={() => onOptionClick('if')}>
        <IfIcon />
        <div data-cy={`${String('if').toLocaleLowerCase().replace(/\s+/g, '-')}-add-query-card`}> If condition</div>
      </div>
    </>
  );
}

export default OptionLister;
