import React from 'react';
import { SearchBoxComponent } from '@/_ui/Search';

const Header = ({ children, darkMode }) => {
  return <div className={`${darkMode && 'dark'} leftsidebar-panel-header overflow-hidden`}>{children}</div>;
};

const PanelHeader = ({ children, settings, title }) => {
  return (
    <div className="panel-header-container row">
      {settings && <div className="cursor-pointer col-auto d-flex px-1">{settings}</div>}
      <div className={`col ${settings && 'px-0'}`}>
        <p className="text-muted m-0 fw-500" data-cy={`label-${String(title).toLowerCase()}`}>
          {title}
        </p>
      </div>
      <div className="col px-1">{children}</div>
    </div>
  );
};

const SearchContainer = ({ onChange, placeholder, placeholderIcon, callBack = null, darkMode }) => {
  return (
    <div className="panel-search-container">
      <SearchBoxComponent
        onChange={onChange}
        callback={callBack}
        placeholder={placeholder}
        placeholderIcon={placeholderIcon}
        customClass={`${darkMode ? 'theme-dark' : ''}`}
      />
    </div>
  );
};

Header.PanelHeader = PanelHeader;
Header.SearchBoxComponent = SearchContainer;

export default Header;
