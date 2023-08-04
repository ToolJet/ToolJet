import React, { useEffect, useRef, useState } from 'react';

export const CardEventPopover = function ({
  show,
  offset,
  kanbanCardWidgetId,
  popoverClosed,
  card,
  updateCardProperty,
  index,
  keyIndex,
}) {
  const parentRef = useRef(null);
  const [showPopover, setShow] = useState(show);
  const [top, setTop] = useState(0);
  const [left, setLeft] = useState(0);

  const [titleInputBoxValue, setTitleInputBoxValue] = useState(card.title ?? '');
  const [descriptionTextAreaValue, setDescriptionTextAreaValue] = useState(card.description ?? '');
  const [titleHovered, setTitleHovered] = useState(false);
  const [descriptionHovered, setDescriptionHovered] = useState(false);
  const [titleEditMode, setTitleEditMode] = useState(false);
  const [descriptionEditMode, setDescriptionEditMode] = useState(false);

  let kanbanBounds;

  const kanbanElement = document.getElementById(kanbanCardWidgetId);

  const handleClickOutside = (event) => {
    if (parentRef.current && !parentRef.current.contains(event.target)) {
      popoverClosed();
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  });

  useEffect(() => {
    setShow(show);
  }, [show]);

  useEffect(() => {
    if (offset?.top && showPopover) {
      const _left = offset.left - kanbanBounds.x + offset.width;
      const _top = ((offset.top - kanbanBounds.y) * 100) / kanbanBounds.height;
      setTop(_top);
      setLeft(_left);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset?.top, showPopover]);

  if (kanbanElement && showPopover) {
    kanbanBounds = kanbanElement.getBoundingClientRect();
  }
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 100,
        width: '300px',
        maxWidth: '300px',
        height: 300,
        top: `${top}%`,
        left,
        display: showPopover ? 'block' : 'none',
      }}
      role="tooltip"
      x-placement="left"
      className={`popover bs-popover-left shadow-lg ${darkMode && 'popover-dark-themed theme-dark'}`}
      ref={parentRef}
      id={`${kanbanCardWidgetId}-popover`}
    >
      {parentRef.current && showPopover && (
        <div
          className="popover-body"
          style={{ padding: 'unset', width: '100%', height: 100, zIndex: 11 }}
        >
          <div className="rows p-2 overflow-auto">
            <div
              className="row overflow-auto"
              onMouseEnter={() => setTitleHovered(true)}
              onMouseLeave={() => setTitleHovered(false)}
            >
              {titleEditMode ? (
                <div>
                  <input
                    type="text"
                    className="form-control"
                    defaultValue={titleInputBoxValue}
                    onChange={(event) => setTitleInputBoxValue(event.target.value)}
                    onBlur={() => {
                      updateCardProperty(keyIndex, index, 'title', titleInputBoxValue);
                      setTitleEditMode(false);
                    }}
                  />
                </div>
              ) : (
                <h3>
                  {card?.title ?? ''}
                  <img
                    src="assets/images/icons/editor/edit.svg"
                    style={{
                      visibility: titleHovered ? 'visible' : 'hidden',
                      height: 15,
                      width: 15,
                      paddingLeft: 1,
                    }}
                    onClick={() => setTitleEditMode(true)}
                  />
                </h3>
              )}
            </div>
            <div
              className="row overflow-auto d-flex align-items-center flex-column"
              onMouseEnter={() => setDescriptionHovered(true)}
              onMouseLeave={() => setDescriptionHovered(false)}
              style={{ maxHeight: 250 }}
            >
              {descriptionEditMode ? (
                <textarea
                  className="form-control"
                  style={{ width: '95%' }}
                  onChange={(event) => setDescriptionTextAreaValue(event.target.value)}
                  onBlur={() => {
                    updateCardProperty(keyIndex, index, 'description', descriptionTextAreaValue);
                    setDescriptionEditMode(false);
                  }}
                  rows={10}
                >
                  {descriptionTextAreaValue}
                </textarea>
              ) : (
                <p>
                  {['', undefined].includes(card.description) ? (
                    <a
                      style={{ color: 'grey' }}
                      onClick={() => setDescriptionEditMode(true)}
                    >
                      Add description
                    </a>
                  ) : (
                    card.description
                  )}
                  <img
                    src="assets/images/icons/editor/edit.svg"
                    style={{
                      visibility: descriptionHovered ? 'visible' : 'hidden',
                      height: 15,
                      width: 15,
                      paddingLeft: 1,
                    }}
                    onClick={() => setDescriptionEditMode(true)}
                  />
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
