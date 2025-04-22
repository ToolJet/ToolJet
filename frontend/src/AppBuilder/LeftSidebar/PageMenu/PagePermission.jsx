import React, { useEffect, useMemo, useState } from 'react';
import { components } from 'react-select';
import ModalBase from '@/_ui/Modal';
import Select from '@/_ui/Select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import useStore from '@/AppBuilder/_stores/store';
import { appPermissionService } from '@/_services';
import { ConfirmDialog } from '@/_components';
import toast from 'react-hot-toast';

const PERMISSION_TYPES = {
  single: 'SINGLE',
  group: 'GROUP',
  all: 'ALL',
};

export default function PagePermission({ darkMode }) {
  const showPagePermissionModal = useStore((state) => state.showPagePermissionModal);
  const togglePagePermissionModal = useStore((state) => state.togglePagePermissionModal);
  const editingPage = useStore((state) => state.editingPage);
  const appId = useStore((state) => state.app.appId);
  const selectedUserGroups = useStore((state) => state.selectedUserGroups);
  const setSelectedUserGroups = useStore((state) => state.setSelectedUserGroups);
  const selectedUsers = useStore((state) => state.selectedUsers);
  const setSelectedUsers = useStore((state) => state.setSelectedUsers);
  const pagePermission = useStore((state) => state.pagePermission);
  const setPagePermission = useStore((state) => state.setPagePermission);

  const [pagePermissionType, setPagePermissionType] = useState('all');
  const [showUserGroupSelect, toggleUserGroupSelect] = useState(false);
  const [showUsersSelect, toggleUsersSelect] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  console.log({ editingPage, showUserGroupSelect });

  useEffect(() => {
    if (!editingPage?.id && !showPagePermissionModal) return;
    const fetchPagePermission = () => {
      appPermissionService.getPagePermission(appId, editingPage?.id).then((data) => {
        if (data) {
          if (data[0]) {
            setPagePermissionType(data[0]?.type?.toLowerCase());
            setPagePermission(data);
            toggleUserGroupSelect(true);
            data?.length &&
              setSelectedUserGroups(
                data[0]?.users?.map((user) => ({
                  label: user?.permissionGroup?.name,
                  value: user?.permissionGroup?.id,
                }))
              );
          }
        }
      });
    };
    fetchPagePermission();
  }, [appId, editingPage, setPagePermission, setSelectedUserGroups, showPagePermissionModal]);

  const permissionTypeOptions = useMemo(
    () => [
      {
        label: 'All users with access to the app',
        value: 'all',
        icon: 'globe',
      },
      {
        label: 'Users',
        value: 'single',
        icon: 'user',
      },
      {
        label: 'User groups',
        value: 'group',
        icon: 'usergroup',
      },
    ],
    []
  );
  console.log({ pagePermission });
  const handlePermissionTypeChange = (value) => {
    console.log({ value });
    switch (value) {
      case 'group': {
        toggleUserGroupSelect(true);
        toggleUsersSelect(false);
        setPagePermissionType('group');
        break;
      }
      case 'single': {
        toggleUsersSelect(true);
        toggleUserGroupSelect(false);
        setPagePermissionType('single');
        break;
      }
      case 'all': {
        toggleUsersSelect(false);
        toggleUserGroupSelect(false);
        setPagePermissionType('all');
      }
    }
  };

  const handlePagePermissionModalClose = () => {
    togglePagePermissionModal(false);
    toggleUserGroupSelect(false);
    toggleUsersSelect(false);
    setPagePermissionType('all');
    setPagePermission(null);
  };

  const createPagePermission = () => {
    const body = {
      pageId: editingPage?.id,
      type: PERMISSION_TYPES[pagePermissionType],
      ...(pagePermissionType === 'group'
        ? { groups: selectedUserGroups.map((group) => group?.value) }
        : { users: selectedUsers.map((user) => user?.value) }),
    };
    setIsLoading(true);
    appPermissionService
      .createPagePermission(appId, editingPage?.id, body)
      .then((data) => {
        console.log({ data });
      })
      .catch(() => {
        toast.error('Permission could not be created. Please try again!');
      })
      .finally(() => {
        setIsLoading(false);
        handlePagePermissionModalClose();
        toast.success('Permission successfully created!');
      });
  };

  const updatePagePermission = () => {
    const body = {
      pageId: editingPage?.id,
      type: PERMISSION_TYPES[pagePermissionType],
      ...(pagePermissionType === 'group'
        ? { groups: selectedUserGroups.map((group) => group?.value) }
        : { users: selectedUsers.map((user) => user?.value) }),
    };
    setIsLoading(true);
    appPermissionService
      .updatePagePermission(appId, editingPage?.id, body)
      .then((data) => {
        console.log({ data });
      })
      .catch(() => {
        toast.error('Permission could not be updated. Please try again!');
      })
      .finally(() => {
        setIsLoading(false);
        handlePagePermissionModalClose();
        toast.success('Permission successfully updated!');
      });
  };

  const deletePagePermission = () => {
    setIsLoading(true);
    appPermissionService
      .deletePagePermission(appId, editingPage?.id)
      .then((data) => {
        console.log({ data });
      })
      .catch(() => {
        toast.error('Permission could not be deleted. Please try again!');
      })
      .finally(() => {
        setIsLoading(false);
        setShowConfirmDelete(false);
        handlePagePermissionModalClose();
        toast.success('Permission successfully deleted!');
      });
  };

  const renderPermissionTypeOptions = ({ label, icon }) => {
    return (
      <div className="row permission-type-select">
        <div className="col-auto">
          <SolidIcon width="20" name={icon} />
        </div>
        <div className="col">
          <span>{label}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <ModalBase
        title={
          <div className="my-3">
            <span className="tj-text-md font-weight-500">Page permission</span>
          </div>
        }
        handleConfirm={!pagePermission ? createPagePermission : updatePagePermission}
        show={showPagePermissionModal}
        isLoading={isLoading}
        handleClose={handlePagePermissionModalClose}
        confirmBtnProps={{
          title: pagePermission ? 'Update' : pagePermissionType === 'all' ? 'Default permission' : 'Create permission',
          disabled: pagePermissionType == 'all' ? true : false,
          tooltipMessage: '',
        }}
        darkMode={darkMode}
        className="page-permissions-modal"
        headerAction={() =>
          pagePermission && (
            <span
              onClick={(e) => {
                togglePagePermissionModal(false);
                setShowConfirmDelete(true);
              }}
            >
              <SolidIcon fill="var(--tomato10)" width="20" name="trash" />
            </span>
          )
        }
      >
        <div className="page-permission">
          <div className="info-container">
            <div className="col-md-1 info-btn">
              <SolidIcon name="informationcircle" fill="#3E63DD" />
            </div>
            <div className="col-md-11">
              <div className="message">
                <p style={{ lineHeight: '18px' }}>
                  Only selected users will be allowed to access this page. Read docs to know more.
                </p>
              </div>
            </div>
          </div>
          <label className="form-label">Type</label>
          <Select
            options={permissionTypeOptions}
            value={pagePermissionType}
            width={'100%'}
            customOption={renderPermissionTypeOptions}
            useMenuPortal={false}
            onChange={handlePermissionTypeChange}
          />
          {showUserGroupSelect && <UserGroupSelect />}
          {showUsersSelect && <UserSelect />}
        </div>
      </ModalBase>
      {showConfirmDelete && (
        <ConfirmDialog
          title={'Delete page permission'}
          show={showConfirmDelete}
          message={
            'Deleting the permission will allow all users with access to the app to view this page. Are you sure you want to continue?'
          }
          confirmButtonLoading={isLoading}
          onConfirm={() => deletePagePermission()}
          onCancel={() => setShowConfirmDelete(false)}
          confirmButtonText={'Delete'}
          darkMode={darkMode}
          confirmButtonIcon={'trash'}
          confirmButtonIconWidth="20"
          confirmButtonIconFill={'var(--slate3)'}
        />
      )}
    </>
  );
}

const UserGroupSelect = () => {
  console.log('rendering');
  const appId = useStore((state) => state.app.appId);
  const editingPage = useStore((state) => state.editingPage);
  const selectedUserGroups = useStore((state) => state.selectedUserGroups);
  const setSelectedUserGroups = useStore((state) => state.setSelectedUserGroups);
  const [userGroups, setUserGroups] = useState([]);
  useEffect(() => {
    const fetchUserGroups = () => {
      appPermissionService.getUsers(appId, 'user-groups').then((data) => {
        console.log({ data });
        if (data?.length) {
          const groups = [];
          data.map((group) => {
            groups.push({ value: group.id, label: group.name });
          });
          setUserGroups(groups);
        }
      });
    };
    fetchUserGroups();
  }, []);

  console.log({ selectedUserGroups, userGroups });

  return (
    <div>
      <label className="form-label mt-3">User groups</label>
      <Select
        isMulti={true}
        options={userGroups}
        value={selectedUserGroups}
        width={'100%'}
        // customOption={renderPermissionTypeOptions}
        useMenuPortal={false}
        //   menuIsOpen={true}
        onChange={(groups) => setSelectedUserGroups(groups)}
      />
    </div>
  );
};

const UserSelect = () => {
  const appId = useStore((state) => state.app.appId);
  const editingPage = useStore((state) => state.editingPage);
  const selectedUsers = useStore((state) => state.selectedUsers);
  const setSelectedUsers = useStore((state) => state.setSelectedUsers);
  const [users, setUsers] = useState([]);
  useEffect(() => {
    const fetchUsers = () => {
      appPermissionService.getUsers(appId, 'users').then((data) => {
        console.log({ data });
        if (data?.length) {
          const users = [];
          data.map((user) => {
            const firstName = user.firstName || '';
            const lastName = user.lastName || '';
            users.push({
              value: user.id,
              label: `${firstName} ${lastName}`.trim(),
              email: user.email,
              initials: `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase(),
            });
          });
          setUsers(users);
        }
      });
    };
    fetchUsers();
  }, []);

  const CustomOption = (props) => {
    const { data, isFocused, isSelected } = props;
    return (
      <components.Option {...props}>
        <div className={`user-select-option ${isFocused ? 'focused' : ''}`}>
          <div className="avatar">{data.initials}</div>
          <div className="user-info">
            <div className="name">{data.label}</div>
            <div className="email">{data.email}</div>
          </div>
        </div>
      </components.Option>
    );
  };

  console.log({ users });

  return (
    <div>
      <label className="form-label mt-3">Users</label>
      <Select
        isMulti={true}
        options={users}
        value={selectedUsers}
        width={'100%'}
        // customOption={renderUserSelectOptions}
        useMenuPortal={false}
        components={{ Option: CustomOption }}
        // menuIsOpen={true}
        onChange={(users) => {
          console.log({ userstemp: users });
          setSelectedUsers(users);
        }}
      />
    </div>
  );
};
