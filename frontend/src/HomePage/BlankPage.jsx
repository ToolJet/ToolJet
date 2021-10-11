import React from 'react';
import { SampleApps } from './SampleApps';

export const BlankPage = function BlankPage({ createApp }) {
  return (
    <div>
      <div className="page-wrapper">
        <div className="container-xl"></div>
        <div className="page-body">
          <div className="container-xl d-flex flex-column justify-content-center">
            <div className="empty">
              <div className="empty-img">
                <img src="/assets/images/blank.svg" height="128" alt="" />
              </div>
              <p className="empty-title">
                Welcome to ToolJet ! You can get started by creating a new application or by creating an application
                using a template in ToolJet Library.
              </p>
              <div className="empty-action">
                <a onClick={createApp} className="btn btn-primary text-light">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create your first app
                </a>
                <a
                  href="https://docs.tooljet.io"
                  target="_blank"
                  className="btn btn-primary text-light mx-2"
                  rel="noreferrer"
                >
                  Go through the tutorial
                </a>
              </div>
            </div>

            <SampleApps></SampleApps>
          </div>
        </div>
      </div>
    </div>
  );
};
