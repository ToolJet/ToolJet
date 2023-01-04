import React, { useState } from 'react';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import { EditOrganization } from './EditOrganization';
import { CreateOrganization } from './CreateOrganization';
import { useTranslation } from 'react-i18next';

const Menu = (props) => {
  const { t } = useTranslation();

  return (
    <components.Menu {...props}>
      <div>
        <div style={{ padding: '8px 12px' }} onClick={() => props.selectProps.setShowEditOrg(true)}>
          <div className="row cursor-pointer d-flex align-items-center">
            <div className="col-10">{props?.selectProps?.value?.label}</div>
            <div className="col-1">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="28" height="28" rx="6" fill="#F0F4FF" />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M16.7467 8.69582C17.0858 8.35696 17.5456 8.1666 18.025 8.1666C18.5046 8.1666 18.9646 8.35713 19.3037 8.69627C19.6429 9.03541 19.8334 9.49538 19.8334 9.975C19.8334 10.4545 19.643 10.9143 19.304 11.2534C19.3039 11.2535 19.3041 11.2533 19.304 11.2534L18.5667 11.9934C18.5462 12.0236 18.5226 12.0524 18.4958 12.0791C18.4695 12.1054 18.4414 12.1287 18.4118 12.1489L14.4132 16.1617C14.3038 16.2716 14.1551 16.3333 14 16.3333H12.25C11.9278 16.3333 11.6667 16.0722 11.6667 15.75V14C11.6667 13.8449 11.7284 13.6962 11.8383 13.5868L15.8511 9.58823C15.8713 9.55862 15.8946 9.53046 15.9209 9.50419C15.9476 9.4774 15.9764 9.45376 16.0066 9.43327L16.7463 8.69627C16.7464 8.69612 16.7466 8.69597 16.7467 8.69582ZM16.3399 10.7482L12.8333 14.2422V15.1667H13.7578L17.2518 11.6601L16.3399 10.7482ZM18.0753 10.8337L17.1663 9.9247L17.5712 9.52123C17.6916 9.40088 17.8548 9.33327 18.025 9.33327C18.1952 9.33327 18.3584 9.40088 18.4788 9.52123C18.5991 9.64158 18.6667 9.8048 18.6667 9.975C18.6667 10.1452 18.5991 10.3084 18.4788 10.4288L18.0753 10.8337ZM9.26256 11.0126C9.59075 10.6844 10.0359 10.5 10.5 10.5H11.0833C11.4055 10.5 11.6667 10.7612 11.6667 11.0833C11.6667 11.4055 11.4055 11.6667 11.0833 11.6667H10.5C10.3453 11.6667 10.1969 11.7281 10.0875 11.8375C9.97812 11.9469 9.91667 12.0953 9.91667 12.25V17.5C9.91667 17.6547 9.97812 17.8031 10.0875 17.9125C10.1969 18.0219 10.3453 18.0833 10.5 18.0833H15.75C15.9047 18.0833 16.0531 18.0219 16.1625 17.9125C16.2719 17.8031 16.3333 17.6547 16.3333 17.5V16.9167C16.3333 16.5945 16.5945 16.3333 16.9167 16.3333C17.2388 16.3333 17.5 16.5945 17.5 16.9167V17.5C17.5 17.9641 17.3156 18.4092 16.9874 18.7374C16.6592 19.0656 16.2141 19.25 15.75 19.25H10.5C10.0359 19.25 9.59075 19.0656 9.26256 18.7374C8.93437 18.4092 8.75 17.9641 8.75 17.5V12.25C8.75 11.7859 8.93437 11.3408 9.26256 11.0126Z"
                  fill="#3E63DD"
                />
              </svg>
            </div>
          </div>
        </div>
        <hr className="m-0" />
        <div>{props.children}</div>
        <div
          className="cursor-pointer d-flex align-items-center"
          style={{ padding: '8px 12px', color: '#3E63DD' }}
          onClick={props.selectProps.setShowCreateOrg}
        >
          <svg
            className="me-2"
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="6" fill="#F0F4FF" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M17 11C17.4142 11 17.75 11.3358 17.75 11.75V16.25H22.25C22.6642 16.25 23 16.5858 23 17C23 17.4142 22.6642 17.75 22.25 17.75H17.75V22.25C17.75 22.6642 17.4142 23 17 23C16.5858 23 16.25 22.6642 16.25 22.25V17.75H11.75C11.3358 17.75 11 17.4142 11 17C11 16.5858 11.3358 16.25 11.75 16.25H16.25V11.75C16.25 11.3358 16.5858 11 17 11Z"
              fill="#3E63DD"
            />
          </svg>
          <span className="p-1">{t('header.organization.addNewWorkSpace', 'Add new workspace')}</span>
        </div>
      </div>
    </components.Menu>
  );
};

const SingleValue = ({ selectProps, data }) => {
  return (
    <div className="d-inline-flex align-items-center">
      <div>{selectProps.value.name}</div>
    </div>
  );
};

export const CustomSelect = ({ ...props }) => {
  const [showEditOrg, setShowEditOrg] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);

  return (
    <>
      <CreateOrganization showCreateOrg={showCreateOrg} setShowCreateOrg={setShowCreateOrg} />
      <EditOrganization showEditOrg={showEditOrg} setShowEditOrg={setShowEditOrg} />
      <Select
        width={'100%'}
        components={{ Menu, SingleValue }}
        setShowEditOrg={setShowEditOrg}
        setShowCreateOrg={setShowCreateOrg}
        styles={{ border: 0, cursor: 'pointer' }}
        {...props}
      />
    </>
  );
};
