import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import toast from 'react-hot-toast';

export const RenameInput = ({ page, updaterCallback }) => {
  const updatePageName = useStore((state) => state.updatePageName);
  const setResolvedPageConstants = useStore((state) => state.setResolvedPageConstants);

  const handleAddingNewPage = (pageName) => {
    if (pageName.trim().length === 0) {
      toast(`${page?.isPageGroup ? 'Page group' : 'Page'} name should have at least 1 character`, {
        icon: '⚠️',
      });
    } else if (pageName.trim().length > 32) {
      toast(`${page?.isPageGroup ? 'Page group' : 'Page'} name cannot exceed 32 characters`, {
        icon: '⚠️',
      });
    } else {
      updatePageName(page.id, pageName);
      setResolvedPageConstants({
        name: pageName,
      });
    }
    if (updaterCallback) updaterCallback();
  };

  return (
    <div className="row" role="button">
      <div className="col-12 tj-app-input">
        <input
          data-cy={`page-rename-input`}
          type="text"
          className="form-control page-name-input"
          autoFocus
          defaultValue={page.name}
          onBlur={(event) => {
            const name = event.target.value;
            handleAddingNewPage(name);
            event.stopPropagation();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              const name = event.target.value;
              handleAddingNewPage(name);
              event.stopPropagation();
            }
          }}
        />
      </div>
    </div>
  );
};
