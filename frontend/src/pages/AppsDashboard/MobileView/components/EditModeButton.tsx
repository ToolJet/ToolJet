import React from 'react';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/Button/Button';

interface EditModeButtonProps {
  editing: boolean;
  onToggle: () => void;
}

// "Edit" enters pin editing; the round check leaves it. Changes save as they are made, so the check only exits.
export function EditModeButton({ editing, onToggle }: EditModeButtonProps) {
  if (editing) {
    return (
      <Button
        iconOnly
        variant="outline"
        aria-label="Done editing"
        className="tw-size-11 tw-rounded-full"
        onClick={onToggle}
      >
        <Check aria-hidden className="tw-size-5" />
      </Button>
    );
  }

  return (
    <Button variant="outline" className="tw-h-11 tw-rounded-full tw-font-title-x-large tw-px-5" onClick={onToggle}>
      Edit
    </Button>
  );
}
