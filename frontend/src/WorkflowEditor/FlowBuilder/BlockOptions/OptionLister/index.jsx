import React from 'react';
import { getSvgIcon } from '@/_helpers/appUtils';

import IfIcon from '../../../../../assets/images/icons/if.svg';

import './styles.scss';

const fetchIconForSource = (source) => {
  const iconFile = source?.plugin?.iconFile?.data ?? undefined;
  const Icon = () => getSvgIcon(source.kind, 20, 20, iconFile);
  return (
    <div
      style={{
        height: 25,
        width: 25,
      }}
    >
      <Icon />
    </div>
  );
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
            onClick={() => onOptionClick(source.kind)}
          >
            {fetchIconForSource(source)}
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
