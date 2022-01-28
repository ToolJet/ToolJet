import React from 'react';
import OnBordingCard from './OnBordingCard';

export const BlankPage = function BlankPage({ createApp, handleImportApp, isImportingApp, fileInput }) {
  const getHelpData = [
    {
      title: 'Documentation',
      description: 'Learn in Details',
      icon: 'tutorials',
      link: 'https://docs.tooljet.com/docs',
    },
    {
      title: "Blog's",
      description: 'Learn in Details',
      icon: 'blog',
      link: 'https://blog.tooljet.com/',
    },
    {
      title: 'Tutorials',
      description: 'Master Tooljet',
      icon: 'documents',
      link: 'https://docs.tooljet.com/docs/intro',
    },
  ];
  return (
    <div className="onboarding-page-wrapper">
      <div className="onboarding-header-wrapper">
        <h1 className="onboarding-header">Welcome to Tooljet!</h1>
        <span className="onboarding-confetti">
          <img src="/assets/images/confetti.svg" alt="" />
        </span>
      </div>
      <p className="onboarding-subheader">
        You can get started by creating a new application or by creating an application using a template in ToolJet
        Library.
      </p>
      <hr className="onboarding-seperator" />
      <p className="onbaording-info">To better use, here is some helpful resources to get started:</p>
      <h1 className="onboarding-topics">Get Help</h1>
      <div>
        <div className="onboarding-card-container">
          {getHelpData.map((item, index) => (
            <OnBordingCard key={index} cardData={item} />
          ))}
        </div>
      </div>
      <hr className="onboarding-seperator" />
      <div className="onboarding-app-creation">
        <h1 className="onboarding-topics ">
          Ready to go? <span>Create your App</span>{' '}
        </h1>
        <div className="empty-action">
          <a
            href="https://docs.tooljet.io"
            target="_blank"
            className="btn  mx-1 onboard-import-button"
            rel="noreferrer"
            onChange={handleImportApp}
          >
            <label>
              {isImportingApp && <span className="spinner-border spinner-border-sm me-2 " role="status"></span>}
              Import
              <input type="file" ref={fileInput} style={{ display: 'none' }} />
            </label>
          </a>
          <a onClick={createApp} className="btn btn-primary text-light mx-1">
            Create new app
          </a>
        </div>
      </div>
    </div>
  );
};
