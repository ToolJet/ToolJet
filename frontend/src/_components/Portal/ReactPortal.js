import React from 'react';
import ReactDOM from 'react-dom';

export function ReactPortal({ children, parent, className }) {
  const el = React.useMemo(() => document.createElement('div'), []);

  React.useEffect(() => {
    const checkPortalExits = document.getElementsByClassName('portal-container');
    if (checkPortalExits.length > 0) {
      checkPortalExits[0].remove();
    }
  }, []);

  React.useEffect(() => {
    const target = parent && parent.appendChild ? parent : document.body;
    const classList = ['portal-container'];
    if (className) className.split(' ').forEach((item) => classList.push(item));
    classList.forEach((item) => el.classList.add(item));
    target.appendChild(el);
    return () => {
      el.remove();
    };
  }, [el, parent, className]);
  return ReactDOM.createPortal(children, el);
}
