import React, { useState } from 'react';
import Drawer from '@/_ui/Drawer';
import CreateTableForm from '../Forms/CreateTableForm';
import CreateRowForm from '../Forms/CreateRowForm';
import CreateColumnForm from '../Forms/CreateColumnForm';
import Search from './Search';
import Filter from './Filter';
import Sort from './Sort';

const PageHeader = () => {
  const [isCreateTableDrawerOpen, setIsCreateTableDrawerOpen] = useState(false);
  const [isCreateColumnDrawerOpen, setIsCreateColumnDrawerOpen] = useState(false);
  const [isCreateRowDrawerOpen, setIsCreateRowDrawerOpen] = useState(false);

  return (
    <div className="page-header d-print-none">
      <div className="container-xl">
        <div className="row g-2 align-items-center">
          <div className="col-3">
            <button
              className="btn btn-outline-secondary active w-100"
              type="button"
              onClick={() => setIsCreateTableDrawerOpen(!isCreateTableDrawerOpen)}
            >
              Create new table +
            </button>
            <Search />
          </div>
          <div className="col-9">
            <div className="card">
              <div className="card-header">Elementary</div>
              <div className="card-body">
                <div className="row g-2 align-items-center">
                  <div className="col">
                    <button
                      onClick={() => setIsCreateColumnDrawerOpen(!isCreateColumnDrawerOpen)}
                      className="btn no-border"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M9.00001 11.9833C8.81592 11.9833 8.66668 11.8341 8.66668 11.65V10.3167C8.66668 10.1326 8.51744 9.98335 8.33334 9.98335H7.00001C6.81592 9.98335 6.66668 9.83411 6.66668 9.65002V8.98335C6.66668 8.79925 6.81592 8.65002 7.00001 8.65002H8.33334C8.51744 8.65002 8.66668 8.50078 8.66668 8.31668V6.98335C8.66668 6.79925 8.81592 6.65002 9.00001 6.65002H9.66668C9.85077 6.65002 10 6.79925 10 6.98335V8.31668C10 8.50078 10.1493 8.65002 10.3333 8.65002H11.6667C11.8508 8.65002 12 8.79925 12 8.98335V9.65002C12 9.83411 11.8508 9.98335 11.6667 9.98335H10.3333C10.1493 9.98335 10 10.1326 10 10.3167V11.65C10 11.8341 9.85077 11.9833 9.66668 11.9833H9.00001ZM0.783346 10.4833C0.599251 10.4833 0.450012 10.3341 0.450012 10.15V9.50002C0.450012 9.31592 0.599251 9.16668 0.783346 9.16668H5.02894C5.20134 9.16668 5.34532 9.29815 5.36076 9.46986C5.37195 9.59434 5.38226 9.70994 5.39168 9.81668C5.39764 9.88427 5.40823 9.95612 5.42344 10.0322C5.46837 10.2571 5.31049 10.4833 5.08115 10.4833H0.783346ZM0.783345 7.50002C0.599251 7.50002 0.450012 7.35078 0.450012 7.16668V6.51668C0.450012 6.33259 0.599251 6.18335 0.783346 6.18335H6.00374C6.26758 6.18335 6.40581 6.56209 6.25001 6.77502C6.12464 6.94636 6.01184 7.12557 5.91161 7.31264C5.85099 7.42579 5.73497 7.50002 5.60661 7.50002H0.783345ZM0.783346 4.50002C0.599251 4.50002 0.450012 4.35078 0.450012 4.16668V3.51668C0.450012 3.33259 0.599251 3.18335 0.783345 3.18335H10.55C10.7341 3.18335 10.8833 3.33259 10.8833 3.51668V4.16668C10.8833 4.35078 10.7341 4.50002 10.55 4.50002H0.783346ZM0.783346 1.50002C0.599251 1.50002 0.450012 1.35078 0.450012 1.16668V0.516683C0.450012 0.332588 0.599251 0.18335 0.783345 0.18335H10.55C10.7341 0.18335 10.8833 0.332588 10.8833 0.516683V1.16668C10.8833 1.35078 10.7341 1.50002 10.55 1.50002H0.783346Z"
                          fill="#5F81FF"
                        />
                      </svg>
                      &nbsp;Add new column
                    </button>
                    <Filter />
                    <Sort />
                  </div>
                  <div className="col-12 col-md-auto ms-auto d-print-none">
                    <button
                      onClick={() => setIsCreateRowDrawerOpen(!isCreateRowDrawerOpen)}
                      className="btn btn-primary"
                    >
                      Add new row&nbsp;
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M8.99995 11.9833C8.81586 11.9833 8.66662 11.8341 8.66662 11.65V10.3167C8.66662 10.1326 8.51738 9.98335 8.33328 9.98335H6.99995C6.81586 9.98335 6.66662 9.83411 6.66662 9.65002V8.98335C6.66662 8.79925 6.81586 8.65002 6.99995 8.65002H8.33328C8.51738 8.65002 8.66662 8.50078 8.66662 8.31668V6.98335C8.66662 6.79925 8.81586 6.65002 8.99995 6.65002H9.66662C9.85071 6.65002 9.99995 6.79925 9.99995 6.98335V8.31668C9.99995 8.50078 10.1492 8.65002 10.3333 8.65002H11.6666C11.8507 8.65002 12 8.79925 12 8.98335V9.65002C12 9.83411 11.8507 9.98335 11.6666 9.98335H10.3333C10.1492 9.98335 9.99995 10.1326 9.99995 10.3167V11.65C9.99995 11.8341 9.85071 11.9833 9.66662 11.9833H8.99995ZM0.783285 10.4833C0.59919 10.4833 0.449951 10.3341 0.449951 10.15V9.50002C0.449951 9.31592 0.59919 9.16668 0.783284 9.16668H5.02888C5.20128 9.16668 5.34526 9.29815 5.3607 9.46986C5.37189 9.59434 5.3822 9.70994 5.39162 9.81668C5.39758 9.88427 5.40817 9.95612 5.42338 10.0322C5.46831 10.2571 5.31043 10.4833 5.08109 10.4833H0.783285ZM0.783284 7.50002C0.59919 7.50002 0.449951 7.35078 0.449951 7.16668V6.51668C0.449951 6.33259 0.59919 6.18335 0.783284 6.18335H6.00368C6.26752 6.18335 6.40575 6.56209 6.24995 6.77502C6.12458 6.94636 6.01177 7.12557 5.91155 7.31264C5.85093 7.42579 5.73491 7.50002 5.60654 7.50002H0.783284ZM0.783285 4.50002C0.59919 4.50002 0.449951 4.35078 0.449951 4.16668V3.51668C0.449951 3.33259 0.59919 3.18335 0.783284 3.18335H10.55C10.734 3.18335 10.8833 3.33259 10.8833 3.51668V4.16668C10.8833 4.35078 10.734 4.50002 10.55 4.50002H0.783285ZM0.783285 1.50002C0.59919 1.50002 0.449951 1.35078 0.449951 1.16668V0.516683C0.449951 0.332588 0.59919 0.18335 0.783284 0.18335H10.55C10.734 0.18335 10.8833 0.332588 10.8833 0.516683V1.16668C10.8833 1.35078 10.734 1.50002 10.55 1.50002H0.783285Z"
                          fill="white"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Drawer isOpen={isCreateTableDrawerOpen} onClose={() => setIsCreateTableDrawerOpen(false)} position="right">
        <CreateTableForm />
      </Drawer>
      <Drawer isOpen={isCreateColumnDrawerOpen} onClose={() => setIsCreateColumnDrawerOpen(false)} position="right">
        <CreateColumnForm />
      </Drawer>
      <Drawer isOpen={isCreateRowDrawerOpen} onClose={() => setIsCreateRowDrawerOpen(false)} position="right">
        <CreateRowForm />
      </Drawer>
    </div>
  );
};

export default PageHeader;
