import React from 'react';
import cx from 'classnames';

const AccordionItem = ({ index, title, children }) => {
  const [show, setShow] = React.useState(true);
  return (
    <div className="accordion-item">
      <h2 onClick={() => setShow(!show)} className="accordion-header" id={`heading-${index}`}>
        <button
          className={cx('accordion-button', { collapsed: !show })}
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={`collapse-${index}`}
          aria-expanded="false"
        >
          {title}
        </button>
      </h2>
      <div
        id={`collapse-${index}`}
        className={cx('accordion-collapse collapse', { show })}
        data-bs-parent="#accordion-example"
      >
        <div className="accordion-body">{children}</div>
      </div>
    </div>
  );
};

export default AccordionItem;
