"use client";

import { NotesBlock } from "./NotesBlock";

interface SessionNotesBlockProps {
  sessionId: string;
  compact?: boolean;
}

export function SessionNotesBlock({ sessionId, compact = false }: SessionNotesBlockProps) {
  return (
    <NotesBlock
      noteType="SESSION"
      entityId={sessionId}
      title="Session Notes"
      showAddButton={true}
      showResolveOption={true}
      compact={compact}
    />
  );
}
