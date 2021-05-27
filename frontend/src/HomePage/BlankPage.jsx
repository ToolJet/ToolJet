import React from 'react';
import { SampleApps } from './SampleApps';

export const BlankPage = function BlankPage({
  createApp
}) {
  return (<div>
    <div className="page-wrapper">
      <div className="container-xl">
      </div>
      <div className="page-body">
        <div className="container-xl d-flex flex-column justify-content-center">
          <div className="empty">
            <span>Welcome to ToolJet ! You can get started by creating a new application or by creating an application using a template in ToolJet Library.</span>
            <div className="empty-action">
              <a onClick={createApp} className="btn btn-primary text-light">
                Create a new application
              </a>
              <a href="https://docs.tooljet.io" target="_blank" className="btn btn-outline mx-3">
                Go through tutorial
              </a>
            </div>
          </div>
          <SampleApps></SampleApps>
        </div>
      </div>
    </div>
  </div>)
}
