import React from 'react';
import { ListGroup } from 'react-bootstrap';

export default function AppList(props) {
  const { apps, selectedApp, selectApp } = props;

  return (
    <div>
      <ListGroup className="mt-2 template-app-list">
        {apps.map((app) => (
          <ListGroup.Item key={app.id} action active={app.id === selectedApp?.id} onClick={() => selectApp(app)}>
            {app.name}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
}
