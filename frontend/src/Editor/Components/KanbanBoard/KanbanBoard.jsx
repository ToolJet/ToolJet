import React, { Component } from 'react';
// import { DndContext } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import _ from 'lodash';
import { Board } from './Board';
import './styles.scss';
import { useDragLayer } from 'react-dnd';

function DragLayerComponent({ children }) {
  const collectedProps = useDragLayer((monitor) => console.log('monitor', monitor));
  return <div>{children}</div>;
}

let _columnId = 0;
let _cardId = 0;

const initialCards = Array.from({ length: 9 }).map(() => ({
  id: ++_cardId,
  title: `Card ${_cardId}`,
}));

const initialColumns = ['TODO', 'Doing', 'Done'].map((title, i) => ({
  id: _columnId++,
  title,
  cardIds: initialCards.slice(i * 3, i * 3 + 3).map((card) => card.id),
}));

class KanbanBoard extends Component {
  state = {
    cards: initialCards,
    columns: initialColumns,
  };

  addColumn = (_title) => {
    const title = _title.trim();
    if (!title) return;

    const newColumn = {
      id: ++_columnId,
      title,
      cardIds: [],
    };
    this.setState((state) => ({
      columns: [...state.columns, newColumn],
    }));
  };

  addCard = (columnId, _title) => {
    const title = _title.trim();
    if (!title) return;

    const newCard = { id: ++_cardId, title };
    this.setState((state) => ({
      cards: [...state.cards, newCard],
      columns: state.columns.map((column) =>
        column.id === columnId ? { ...column, cardIds: [...column.cardIds, newCard.id] } : column
      ),
    }));
  };

  moveCard = (cardId, destColumnId, index) => {
    this.setState((state) => ({
      columns: state.columns.map((column) => ({
        ...column,
        cardIds: _.flowRight(
          // 2) If this is the destination column, insert the cardId.
          (ids) => (column.id === destColumnId ? [...ids.slice(0, index), cardId, ...ids.slice(index)] : ids),
          // 1) Remove the cardId for all columns
          (ids) => ids.filter((id) => id !== cardId)
        )(column.cardIds),
      })),
    }));
  };

  render() {
    return (
      <>
        <DragLayerComponent>
          <Board
            cards={this.state.cards}
            columns={this.state.columns}
            moveCard={this.moveCard}
            addCard={this.addCard}
            addColumn={this.addColumn}
          />
        </DragLayerComponent>
      </>
    );
  }
}

export default KanbanBoard;
