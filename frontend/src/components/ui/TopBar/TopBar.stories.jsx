import React, { useState } from "react";
import { TopBar } from "./TopBar";

export default {
  title: "UI/TopBar",
  component: TopBar,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    workspaceName: {
      control: "text",
      description: "Current workspace name",
    },
    searchPlaceholder: {
      control: "text",
      description: "Search input placeholder text",
    },
    workspaces: {
      control: "object",
      description: "Array of available workspaces",
    },
  },
};

const Template = (args) => {
  const [searchValue, setSearchValue] = useState("");
  const [currentWorkspace, setCurrentWorkspace] = useState(args.workspaceName);

  const handleWorkspaceChange = (workspace) => {
    setCurrentWorkspace(workspace.name);
    console.log("Workspace changed to:", workspace);
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    console.log("Search:", value);
  };

  return (
    <div className="tw-w-full tw-h-screen tw-bg-background-surface-layer-01">
      <TopBar
        {...args}
        workspaceName={currentWorkspace}
        searchValue={searchValue}
        onWorkspaceChange={handleWorkspaceChange}
        onSearch={handleSearch}
      />
      <div className="tw-p-8">
        <h1 className="tw-text-2xl tw-font-bold tw-text-text-default tw-mb-4">
          Dashboard Content
        </h1>
        <p className="tw-text-text-medium">
          This is where your main content would go. The TopBar component is
          fixed at the top.
        </p>
        <div className="tw-mt-4 tw-p-4 tw-bg-background-surface-layer-02 tw-rounded-lg">
          <h3 className="tw-font-medium tw-text-text-default tw-mb-2">
            Current State:
          </h3>
          <p className="tw-text-sm tw-text-text-medium">
            Workspace:{" "}
            <span className="tw-font-medium">{currentWorkspace}</span>
          </p>
          <p className="tw-text-sm tw-text-text-medium">
            Search: <span className="tw-font-medium">"{searchValue}"</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  workspaceName: "ABC cargo main team",
  searchPlaceholder: "Search",
  workspaces: [
    { name: "ABC cargo main team", id: "1" },
    { name: "XYZ Logistics", id: "2" },
    { name: "Global Shipping Co.", id: "3" },
    { name: "Fast Delivery Inc.", id: "4" },
  ],
};

export const SingleWorkspace = Template.bind({});
SingleWorkspace.args = {
  workspaceName: "My Workspace",
  searchPlaceholder: "Search applications...",
  workspaces: [{ name: "My Workspace", id: "1" }],
};

export const ManyWorkspaces = Template.bind({});
ManyWorkspaces.args = {
  workspaceName: "Enterprise Team Alpha",
  searchPlaceholder: "Search across all workspaces",
  workspaces: [
    { name: "Enterprise Team Alpha", id: "1" },
    { name: "Development Team Beta", id: "2" },
    { name: "Marketing Team Gamma", id: "3" },
    { name: "Sales Team Delta", id: "4" },
    { name: "Support Team Epsilon", id: "5" },
    { name: "Operations Team Zeta", id: "6" },
    { name: "Research Team Eta", id: "7" },
    { name: "Finance Team Theta", id: "8" },
  ],
};

export const LongWorkspaceName = Template.bind({});
LongWorkspaceName.args = {
  workspaceName: "Very Long Workspace Name That Should Be Truncated",
  searchPlaceholder: "Search",
  workspaces: [
    { name: "Very Long Workspace Name That Should Be Truncated", id: "1" },
    { name: "Another Very Long Workspace Name For Testing", id: "2" },
    { name: "Short Name", id: "3" },
  ],
};

export const WithoutSearch = Template.bind({});
WithoutSearch.args = {
  workspaceName: "ABC cargo main team",
  workspaces: [
    { name: "ABC cargo main team", id: "1" },
    { name: "XYZ Logistics", id: "2" },
  ],
};

// Interactive example showing all features
export const Interactive = () => {
  const [searchValue, setSearchValue] = useState("");
  const [currentWorkspace, setCurrentWorkspace] = useState(
    "ABC cargo main team"
  );
  const [workspaces] = useState([
    { name: "ABC cargo main team", id: "1" },
    { name: "XYZ Logistics", id: "2" },
    { name: "Global Shipping Co.", id: "3" },
    { name: "Fast Delivery Inc.", id: "4" },
  ]);

  const handleWorkspaceChange = (workspace) => {
    setCurrentWorkspace(workspace.name);
    console.log("Workspace changed to:", workspace);
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    console.log("Search:", value);
  };

  return (
    <div className="tw-w-full tw-h-screen tw-bg-background-surface-layer-01">
      <TopBar
        workspaceName={currentWorkspace}
        workspaces={workspaces}
        searchValue={searchValue}
        onWorkspaceChange={handleWorkspaceChange}
        onSearch={handleSearch}
        searchPlaceholder="Search applications, pages, or data sources..."
      />
      <div className="tw-p-8">
        <h1 className="tw-text-2xl tw-font-bold tw-text-text-default tw-mb-4">
          Interactive TopBar Demo
        </h1>
        <p className="tw-text-text-medium tw-mb-6">
          Try interacting with the workspace switcher and search input above.
          Check the console for event logs.
        </p>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
          <div className="tw-p-4 tw-bg-background-surface-layer-02 tw-rounded-lg">
            <h3 className="tw-font-medium tw-text-text-default tw-mb-2">
              Current State
            </h3>
            <div className="tw-space-y-2">
              <p className="tw-text-sm tw-text-text-medium">
                <span className="tw-font-medium">Workspace:</span>{" "}
                {currentWorkspace}
              </p>
              <p className="tw-text-sm tw-text-text-medium">
                <span className="tw-font-medium">Search:</span> "
                {searchValue || "No search term"}"
              </p>
            </div>
          </div>

          <div className="tw-p-4 tw-bg-background-surface-layer-02 tw-rounded-lg">
            <h3 className="tw-font-medium tw-text-text-default tw-mb-2">
              Available Workspaces
            </h3>
            <div className="tw-space-y-1">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className={`tw-text-sm tw-p-2 tw-rounded ${
                    workspace.name === currentWorkspace
                      ? "tw-bg-background-accent-strong tw-text-text-on-solid"
                      : "tw-bg-background-surface-layer-03 tw-text-text-medium"
                  }`}
                >
                  {workspace.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

