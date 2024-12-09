import React from 'react';
import { getWorkspaceId } from '@/_helpers/utils';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import BulkIcon from '@/_ui/Icon/BulkIcons';
import { getSubpath } from '@/_helpers/routes';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const NoComponentCanvasContainer = () => {
  const sampleDataSource = useStore((state) => state.sampleDataSource, shallow);
  const createDataQuery = useStore((state) => state.dataQuery.createDataQuery, shallow);
  const setPreviewData = useStore((state) => state.queryPanel.setPreviewData, shallow);
  const shouldFreeze = useStore((state) => state.getShouldFreeze());

  const queryBoxText = sampleDataSource
    ? 'Connect to your data source or use our sample data source to start playing around!'
    : 'Connect to a data source to be able to create a query';

  const openAddUserWorkspaceSetting = () => {
    const workspaceId = getWorkspaceId();
    const subPath = getSubpath();
    const path = subPath
      ? `${subPath}/${workspaceId}/workspace-settings?adduser=true`
      : `/${workspaceId}/workspace-settings?adduser=true`;
    window.open(path, '_blank');
  };

  const handleConnectSampleDB = () => {
    const source = sampleDataSource;
    const query = `SELECT tablename \nFROM pg_catalog.pg_tables \nWHERE schemaname='public';`;
    createDataQuery(source, true, { query });
    setPreviewData(null);
  };

  return (
    <div style={{ paddingTop: '10%' }}>
      <div className="row empty-box-cont">
        <div className="col-md-4 dotted-cont">
          <div className="box-icon">
            <BulkIcon name="addtemplate" width="25" viewBox="0 0 28 28" />
          </div>
          <div className={`title-text`} data-cy="empty-editor-text">
            Drag and drop a component
          </div>
          <div className="title-desc">
            Choose a component from the right side panel or use our pre-built templates to get started quickly!
          </div>
        </div>
        <div className="col-md-4 dotted-cont">
          <div className="box-icon">
            <SolidIcon name="datasource" fill="#3E63DD" width="25" />
          </div>
          <div className={`title-text`}>Create a Query</div>
          <div className="title-desc">{queryBoxText}</div>
          {!!sampleDataSource && !shouldFreeze && (
            <div className="box-link">
              <div className="child">
                <a className="link-but" onClick={handleConnectSampleDB}>
                  Connect to sample data source{' '}
                </a>
              </div>

              <div>
                <BulkIcon name="arrowright" fill="#3E63DD" />
              </div>
            </div>
          )}
        </div>

        <div className="col-md-4 dotted-cont">
          <div className="box-icon">
            <BulkIcon name="invitecollab" width="25" viewBox="0 0 28 28" />
          </div>
          <div className={`title-text `}>Share your application!</div>
          <div className="title-desc">
            Invite users to collaborate in real-time with multiplayer editing and comments for seamless development.
          </div>
          <div className="box-link">
            <div className="child">
              <a className="link-but" onClick={openAddUserWorkspaceSetting}>
                Invite collaborators{' '}
              </a>
            </div>
            <div>
              <BulkIcon name="arrowright" fill="#3E63DD" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoComponentCanvasContainer;
