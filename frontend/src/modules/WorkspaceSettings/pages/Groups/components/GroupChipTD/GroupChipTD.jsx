import React, { useEffect, useState, useRef } from 'react';
import cx from 'classnames'; // Assuming you're using the classnames package
import { humanizeifDefaultGroupName } from '@/_helpers/utils';
import '../../resources/styles/group-permissions.styles.scss';

const GroupChipTD = ({ groups = [] }) => {
  const [showAllGroups, setShowAllGroups] = useState(false);
  const groupsListRef = useRef();

  useEffect(() => {
    const onCloseHandler = (e) => {
      if (groupsListRef.current && !groupsListRef.current.contains(e.target)) {
        setShowAllGroups(false);
      }
    };

    window.addEventListener('click', onCloseHandler);
    return () => {
      window.removeEventListener('click', onCloseHandler);
    };
  }, [showAllGroups]);

  function moveValuesToLast(arr, valuesToMove) {
    const validValuesToMove = valuesToMove.filter((value) => arr.includes(value));

    validValuesToMove.forEach((value) => {
      const index = arr.indexOf(value);
      if (index !== -1) {
        const removedItem = arr.splice(index, 1);
        arr.push(removedItem[0]);
      }
    });

    return arr;
  }

  const orderedArray = groups;

  const toggleAllGroupsList = (e) => {
    setShowAllGroups(!showAllGroups);
  };

  const renderGroupChip = (group, index) => (
    <span className="group-chip" key={index} data-cy="group-chip">
      {humanizeifDefaultGroupName(group)}
    </span>
  );

  return (
    <div
      data-active={showAllGroups}
      onClick={(e) => {
        orderedArray.length > 2 && toggleAllGroupsList(e);
      }}
      className={cx('text-muted resource-name-cell', { 'groups-hover': orderedArray.length > 2 })}
    >
      <div className="groups-name-container tj-text-sm font-weight-500">
        {orderedArray.length === 0 ? (
          <div className="groups-name-row">
            <div className="empty-text">-</div>
          </div>
        ) : (
          <>
            <div className="groups-name-row">
              {orderedArray.slice(0, 2).map((group, index) => {
                return renderGroupChip(group, index);
              })}
            </div>
            <div className="groups-name-row">
              {orderedArray.slice(2, 4).map((group, index) => {
                return renderGroupChip(group, index);
              })}
            </div>
            {orderedArray.length > 4 && (
              <React.Fragment key={4}>
                <div className="groups-name-row" ref={groupsListRef}>
                  <span className="group-chip">+{orderedArray.length - 4} more</span>
                </div>
                {showAllGroups && (
                  <div className="all-groups-list">
                    {orderedArray.slice(4).map((group, index) => renderGroupChip(group, index))}
                  </div>
                )}
              </React.Fragment>
            )}

            {/* orderedArray.slice(0, 2).map((group, index) => {
    if (orderedArray.length <= 2) {
      return renderGroupChip(group, index);
    }

    if (orderedArray.length > 2 && index === 1) {
      
    }

    return renderGroupChip(group, index);
  }) */}
          </>
        )}
      </div>
    </div>
  );
};

export default GroupChipTD;
