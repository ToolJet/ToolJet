import React from 'react';
import { SearchBoxComponent } from '@/_ui/Search';

const Header = ({ children, darkMode }) => {
  return <div className={`${darkMode && 'dark-theme'} leftsidebar-panel-header overflow-hidden`}>{children}</div>;
};

const PanelHeader = ({ children, settings, title, darkMode }) => {
  return (
    <div className={`panel-header-container row ${darkMode && 'dark-theme'}`}>
      {settings && (
        <div className="cursor-pointer col-auto d-flex p-0" data-cy={`page-global-settings`}>
          {settings}
        </div>
      )}
      <div className={`col ${settings && 'px-0'}`}>
        <p className="sidebar-panel-header m-0 fw-500" data-cy={`label-${String(title).toLowerCase()}`}>
          {title}
        </p>
      </div>
      <div className="col">{children}</div>
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
