import React from 'react';
import cx from 'classnames';

import Textarea from '@/_ui/Textarea';

import usePopover from '@/_hooks/use-popover';

const Mentions = ({ value, setValue, placeholder }) => {
  const [open, trigger, content, setOpen] = usePopover(false);
  const handleChange = (e) => {
    e.stopPropagation();
    if (e.target.value.includes('@')) {
      setOpen(true);
    }
    setValue(e.target.value);
  };

  let conditionalProps = {};

  if (open) {
    conditionalProps = { ...trigger };
  }
  return (
    <>
      <Textarea
        {...conditionalProps}
        value={value}
        onChange={handleChange}
        rows="1"
        className="w-full form-control"
        placeholder={placeholder}
      />
      <div
        {...content}
        className={cx('card popover mentions-popover', {
          show: open,
          hide: !open,
        })}
      >
        <div className="list-group list-group-flush list-group-hoverable">
          <div className="list-group-item">
            <div className="row align-items-center">
              <div className="col-auto">
                <a href="#">
                  <span className="avatar">JL</span>
                </a>
              </div>
              <div className="col text-truncate">
                <a href="#" className="text-body d-block">
                  Jeffie Lewzey
                </a>
                <small className="d-block text-muted text-truncate mt-n1">
                  justify-content:between ⇒ justify-content:space-between (#29734)
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Mentions;
