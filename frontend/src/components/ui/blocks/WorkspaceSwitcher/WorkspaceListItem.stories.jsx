import React, { useState } from "react";
import { WorkspaceListItem } from "./WorkspaceListItem";
import { GalleryVerticalEnd, AudioWaveform, Command } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button/Button";

export default {
  title: "UI/Blocks/WorkspaceSwitcher/WorkspaceListItem",
  component: WorkspaceListItem,
  parameters: {
    layout: "centered",
  },
};

const workspaces = [
  {
    name: "Acme Inc",
    logo: GalleryVerticalEnd,
    plan: "Enterprise",
  },
  {
    name: "Acme Corp.",
    logo: AudioWaveform,
    plan: "Startup",
  },
  {
    name: "Evil Corp.",
    logo: Command,
    plan: "Free",
  },
];

export const Default = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button>Open Menu</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="tw-min-w-56">
      <WorkspaceListItem
        workspace={workspaces[0]}
        index={0}
        onClick={() => console.log("Workspace clicked:", workspaces[0].name)}
      />
    </DropdownMenuContent>
  </DropdownMenu>
);

export const MultipleItems = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button>Open Menu</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="tw-min-w-56">
      {workspaces.map((workspace, index) => (
        <WorkspaceListItem
          key={workspace.name}
          workspace={workspace}
          index={index}
          onClick={() => console.log("Workspace clicked:", workspace.name)}
        />
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export const WithKeyboardShortcuts = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button>Open Menu (⌘1, ⌘2, ⌘3)</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="tw-min-w-56">
      {workspaces.map((workspace, index) => (
        <WorkspaceListItem
          key={workspace.name}
          workspace={workspace}
          index={index}
          onClick={() =>
            console.log(`Workspace ${index + 1} clicked:`, workspace.name)
          }
        />
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export const WithCheckedState = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button>Open Menu (First item checked)</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="tw-min-w-56">
      {workspaces.map((workspace, index) => (
        <WorkspaceListItem
          key={workspace.name}
          workspace={workspace}
          index={index}
          checked={index === 0}
          onClick={() => console.log("Workspace clicked:", workspace.name)}
          onCheckedChange={(checked) =>
            console.log(`Workspace ${workspace.name} checked:`, checked)
          }
        />
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export const ControlledCheckbox = () => {
  const [selectedWorkspace, setSelectedWorkspace] = useState(
    workspaces[0].name
  );

  return (
    <div className="tw-space-y-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Select Workspace</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="tw-min-w-56">
          {workspaces.map((workspace, index) => (
            <WorkspaceListItem
              key={workspace.name}
              workspace={workspace}
              index={index}
              checked={selectedWorkspace === workspace.name}
              onClick={() => {
                setSelectedWorkspace(workspace.name);
                console.log("Workspace selected:", workspace.name);
              }}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedWorkspace(workspace.name);
                  console.log("Workspace checked:", workspace.name);
                }
              }}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="tw-p-4 tw-bg-background-surface-layer-02 tw-rounded-lg">
        <p className="tw-text-sm tw-text-text-medium">
          <span className="tw-font-medium">Selected workspace:</span>{" "}
          {selectedWorkspace}
        </p>
      </div>
    </div>
  );
};
