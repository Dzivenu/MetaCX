"use client";

import React from "react";
import { NotesBlock, SessionNotesBlock, CustomerNotesBlock } from "./index";
import type { NoteType } from "./NotesBlock";

// Example 1: Using the generic NotesBlock component directly
export function GenericNotesExample() {
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Order Notes */}
      <NotesBlock
        noteType="ORDER"
        entityId="order-123"
        title="Order Notes"
        showAddButton={true}
        showResolveOption={true}
      />

      {/* Session Notes - Compact version */}
      <NotesBlock
        noteType="SESSION"
        entityId="session-456"
        title="Session Notes"
        showAddButton={true}
        showResolveOption={true}
        compact={true}
      />

      {/* Customer Notes - Read-only */}
      <NotesBlock
        noteType="CUSTOMER"
        entityId="customer-789"
        title="Customer Notes"
        showAddButton={false}
        showResolveOption={false}
      />

      {/* Repository Notes */}
      <NotesBlock
        noteType="REPOSITORY"
        entityId="repo-001"
        title="Repository Notes"
        showAddButton={true}
        showResolveOption={false}
      />
    </div>
  );
}

// Example 2: Using specialized components
export function SpecializedNotesExample() {
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Session Notes using specialized component */}
      <SessionNotesBlock sessionId="session-456" />

      {/* Customer Notes using specialized component */}
      <CustomerNotesBlock customerId="customer-789" compact={true} />
    </div>
  );
}

// Example 3: Dynamic notes component
interface DynamicNotesProps {
  noteType: NoteType;
  entityId: string;
  title?: string;
  readOnly?: boolean;
}

export function DynamicNotes({ noteType, entityId, title, readOnly = false }: DynamicNotesProps) {
  return (
    <NotesBlock
      noteType={noteType}
      entityId={entityId}
      title={title}
      showAddButton={!readOnly}
      showResolveOption={noteType === "ORDER" || noteType === "SESSION"}
      compact={readOnly}
    />
  );
}

// Example usage in a real component
export function OrderDetailPage({ orderId }: { orderId: string }) {
  return (
    <div>
      <h1>Order Details</h1>
      
      {/* Order-specific notes */}
      <NotesBlock
        noteType="ORDER"
        entityId={orderId}
        title="Order Notes"
        showAddButton={true}
        showResolveOption={true}
      />
      
      {/* Customer notes for the order's customer */}
      <NotesBlock
        noteType="CUSTOMER"
        entityId="customer-123"
        title="Customer Notes"
        showAddButton={true}
        showResolveOption={false}
      />
    </div>
  );
}

// Example usage in a session management page
export function SessionDetailPage({ sessionId }: { sessionId: string }) {
  return (
    <div>
      <h1>Session Details</h1>
      
      {/* Session notes */}
      <SessionNotesBlock sessionId={sessionId} />
      
      {/* Repository notes for the session */}
      <NotesBlock
        noteType="REPOSITORY"
        entityId="repo-456"
        title="Repository Notes"
        showAddButton={true}
        showResolveOption={false}
      />
    </div>
  );
}
