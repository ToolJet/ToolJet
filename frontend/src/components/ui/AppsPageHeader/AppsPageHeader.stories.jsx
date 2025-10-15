import React from "react";
import { AppsPageHeader } from "./AppsPageHeader";

export default {
  title: "UI/AppsPageHeader",
  component: AppsPageHeader,
  parameters: {
    layout: "padded",
  },
};

// Simple test story
export const Simple = () => {
  return (
    <AppsPageHeader
      title="Applications"
      onCreateBlankApp={() => console.log("Create blank app")}
      onBuildWithAI={() => console.log("Build with AI")}
      createAppMenuItems={[]}
    />
  );
};

// Story with menu items
export const WithMenu = () => {
  const menuItems = [
    {
      label: "Import template",
      onClick: () => console.log("Import template"),
      icon: "Download",
    },
  ];

  return (
    <AppsPageHeader
      title="Applications"
      onCreateBlankApp={() => console.log("Create blank app")}
      onBuildWithAI={() => console.log("Build with AI")}
      createAppMenuItems={menuItems}
    />
  );
};
