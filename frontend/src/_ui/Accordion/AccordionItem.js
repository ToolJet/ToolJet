import React, { useEffect } from 'react';
import cx from 'classnames';

const AccordionItem = ({ open = true, index, title, children }) => {
  const [show, setShow] = React.useState(open);
  const [newChildren, setNewChildren] = React.useState([]);

  useEffect(() => {
    setNewChildren(removeEmptyItems(children));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  function isNotEmpty(item) {
    if (Array.isArray(item)) {
      return item.some(isNotEmpty); // Check if any element in the array is not empty
    } else if (typeof item === 'object') {
      return Object.keys(item).some((key) => isNotEmpty(item[key])); // Check if any key in the object is not empty
    } else {
      return Boolean(item); // Check if the item itself is truthy
    }
  }

  function removeEmptyItems(input) {
    if (Array.isArray(input)) {
      return input.filter(isNotEmpty);
    } else if (typeof input === 'object') {
      return isNotEmpty(input) ? input : null;
    } else {
      return input;
    }
  }
  return (
    <div className="accordion-item">
      <h2 onClick={() => setShow(!show)} className="accordion-header" id={`heading-${index}`}>
        <button
          className={cx('accordion-button', { collapsed: !show })}
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={`collapse-${index}`}
          aria-expanded="false"
          data-cy={`widget-accordion-${title.toLowerCase()}`}
        >
          <span className="text-capitalize">{title}</span>
        </button>
      </h2>
      <div
        id={`collapse-${index}`}
        className={cx('accordion-collapse collapse', { show })}
        data-bs-parent="#accordion-example"
      >
        <div className="accordion-body">{newChildren}</div>
      </div>
    </div>
  );
};

export default AccordionItem;
