import React from "react";
import AppsPageAdapter from "../AppsPageAdapter";
import data from "../data.json";

// Mock HomePage methods
const mockCanCreateApp = () => true;
const mockCanUpdateApp = (_app) => true;
const mockCanDeleteApp = (_app) => true;
const mockPageChanged = (page) => console.log("Page changed:", page);
const mockOnSearch = (key) => console.log("Search:", key);
const mockDeleteApp = (app) => console.log("Delete:", app);
const mockCloneApp = (app) => console.log("Clone:", app);
const mockExportApp = (app) => console.log("Export:", app);
const mockNavigate = (path) => console.log("Navigate:", path);

export default {
  title: "Flows/AppsPage/Adapter",
  component: AppsPageAdapter,
  parameters: { layout: "fullscreen" },
};

export const Default = () => (
  <AppsPageAdapter
    apps={data}
    isLoading={false}
    meta={{
      current_page: 1,
      total_pages: 1,
      total_count: data.length,
      per_page: 9,
    }}
    appSearchKey=""
    appType="front-end"
    workspaceId="storybook-workspace"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={mockCanCreateApp}
    canUpdateApp={mockCanUpdateApp}
    canDeleteApp={mockCanDeleteApp}
    deleteApp={mockDeleteApp}
    cloneApp={mockCloneApp}
    exportApp={mockExportApp}
    navigate={mockNavigate}
  />
);

export const Loading = () => (
  <AppsPageAdapter
    apps={[]}
    isLoading={true}
    meta={{ current_page: 1, total_pages: 1, total_count: 0, per_page: 9 }}
    appSearchKey=""
    appType="front-end"
    workspaceId="storybook-workspace"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={mockCanCreateApp}
    canUpdateApp={mockCanUpdateApp}
    canDeleteApp={mockCanDeleteApp}
    navigate={mockNavigate}
  />
);

export const EmptyState = () => (
  <AppsPageAdapter
    apps={[]}
    isLoading={false}
    meta={{ current_page: 1, total_pages: 1, total_count: 0, per_page: 9 }}
    appSearchKey=""
    appType="front-end"
    workspaceId="storybook-workspace"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={mockCanCreateApp}
    canUpdateApp={mockCanUpdateApp}
    canDeleteApp={mockCanDeleteApp}
    navigate={mockNavigate}
  />
);

export const ErrorState = () => (
  <AppsPageAdapter
    apps={[]}
    isLoading={false}
    error={new Error("Failed to fetch apps")}
    meta={{ current_page: 1, total_pages: 1, total_count: 0, per_page: 9 }}
    appSearchKey=""
    appType="front-end"
    workspaceId="storybook-workspace"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={mockCanCreateApp}
    canUpdateApp={mockCanUpdateApp}
    canDeleteApp={mockCanDeleteApp}
    navigate={mockNavigate}
  />
);

export const WithPagination = () => (
  <AppsPageAdapter
    apps={data}
    isLoading={false}
    meta={{ current_page: 2, total_pages: 3, total_count: 25, per_page: 9 }}
    appSearchKey=""
    appType="front-end"
    workspaceId="storybook-workspace"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={mockCanCreateApp}
    canUpdateApp={mockCanUpdateApp}
    canDeleteApp={mockCanDeleteApp}
    navigate={mockNavigate}
  />
);

export const Modules = () => (
  <AppsPageAdapter
    apps={data}
    isLoading={false}
    meta={{
      current_page: 1,
      total_pages: 1,
      total_count: data.length,
      per_page: 9,
    }}
    appSearchKey=""
    appType="module"
    workspaceId="storybook-workspace"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={mockCanCreateApp}
    canUpdateApp={mockCanUpdateApp}
    canDeleteApp={mockCanDeleteApp}
    navigate={mockNavigate}
  />
);

export const NoPermissions = () => (
  <AppsPageAdapter
    apps={data}
    isLoading={false}
    meta={{
      current_page: 1,
      total_pages: 1,
      total_count: data.length,
      per_page: 9,
    }}
    appSearchKey=""
    appType="front-end"
    workspaceId="storybook-workspace"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={false}
    canUpdateApp={() => false}
    canDeleteApp={() => false}
    navigate={mockNavigate}
  />
);
