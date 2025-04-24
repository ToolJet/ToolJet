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
  const setEditingPage = useStore((state) => state.setEditingPage);
  const appId = useStore((state) => state.app.appId);
  const selectedUserGroups = useStore((state) => state.selectedUserGroups);
  const setSelectedUserGroups = useStore((state) => state.setSelectedUserGroups);
  const selectedUsers = useStore((state) => state.selectedUsers);
  const setSelectedUsers = useStore((state) => state.setSelectedUsers);
  const pagePermission = useStore((state) => state.pagePermission);
  const setPagePermission = useStore((state) => state.setPagePermission);
  const updatePageWithPermissions = useStore((state) => state.updatePageWithPermissions);

  const [pagePermissionType, setPagePermissionType] = useState('all');
  const [showUserGroupSelect, toggleUserGroupSelect] = useState(false);
  const [showUsersSelect, toggleUsersSelect] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageToDelete, setPageToDelete] = useState(null);

  useEffect(() => {
    if (!editingPage?.id && !showPagePermissionModal) return;
    const fetchPagePermission = () => {
      appPermissionService.getPagePermission(appId, editingPage?.id).then((data) => {
        if (data) {
          if (data[0] && data[0]?.type === PERMISSION_TYPES.group) {
            setPagePermissionType(data[0]?.type?.toLowerCase());
            setPagePermission(data);
            toggleUserGroupSelect(true);
            data?.length &&
              setSelectedUserGroups(
                data[0]?.groups?.map((user) => ({
                  label: user?.permissionGroup?.name,
                  value: user?.permissionGroup?.id,
                  count: user?.permissionGroup?.count,
                }))
              );
          } else if (data[0] && data[0]?.type === PERMISSION_TYPES.single) {
            setPagePermissionType(data[0]?.type?.toLowerCase());
            setPagePermission(data);
            toggleUsersSelect(true);
            data?.length &&
              setSelectedUsers(
                data[0]?.users?.map(({ user }) => {
                  const firstName = user.firstName || '';
                  const lastName = user.lastName || '';
                  return {
                    value: user.id,
                    label: `${firstName} ${lastName}`.trim(),
                    email: user.email,
                    initials: `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase(),
                  };
                })
              );
          }
        }
      });
    };
    fetchPagePermission();
  }, [editingPage]);

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
  const handlePermissionTypeChange = (value) => {
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
    setEditingPage(null);
    setSelectedUsers([]);
    setSelectedUserGroups([]);
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
        toast.success('Permission successfully created!');
        updatePageWithPermissions(editingPage?.id, data);
      })
      .catch(() => {
        toast.error('Permission could not be created. Please try again!');
      })
      .finally(() => {
        setIsLoading(false);
        handlePagePermissionModalClose();
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
        toast.success('Permission successfully updated!');
        updatePageWithPermissions(editingPage?.id, data);
      })
      .catch(() => {
        toast.error('Permission could not be updated. Please try again!');
      })
      .finally(() => {
        setIsLoading(false);
        handlePagePermissionModalClose();
      });
  };

  const deletePagePermission = () => {
    setIsLoading(true);
    appPermissionService
      .deletePagePermission(appId, pageToDelete)
      .then((data) => {
        toast.success('Permission successfully deleted!');
        updatePageWithPermissions(pageToDelete, []);
      })
      .catch(() => {
        toast.error('Permission could not be deleted. Please try again!');
      })
      .finally(() => {
        setIsLoading(false);
        setShowConfirmDelete(false);
        setPageToDelete(null);
        handlePagePermissionModalClose();
      });
  };

  const renderPermissionTypeOptions = ({ label, icon }) => {
    return (
      <div className="row permission-type-select" style={{ padding: '0px 8px' }}>
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
                setPageToDelete(editingPage?.id);
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
  const appId = useStore((state) => state.app.appId);
  const selectedUserGroups = useStore((state) => state.selectedUserGroups);
  const setSelectedUserGroups = useStore((state) => state.setSelectedUserGroups);
  const [userGroups, setUserGroups] = useState([]);
  useEffect(() => {
    const fetchUserGroups = () => {
      appPermissionService.getUsers(appId, 'user-groups').then((data) => {
        if (data?.length) {
          const groups = [];
          data.map((group) => {
            groups.push({ value: group.id, label: group.name, count: group.count });
          });
          setUserGroups(groups);
        }
      });
    };
    fetchUserGroups();
  }, []);

  const CustomOption = (props) => {
    const { data, isFocused, isSelected } = props;

    return (
      <components.Option {...props}>
        <div className={`user-select-option ${isFocused ? 'focused' : ''}`}>
          <input
            style={{ width: '1.2rem', height: '1.2rem', borderRadius: '6px !important' }}
            type={'checkbox'}
            className="form-check-input"
            checked={isSelected}
          />
          <div className="group-info">
            <div className="name">{data.label}</div>
            <div className="count">{data.count} users</div>
          </div>
        </div>
      </components.Option>
    );
  };

  return (
    <div>
      <label className="form-label mt-3">User groups</label>
      <Select
        isMulti={true}
        options={userGroups}
        value={selectedUserGroups}
        width={'100%'}
        closeMenuOnSelect={false}
        components={{ Option: CustomOption, MenuList: CustomMenuList }}
        useMenuPortal={false}
        hideSelectedOptions={false}
        onChange={(groups) => setSelectedUserGroups(groups)}
        info="Only user groups with access to this application can be selected"
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
          <input
            style={{ width: '1.2rem', height: '1.2rem', borderRadius: '6px !important' }}
            type={'checkbox'}
            className="form-check-input"
            checked={isSelected}
          />
          <div className="avatar">{data.initials}</div>
          <div className="user-info">
            <div className="name">{data.label}</div>
            <div className="email">{data.email}</div>
          </div>
        </div>
      </components.Option>
    );
  };

  const selectStyles = {
    option: (base) => ({
      ...base,
      padding: '8px 0px',
    }),
  };
  return (
    <div>
      <label className="form-label mt-3">Users</label>
      <Select
        isMulti={true}
        options={users}
        value={selectedUsers}
        width={'100%'}
        useMenuPortal={false}
        closeMenuOnSelect={false}
        components={{ Option: CustomOption, MenuList: CustomMenuList }}
        styles={selectStyles}
        hideSelectedOptions={false}
        info="Only user with access to this application can be selected"
        onChange={(users) => {
          setSelectedUsers(users);
        }}
      />
    </div>
  );
};

const CustomMenuList = (props) => {
  const { info } = props.selectProps;
  return (
    <components.MenuList {...props}>
      <div className="info-container" style={{ marginLeft: '12px', marginRight: '12px', marginTop: '8px' }}>
        <div className="col-md-1 info-btn">
          <SolidIcon name="informationcircle" fill="#3E63DD" />
        </div>
        <div className="col-md-11">
          <div className="message">
            <p style={{ lineHeight: '18px' }}>{info}</p>
          </div>
        </div>
      </div>
      {props.children}
    </components.MenuList>
  );
};
