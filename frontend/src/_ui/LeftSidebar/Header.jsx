import React from 'react';
import { SearchBoxComponent } from '@/_ui/Search';

const Header = ({ children, darkMode }) => {
  return <div className={`${darkMode && 'dark'} leftsidebar-panel-header`}>{children}</div>;
};

const PanelHeader = ({ children, title }) => {
  return (
    <div className="panel-header-container row">
      <div className="col-3">
        <p className="text-muted m-0 fw-500">{title}</p>
      </div>
      <div className="col-9 px-1">{children}</div>
    </div>
  );
};

const SearchContainer = ({ onChange, placeholder, placeholderIcon, callBack = null }) => {
  return (
    <div className="panel-search-container">
      <SearchBoxComponent
        onChange={onChange}
        callback={callBack}
        placeholder={placeholder}
        placeholderIcon={placeholderIcon}
      />
    </div>
  );
};

Header.PanelHeader = PanelHeader;
Header.SearchBoxComponent = SearchContainer;

export default Header;
