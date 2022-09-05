import React from 'react';
import { Pagination } from '@/_components';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const UsersTable = ({
  isLoading,
  users,
  archivingUser,
  unarchivingUser,
  meta,
  generateInvitationURL,
  invitationLinkCopyHandler,
  unarchiveOrgUser,
  archiveOrgUser,
  pageChanged,
  darkMode,
}) => {
  const tableRef = React.createRef(null);

  function calculateOffset() {
    const elementHeight = tableRef.current.getBoundingClientRect().top;
    return window.innerHeight - elementHeight;
  }

  const setWidth = () =>
    (document.querySelector('.users-pagination').style.width = `${tableRef.current.offsetWidth}px`);

  React.useEffect(() => {
    window.addEventListener('resize', setWidth);
    return () => window.removeEventListener('resize', setWidth);
  });

  React.useEffect(() => {
    setWidth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableRef]);

  return (
    <div className="container-xl">
      <div className="card">
        <div
          className="card-table fixedHeader table-responsive table-bordered"
          ref={tableRef}
          style={{
            maxHeight: tableRef.current && calculateOffset(),
          }}
        >
          <table data-testid="usersTable" className="table table-vcenter" disabled={true}>
            <thead>
              <tr>
                <th data-cy="name-title">Name</th>
                <th data-cy="email-title">Email</th>
                {(users && users[0]?.status) && <th data-cy="status-title">Status</th>}
                <th className="w-1"></th>
              </tr>
            </thead>
            {isLoading ? (
              <tbody className="w-100" style={{ minHeight: '300px' }}>
                {Array.from(Array(4)).map((_item, index) => (
                  <tr key={index}>
                    <td className="col-2 p-3">
                      <div className="row">
                        <div className="skeleton-image col-auto" style={{ width: '25px', height: '25px' }}></div>
                        <div className="skeleton-line w-10 col mx-3"></div>
                      </div>
                    </td>
                    <td className="col-4 p-3">
                      <div className="skeleton-line w-10"></div>
                    </td>
                    {(users && users[0]?.status) &&<td className="col-2 p-3">
                      <div className="skeleton-line"></div>
                    </td>}
                    <td className="text-muted col-auto col-1 pt-3">
                      <div className="skeleton-line"></div>
                    </td>
                    <td className="text-muted col-auto col-1 pt-3">
                      <div className="skeleton-line"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="avatar bg-azure-lt avatar-sm" data-cy="user-avatar">
                        {user.first_name ? user.first_name[0] : ''}
                        {user.last_name ? user.last_name[0] : ''}
                      </span>
                      <span
                        className="mx-3"
                        style={{
                          display: 'inline-flex',
                          marginBottom: '7px',
                        }}
                        data-cy="user-name"
                      >
                        {user.name}
                      </span>
                    </td>
                    <td className="text-muted">
                      <a className="text-reset user-email" data-cy="user-email">
                        {user.email}
                      </a>
                    </td>
                    {user.status && (<td className="text-muted">
                      <span
                        className={`badge bg-${
                          user.status === 'invited' ? 'warning' : user.status === 'archived' ? 'danger' : 'success'
                        } me-1 m-1`}
                        data-cy="status-badge"
                      ></span>
                      <small className="user-status" data-cy="user-status">
                        {user.status}
                      </small>
                      {user.status === 'invited' && 'invitation_token' in user ? (
                        <CopyToClipboard text={generateInvitationURL(user)} onCopy={invitationLinkCopyHandler}>
                          <img
                            data-tip="Copy invitation link"
                            className="svg-icon"
                            src="assets/images/icons/copy.svg"
                            width="15"
                            height="15"
                            style={{
                              cursor: 'pointer',
                            }}
                            data-cy="copy-invitation-link"
                          ></img>
                        </CopyToClipboard>
                      ) : (
                        ''
                      )}
                    </td>)}
                    <td>
                      <button
                        type="button"
                        style={{ minWidth: '100px' }}
                        className={`btn btn-sm btn-outline-${user.status === 'archived' ? 'success' : 'danger'} ${
                          unarchivingUser === user.id || archivingUser === user.id ? 'btn-loading' : ''
                        }`}
                        disabled={unarchivingUser === user.id || archivingUser === user.id}
                        onClick={() => {
                          user.status === 'archived' ? unarchiveOrgUser(user.id) : archiveOrgUser(user.id);
                        }}
                        data-cy="user-state"
                      >
                        {user.status === 'archived' ? 'Unarchive' : 'Archive'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>
      <div className="users-pagination">
        {meta.total_count > 10 && (
          <Pagination
            currentPage={meta.current_page}
            count={meta.total_count}
            pageChanged={pageChanged}
            itemsPerPage={10}
            darkMode={darkMode}
          />
        )}
      </div>
    </div>
  );
};

export default UsersTable;
