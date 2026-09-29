import React from 'react';
import { Container, Row, Badge } from 'react-bootstrap';
import { getSvgIcon } from '@/_helpers/appUtils';

export default function TemplateDisplay(props) {
  const { id, name, description, sources } = props?.app ?? {};

  return (
    <div className="template-display">
      <Container fluid className="pt-2">
        <Row style={{ height: '10%' }}>
          <h3 className="title" data-cy={`${String(name).toLowerCase().replace(/\s+/g, '-')}`}>
            {name}
          </h3>
          <p className="description" data-cy="description-text">
            {description}
          </p>
          <span>
            {sources?.map((source) => (
              <Badge
                className="me-2"
                key={source.id}
                bg={props.darkMode ? 'dark' : 'light'}
                style={{
                  backgroundColor: '#D2DDEC',
                  color: 'black',
                  width: 'auto',
                  height: 30,
                  fontWeight: 400,
                  textTransform: 'none',
                }}
              >
                <div className="d-flex py-2">
                  <div
                    className="d-flex flex-rows align-items-center justify-content-center"
                    style={{ backgroundColor: 'white', borderRadius: 20, height: 20, width: 20 }}
                  >
                    {getSvgIcon(source.id, 14, 14)}
                  </div>
                  <div
                    className="d-flex flex-rows align-items-center ms-1 template-source-name"
                    data-cy={`${String(source.name).toLowerCase().replace(/\s+/g, '-')}-template-source-name`}
                  >
                    {source.name}
                  </div>
                </div>
              </Badge>
            ))}
          </span>
        </Row>
        <Row
          className="align-items-center justify-content-center"
          style={{ height: '88%', position: 'relative' }}
          data-cy="template-image"
        >
          {/* TEMP: rendering the same HTML preview for every template while testing */}
          <iframe
            key={id}
            src={`assets/images/templates/advanced-data-visualization.html${props.darkMode ? '?theme=dark' : ''}`}
            className="template-image"
            title={`${name} preview`}
          />
        </Row>
      </Container>
    </div>
  );
}
