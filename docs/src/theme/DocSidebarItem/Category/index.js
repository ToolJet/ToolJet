import React from 'react';
import Category from '@theme-original/DocSidebarItem/Category';

export default function CategoryWrapper(props) {
  const isSelfHosted = props.item.customProps?.selfHosted === true;

  if (isSelfHosted) {
    const modifiedItem = {
      ...props.item,
      label: (
        <>
          {props.item.label}
          <img
            src="/img/badge-icons/premium.svg"
            alt="Self-hosted"
            className="self-hosted-icon"
          />
        </>
      ),
    };
    return <Category {...props} item={modifiedItem} />;
  }

  return <Category {...props} />;
}
