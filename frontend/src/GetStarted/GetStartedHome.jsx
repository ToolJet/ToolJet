import React, { useCallback } from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import AiBuilder from './AiBuilder';
import GetStartedCard from './GetStartedCard';

// Constants
const WIDGET_TYPES = {
  APP: {
    title: 'Create an application',
    description: 'Build apps visually with drag-and-drop components, no coding required',
    icon: 'apps',
    iconColor: '#3E90F1',
  },
  DATASOURCE: {
    title: 'Connect to a data source',
    description: 'Link your tools to existing databases, spreadsheets, APIs, and more',
    icon: 'datasource',
    iconColor: 'var(--icon-success)',
  },
  WORKFLOW: {
    title: 'Create a workflow',
    description: 'Automate tasks and connect your apps and data sources with workflows',
    icon: 'workflows',
    iconColor: 'var(--icon-warning)',
  },
};

function Hero() {
  const handleAiBuilderChange = useCallback((value) => {
    try {
      // Handle AI builder value
      if (!value) return;
    } catch (error) {
      console.error('Error in AI builder:', error);
      // Add proper error handling/notification
    }
  }, []);

  return (
    <div className="tw-relative tw-shrink-0 tw-w-full tw-mb-3" role="banner">
      <div className="tw-box-border tw-content-stretch tw-flex tw-flex-col tw-gap-1 tw-items-center tw-justify-start tw-p-0 tw-relative tw-w-full">
        <SolidIcon name="tooljetai" width={24} height={24} className="" data-name="TJ AI" aria-label="ToolJet AI" />
        <h1 className="tw-text-2xl tw-font-medium tw-text-center tw-text-text-default tw-mb-2">
          What do you want to build today?
        </h1>
        <AiBuilder onSubmit={handleAiBuilderChange} />
      </div>
    </div>
  );
}

function DividerWithText() {
  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-w-full">
      <div className="tw-min-w-0 tw-grow tw-border-solid tw-flex-1 tw-border-0 tw-border-t tw-border-border-weak tw-mr-4" />
      <p className="tw-flex tw-items-center tw-text-text-placeholder tw-font-medium tw-text-sm tw-uppercase tw-m-0">
        OR START WITH
      </p>
      <div className="tw-min-w-0 tw-grow tw-border-solid tw-flex-1 tw-border-0 tw-border-t tw-border-border-weak tw-ml-4" />
    </div>
  );
}

function WidgetIcon({ type }) {
  const { icon, iconColor } = WIDGET_TYPES[type];
  return <SolidIcon name={icon} className="tw-size-6 tw-shrink-0" fill={iconColor} data-name={icon} />;
}

function ContentBlock({ title, description, descriptionClassName = '', titleClassName = '', ...props }) {
  return (
    <article
      className="tw-box-border tw-content-stretch tw-flex tw-flex-col tw-items-start tw-justify-start tw-leading-[0] tw-not-italic tw-p-0 tw-relative tw-text-[12px] tw-text-left tw-w-full"
      {...props}
    >
      <p
        className={`tw-block tw-text-text-default tw-leading-[20px] tw-text-[12px] tw-font-medium tw-whitespace-pre tw-m-0 ${titleClassName}`}
      >
        {title}
      </p>
      <p
        className={`tw-block tw-leading-[20px] tw-text-[12px] tw-text-text-placeholder tw-m-0 ${descriptionClassName}`}
      >
        {description}
      </p>
    </article>
  );
}

function GetStartedWidget({ type }) {
  const { title, description } = WIDGET_TYPES[type];
  return (
    <GetStartedCard>
      <WidgetIcon type={type} />
      <ContentBlock
        title={title}
        description={description}
        descriptionClassName={type === 'WORKFLOW' ? 'tw-whitespace-pre-wrap' : ''}
      />
    </GetStartedCard>
  );
}

function GetStartedOptionsRow() {
  return (
    <div className="tw-flex tw-flex-row tw-gap-4 tw-items-start tw-justify-start tw-w-full">
      <GetStartedWidget type="APP" />
      <GetStartedWidget type="DATASOURCE" />
      <GetStartedWidget type="WORKFLOW" />
    </div>
  );
}

export default function GetStartedHome() {
  return (
    <div className="tw-box-border tw-content-stretch tw-flex tw-flex-col tw-gap-9 tw-items-center tw-justify-center tw-mx-auto tw-py-6 tw-relative tw-size-full tw-max-w-[896px]">
      <Hero />
      <DividerWithText />
      <GetStartedOptionsRow />
    </div>
  );
}
