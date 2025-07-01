import React, { useCallback } from 'react';
import { getPrivateRoute } from '@/_helpers/routes';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import AiBuilder from './AiBuilder';
import GetStartedCard from './GetStartedCard';
import withAdminOrBuilderOnly from './withAdminOrBuilderOnly';
import toast from 'react-hot-toast';
import { appsService } from '@/_services';
import { v4 as uuidv4 } from 'uuid';
import { sample } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { getWorkspaceId } from '@/_helpers/utils';
import iconConfig from '../HomePage/Configs/AppIcon.json';

const { iconList, defaultIcon } = iconConfig;

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
  EXPLORE_TEMPLATES: {
    title: 'Explore templates',
    description: 'Get started quickly with ready-to-deploy applications',
    icon: 'corners',
    iconColor: 'var(--icon-danger)',
  },
};

function Hero() {
  const navigate = useNavigate();
  const createApp = useCallback(
    async (appName, _unused, prompt) => {
      try {
        const data = await appsService.createApp({
          icon: sample(iconList) || defaultIcon,
          name: appName,
          type: 'front-end',
          prompt,
        });
        const workspaceId = getWorkspaceId();
        navigate(`/${workspaceId}/apps/${data.id}`);
        toast.success('App created successfully!');
        return true;
      } catch (error) {
        if (error.statusCode === 409) return false;
        toast.error(error?.error || 'Failed to create app');
        throw error;
      }
    },
    [navigate]
  );

  const handleAiBuilderChange = useCallback(
    (value) => {
      if (!value) return;
      if (!value.trim()) {
        return toast.error('Prompt can not be empty');
      }
      createApp(`Untitled App: ${uuidv4()}`, undefined, value);
    },
    [createApp]
  );

  return (
    <div className="tw-relative tw-shrink-0 tw-w-full tw-mb-3" role="banner">
      <div className="tw-box-border tw-content-stretch tw-flex tw-flex-col tw-gap-1 tw-items-center tw-justify-start tw-p-0 tw-relative tw-w-full">
        <SolidIcon name="tooljetai" width={24} height={24} className="" data-name="TJ AI" aria-label="ToolJet AI" />
        <h1 className="tw-font-display-small tw-text-center tw-text-text-default tw-mb-2">
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
      <p className="tw-flex tw-items-center tw-font-body-default tw-text-text-placeholder tw-uppercase tw-m-0">
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
        className={`tw-block tw-text-text-default tw-font-title-large tw-whitespace-pre tw-m-0 tw-mb-0.5 ${titleClassName}`}
      >
        {title}
      </p>
      <p className={`tw-block tw-font-body-default tw-text-text-placeholder tw-m-0 tw-mb-0.5 ${descriptionClassName}`}>
        {description}
      </p>
    </article>
  );
}

function GetStartedWidget({ type, to }) {
  const { title, description } = WIDGET_TYPES[type];
  return (
    <GetStartedCard to={to}>
      <WidgetIcon type={type} />
      <ContentBlock
        title={title}
        description={description}
        descriptionClassName={type === 'WORKFLOW' ? 'tw-whitespace-pre-wrap' : ''}
      />
    </GetStartedCard>
  );
}

function GetStartedOptionsRow({ edition }) {
  if (edition === 'cloud') {
    return (
      <div className="tw-flex tw-flex-row tw-gap-4 tw-items-start tw-justify-start tw-w-full">
        <GetStartedWidget type="APP" to={getPrivateRoute('dashboard')} />
        <GetStartedWidget type="DATASOURCE" to={getPrivateRoute('data_sources')} />
        <GetStartedWidget type="EXPLORE_TEMPLATES" to={`${getPrivateRoute('dashboard')}?fromtemplate=true`} />
      </div>
    );
  }
  return (
    <div className="tw-flex tw-flex-row tw-gap-4 tw-items-start tw-justify-start tw-w-full">
      <GetStartedWidget type="APP" to={getPrivateRoute('dashboard')} />
      <GetStartedWidget type="DATASOURCE" to={getPrivateRoute('data_sources')} />
      <GetStartedWidget type="WORKFLOW" to={getPrivateRoute('workflows')} />
    </div>
  );
}

function GetStartedHome({ edition }) {
  return (
    <div className="tw-box-border tw-content-stretch tw-flex tw-flex-col tw-gap-9 tw-items-center tw-justify-center tw-mx-auto tw-py-6 tw-relative tw-size-full tw-max-w-[896px]">
      <Hero />
      <DividerWithText />
      <GetStartedOptionsRow edition={edition} />
    </div>
  );
}

export default withAdminOrBuilderOnly(GetStartedHome);
