import React, { useContext } from 'react';
import cx from 'classnames';
import Table from '../Table';
import Sidebar from '../Sidebar';
import { TooljetDatabaseContext } from '../index';
import EmptyFoldersIllustration from '@assets/images/icons/no-queries-added.svg';
import { isEmpty } from 'lodash';

const TooljetDatabasePage = ({ totalTables, collapseSidebar }) => {
  const { selectedTable } = useContext(TooljetDatabaseContext);

  const EmptyState = () => {
    return (
      <div
        style={{
          transform: 'translateY(50%)',
        }}
        className="d-flex justify-content-center align-items-center flex-column mt-3"
      >
        <div className="mb-4">
          <EmptyFoldersIllustration />
        </div>
        <div className="text-center">
          <div className="text-h3" data-cy="do-not-have-table-text">
            You don&apos;t have any tables yet.
          </div>
        </div>
        <div className="text-h5 text-secondary" data-cy="create-table-to-get-started-text">
          Create a table to get started!
        </div>
      </div>
    );
  };

  return (
    <div className="row gx-0">
      <Sidebar collapseSidebar={collapseSidebar} />
      <div className={cx('col animation-fade database-page-content-wrap vh-100')}>
        {totalTables === 0 && <EmptyState />}
        {!isEmpty(selectedTable) && (
          <div className={cx('col')}>
            <Table collapseSidebar={collapseSidebar} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TooljetDatabasePage;
