import React from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import cn from 'classnames';
import _ from 'lodash';

export function Card(props) {
  return _.flowRight(
    props.connectDragSource,
    props.connectDropTarget
  )(
    <div
      className={cn('Card', {
        'Card--dragging': props.isDragging,
        'Card--spacer': props.isSpacer,
      })}
    >
      <div className="Card__title">{props.title}</div>
    </div>
  );
}

export const DraggableCard = _.flowRight([
  DropTarget(
    'Card',
    {
      hover(props, monitor) {
        const { columnId, columnIndex } = props;
        const draggingItem = monitor.getItem();
        if (draggingItem.id !== props.id) {
          props.moveCard(draggingItem.id, columnId, columnIndex);
        }
      },
    },
    (connect) => ({
      connectDropTarget: connect.dropTarget(),
    })
  ),
  DragSource(
    'Card',
    {
      beginDrag(props) {
        return { id: props.id };
      },

      isDragging(props, monitor) {
        return props.id === monitor.getItem().id;
      },
    },
    (connect, monitor) => ({
      connectDragSource: connect.dragSource(),
      isDragging: monitor.isDragging(),
    })
  ),
])(Card);
