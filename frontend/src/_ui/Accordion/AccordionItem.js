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
    <div className="accordion-item" onClick={() => setShow((prev) => !prev)}>
      <h2
        className="accordion-header"
        id={`heading-${index}`}
        data-cy={`widget-accordion-${String(title).toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className={cx('accordion-button inspector')}>
          <span
            className="text-capitalize accordion-title-text tw-text-sm tw-text-text-default"
            data-cy={`label-${String(title).toLowerCase().replace(/\s+/g, '-')}`}
          >
            {title}
          </span>

          <div
            data-cy={`${String(title).toLowerCase().replace(/\s+/g, '-')}-collapse-button`}
            type="button"
            data-bs-toggle="collapse"
            data-bs-target={`collapse-${index}`}
            aria-expanded="false"
            className={cx('accordion-item-trigger', { collapsed: !show })}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 10" fill="none">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M1.75248 9.79077C1.45888 9.99505 1.01733 10.0562 0.633728 9.94561C0.250116 9.83505 -1.8595e-08 9.5746 -3.12232e-08 9.2857L-4.0589e-07 0.714319C-4.18519e-07 0.425392 0.250115 0.164965 0.633727 0.0543937C1.01733 -0.0561772 1.45888 0.00496476 1.75248 0.20925L7.54905 4.24239C8.15032 4.6608 8.15032 5.33919 7.54905 5.75761L1.75248 9.79077Z"
                fill="var(--icon-default)"
              />
            </svg>
          </div>
        </div>
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
