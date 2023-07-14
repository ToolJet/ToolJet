import React, { useEffect, useRef, useState } from 'react';
import ArgumentFormPopup, { PillButton } from './ArgumentFormPopup';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import ArgumentFormOverlay from './ArgumentFormOverlay';

const RunjsArgumentList = ({
  args,
  handleAddArgument,
  handleArgumentChange,
  handleArgumentRemove,
  currentState,
  darkMode,
}) => {
  const [showMore, setShowMore] = useState(false);
  const [selectedArg, setSelectedArg] = useState();
  const [formattedArguments, setFormattedArguments] = useState([]);
  const containerRef = useRef(null);
  const containerWidth = containerRef.current?.offsetWidth;

  useEffect(() => {
    let totalWidth = 0;
    const formattedArgs = containerWidth
      ? args.map((arg, index) => {
          const boxWidth = Math.min(arg.name.length * 6 + 63 + 8, 178);
          totalWidth += boxWidth;
          return {
            ...arg,
            isVisible: totalWidth <= containerWidth - 57 - 125 - 57,
            index,
          };
        })
      : [];
    setFormattedArguments(formattedArgs);
    if (formattedArgs.every((arg) => arg.isVisible)) {
      setShowMore(false);
    }
  }, [JSON.stringify(args), containerWidth]);

  const handleClickOutside = (event) => {
    if (showMore && event.target.closest('#argument-more-popover') === null) {
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
      {formattedArguments
        .filter((arg) => arg.isVisible)
        .map((argument) => {
          return (
            <ArgumentFormPopup
              isEdit
              key={argument.name}
              onSubmit={(arg) => handleArgumentChange(argument.index, arg)}
              onRemove={() => handleArgumentRemove(argument.index)}
              name={argument.name}
              defaultValue={argument.defaultValue}
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
            id="argument-more-popover"
            className={`query-manager-sort-filter-popup  ${darkMode && 'popover-dark-themed theme-dark dark-theme'}`}
            style={{ minWidth: '268px', maxWidth: 'fit-content' }}
          >
            {selectedArg ? (
              <ArgumentFormOverlay
                darkMode={darkMode}
                isEdit={true}
                name={selectedArg.name}
                defaultValue={selectedArg.defaultValue}
                onSubmit={(arg) => {
                  handleArgumentChange(selectedArg.index, arg);
                  setSelectedArg();
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
                {formattedArguments
                  .filter((arg) => !arg.isVisible)
                  .map((argument) => {
                    return (
                      <span key={argument.name}>
                        <PillButton
                          name={argument.name}
                          onRemove={() => handleArgumentRemove(argument.index)}
                          marginBottom
                          onClick={() => setSelectedArg(argument)}
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
          {formattedArguments.some((arg) => !arg.isVisible) && (
            <PillButton name="More" onClick={() => setShowMore(true)} />
          )}
        </span>
      </OverlayTrigger>
      <ArgumentFormPopup onSubmit={handleAddArgument} currentState={currentState} darkMode={darkMode} />
    </div>
  );
};

export { RunjsArgumentList };
