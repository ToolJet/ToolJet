import React from 'react';

export const RenameInput = ({ page, updaterCallback, updatePageEditMode }) => {
  const handleAddingNewPage = (pageName) => {
    if (pageName.length > 0 && pageName !== page.name) {
      updaterCallback(page.id, pageName);
      updatePageEditMode(false);
    } else {
      //updaterCallback(page.id, pageName);
      updatePageEditMode(false);
    }

  };

  return (
    <div className="row" role="button">
      <div className="col-12">
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
