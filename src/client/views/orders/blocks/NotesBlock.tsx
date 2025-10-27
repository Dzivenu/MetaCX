"use client";

import { NotesBlock } from "@/client/components/blocks";

interface OrderNotesBlockProps {
  orderId: string;
}

export function OrderNotesBlock({ orderId }: OrderNotesBlockProps) {
  return (
    <NotesBlock
      noteType="ORDER"
      entityId={orderId}
      title="Order Notes"
      showAddButton={true}
      showResolveOption={true}
    />
  );
}
