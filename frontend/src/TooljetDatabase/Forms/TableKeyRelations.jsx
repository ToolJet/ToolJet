import React from 'react';
import TableDetailsDropdown from './TableDetailsDropdown';
import Source from '../Icons/Source.svg';
import Target from '../Icons/Target.svg';
import Actions from '../Icons/Actions.svg';

function SourceKeyRelation() {
  return (
    <div className="relations-container">
      <div className="source mt-3">
        <div>
          <div className="d-flex align-items-center mb-1">
            <Source width={18} height={18} />
            <p className="mb-0 source-title">SOURCE</p>
          </div>
          <span className="source-description">This is the data to which the current table will be referenced to </span>
        </div>
        <TableDetailsDropdown
          firstColumnName={'Table'}
          secondColumnName={'Column'}
          firstColumnPlaceholder={'Select Table'}
          secondColumnPlaceholder={'Select Column'}
        />
      </div>
      <div className="target mt-4">
        <div>
          <div className="d-flex align-items-center mb-1">
            <Target width={18} height={18} />
            <p className="mb-0 source-title">TARGET</p>
          </div>
          <span className="source-description">This is the data to which the current table will be referenced to </span>
        </div>
        <TableDetailsDropdown
          firstColumnName={'Table'}
          secondColumnName={'Column'}
          firstColumnPlaceholder={'Select Table'}
          secondColumnPlaceholder={'Select Column'}
        />
      </div>
      <div className="actions mt-4">
        <div>
          <div className="d-flex align-items-center mb-1">
            <Actions width={18} height={18} />
            <p className="mb-0 source-title">ACTIONS</p>
          </div>
          <span className="source-description">This is the data to which the current table will be referenced to </span>
        </div>
        <TableDetailsDropdown
          firstColumnName={'On update'}
          secondColumnName={'On remove'}
          firstColumnPlaceholder={'Select action'}
          secondColumnPlaceholder={'Select columns from this table to reference with..'}
        />
      </div>
    </div>
  );
}

export default SourceKeyRelation;
