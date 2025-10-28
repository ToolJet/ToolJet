import React from 'react';
import { getPrivateRoute } from '@/_helpers/routes';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import GetStartedCard from './GetStartedCard';
import withAdminOrBuilderOnly from './withAdminOrBuilderOnly';
import HomePagePromptSection from './HomePagePromptSection';
import { authenticationService } from '@/_services';
import toast from 'react-hot-toast';

const WIDGET_TYPES = {
  APP: {
    title: 'Create a blank app',
    description: 'Build custom apps that make internal processes efficient',
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
    description: 'Automate repetitive tasks to streamline business process',
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

function DividerWithText() {
  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-w-full">
      <div className="tw-min-w-0 tw-grow tw-border-solid tw-flex-1 tw-border-0 tw-border-t tw-border-border-weak tw-mr-4" />
      <p
        className="tw-flex tw-items-center tw-font-body-default tw-text-text-placeholder tw-m-0"
        data-cy="divider-text"
      >
        OR START WITH
      </p>
      <div className="tw-min-w-0 tw-grow tw-border-solid tw-flex-1 tw-border-0 tw-border-t tw-border-border-weak tw-ml-4" />
    </div>
  );
}

function WidgetIcon({ type }) {
  const { icon, iconColor } = WIDGET_TYPES[type];
  return (
    <SolidIcon
      name={icon}
      className="tw-size-5 tw-shrink-0"
      fill={iconColor}
      data-name={icon}
    />
  );
}

function ContentBlock({ title, description, descriptionClassName = '', titleClassName = '', ...props }) {
  return (
    <article
      className="tw-box-border tw-content-stretch tw-flex tw-flex-col tw-items-start tw-justify-start tw-leading-[0] tw-not-italic tw-p-0 tw-relative tw-text-[12px] tw-text-left tw-w-full"
      {...props}
    >
      <p
        className={`tw-block tw-text-text-default tw-font-title-large tw-whitespace-pre tw-m-0 tw-mb-0.5 ${titleClassName}`} data-cy="widget-card-title"
      >
        {title}
      </p>
      <p
        className={`tw-block tw-font-body-default tw-text-text-placeholder tw-m-0 tw-mb-0.5 ${descriptionClassName}`} data-cy="widget-card-description"
      >
        {description}
      </p>
    </article>
  );
}

function GetStartedWidget({ type, to, onClick}) {
  const { title, description } = WIDGET_TYPES[type];
  return (
    <GetStartedCard to={to} onClick={onClick} data-cy={`getstarted-${type.toLowerCase()}-widget`}>
      <WidgetIcon type={type} />
      <ContentBlock
        title={title}
        description={description}
        descriptionClassName={type === 'WORKFLOW' ? 'tw-whitespace-pre-wrap' : ''}
      />
    </GetStartedCard>
  );
}

const handleWorkflowClick = (e) => {
  const currentSession = authenticationService.currentSessionValue;
  const { user_permissions, workflow_group_permissions, super_admin, admin } = currentSession;
  const canCreateWorkflow = admin || user_permissions?.workflow_create;
  const canUpdateWorkflow = workflow_group_permissions?.is_all_editable;
  const canDeleteWorkflow = user_permissions?.workflow_delete || admin;

  if (
    !super_admin &&
    !admin &&
    !canCreateWorkflow &&
    !canUpdateWorkflow &&
    !canDeleteWorkflow &&
    !workflow_group_permissions?.editable_workflows_id?.length > 0 &&
    !workflow_group_permissions?.executable_workflows_id?.length > 0
  ) {
    toast.error('You do not have permission to view workflows', {
      style: { maxWidth: '500px' },
    });
    e.preventDefault();
    e.stopPropagation();
    return;
  }
};

function GetStartedOptionsRow({ edition, isToolJetCloud }) {
  if (isToolJetCloud || edition === 'cloud') {
    return (
      <div className="tw-flex tw-flex-row tw-gap-4 tw-items-start tw-justify-start tw-w-full">
        <GetStartedWidget
          type="APP"
          to={getPrivateRoute('dashboard')}
        />
        <GetStartedWidget
          type="DATASOURCE"
          to={getPrivateRoute('data_sources')}
        />
        <GetStartedWidget
          type="EXPLORE_TEMPLATES"
          to={`${getPrivateRoute('dashboard')}?fromtemplate=true`}
        />
      </div>
    );
  }

  return (
    <div className="tw-flex tw-flex-row tw-gap-4 tw-items-start tw-justify-start tw-w-full">
      <GetStartedWidget
        type="APP"
        to={getPrivateRoute('dashboard')}
      />
      <GetStartedWidget
        type="DATASOURCE"
        to={getPrivateRoute('data_sources')}
      />
      <GetStartedWidget
        type="WORKFLOW"
        to={getPrivateRoute('workflows')}
        onClick={handleWorkflowClick}
      />
    </div>
  );
}

function GetStartedHome({ edition, isToolJetCloud }) {
  return (
    <div className="tw-box-border tw-content-stretch tw-flex tw-flex-col tw-gap-9 tw-items-center tw-justify-center tw-mx-auto tw-py-6 tw-relative tw-size-full tw-max-w-[896px]">
      <HomePagePromptSection />
      <DividerWithText />
      <GetStartedOptionsRow edition={edition} isToolJetCloud={isToolJetCloud} />
    </div>
  );
}

export default withAdminOrBuilderOnly(GetStartedHome);
