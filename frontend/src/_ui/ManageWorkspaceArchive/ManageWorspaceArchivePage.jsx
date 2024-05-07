import React, { Component } from 'react';
import cx from 'classnames';
import { organizationService, authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { withTranslation } from 'react-i18next';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import Pagination from '@/_ui/Pagination';
import { SwitchWorkspaceModal } from '@/HomePage/SwitchWorkspacePage';
import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { appendWorkspaceId } from '@/_helpers/routes';
import WorkspaceListingTable from './WorkspaceListingTable';
import { SearchBox } from '@/_components/SearchBox';
import ModalBase from '@/_ui/Modal';
import { Spinner } from 'react-bootstrap';
import { useCurrentSessionStore } from '@/_stores/currentSessionStore';

const WORKSPACE_STATUS = {
  ARCHIVED: 'archived',
  ACTIVE: 'active',
};

class ManageWorkspaceArchivePage extends Component {
  constructor(props) {
    super(props);
    const session = authenticationService.currentSessionValue;
    const { current_organization_id: currentOrganizationId, organizations: currentOrganizations } = session;

    this.defaultState = {
      isLoading: true,
      currentPage: 1,
      singleActiveWorkspace: false,
      searchValue: '',
    };

    this.state = {
      isLoading: true,
      currentPage: 1,
      totalPageActive: 1,
      totalPageArchived: 1,
      currentOrganizations: currentOrganizations,
      currentTab: WORKSPACE_STATUS.ACTIVE,
      activeWorkspace: [],
      totalActive: 0,
      archivedWorkspace: [],
      totalArchived: 0,
      showSwitchModel: false,
      currentOrganizationId,
      totalWorkspace: 0,
      searchValue: '',
      showArchiveConfirmModal: false,
      organizationIdToArchive: '',
      organizationNameToArchive: '',
    };
  }

  gotoNextPage = () => {
    this.setState(
      (prevState) => ({
        currentPage: prevState.currentPage + 1,
        isLoading: true,
      }),
      () => {
        this.fetchWorkspace(this.state.currentTab, () => {}, this.state.searchValue, true);
      }
    );
  };

  changeAndResetTab = (tab) => {
    const otherTab = tab == 'active' ? 'archived' : 'active';
    this.setState(
      {
        ...this.defaultState,
        currentTab: tab,
      },
      () => {
        this.fetchWorkspace(tab);
        this.fetchWorkspace(otherTab);
      }
    );
  };

  gotoPrevPage = () => {
    if (this.state.currentPage <= 1) return;
    this.setState(
      (prevState) => ({
        currentPage: prevState.currentPage - 1,
        isLoading: true,
      }),
      () => {
        this.fetchWorkspace(this.state.currentTab, () => {}, this.state.searchValue, true);
      }
    );
  };

  updateCurrentActiveWorkspaces = () => {
    organizationService.getOrganizations().then((response) => {
      const { organizations } = response;
      const currentOrganization = organizations?.find((org) => org.id === this.state.currentOrganizationId);
      this.setState({
        currentOrganizations: organizations,
      });
      useCurrentSessionStore.getState().actions.setOrganizations(organizations);
      updateCurrentSession({
        current_organization: currentOrganization,
      });
    });
  };

  fetchWorkspace = (currentTab, callback = () => {}, name = undefined, isSearch = false) => {
    organizationService.getOrganizations(currentTab, this.state.currentPage, 7, name).then((response) => {
      const { organizations, total_count } = response;
      if (currentTab == WORKSPACE_STATUS.ACTIVE) {
        this.setState(
          {
            activeWorkspace: organizations.sort((orgA, orgB) => {
              if (orgA.id === this.state.currentOrganizationId) {
                return -1; // orgA comes first
              } else if (orgB.id === this.state.currentOrganizationId) {
                return 1; // orgB comes first
              } else {
                return 0; // maintain the original order for other organizations
              }
            }),
            totalActive: total_count,
            totalPageActive: total_count % 7 > 0 ? Math.floor(total_count / 7) + 1 : total_count / 7,
            isLoading: false,
          },
          callback
        );
        if (!isSearch && organizations.length < 2) {
          this.setState({
            singleActiveWorkspace: true,
          });
        }
      } else {
        this.setState(
          {
            archivedWorkspace: organizations,
            totalArchived: total_count,
            totalPageArchived: total_count % 7 > 0 ? Math.floor(total_count / 7) + 1 : total_count / 7,
            isLoading: false,
          },
          callback
        );
      }
    });
  };

  setOptionVal = (event) => {
    this.setState(
      {
        ...this.defaultState,
        searchValue: event.target.value,
      },
      () => {
        this.fetchWorkspace(this.state.currentTab, () => {}, event.target.value, true);
      }
    );
  };

  onSearchClear = () => {
    this.setState(
      {
        ...this.defaultState,
        searchValue: '',
      },
      () => {
        this.fetchWorkspace(this.state.currentTab);
      }
    );
  };

  componentDidMount = () => {
    this.fetchWorkspace(WORKSPACE_STATUS.ACTIVE);
    this.fetchWorkspace(WORKSPACE_STATUS.ARCHIVED, () => {
      const { totalActive, totalArchived } = this.state;
      this.setState(() => ({
        totalWorkspace: totalActive + totalArchived,
      }));
    });
  };

  changeWorkspaceState = (organizationId, status, name) => {
    this.setState({
      isLoading: true,
      currentPage: 1,
    });
    organizationService
      .editOrganization({ status: status }, organizationId)
      .then(() => {
        toast.success(`${name} \n was successfully ${status == 'active' ? 'unarchived' : 'archived'}`);
        this.fetchWorkspace(WORKSPACE_STATUS.ACTIVE, () => {});
        this.fetchWorkspace(WORKSPACE_STATUS.ARCHIVED, () => {
          this.setState({
            searchValue: '',
            organizationIdToArchive: '',
            organizationNameToArchive: '',
            showArchiveConfirmModal: false,
          });
        });
        this.updateCurrentActiveWorkspaces();
      })
      .catch(({ error, data }) => {
        const { statusCode } = data;
        this.setState({
          isLoading: false,
        });
        if (statusCode != 451) toast.error(`Cannot ${status == 'active' ? 'unarchive' : 'archive'} \n ${error} `);
      });
  };

  switchOrganizationAndArchive = ({ id, slug, name }) => {
    if (slug || id) {
      const newPath = appendWorkspaceId(slug || id, location.pathname, true);
      window.history.replaceState(null, null, newPath);
      window.location.reload();
      this.changeWorkspaceState(this.state.currentOrganizationId, WORKSPACE_STATUS.ARCHIVED, name);
    }
  };

  setShowArchiveConfirmModal = (organizationId, name) => {
    this.setState({
      showArchiveConfirmModal: true,
      organizationIdToArchive: organizationId,
      organizationNameToArchive: name,
    });
  };

  openOrganizationNew = ({ organizationId, slug }) => {
    if (organizationId || slug) {
      const newPath = appendWorkspaceId(slug || organizationId, location.pathname, true);
      window.open(newPath, '_blank');
    }
  };

  archiveWorkspaceAction = () => {
    if (this.state.currentOrganizationId === this.state.organizationIdToArchive) {
      this.setState({
        showSwitchModel: true,
        showArchiveConfirmModal: false,
      });
      return;
    }
    this.changeWorkspaceState(
      this.state.organizationIdToArchive,
      WORKSPACE_STATUS.ARCHIVED,
      this.state.organizationNameToArchive
    );
  };

  render() {
    const {
      archivedWorkspace,
      activeWorkspace,
      totalActive,
      totalArchived,
      totalPageActive,
      totalPageArchived,
      currentTab,
      showSwitchModel,
      currentPage,
      isLoading,
      currentOrganizationId,
      totalWorkspace,
      singleActiveWorkspace,
      showArchiveConfirmModal,
      organizationNameToArchive,
      currentOrganizations,
      searchValue,
    } = this.state;

    const confirmButtonProps = {
      title: 'Archive',
      isLoading: isLoading,
      disabled: isLoading,
      variant: 'dangerPrimary',
      leftIcon: 'archive',
    };
    return (
      <ErrorBoundary showFallback={false}>
        <div>
          <SwitchWorkspaceModal
            showCloseButton={true}
            darkMode={this.props.darkMode}
            title={'The current workspace will be archived. Select an active workspace to continue this session.'}
            organizations={currentOrganizations.filter((org) => org.id !== currentOrganizationId)}
            switchOrganization={this.switchOrganizationAndArchive}
            show={showSwitchModel}
            headerText={'Archive current workspace'}
            handleClose={() => {
              this.setState({
                showSwitchModel: false,
              });
            }}
          />
          <ModalBase
            title={
              <div className="my-3">
                <span className="tj-text-md font-weight-500" data-cy="modal-title">
                  Archive workspace
                </span>
                <div
                  className="tj-text-sm text-muted font-weight-400"
                  style={{ color: '#687076' }}
                  data-cy="workspace-name"
                >
                  {organizationNameToArchive}
                </div>
              </div>
            }
            show={showArchiveConfirmModal}
            handleClose={() => {
              this.setState({
                showArchiveConfirmModal: false,
              });
            }}
            handleConfirm={this.archiveWorkspaceAction}
            confirmBtnProps={confirmButtonProps}
            body={
              <div className="tj-text-sm" data-cy="modal-message">
                {
                  'Archiving the workspace will revoke user access and all associate content. Are you sure you want to continue?'
                }
              </div>
            }
            darkMode={this.props.darkMode}
          />
        </div>
        <div className="wrapper org-users-page animation-fade">
          <div class="org-users-page-container">
            <div class="d-flex">
              <p class="tj-text" data-cy="page-title">
                {totalActive + totalArchived} Workspaces
              </p>
            </div>
            <div class={`manage-workspace-table-wrap ${this.props.darkMode ? 'dark-mode' : ''}`}>
              <div class={`worskspace-sub-header-wrap-nav-ws`}>
                <div class="col d-flex">
                  <div class="col-md-6 d-flex ws-nav">
                    <nav class="nav nav-tabs">
                      <a
                        className={cx('nav-item nav-link', { active: currentTab === WORKSPACE_STATUS.ACTIVE })}
                        onClick={() => this.changeAndResetTab(WORKSPACE_STATUS.ACTIVE)}
                        data-cy="active-link"
                      >
                        Active ({totalActive})
                      </a>
                      <a
                        className={cx('nav-item nav-link', { active: currentTab === WORKSPACE_STATUS.ARCHIVED })}
                        onClick={() => this.changeAndResetTab(WORKSPACE_STATUS.ARCHIVED)}
                        data-cy="archived-link"
                      >
                        Archived ({totalArchived})
                      </a>
                    </nav>
                  </div>
                  <div class="col-md-6 workspace-search-bar">
                    <SearchBox
                      dataCy={`query-manager`}
                      width="248px"
                      callBack={this.setOptionVal}
                      placeholder={`Search ${currentTab} workspace`}
                      onClearCallback={this.onSearchClear}
                      initialValue={searchValue}
                    />
                  </div>
                </div>
              </div>
              <div class="tab-content tab-content-ws">
                {currentTab === WORKSPACE_STATUS.ACTIVE && (
                  <WorkspaceListingTable
                    workspaces={activeWorkspace}
                    unArchiveWorkspace={(organizationId, status, name) => {
                      this.changeWorkspaceState(organizationId, status, name);
                    }}
                    archiveWorkspace={this.setShowArchiveConfirmModal}
                    openOrganizationNew={this.openOrganizationNew}
                    currentTab={currentTab}
                    currentOrganizationId={currentOrganizationId}
                    singleActiveWorkspace={singleActiveWorkspace}
                    isLoading={isLoading}
                    darkMode={this.props.darkMode}
                  />
                )}
                {currentTab === WORKSPACE_STATUS.ARCHIVED && (
                  <WorkspaceListingTable
                    workspaces={archivedWorkspace}
                    unArchiveWorkspace={(organizationId, status, name) => {
                      this.changeWorkspaceState(organizationId, status, name);
                    }}
                    archiveWorkspace={this.setShowArchiveConfirmModal}
                    currentTab={currentTab}
                    singleActiveWorkspace={singleActiveWorkspace}
                    isLoading={isLoading}
                    darkMode={this.props.darkMode}
                  />
                )}
              </div>
              <div className="pagination-container-box">
                {((currentTab == WORKSPACE_STATUS.ACTIVE && totalActive > 0) ||
                  (currentTab == WORKSPACE_STATUS.ARCHIVED && totalArchived > 0)) && (
                  <div>
                    <Pagination
                      darkMode={this.props.darkMode}
                      gotoNextPage={this.gotoNextPage}
                      gotoPreviousPage={this.gotoPrevPage}
                      currentPage={currentPage}
                      totalPage={currentTab == WORKSPACE_STATUS.ACTIVE ? totalPageActive : totalPageArchived}
                      isDisabled={isLoading}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }
}

export const ManageWorkspaceArchivePageComponent = withTranslation()(ManageWorkspaceArchivePage);
