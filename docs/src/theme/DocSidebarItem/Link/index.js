import React from 'react';
import Link from '@theme-original/DocSidebarItem/Link';

export default function LinkWrapper(props) {
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
    return <Link {...props} item={modifiedItem} />;
  }

  return <Link {...props} />;
}
