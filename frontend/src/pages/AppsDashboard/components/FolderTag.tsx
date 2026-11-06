import React from 'react';
import { Folder } from 'lucide-react';

import { cn } from '@/lib/utils';
import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';

// Search lists nested apps beside stray ones, so the tag tells which folder an app sits in.
// The pill itself is the truncating element, so hovering any part of it shows the full name once it is cut off.
interface FolderTagProps {
  folderName: string;
  /** `root` is merged over the default (grid card) look; the list view passes its borderless variant. */
  classes?: { root?: string };
}

// Figma 4563-75104: no border or background, 4px side padding and placeholder-colored text.
export const LIST_FOLDER_TAG_CLASSES = { root: 'tw-border-0 tw-bg-transparent tw-px-1 tw-text-text-placeholder' };

export default function FolderTag({ folderName, classes }: FolderTagProps) {
  return (
    <TruncatedText
      as="span"
      arrow
      content={folderName}
      className={cn(
        'tw-inline-block tw-min-w-0 tw-shrink-[2] tw-rounded-full tw-border tw-border-solid tw-border-border-weak tw-bg-button-secondary tw-px-2 tw-py-0.5 tw-font-body-small tw-text-text-default',
        classes?.root
      )}
    >
      <Folder size={12} className="tw-mr-1 tw-inline tw-align-middle tw-text-icon-strong" aria-hidden />
      {folderName}
    </TruncatedText>
  );
}
