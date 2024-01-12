import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import ListGroup from 'react-bootstrap/ListGroup';

function SuggestionsList() {
  // Replace this with your actual suggestions array
  const suggestions = [
    {
      hint: 'components.table1.selectedRow',
      type: 'object',
    },
    {
      hint: 'components.table',
      type: 'array',
    },
    {
      hint: 'components.table1.searchtext',
      type: 'string',
    },
  ];

  return (
    <ListGroup>
      {suggestions.map((suggestion, index) => (
        <ListGroup.Item
          action
          key={index}
          as="li"
          className=" suggest-list-item d-flex justify-content-between align-items-start"
        >
          <div className="ms-2 me-auto">
            <div>{suggestion.hint}</div>
          </div>
          <code>{suggestion.type}</code>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}

export default SuggestionsList;
