import React from 'react';
import ReactDOM from 'react-dom';

export function ReactPortal({ children, parent, className, componentName }) {
  // Must attach here, not in the effect below: react-rnd measures itself on mount, and a detached node reads every rect as 0.
  const el = React.useMemo(() => {
    const node = document.createElement('div');
    (parent && parent.appendChild ? parent : document.body).appendChild(node);
    return node;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const target = parent && parent.appendChild ? parent : document.body;
    const classList = ['portal-container', componentName];
    if (className) className.split(' ').forEach((item) => classList.push(item));

    classList.forEach((item) => el.classList.add(item));

    if (el.parentNode !== target) target.appendChild(el);
    return () => {
      el.remove();
    };
  }, [el, parent, className, componentName]);

  return ReactDOM.createPortal(children, el);
}
