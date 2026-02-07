import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const RenameInput = ({ page, updaterCallback }) => {
  const { t } = useTranslation();
  const updatePageName = useStore((state) => state.updatePageName);
  const handleAddingNewPage = (pageName) => {
    if (pageName.trim().length === 0) {
      toast(
        t(
          page?.isPageGroup ? 'editor.pageMenu.toasts.pageGroupNameMinLength' : 'editor.pageMenu.toasts.pageNameMinLength',
          page?.isPageGroup ? 'Page group name should have at least 1 character' : 'Page name should have at least 1 character'
        ),
        {
        icon: '⚠️',
        }
      );
    } else if (pageName.trim().length > 32) {
      toast(
        t(
          page?.isPageGroup ? 'editor.pageMenu.toasts.pageGroupNameMaxLength' : 'editor.pageMenu.toasts.pageNameMaxLength',
          page?.isPageGroup ? 'Page group name cannot exceed 32 characters' : 'Page name cannot exceed 32 characters'
        ),
        {
        icon: '⚠️',
        }
      );
    } else {
      updatePageName(page.id, pageName);
    }
    if (updaterCallback) updaterCallback();
  };

  return (
    <div
      style={{
        width: '100%',
      }}
      className="row"
      role="button"
    >
      <div className="col-12 tj-app-input">
        <input
          style={{
            height: '28px',
            width: '100%',
          }}
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
