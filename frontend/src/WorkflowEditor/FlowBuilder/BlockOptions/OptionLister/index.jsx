import React from 'react';

import IfIcon from '../../../../../assets/images/icons/if.svg';

import './styles.scss';
import DataSourceIcon from '../../DataSourceIcon';

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
            onClick={() => onOptionClick(source.kind)}
          >
            <DataSourceIcon source={source} />
            <div data-cy={`${String(source.name).toLocaleLowerCase().replace(/\s+/g, '-')}-add-query-card`}>
              {' '}
              {source.name}
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
