import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Card } from './Card';

const Column = ({ state, group, keyIndex, getListStyle, getItemStyle, updateCb, addNewItem, deleteGroup }) => {
  const styles = {
    overflowX: 'hidden',
    overflowY: 'hidden',
    maxHeight: 350,
  };

  const cards = group['cards'];

  return (
    <Droppable key={keyIndex} droppableId={`${keyIndex}`}>
      {(dndProps, dndState) => (
        <div
          className="card text-dark bg-light mb-3 m-2 kanban-column"
          ref={dndProps.innerRef}
          style={getListStyle(dndState.isDraggingOver)}
          {...dndProps.droppableProps}
        >
          <div className="card-header d-flex">
            <div className="flex-grow-1">
              <span className="badge bg-cyan-lt">{group.title}</span>
            </div>
            <div>
              <span className="cursor-pointer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon-tabler icon-tabler-dots-vertical"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="#2c3e50"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                  <circle cx="12" cy="5" r="1" />
                </svg>
              </span>

              <img
                onClick={(e) => {
                  e.stopPropagation();
                  deleteGroup(state, keyIndex);
                }}
                className="mx-1 cursor-pointer"
                src={`/assets/images/icons/trash.svg`}
                width={12}
                height={12}
              />
            </div>
          </div>
          <div style={{ ...styles }} className="card-body">
            {cards?.map((item, index) => (
              <Card
                key={index}
                item={item}
                index={index}
                state={state}
                updateCb={updateCb}
                getItemStyle={getItemStyle}
                keyIndex={keyIndex}
              />
            ))}

            {dndProps.placeholder}
            <button className="btn btn-primary w-100 add-card-btn" onClick={() => addNewItem(state, keyIndex)}>
              add +
            </button>
          </div>
        </div>
      )}
    </Droppable>
  );
};

export default Column;
