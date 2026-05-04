import React from 'react';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import { TreeSelectSortableTree } from './Tree';

const TreeSelectOptionsList = ({
  treeItems,
  darkMode,
  onDeleteItem,
  onItemChange,
  onAddItem,
  onAddNestedItem,
  onReorder,
  getResolvedValue,
}) => {
  return (
    <div className="treeselect-inspector" data-cy="inspector-treeselect-options-list" style={{ marginBottom: '12px' }}>
      <div>
        <TreeSelectSortableTree
          treeItems={treeItems}
          darkMode={darkMode}
          onDeleteItem={onDeleteItem}
          onItemChange={onItemChange}
          onAddNestedItem={onAddNestedItem}
          onReorder={onReorder}
          getResolvedValue={getResolvedValue}
        />
      </div>
      <div>
        <AddNewButton onClick={() => onAddItem()} dataCy="inspector-treeselect-add-new-option" className="mt-2">
          Add new option
        </AddNewButton>
      </div>
    </div>
  );
};

export default TreeSelectOptionsList;
