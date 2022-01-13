import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

export default function TemplateDisplay(props) {
  const { id, name, description } = props?.app ?? {};

  return (
    <div className="template-display">
      <Container fluid className="pt-2">
        <Row style={{ height: '10%' }}>
          <h3 className="title">{name}</h3>
          <p className="description">{description}</p>
        </Row>
        <Row style={{ height: '88%' }}>
          <img className="template-image" src={`/assets/images/templates/${id}.png`} />
        </Row>
      </Container>
    </div>
  );
}
