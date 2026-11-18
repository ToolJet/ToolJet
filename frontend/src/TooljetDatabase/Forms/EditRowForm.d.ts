export interface EditRowFormProps {
  /** The row as the grid holds it: raw stored values, one entry per column. */
  selectedRowObj: Record<string, unknown>;
  referencedColumnDetails: unknown[];
  setReferencedColumnDetails: (details: unknown[]) => void;
  /** Called after the row was saved. */
  onEdit?: () => void;
  onClose: () => void;
  initiator: 'EditRowForm';
}

declare const EditRowForm: (props: EditRowFormProps) => JSX.Element;
export default EditRowForm;
