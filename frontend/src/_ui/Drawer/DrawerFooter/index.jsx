import React, { useEffect } from 'react';
import { ButtonSolid } from '../../AppButton/AppButton';
import Student from '../../../TooljetDatabase/Icons/Student.svg';
import DeleteIcon from '@/TooljetDatabase/Icons/DeleteIcon.svg';
import './styles.scss';
import { ToolTip } from '@/_components/ToolTip';
import { triggerKeyboardShortcut } from '@/_helpers/utils';
import { useKeyboardShortcutStore } from '@/_stores/keyboardShortcutStore';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import cx from 'classnames';

function DrawerFooter({
  fetching,
  onClose,
  isEditMode,
  onCreate,
  onEdit,
  shouldDisableCreateBtn,
  isForeignKeyDraweOpen = false,
  onDeletePopup,
  isEditColumn,
  createForeignKeyInEdit,
  isCreateColumn,
  isForeignKeyForColumnDrawer,
  editForeignKeyInCreateTable,
  showToolTipForFkOnReadDocsSection = false,
  foreignKeyDetails = [],
  initiator,
}) {
  useEffect(() => {
    const keyboardShortcutStore = useKeyboardShortcutStore.getState();
    keyboardShortcutStore.actions.pushComponent(initiator);
    return () => {
      keyboardShortcutStore.actions.popComponent();
    };
  }, []);

  useEffect(() => {
    const baseKeyCallback = { key: 'Escape', callbackFn: onClose };
    const keyCallbackFnArray = [baseKeyCallback];

    const addEnterCallback = (callbackFn) => {
      keyCallbackFnArray.push({ key: 'Enter', callbackFn });
    };

    const formType = initiator;
    if (formType.startsWith('Create')) {
      addEnterCallback(onCreate);
    } else if (formType.startsWith('Edit')) {
      addEnterCallback(onEdit);
    } else {
      const shouldAddEnterForEdit = (isEditColumn || isCreateColumn) && isForeignKeyForColumnDrawer;
      if (shouldAddEnterForEdit) {
        addEnterCallback(isEditColumn ? onEdit : onCreate);
      } else if (isForeignKeyDraweOpen && editForeignKeyInCreateTable) {
        addEnterCallback(onEdit);
      } else if (isEditMode) {
        addEnterCallback(onEdit);
      } else {
        addEnterCallback(onCreate);
      }
    }

    if (formType === 'CreateRowForm') {
      keyCallbackFnArray.push({ key: 'Shift, Enter', callbackFn: onCreate, args: [true] });
    }

    const cleanup = triggerKeyboardShortcut(keyCallbackFnArray, initiator);
    return cleanup;
  }, [
    onCreate,
    onEdit,
    onClose,
    initiator,
    isEditColumn,
    isCreateColumn,
    isForeignKeyForColumnDrawer,
    isForeignKeyDraweOpen,
    isEditMode,
    editForeignKeyInCreateTable,
  ]);

  const drawerDocumentationsLinks = {
    CreateTableForm: 'https://docs.tooljet.com/docs/tooljet-db/database-editor/#create-new-table',
    EditTableForm: 'https://docs.tooljet.com/docs/tooljet-db/database-editor/#rename-table',
    CreateColumnForm: 'https://docs.tooljet.com/docs/tooljet-db/database-editor/#add-new-column',
    EditColumnForm: 'https://docs.tooljet.com/docs/tooljet-db/database-editor/#edit-column',
    ForeignKeyTableForm: 'https://docs.tooljet.com/docs/tooljet-db/database-editor/#foreign-key',
  };
  const drawerNames = Object.keys(drawerDocumentationsLinks);
  const isDrawerWithDocumentation = drawerNames.some((drawerName) => drawerName === initiator);
  const isDrawerWithDocumentationLink = drawerDocumentationsLinks[initiator];

  return (
    <div className="position-sticky bottom-0 right-0 w-100  mt-auto z-2">
      <div
        className={cx(
          { 'd-flex justify-content-end drawer-footer-btn-wrap': !isDrawerWithDocumentation },
          { 'd-flex justify-content-between drawer-footer-btn-wrap': isDrawerWithDocumentation }
        )}
      >
        {isDrawerWithDocumentation && (
          <ToolTip
            message={'Foreign key relations checks for referential integrity between two tables. Read more.'}
            placement="top"
            tooltipClassName="tootip-table read-docs-fk"
            show={showToolTipForFkOnReadDocsSection}
          >
            <div className="d-flex align-items-center">
              <Student />
              <a href={isDrawerWithDocumentationLink} target="_blank" className="read-documentation" rel="noreferrer">
                Read documentation
              </a>
            </div>
          </ToolTip>
        )}
        {initiator === 'CreateRowForm' && (
          <div className="tjdb-shotcut-text-container">
            <div className="tjdb-shift-shortcut-box">
              <SolidIcon name="shiftbutton" />
            </div>
            <SolidIcon name="plus" width={10} />
            <div className="mr-5 tjdb-enter-shortcut-box">
              <SolidIcon name="enterbutton" />
            </div>
            <div className="fw-400 tjdb-cell-menu-shortcuts-text">Create this row & add another</div>
          </div>
        )}
        <div className="d-flex action-btns">
          {(isForeignKeyDraweOpen && (isEditMode || (isEditColumn && !createForeignKeyInEdit))) ||
          (isForeignKeyDraweOpen && editForeignKeyInCreateTable) ||
          (isCreateColumn && foreignKeyDetails?.length > 0) ? (
            <ButtonSolid variant="dangerTertiary" onClick={onDeletePopup}>
              <DeleteIcon />
              &nbsp; Delete
            </ButtonSolid>
          ) : (
            <ButtonSolid variant="tertiary" data-cy={`cancel-button`} onClick={onClose}>
              Cancel
            </ButtonSolid>
          )}
          {isForeignKeyForColumnDrawer && !createForeignKeyInEdit ? (
            <>
              {isEditColumn && (
                <ButtonSolid
                  disabled={shouldDisableCreateBtn || fetching}
                  data-cy={`save-changes-button`}
                  onClick={onEdit}
                  fill="#fff"
                  leftIcon="floppydisk"
                >
                  Save changes <SolidIcon name="enterbutton" width={16} fill="#FDFDFE" />
                </ButtonSolid>
              )}
              {isCreateColumn && (
                <ButtonSolid
                  disabled={fetching || shouldDisableCreateBtn}
                  data-cy={`create-button`}
                  onClick={() => {
                    onCreate();
                  }}
                >
                  Create <SolidIcon name="enterbutton" width={16} fill="#FDFDFE" />
                </ButtonSolid>
              )}
            </>
          ) : isForeignKeyForColumnDrawer && createForeignKeyInEdit ? (
            <>
              <ButtonSolid
                disabled={fetching || shouldDisableCreateBtn}
                data-cy={`create-button`}
                onClick={() => {
                  onCreate();
                }}
              >
                Create <SolidIcon name="enterbutton" width={16} fill="#FDFDFE" />
              </ButtonSolid>
            </>
          ) : isForeignKeyDraweOpen && editForeignKeyInCreateTable ? (
            <>
              <ButtonSolid
                disabled={shouldDisableCreateBtn || fetching}
                data-cy={`save-changes-button`}
                onClick={onEdit}
                fill="#fff"
                leftIcon="floppydisk"
              >
                Save changes <SolidIcon name="enterbutton" width={16} fill="#FDFDFE" />
              </ButtonSolid>
            </>
          ) : (
            <>
              {isEditMode && (
                <ButtonSolid
                  disabled={shouldDisableCreateBtn || fetching}
                  data-cy={`save-changes-button`}
                  onClick={onEdit}
                  fill="#fff"
                  leftIcon="floppydisk"
                >
                  Save changes <SolidIcon name="enterbutton" width={16} fill="#FDFDFE" />
                </ButtonSolid>
              )}
              {!isEditMode && (
                <ButtonSolid
                  disabled={fetching || shouldDisableCreateBtn}
                  data-cy={`create-button`}
                  onClick={() => {
                    onCreate();
                  }}
                >
                  Create <SolidIcon name="enterbutton" width={16} fill="#FDFDFE" />
                </ButtonSolid>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DrawerFooter;
