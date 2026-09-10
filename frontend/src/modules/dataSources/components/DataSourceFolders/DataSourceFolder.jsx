import React, { useContext, useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { DynamicIcon } from 'lucide-react/dynamic.mjs';
import { EllipsisVerticalIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { ListItem } from '../LIstItem';
import { GlobalDataSourcesContext } from '../../pages/GlobalDataSourcesPage';

// A single data-source folder row: expand/collapse header + (when expanded) its data-source rows.
// Folder icon states mirror the design: `folder-dot` when it has items, `folder` when empty, and
// `folder-open` while expanded. Expanding is inline/accordion — it never touches the right pane.
export const DataSourceFolder = ({
  folder,
  contents,
  isExpanded,
  onToggle,
  onRename,
  onDelete,
  onDeleteDataSource,
  updateSelectedDatasource,
  canRename,
  canDelete,
  darkMode,
}) => {
  const { selectedDataSource } = useContext(GlobalDataSourcesContext);
  const canManageFolder = canRename || canDelete;
  const [showMenu, setShowMenu] = useState(false);
  const menuBtnRef = useRef(null);

  const hasItems = contents.length > 0;
  const folderIcon = isExpanded ? 'folder-open' : hasItems ? 'folder-dot' : 'folder';

  const handleMenuAction = (action) => {
    setShowMenu(false);
    if (action === 'rename') onRename(folder);
    if (action === 'delete') onDelete(folder);
  };

  return (
    <div className="datasource-folder">
      <div
        className="datasource-folder-row"
        role="button"
        onClick={onToggle}
        data-cy={`datasource-folder-${String(folder.name).toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="datasource-folder-leading">
          <DynamicIcon name={folderIcon} size={16} style={{ color: 'var(--icon-default, #6a727c)', flexShrink: 0 }} />
          <span className="datasource-folder-name text-truncate" title={folder.name}>
            {folder.name}
          </span>
        </div>

        {canManageFolder && (
          <div
            className={`datasource-folder-menu-trigger ${showMenu ? 'is-open' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              ref={menuBtnRef}
              iconOnly
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((v) => !v);
              }}
              size="small"
              variant="outline"
              data-cy={`datasource-folder-menu-btn-${folder.id}`}
            >
              <EllipsisVerticalIcon color="var(--icon-strong)" size={12} />
            </Button>
          </div>
        )}
      </div>

      <Overlay
        show={showMenu}
        target={menuBtnRef.current}
        placement="bottom-start"
        rootClose
        transition={false}
        onHide={() => setShowMenu(false)}
        popperConfig={{ modifiers: [{ name: 'offset', options: { offset: [0, 4] } }] }}
      >
        {(overlayProps) => (
          <Popover
            {...overlayProps}
            id={`datasource-folder-menu-${folder.id}`}
            className={`transparent-popover ${darkMode ? 'dark-theme' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`datasource-folder-context-menu ${darkMode ? 'dark-theme' : ''}`}>
              {canRename && (
                <button
                  className="datasource-folder-menu-item"
                  onClick={() => handleMenuAction('rename')}
                  data-cy={`datasource-folder-rename-btn-${folder.id}`}
                >
                  <DynamicIcon name="square-pen" size={16} style={{ color: 'var(--icon-default, #6a727c)' }} />
                  Rename
                </button>
              )}
              {canDelete && (
                <button
                  className="datasource-folder-menu-item datasource-folder-menu-item--delete"
                  onClick={() => handleMenuAction('delete')}
                  data-cy={`datasource-folder-delete-btn-${folder.id}`}
                >
                  <DynamicIcon name="trash-2" size={16} style={{ color: 'var(--tomato9, #e54d2e)' }} />
                  Delete
                </button>
              )}
            </div>
          </Popover>
        )}
      </Overlay>

      {isExpanded && (
        <div className="datasource-folder-contents">
          {hasItems ? (
            contents.map((source) => (
              <ListItem
                dataSource={source}
                key={source.id}
                active={selectedDataSource?.id === source?.id}
                onDelete={onDeleteDataSource}
                updateSelectedDatasource={updateSelectedDatasource}
              />
            ))
          ) : (
            <div className="datasource-folder-empty" data-cy={`datasource-folder-empty-${folder.id}`}>
              This folder is empty
            </div>
          )}
        </div>
      )}
    </div>
  );
};
