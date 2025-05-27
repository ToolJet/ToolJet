import { buildComponentMetaDefinition } from '@/_helpers/appUtils';
import { appVersionService } from '@/_services';
import { toast } from 'react-hot-toast';
import { v4 as uuid } from 'uuid';
import Fuse from 'fuse.js';
import _ from 'lodash';
import { decimalToHex } from '@/Editor/editorConstants';

const createUpdateObject = (appId, versionId, pageId, diff, operation = 'update', type = 'pages') => ({
  appId,
  versionId,
  diff,
  isComponentCutProcess: false,
  isUserSwitchedVersion: false,
  operation,
  pageId,
  type,
});

const didItemChangePosition = (originalArr, sortedArry) => {
  return originalArr.some((item, index) => {
    return item.id !== sortedArry[index].id;
  });
};

export const savePageChanges = async (appId, versionId, pageId, diff, operation = 'update', type = 'pages') => {
  const updateObj = createUpdateObject(appId, versionId, pageId, diff, operation, type);
  try {
    const res = await appVersionService.autoSaveApp(
      updateObj.appId,
      updateObj.versionId,
      updateObj.diff,
      updateObj.type,
      updateObj.pageId,
      updateObj.operation
    );
  } catch (error) {
    toast.error('App could not be saved.');
    console.error('Error updating page:', error);
  }
};

const createPageUpdateCommand =
  (updatePaths, afterUpdateFn = () => {}, enableSave = true) =>
  (pageId, values) => {
    return (set, get) => {
      set((state) => {
        const page = state.modules.canvas.pages.find((p) => p.id === pageId);
        if (page) {
          updatePaths.forEach((path, index) => {
            _.set(page, path, values[index]);
          });
          state.editingPage = page;
          afterUpdateFn(state);
        }
      });

      const { app, currentVersionId } = get();
      const diff = _.zipObject(updatePaths, values);
      if (enableSave) savePageChanges(app.appId, currentVersionId, pageId, diff);
    };
  };

export const createPageMenuSlice = (set, get) => {
  const updatePageVisibility = createPageUpdateCommand(['hidden']);

  const disableOrEnablePage = createPageUpdateCommand(['disabled']);

  const updatePageName = createPageUpdateCommand(['name'], (state) => {
    state.showEditPageNameInput = false;
    state.showEditingPopover = false;
    state.editingPage = null;
  });

  const updatePageIcon = createPageUpdateCommand(['icon']);

  const updatePageGroupName = createPageUpdateCommand(['name'], (state) => {});

  const updatePageHandle = createPageUpdateCommand(['handle'], (state) => {
    state.showRenamePageHandleModal = false;
    state.showEditingPopover = false;
    state.editingPage = null;
  });

  const updatePageWithPermissions = createPageUpdateCommand(['permissions'], (state) => {}, false);

  return {
    editingPage: null,
    showEditingPopover: false,
    showRenamePageHandleModal: false,
    showEditPageEventsModal: false,
    showDeleteConfirmationModal: false,
    showEditPageNameInput: false,
    popoverTargetId: null,
    showAddNewPageInput: false,
    showSearch: false,
    pageSearchResults: null,
    isPageGroup: false,
    pageSettingSelected: false,
    pageSettings: {},
    showPagePermissionModal: false,

    toggleSearch: (show) =>
      set((state) => {
        state.showSearch = show;
        if (!show) state.pageSearchResults = null;
      }),
    togglePageSettingMenu: (val) =>
      set((state) => {
        state.pageSettingSelected = typeof val === 'boolean' ? val : !state.pageSettingSelected;
      }),
    openPageEditPopover: (page, ref) =>
      set((state) => {
        state.editingPage = page;
        if (ref) {
          state.popoverTargetId = ref?.current?.id;
          state.showEditingPopover = true;
        }
      }),

    closePageEditPopover: () =>
      set((state) => {
        state.showEditingPopover = false;
        state.showEditPageEventsModal = false;
        state.showRenamePageHandleModal = false;
        state.showEditPageNameInput = false;
        state.showDeleteConfirmationModal = false;
      }),

    toggleEditPageHandleModal: (show) =>
      set((state) => {
        state.showRenamePageHandleModal = show;
        state.showEditingPopover = !show;
      }),

    toggleShowAddNewPageInput: (show, isPageGroup = false) =>
      set((state) => {
        state.showAddNewPageInput = show;
        if (show) state.isPageGroup = isPageGroup;
        else state.isPageGroup = false;
      }),

    toggleDeleteConfirmationModal: (show) =>
      set((state) => {
        state.showDeleteConfirmationModal = show;
        if (!state?.editingPage?.isPageGroup) state.showEditingPopover = !show;
      }),

    togglePageEventsModal: (show) =>
      set((state) => {
        state.showEditPageEventsModal = show;
        state.showEditingPopover = !show;
      }),

    toggleEditPageNameInput: (show) =>
      set((state) => {
        state.showEditPageNameInput = show;
        state.showEditingPopover = false;
        if (!show) state.editingPage = null;
      }),

    // page actions
    updatePageVisibility: (pageId, value) => updatePageVisibility(pageId, [value])(set, get),
    disableOrEnablePage: (pageId, value) => disableOrEnablePage(pageId, [value])(set, get),
    updatePageName: (pageId, value) => {
      const page = get().modules.canvas.pages.find((p) => p.id === pageId);
      const pages = get().modules.canvas.pages;
      const pageWithSameName = pages.some((page) => page.name === value && !page.isPageGroup);
      const pageGroupWithSameName = pages.some((page) => page.name === value && page.isPageGroup);
      // if page group is being added and a page group with same name already exists display error
      if (page?.isPageGroup && pageGroupWithSameName) {
        return toast('Page group with same name already exists', {
          icon: '⚠️',
        });
      }
      // if page is being added and a page with same name already exists display error
      if (!page?.isPageGroup && pageWithSameName) {
        return toast('Page with same name already exists', {
          icon: '⚠️',
        });
      }
      updatePageName(pageId, [value])(set, get);
    },
    updatePageIcon: (pageId, value) => updatePageIcon(pageId, [value])(set, get),
    updatePageHandle: (pageId, value) => {
      const pageWithSameHandle = get().modules.canvas.pages.some((page) => page.handle === value);
      if (pageWithSameHandle) {
        return toast('Page with same handle already exists', {
          icon: '⚠️',
        });
      }
      updatePageHandle(pageId, [value])(set, get);
    },
    updatePageGroupName: (pageId, value) => updatePageGroupName(pageId, [value])(set, get),
    updatePageWithPermissions: (pageId, value) => updatePageWithPermissions(pageId, [value])(set, get),
    // unsure about this one
    clonePage: async (pageId) => {
      const {
        app: { appId },
        currentVersionId,
      } = get();
      const pages = get().modules.canvas.pages;
      const data = await appVersionService.clonePage(appId, currentVersionId, pageId);
      const newPages = data?.pages;
      const newEvents = data?.events;
      const pageAdded = newPages.find((p) => !pages.some((p2) => p2.id === p.id));
      if (pageAdded) {
        const currentComponents = buildComponentMetaDefinition(JSON.parse(JSON.stringify(pageAdded?.components)));

        pageAdded.components = currentComponents;
        set((state) => {
          state.modules.canvas.pages.push(pageAdded);
          state.eventsSlice.module.canvas.events = newEvents;
        });
        get().switchPage(pageAdded.id, pageAdded.handle);
      }
    },
    deletePage: async (pageId) => {
      const { app, currentVersionId } = get();
      const diff = {
        pageId: pageId,
      };
      const pages = get().modules.canvas.pages;
      const currentPageId = get().currentPageId;
      const switchPage = get().switchPage;
      if (pages.length === 1) {
        toast.error('You cannot delete the only page in your app.');
        return;
      }
      if (currentPageId === pageId) {
        const homePage = pages.find((p) => p.id === app.homePageId);
        switchPage(homePage.id, homePage.handle);
      }
      set((state) => {
        state.modules.canvas.pages = pages.filter((p) => p.id !== pageId);
        state.showDeleteConfirmationModal = false;
        state.showEditingPopover = false;
        state.editingPage = null;
      });
      await savePageChanges(app.appId, currentVersionId, pageId, diff, 'delete');
      toast.success('Page deleted successfully');
    },
    /*
     * @param {string} pageGroupId - id of the page group to be deleted
     * @param {boolean} deleteAssociatedPages - if true, all pages in the group will be deleted
     *  If home page is in the group, the group cannot be deleted
     * If current page is in the group, the page will be switched to home page
     */
    deletePageGroup: async (pageGroupId, deleteAssociatedPages = false) => {
      const { app, currentVersionId } = get();
      const pages = get().modules.canvas.pages;

      const homePageId = get().app.homePageId;
      const diff = {
        pageId: pageGroupId,
        deleteAssociatedPages,
      };
      if (deleteAssociatedPages) {
        // check if homepage is in the group or current page is in the group
        let isHomePageInGroup = false;
        let isCurrentPageInGroup = false;
        for (let i = 0; i < pages.length; i++) {
          if (pages[i].id === homePageId && pages[i].pageGroupId === pageGroupId) {
            isHomePageInGroup = true;
          }
          if (pages[i].id === get().currentPageId && pages[i].pageGroupId === pageGroupId) {
            isCurrentPageInGroup = true;
          }
        }
        if (isHomePageInGroup) return toast.error('You cannot delete the page group as it contains the home page');
        set((state) => {
          const newPages = [];
          pages.forEach((p) => {
            if (p.id !== pageGroupId && p.pageGroupId !== pageGroupId) {
              newPages.push(p);
            }
          });
          state.modules.canvas.pages = newPages;
          state.showDeleteConfirmationModal = false;
        });
        // switch page to home page if current page is in the group
        if (isCurrentPageInGroup) {
          const homePage = pages.find((p) => p.id === app.homePageId);
          get().switchPage(homePage.id, homePage.handle);
        }
        await savePageChanges(app.appId, currentVersionId, pageGroupId, diff, 'delete');
      } else {
        set((state) => {
          const pages = get().modules.canvas.pages;
          const newPages = pages
            .map((p) => {
              if (p.id !== pageGroupId) {
                if (p.pageGroupId === pageGroupId) {
                  return { ...p, pageGroupId: null };
                }
                return p;
              }
              return p;
            })
            .filter((p) => p.id !== pageGroupId);

          state.modules.canvas.pages = newPages;
          state.showDeleteConfirmationModal = false;
        });
        await savePageChanges(app.appId, currentVersionId, pageGroupId, diff, 'delete');
      }
    },
    markAsHomePage: async (pageId) => {
      const { app, currentVersionId, editingPage } = get();
      const diff = {
        homePageId: pageId,
      };

      set((state) => {
        state.app.homePageId = pageId;
        state.showEditingPopover = false;
        state.editingPage = null;
      });
      await savePageChanges(app.appId, currentVersionId, editingPage.id, diff, 'update', null);
    },
    reorderPages: async (reorderdPages) => {
      const diff = {};
      const currentPageId = get().currentPageId;
      // update index of everything to avoid inconsistencies
      reorderdPages.forEach((page, index) => {
        diff[page.id] = {
          index,
          pageGroupId: page.pageGroupId,
        };
      });
      // @todo come back to this, components can be segregated which will make this update fast compaaed to the current approach
      set((state) => {
        state.modules.canvas.pages = reorderdPages;
      });
      const { app, currentVersionId } = get();
      await savePageChanges(app.appId, currentVersionId, currentPageId, diff, 'update', 'pages/reorder');
    },

    addNewPage: async (name, handle, isPageGroup = false) => {
      const pages = get().modules.canvas.pages;
      const pageWithSameName = pages.some((page) => page.name === name && !page.isPageGroup);
      const pageGroupWithSameName = pages.some((page) => page.name === name && page.isPageGroup);
      // if page group is being added and a page group with same name already exists display error
      if (isPageGroup && pageGroupWithSameName) {
        return toast('Page group with same name already exists', {
          icon: '⚠️',
        });
      }
      // if page is being added and a page with same name already exists display error
      if (!isPageGroup && pageWithSameName) {
        return toast('Page with same name already exists', {
          icon: '⚠️',
        });
      }
      const pageHandles = pages.map((page) => page.handle);
      let newHandle = handle;

      for (let handleIndex = 1; pageHandles.includes(newHandle); handleIndex++) {
        newHandle = `${handle}-${handleIndex}`;
      }
      const newPageId = uuid();
      const pageObject = {
        id: newPageId,
        name,
        handle: newHandle,
        components: {},
        index: pages.length + 1,
        isPageGroup,
        ...(isPageGroup
          ? {
              icon: `IconFolder`,
            }
          : {}),
      };
      set((state) => {
        state.modules.canvas.pages.push(pageObject);
      });
      const { app, currentVersionId } = get();
      await savePageChanges(app.appId, currentVersionId, '', pageObject, 'create', 'pages');
      if (!isPageGroup) get().switchPage(newPageId, newHandle);
    },

    handleSearch: (value) => {
      if (!value || value.length === 0) {
        set((state) => {
          state.pageSearchResults = null;
        });
        return;
      }
      const pages = get().modules.canvas.pages;
      const fuse = new Fuse(pages, { keys: ['name'], threshold: 0.3 });
      const result = fuse.search(value);
      set((state) => {
        state.pageSearchResults = result.map((result) => result.item.id);
      });
    },

    pageSettingChanged: async (newOptions, type) => {
      for (const [key, value] of Object.entries(newOptions)) {
        if (value?.[1]?.a == undefined) {
          newOptions[key] = value;
        } else {
          const hexCode = `${value?.[0]}${decimalToHex(value?.[1]?.a)}`;
          newOptions[key] = hexCode;
        }
      }
      const { app, currentVersionId, currentPageId } = get();
      try {
        const res = await appVersionService.autoSaveApp(
          app.appId,
          currentVersionId,
          { pageSettings: { [type]: newOptions } },
          'page_settings',
          currentPageId,
          'update'
        );
        set((state) => {
          state.pageSettings.definition[type] = { ...state.pageSettings.definition[type], ...newOptions };
        });
      } catch (error) {
        toast.error('Page settings could not be saved.');
        console.error('Error updating page:', error);
      }
    },

    togglePagePermissionModal: (show) => {
      set((state) => {
        state.showPagePermissionModal = show;
      });
    },

    setEditingPage: (page) =>
      set((state) => {
        state.editingPage = page;
      }),
  };
};
