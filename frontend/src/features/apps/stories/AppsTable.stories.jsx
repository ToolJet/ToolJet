import React from "react";
import { AppsTable } from "../components/AppsTable";
import { generateMockApps } from "./utils";
import { appsColumns } from "@/features/commons/columns";
import { useResourcePageAdapter } from "@/features/apps/hooks/useResourcePageAdapter";

const mockActions = {
  play: (app) => console.log("Play:", app),
  edit: (app) => console.log("Edit:", app),
  delete: (app) => console.log("Delete:", app),
  clone: (app) => console.log("Clone:", app),
  export: (app) => console.log("Export:", app),
};

const mockPerms = {
  canPlay: () => true,
  canEdit: () => true,
};

export default {
  title: "Features/Apps/Components/AppsTable",
  component: AppsTable,
  parameters: {
    layout: "padded",
  },
};

function AppsTableWrapper({ apps, isLoading = false }) {
  const columns = React.useMemo(
    () =>
      appsColumns({ perms: mockPerms, actions: mockActions, canDelete: true }),
    []
  );
  const { table } = useResourcePageAdapter({
    data: { apps, isLoading, error: null, meta: {} },
    filters: { appSearchKey: "", currentFolder: {} },
    actions: {},
    columns,
  });

  return <AppsTable table={table} isLoading={isLoading} />;
}

export const Default = () => {
  const apps = generateMockApps(10);
  return <AppsTableWrapper apps={apps} />;
};

export const Empty = () => {
  return <AppsTableWrapper apps={[]} />;
};

export const Loading = () => {
  return <AppsTableWrapper apps={[]} isLoading={true} />;
};
