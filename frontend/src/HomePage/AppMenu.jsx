import React, { useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import SelectSearch from 'react-select-search';
import Fuse from 'fuse.js';
import { folderService } from '@/_services';
import { toast } from 'react-hot-toast';

export const AppMenu = function AppMenu({
  app,
  folders,
  foldersChanged,
  deleteApp,
  cloneApp,
  exportApp,
  canCreateApp,
  canDeleteApp,
}) {
  const [addToFolder, setAddToFolder] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  function addAppToFolder(appId, folderId) {
    setIsAdding(true);

    folderService
      .addToFolder(appId, folderId)
      .then(() => {
        toast.success('Added to folder.', {
          position: 'top-center',
        });

        foldersChanged();
        setIsAdding(false);
        setAddToFolder(false);
      })
      .catch(({ error }) => {
        setIsAdding(false);
        setAddToFolder(false);
        toast.error(error, { position: 'top-center' });
      });
  }

  function handleToggle(status) {
    if (!status) {
      setAddToFolder(false);
    }
  }

  function customFuzzySearch(options) {
    const fuse = new Fuse(options, {
      keys: ['name'],
      threshold: 0.1,
    });

    return (value) => {
      if (!value.length) {
        return options;
      }
      let searchKeystrokes = fuse.search(value);

      let _fusionSearchArray = searchKeystrokes.map((_item) => _item.item);

      return _fusionSearchArray;
    };
  }

  return (
    <OverlayTrigger
      trigger="click"
      placement="bottom"
      rootClose
      onToggle={(status) => handleToggle(status)}
      overlay={
        <Popover id="popover-basic">
          {/* <Popover.Title as="h3">brrr</Popover.Title> */}
          <Popover.Content bsPrefix="shadow popover-body">
            {!addToFolder && (
              <div>
                {canCreateApp && (
                  <>
                    <div className="field mb-2">
                      <span role="button" onClick={() => setAddToFolder(true)}>
                        Add to folder
                      </span>
                    </div>
                    <div className="field mb-2">
                      <span className="field mb-2" role="button" onClick={() => cloneApp()}>
                        Clone app
                      </span>
                    </div>
                    <div className="field mb-2">
                      <span className="field mb-2" role="button" onClick={() => exportApp()}>
                        Export app
                      </span>
                    </div>
                  </>
                )}
                {canDeleteApp && (
                  <div className="field mb-2">
                    <span className="my-3 text-danger" role="button" onClick={() => deleteApp()}>
                      Delete app
                    </span>
                  </div>
                )}
              </div>
            )}

            {addToFolder && (
              <div>
                {isAdding && (
                  <div className="p-3">
                    <center>
                      <div className="spinner-border text-azure" role="status"></div>
                    </center>
                  </div>
                )}
                {!isAdding && (
                  <SelectSearch
                    options={folders.map((folder) => {
                      return { name: folder.name, value: folder.id };
                    })}
                    // value={currentValue}
                    search={true}
                    onChange={(newVal) => {
                      addAppToFolder(app.id, newVal);
                    }}
                    emptyMessage={folders.length === 0 ? 'No folders present' : 'Not found'}
                    filterOptions={customFuzzySearch}
                    placeholder="Select folder"
                  />
                )}
              </div>
            )}
          </Popover.Content>
        </Popover>
      }
    >
      <img className="svg-icon" src="/assets/images/icons/three-dots.svg" width="12" height="12" />
    </OverlayTrigger>
  );
};
