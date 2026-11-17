export interface ExportCsvModalProps {
  show: boolean;
  darkMode: boolean;
  tableName: string;
  tableId: string;
  organizationId: string | null;
  environments?: unknown[];
  /** The table's per-environment `has_relation` flags. */
  relationsByEnvironment?: unknown[];
  onCancel: () => void;
}

export default function ExportCsvModal(props: ExportCsvModalProps): JSX.Element;
