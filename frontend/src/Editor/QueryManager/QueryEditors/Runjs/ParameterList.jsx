import React, { useEffect, useRef, useState } from 'react';
import ParameterDetails, { PillButton } from './ParameterDetails';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import ParameterForm from './ParameterForm';

const ParameterList = ({
  parameters,
  handleAddParameter,
  handleParameterChange,
  handleParameterRemove,
  currentState,
  darkMode,
}) => {
  const [showMore, setShowMore] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState();
  const [formattedParameters, setFormattedParameters] = useState([]);
  const containerRef = useRef(null);
  const containerWidth = containerRef.current?.offsetWidth;

  useEffect(() => {
    let totalWidth = 0;
    const formattedParams = containerWidth
      ? parameters.map((param, index) => {
          const boxWidth = Math.min((param?.name || '').length * 6 + 63 + 8, 178);
          totalWidth += boxWidth;
          return {
            ...param,
            isVisible: totalWidth <= containerWidth - 57 - 125 - 57,
            index,
          };
        })
      : [];
    setFormattedParameters(formattedParams);
    if (formattedParams.every((param) => param.isVisible)) {
      setShowMore(false);
    }
  }, [JSON.stringify(parameters), containerWidth]);

  const handleClickOutside = (event) => {
    if (showMore && event.target.closest('#parameter-more-popover') === null) {
      setShowMore(false);
    }
  };

  useEffect(() => {
    if (showMore) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMore]);

  return (
    <div className="card-header" ref={containerRef}>
      Parameters
      {formattedParameters
        .filter((param) => param.isVisible)
        .map((parameter) => {
          return (
            <ParameterDetails
              isEdit
              key={parameter.name}
              onSubmit={(param) => handleParameterChange(parameter.index, param)}
              onRemove={() => handleParameterRemove(parameter.index)}
              name={parameter.name}
              otherParams={formattedParameters.filter((p) => p.name !== parameter.name)}
              defaultValue={parameter.defaultValue}
              currentState={currentState}
              darkMode={darkMode}
            />
          );
        })}
      <OverlayTrigger
        trigger={'click'}
        placement={'bottom-end'}
        rootClose={true}
        show={showMore}
        overlay={
          <Popover
            id="parameter-more-popover"
            className={`query-manager-sort-filter-popup  ${darkMode && 'popover-dark-themed theme-dark dark-theme'}`}
            style={{ minWidth: '268px', maxWidth: 'fit-content' }}
          >
            {selectedParameter ? (
              <ParameterForm
                darkMode={darkMode}
                isEdit={true}
                name={selectedParameter.name}
                defaultValue={selectedParameter.defaultValue}
                onSubmit={(param) => {
                  handleParameterChange(selectedParameter.index, param);
                  setSelectedParameter();
                }}
                currentState={currentState}
                showModal={showMore}
              />
            ) : (
              <Popover.Body
                key={'1'}
                bsPrefix="popover-body"
                className={`ps-1 pe-1 me-2 py-2 query-manager`}
                style={{ maxWidth: '500px' }}
              >
                {formattedParameters
                  .filter((param) => !param.isVisible)
                  .map((parameter) => {
                    return (
                      <span key={parameter.name}>
                        <PillButton
                          name={parameter.name}
                          onRemove={() => handleParameterRemove(parameter.index)}
                          marginBottom
                          onClick={() => setSelectedParameter(parameter)}
                        />
                      </span>
                    );
                  })}
              </Popover.Body>
            )}
          </Popover>
        }
      >
        <span>
          {formattedParameters.some((param) => !param.isVisible) && (
            <PillButton name="More" onClick={() => setShowMore(true)} />
          )}
        </span>
      </OverlayTrigger>
      <ParameterDetails onSubmit={handleAddParameter} currentState={currentState} darkMode={darkMode} />
    </div>
  );
};

export default ParameterList;
