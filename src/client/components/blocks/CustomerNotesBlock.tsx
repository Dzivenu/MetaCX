"use client";

import { NotesBlock } from "./NotesBlock";

interface CustomerNotesBlockProps {
  customerId: string;
  compact?: boolean;
}

export function CustomerNotesBlock({ customerId, compact = false }: CustomerNotesBlockProps) {
  return (
    <NotesBlock
      noteType="CUSTOMER"
      entityId={customerId}
      title="Customer Notes"
      showAddButton={true}
      showResolveOption={false}
      compact={compact}
    />
  );
}
