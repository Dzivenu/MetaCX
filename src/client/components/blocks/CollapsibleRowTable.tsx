"use client";

import { useState, ReactNode } from "react";
import {
  Box,
  Group,
  Text,
  Button,
  ActionIcon,
} from "@mantine/core";
import { DataTable, DataTableColumn } from "mantine-datatable";
import {
  IconChevronRight,
  IconChevronDown,
} from "@tabler/icons-react";

export interface CollapsibleRowTableProps<T = unknown> {
  /** Array of data records to display */
  records: T[];
  /** Function to get unique identifier for each record */
  idAccessor: string | ((record: T) => string);
  /** Column definitions for the table */
  columns: DataTableColumn<T>[];
  /** Function to render the expanded content for each row */
  renderExpandedContent: (record: T, collapse: () => void) => ReactNode;
  /** Optional title for the table */
  title?: string;
  /** Optional refresh function */
  onRefresh?: () => void;
  /** Whether to show table borders */
  withTableBorder?: boolean;
  /** Whether to show column borders */
  withColumnBorders?: boolean;
  /** Whether to show striped rows */
  striped?: boolean;
  /** Whether to highlight rows on hover */
  highlightOnHover?: boolean;
  /** Whether to allow multiple rows to be expanded at once */
  allowMultiple?: boolean;
  /** Custom loading state */
  loading?: boolean;
  /** Custom empty state message */
  emptyStateMessage?: string;
  /** Additional props to pass to DataTable */
  dataTableProps?: Record<string, unknown>;
}

export function CollapsibleRowTable<T = unknown>({
  records,
  idAccessor,
  columns,
  renderExpandedContent,
  title,
  onRefresh,
  withTableBorder = true,
  withColumnBorders = true,
  striped = true,
  highlightOnHover = true,
  allowMultiple = false,
  loading = false,
  emptyStateMessage = "No records found",
  dataTableProps = {},
}: CollapsibleRowTableProps<T>) {
  const [expandedRecordIds, setExpandedRecordIds] = useState<string[]>([]);

  // Helper function to get record ID
  const getRecordId = (record: T): string => {
    if (typeof idAccessor === "string") {
      return (record as Record<string, unknown>)[idAccessor] as string;
    }
    return idAccessor(record);
  };

  // Handle expand/collapse toggle
  const toggleExpansion = (recordId: string) => {
    setExpandedRecordIds((prev) => {
      const isExpanded = prev.includes(recordId);
      
      if (isExpanded) {
        // Collapse this row
        return prev.filter((id) => id !== recordId);
      } else {
        // Expand this row
        if (allowMultiple) {
          return [...prev, recordId];
        } else {
          // Only allow one expanded at a time
          return [recordId];
        }
      }
    });
  };

  // Create columns with expand button
  const enhancedColumns: DataTableColumn<T>[] = [
    {
      accessor: "expand",
      title: "",
      width: 40,
      textAlign: "center",
      render: (record) => {
        const recordId = getRecordId(record);
        const isExpanded = expandedRecordIds.includes(recordId);
        
        return (
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpansion(recordId);
            }}
          >
            {isExpanded ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )}
          </ActionIcon>
        );
      },
    },
    ...columns,
  ];

  return (
    <Box>
      {(title || onRefresh) && (
        <Group justify="space-between" mb="md">
          {title && (
            <Text size="lg" fw={500}>
              {title}
            </Text>
          )}
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm">
              Refresh
            </Button>
          )}
        </Group>
      )}

      <DataTable
        withTableBorder={withTableBorder}
        borderRadius="sm"
        withColumnBorders={withColumnBorders}
        striped={striped}
        highlightOnHover={highlightOnHover}
        records={records}
        idAccessor={idAccessor}
        columns={enhancedColumns}
        fetching={loading}
        noRecordsText={emptyStateMessage}
        rowExpansion={{
          allowMultiple,
          trigger: "never", // Disable automatic expansion on row click
          expanded: {
            recordIds: expandedRecordIds,
            onRecordIdsChange: setExpandedRecordIds,
          },
          content: ({ record, collapse }) => {
            return renderExpandedContent(record, collapse);
          },
        }}
        {...dataTableProps}
        style={{ background: "transparent", ...(dataTableProps?.style || {}) }}
      />
    </Box>
  );
}

export default CollapsibleRowTable;
