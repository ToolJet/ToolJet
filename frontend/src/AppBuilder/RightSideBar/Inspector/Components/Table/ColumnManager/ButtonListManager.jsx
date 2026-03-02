import React, { useMemo } from 'react';
import { SortableTree } from '@/_ui/SortableTree';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import { Button } from '@/components/ui/Button/Button';

const PROPERTY_NAMES = {
  isGroup: 'isGroup',
  parentId: 'parentId',
};

const ButtonListItem = ({ item, onSelect }) => (
  <div
    className="page-menu-item"
    onClick={(e) => {
      e.preventDefault();
      onSelect(item.id);
    }}
  >
    <div className="left">
      <div className="main-page-icon-wrapper">
        <SolidIcon name="cursor" width={16} />
      </div>
      <span className="page-name">{item.buttonLabel || 'Button'}</span>
    </div>
  </div>
);

const ButtonListItemGhost = ({ item, darkMode }) => (
  <div className={`nav-handler ghost ${darkMode ? 'dark-theme' : ''}`}>
    <div className="page-menu-item" style={{ width: '100%' }}>
      <div className="left">
        <div className="main-page-icon-wrapper">
          <SolidIcon name="cursor" width={16} />
        </div>
        <span className="page-name">{item.buttonLabel || 'Button'}</span>
      </div>
    </div>
  </div>
);

export const ButtonListManager = ({ buttons = [], onAddButton, onReorderButtons, onSelectButton }) => {
  const items = useMemo(
    () =>
      buttons.map((btn) => ({
        ...btn,
        isGroup: false,
        parentId: null,
      })),
    [buttons]
  );

  const handleReorder = (reorderedTree) => {
    const reordered = reorderedTree.map(({ isGroup, parentId, children, ...btn }) => btn);
    onReorderButtons(reordered);
  };

  const renderItem = (item) => (
    <ButtonListItem item={item} onSelect={onSelectButton} />
  );

  const renderGhost = (item, { darkMode } = {}) => <ButtonListItemGhost item={item} darkMode={darkMode} />;

  return (
    <div className="button-list-manager navigation-inspector" style={{ padding: '0 12px' }}>
      <div
        className="d-flex align-items-center justify-content-center tj-text-xsm"
        style={{ color: 'var(--text-placeholder)', gap: '8px', marginBottom: '8px' }}
      >
        <span style={{ flex: 1, borderTop: '1px dashed var(--border-weak)' }} />
        <span>Buttons</span>
        <span style={{ flex: 1, borderTop: '1px dashed var(--border-weak)' }} />
      </div>
      {
        items.length === 0 && ( 
          <div className='d-flex justify-content-center align-items-center gap-[8px] flex-column'>
            <div style={{
              background: 'var(--cc-surface2-surface)',
              height: '32px',
              width: '32px',
              borderRadius: '8px',
              padding:'6px',
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Button
                variant="ghost"
                size="default"
                iconOnly={true}
                isLucid={true}
                trailingIcon="mouse"
              />          

            </div>
            <span className='flex tj-header-h8' style={{color:'var(--cc-text-default)'}}>No action button added</span>
            <span className='flex tj-text-xsm text-center' style={{color: 'var(--cc-text-placeholder)'}}>Add action buttons to table rows and configure events like you would with any button component</span>
          </div>
        )
      }

      {items.length > 0 && (
        <SortableTree
          items={items}
          onReorder={handleReorder}
          propertyNames={PROPERTY_NAMES}
          renderItem={renderItem}
          renderGhost={renderGhost}
          collapsible={false}
          indicator={true}
          indentationWidth={0}
          handlerClassName="button-list-handler"
          containerElement="div"
        />
      )}

      <AddNewButton onClick={onAddButton} dataCy="add-new-action-button" className="mt-2 w-100">
        Add new action button
      </AddNewButton>
    </div>
  );
};
