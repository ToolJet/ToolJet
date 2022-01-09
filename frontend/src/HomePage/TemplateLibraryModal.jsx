import React from 'react';
import { Modal, Button, Container, Row, Col } from 'react-bootstrap';

export default function TemplateLibraryModal(props) {
  return (
    <Modal {...props} className="templateLibraryModal" aria-labelledby="contained-modal-title-vcenter" centered>
      <Modal.Header>
        <Modal.Title>Select template</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container fluid>
          <Row>
            <Col xs={3}>first</Col>
            <Col xs={3}>second</Col>
            <Col xs={6}>third</Col>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
