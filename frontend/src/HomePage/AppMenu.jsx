import React, { useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import SelectSearch from 'react-select-search';
import Fuse from 'fuse.js';
import { folderService } from '@/_services';
import { toast } from 'react-toastify';

export const AppMenu = function AppMenu({ app, folders, foldersChanged, deleteApp, cloneApp, exportApp }) {
  const [addToFolder, setAddToFolder] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  function addAppToFolder(appId, folderId) {
    setIsAdding(true);

    folderService
      .addToFolder(appId, folderId)
      .then(() => {
        toast.info('Added to folder.', {
          hideProgressBar: true,
          position: 'top-center',
        });

        foldersChanged();
        setIsAdding(false);
        setAddToFolder(false);
      })
      .catch(({ error }) => {
        setIsAdding(false);
        setAddToFolder(false);
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
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
      placement="top"
      rootClose
      onToggle={(status) => handleToggle(status)}
      overlay={
        <Popover id="popover-basic">
          {/* <Popover.Title as="h3">brrr</Popover.Title> */}
          <Popover.Content>
            {!addToFolder && (
              <div>
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
                <div className="field mb-2">
                  <span className="my-3 text-danger" role="button" onClick={() => deleteApp()}>
                    Delete app
                  </span>
                </div>
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
      <span className="badge bg-blue-lt mx-2" role="button">
        <img className="svg-icon" src="/assets/images/icons/app-menu.svg" width="12" height="12" />
      </span>
    </OverlayTrigger>
  );
};
