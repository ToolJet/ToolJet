import React from 'react';
import { Link } from 'react-router-dom';
import useRouter from '@/_hooks/use-router';
import Header from '../Header';

function Layout({ children }) {
  const router = useRouter();

  return (
    <div className="row">
      <div className="col-auto p-0">
        <aside className="left-sidebar p-3 h-100" style={{ borderRight: '1px solid #eee' }}>
          <div className="application-brand">logo</div>
          <div>
            <ul className="sidebar-inner nav nav-vertical">
              <li className="text-center mt-3 cursor-pointer">
                <Link to="/">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="32" height="32" rx="4" fill={router.pathname === '/' ? '#E6EDFE' : 'none'} />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M7 9C7 7.89543 7.89543 7 9 7H13C14.1046 7 15 7.89543 15 9V13C15 14.1046 14.1046 15 13 15H9C7.89543 15 7 14.1046 7 13V9ZM13 9H9V13H13V9ZM21 7C21.5523 7 22 7.44772 22 8V10H24C24.5523 10 25 10.4477 25 11C25 11.5523 24.5523 12 24 12H22V14C22 14.5523 21.5523 15 21 15C20.4477 15 20 14.5523 20 14V12H18C17.4477 12 17 11.5523 17 11C17 10.4477 17.4477 10 18 10H20V8C20 7.44772 20.4477 7 21 7ZM7 19C7 17.8954 7.89543 17 9 17H13C14.1046 17 15 17.8954 15 19V23C15 24.1046 14.1046 25 13 25H9C7.89543 25 7 24.1046 7 23V19ZM13 19H9V23H13V19ZM17 19C17 17.8954 17.8954 17 19 17H23C24.1046 17 25 17.8954 25 19V23C25 24.1046 24.1046 25 23 25H19C17.8954 25 17 24.1046 17 23V19ZM19 19V23H23V19H19Z"
                      fill={router.pathname === '/' ? '#3E63DD' : '#C1C8CD'}
                    />
                  </svg>
                </Link>
              </li>
              <li className="ext-center mt-3 cursor-pointer">
                <Link to="/tooljet-database">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect
                      width="32"
                      height="32"
                      rx="4"
                      fill={router.pathname === '/tooljet-database' ? '#E6EDFE' : 'none'}
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M7 10C7 9.44772 7.44772 9 8 9H13.5C14.0523 9 14.5 9.44772 14.5 10C14.5 10.5523 14.0523 11 13.5 11H8C7.44772 11 7 10.5523 7 10ZM17.5 10C17.5 9.44772 17.9477 9 18.5 9H24C24.5523 9 25 9.44772 25 10C25 10.5523 24.5523 11 24 11H18.5C17.9477 11 17.5 10.5523 17.5 10ZM7 14C7 13.4477 7.44772 13 8 13H13.5C14.0523 13 14.5 13.4477 14.5 14C14.5 14.5523 14.0523 15 13.5 15H8C7.44772 15 7 14.5523 7 14ZM17.5 14C17.5 13.4477 17.9477 13 18.5 13H24C24.5523 13 25 13.4477 25 14C25 14.5523 24.5523 15 24 15H18.5C17.9477 15 17.5 14.5523 17.5 14ZM7 18C7 17.4477 7.44772 17 8 17H13.5C14.0523 17 14.5 17.4477 14.5 18C14.5 18.5523 14.0523 19 13.5 19H8C7.44772 19 7 18.5523 7 18ZM17.5 18C17.5 17.4477 17.9477 17 18.5 17H24C24.5523 17 25 17.4477 25 18C25 18.5523 24.5523 19 24 19H18.5C17.9477 19 17.5 18.5523 17.5 18ZM7 22C7 21.4477 7.44772 21 8 21H13.5C14.0523 21 14.5 21.4477 14.5 22C14.5 22.5523 14.0523 23 13.5 23H8C7.44772 23 7 22.5523 7 22ZM17.5 22C17.5 21.4477 17.9477 21 18.5 21H24C24.5523 21 25 21.4477 25 22C25 22.5523 24.5523 23 24 23H18.5C17.9477 23 17.5 22.5523 17.5 22Z"
                      fill={router.pathname === '/tooljet-database' ? '#3E63DD' : '#C1C8CD'}
                    />
                  </svg>
                </Link>
              </li>
              <li className="text-center mt-3 cursor-pointer">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill={router.pathname === '/notifications' ? '#E6EDFE' : 'none'}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13 21V22C13 22.7956 13.3161 23.5587 13.8787 24.1213C14.4413 24.6839 15.2044 25 16 25C16.7956 25 17.5587 24.6839 18.1213 24.1213C18.6839 23.5587 19 22.7956 19 22V21M14 9C14 8.46957 14.2107 7.96086 14.5858 7.58579C14.9609 7.21071 15.4696 7 16 7C16.5304 7 17.0391 7.21071 17.4142 7.58579C17.7893 7.96086 18 8.46957 18 9C19.1484 9.54303 20.1274 10.3883 20.8321 11.4453C21.5367 12.5023 21.9404 13.7311 22 15V18C22.0753 18.6217 22.2954 19.2171 22.6428 19.7381C22.9902 20.2592 23.4551 20.6914 24 21H8C8.54494 20.6914 9.00981 20.2592 9.35719 19.7381C9.70457 19.2171 9.92474 18.6217 10 18V15C10.0596 13.7311 10.4633 12.5023 11.1679 11.4453C11.8726 10.3883 12.8516 9.54303 14 9Z"
                    stroke="#C1C8CD"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </li>
            </ul>
          </div>
        </aside>
      </div>
      <div className="col p-0">
        <Header />
        {children}
      </div>
    </div>
  );
}

export default Layout;
