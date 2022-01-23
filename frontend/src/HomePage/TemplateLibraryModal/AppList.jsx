import React, { useState } from 'react';
import { ListGroup, InputGroup, FormControl } from 'react-bootstrap';

export default function AppList(props) {
  const { apps, selectedApp, selectApp } = props;
  const [searchText, searchFor] = useState('');
  const filteredApps = apps.filter((app) => app.name.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <div className="template-list">
      <InputGroup className="template-search-box">
        <FormControl placeholder="Search" aria-label="search" onChange={(event) => searchFor(event.target.value)} />
      </InputGroup>
      <ListGroup className="mt-2 template-app-list">
        {filteredApps.length === 0 ? (
          <ListGroup.Item variant="light" className="no-results-item">
            No results
          </ListGroup.Item>
        ) : (
          <div></div>
        )}
        {filteredApps.map((app) => (
          <ListGroup.Item key={app.id} action active={app.id === selectedApp?.id} onClick={() => selectApp(app)}>
            {app.name}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
}
