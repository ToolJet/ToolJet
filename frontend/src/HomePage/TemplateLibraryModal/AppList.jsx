import React, { useState } from 'react';
import { ListGroup, InputGroup, FormControl } from 'react-bootstrap';

export default function AppList(props) {
  const { apps, selectedApp, selectApp } = props;
  const [searchText, searchFor] = useState('');

  return (
    <div>
      <InputGroup className="mt-2">
        <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
        <FormControl placeholder="Search" aria-label="search" onChange={(event) => searchFor(event.target.value)} />
      </InputGroup>
      <ListGroup className="mt-2 template-app-list">
        {apps
          .filter((app) => app.name.toLowerCase().includes(searchText.toLowerCase()))
          .map((app) => (
            <ListGroup.Item key={app.id} action active={app.id === selectedApp?.id} onClick={() => selectApp(app)}>
              {app.name}
            </ListGroup.Item>
          ))}
      </ListGroup>
    </div>
  );
}
