import React from 'react';
import ArrowRight from './Icons/ArrowRight.svg';
import RightFlex from './Icons/Right-flex.svg';
import { renderDatatypeIcon } from './constants';

type KeyIcon = {
  icon: string;
  columnName: string;
};

type ChangesComponentProps = {
  currentPrimaryKeyIcons?: Record<string, KeyIcon>;
  newPrimaryKeyIcons?: Record<string, KeyIcon>;
  foreignKeyChanges?: unknown[];
  existingReferencedTableName?: string;
  existingReferencedColumnName?: string;
  currentReferencedTableName?: string;
  currentReferencedColumnName?: string;
};

const ChangesComponent = ({
  currentPrimaryKeyIcons = {},
  newPrimaryKeyIcons = {},
  foreignKeyChanges = [],
  existingReferencedTableName = '',
  existingReferencedColumnName = '',
  currentReferencedTableName = '',
  currentReferencedColumnName = '',
}: ChangesComponentProps) => {
  return (
    <div className="new-changes-container">
      <div className="changes-title">
        <span>{foreignKeyChanges && foreignKeyChanges.length > 0 ? 'Current relation' : 'Current primary key'}</span>
        <ArrowRight />
        <span>{foreignKeyChanges && foreignKeyChanges.length > 0 ? 'New relation' : 'New primary key'}</span>
      </div>
      <div className="key-changes-container">
        <div className="primarykeyDetails-container">
          {foreignKeyChanges && foreignKeyChanges.length > 0 ? (
            <>
              <span className="currentPrimaryKey-columnName">{existingReferencedTableName}</span>
              <div className="currentKey-details align-item-center">
                <RightFlex width={16} height={16} />
                <span className="currentPrimaryKey-columnName">{existingReferencedColumnName}</span>
              </div>
            </>
          ) : (
            <>
              {Object.entries(currentPrimaryKeyIcons)?.map(([index, item]) => (
                <div className="currentKey-details" key={index}>
                  {renderDatatypeIcon(item.icon)}
                  <span className="currentPrimaryKey-columnName">{item.columnName}</span>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="newkeyDetails-container">
          {foreignKeyChanges && foreignKeyChanges.length > 0 ? (
            <>
              <span className="currentPrimaryKey-columnName">{currentReferencedTableName}</span>
              <div className="currentKey-details align-item-center">
                <RightFlex width={16} height={16} />
                <span className="currentPrimaryKey-columnName">{currentReferencedColumnName}</span>
              </div>
            </>
          ) : (
            <>
              {Object.entries(newPrimaryKeyIcons)?.map(([index, item]) => (
                <div className="newKey-details" key={index}>
                  {renderDatatypeIcon(item.icon)}
                  <span className="newPrimaryKey-columnName">{item.columnName}</span>
                </div>
              ))}
            </>
          )}
        </div>
        <div></div>
      </div>
    </div>
  );
};

export default ChangesComponent;
