import React, { useRef, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import ListGroup from 'react-bootstrap/ListGroup';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import List from '@/ToolJetUI/List/List';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SortableList from '@/_components/SortableList';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import { isClickInsidePortaledOverlay } from '@/AppBuilder/RightSideBar/Inspector/Utils';

const ListComponent = List as React.ComponentType<any>;
const AddNewButtonComponent = AddNewButton as React.ComponentType<any>;
const ButtonSolidComponent = ButtonSolid as React.ComponentType<any>;
const TrashIcon = Trash as React.ComponentType<any>;
const DragHandle = (SortableList as unknown as { DragHandle: React.ComponentType<{ show?: boolean }> }).DragHandle;

// A click in another popover (a colour or icon picker opened from this one) or a portaled menu is not a click outside.
const isInsideNestedLayer = (target: EventTarget | null) =>
  isClickInsidePortaledOverlay(target) || !!(target as Element | null)?.closest?.('.popover, .sketch-picker');

interface RowProps<T> {
  item: T;
  index: number;
  id: string;
  darkMode: boolean;
  renderLabel: (item: T, index: number) => React.ReactNode;
  renderDetails: (item: T, index: number) => React.ReactNode;
  onDelete: (index: number) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  cyLabel: string;
}

const Row = <T,>({
  item,
  index,
  id,
  darkMode,
  renderLabel,
  renderDetails,
  onDelete,
  open,
  setOpen,
  cyLabel,
}: RowProps<T>) => {
  const target = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  return (
    <Draggable draggableId={id} index={index}>
      {(provided: any, snapshot: any) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ userSelect: 'none', ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.9 : 1 }}
        >
          <div ref={target}>
            <ListGroup.Item
              style={{ marginBottom: '8px', backgroundColor: open ? 'var(--slate4)' : 'var(--slate3)' }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              onClick={() => setOpen(!open)}
              data-cy={`${cyLabel}-row-${index}`}
            >
              <div className="row">
                <div className="col-auto d-flex align-items-center">
                  <DragHandle show />
                </div>
                <div className="col text-truncate cursor-pointer" style={{ padding: 0 }}>
                  {renderLabel(item, index)}
                </div>
                <div className="col-auto">
                  {hovered && (
                    <ButtonSolidComponent
                      variant="danger"
                      size="xs"
                      className="delete-icon-btn"
                      aria-label="Remove"
                      data-cy={`${cyLabel}-delete-${index}`}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onDelete(index);
                      }}
                    >
                      <span className="d-flex">
                        <TrashIcon fill="var(--tomato9)" width={12} />
                      </span>
                    </ButtonSolidComponent>
                  )}
                </div>
              </div>
            </ListGroup.Item>
          </div>
          <Overlay
            target={target.current}
            show={open}
            placement="left-start"
            rootClose
            rootCloseEvent="mousedown"
            // A tall popover (a column's fields) slides up to stay on screen rather than running off the bottom.
            popperConfig={{ modifiers: [{ name: 'preventOverflow', options: { altAxis: true, padding: 8 } }] }}
            onHide={(e: Event) => {
              const clicked = (e?.target ?? null) as Node | null;
              // A click on this row toggles it itself.
              if (isInsideNestedLayer(clicked) || (clicked && target.current?.contains(clicked))) return;
              // Deferred so a field's blur commit runs before the mousedown closes the popover.
              setTimeout(() => setOpen(false), 0);
            }}
          >
            <Popover
              className={`${darkMode ? 'dark-theme theme-dark' : ''} inspector-select-options-popover`}
              style={{ minWidth: 280, maxWidth: 300 }}
              data-cy={`${cyLabel}-details`}
            >
              <Popover.Body style={{ maxHeight: 'calc(100vh - 32px)', overflowY: 'auto' }}>
                {renderDetails(item, index)}
              </Popover.Body>
            </Popover>
          </Overlay>
        </div>
      )}
    </Draggable>
  );
};

export interface ListEditorProps<T> {
  items: T[];
  /** A stable id per row (for drag and drop and keeping an open popover on its row). */
  ids: string[];
  darkMode: boolean;
  renderLabel: (item: T, index: number) => React.ReactNode;
  renderDetails: (item: T, index: number) => React.ReactNode;
  onAdd: () => void;
  onDelete: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  addLabel: string;
  cyLabel: string;
}

/**
 * The inspector's list of items as UI 2.0 and the native Dropdown inspector draw it: a row per item (drag handle,
 * label, a delete button on hover) that opens a popover with the item's fields, rows dragged to reorder, and an add
 * button under them. The options editor and the columns manager both draw their lists with it.
 */
export const ListEditor = <T,>({
  items,
  ids,
  darkMode,
  renderLabel,
  renderDetails,
  onAdd,
  onDelete,
  onReorder,
  addLabel,
  cyLabel,
}: ListEditorProps<T>) => {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <ListComponent style={{ marginBottom: '12px' }} data-cy={`${cyLabel}-list`}>
      <DragDropContext
        onDragEnd={({ source, destination }: any) => {
          if (destination && source.index !== destination.index) onReorder(source.index, destination.index);
        }}
      >
        <Droppable droppableId={`${cyLabel}-droppable`}>
          {({ innerRef, droppableProps, placeholder }: any) => (
            <div className="w-100" {...droppableProps} ref={innerRef}>
              {items.map((item, index) => (
                <Row
                  key={ids[index]}
                  item={item}
                  index={index}
                  id={ids[index]}
                  darkMode={darkMode}
                  renderLabel={renderLabel}
                  renderDetails={renderDetails}
                  onDelete={(i) => {
                    if (openId === ids[i]) setOpenId(null);
                    onDelete(i);
                  }}
                  open={openId === ids[index]}
                  setOpen={(open) =>
                    setOpenId((current) => (open ? ids[index] : current === ids[index] ? null : current))
                  }
                  cyLabel={cyLabel}
                />
              ))}
              {placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <AddNewButtonComponent onClick={onAdd} dataCy={`${cyLabel}-add`} className="mt-0">
        {addLabel}
      </AddNewButtonComponent>
    </ListComponent>
  );
};

let lastRowId = 0;

/** Row ids that follow the items: kept by position, so an edit keeps its row's id and an open popover stays open. */
export const useRowIds = (
  count: number
): { ids: string[]; move: (from: number, to: number) => void; remove: (index: number) => void } => {
  const ref = useRef<string[]>([]);
  while (ref.current.length < count) ref.current.push(`row-${++lastRowId}`);
  if (ref.current.length > count) ref.current = ref.current.slice(0, count);
  return {
    ids: ref.current,
    move: (from, to) => {
      ref.current = moveItem(ref.current, from, to);
    },
    remove: (index) => {
      ref.current = ref.current.filter((_, i) => i !== index);
    },
  };
};

export const moveItem = <T,>(list: T[], from: number, to: number): T[] => {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};
