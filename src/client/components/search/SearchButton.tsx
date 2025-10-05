'use client';

import { Group, Text } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { spotlight } from '@mantine/spotlight';

export function SearchButton() {
  return (
    <Group
      gap="xs"
      style={{
        cursor: 'pointer',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid var(--mantine-color-gray-4)',
        backgroundColor: 'transparent',
        width: 'clamp(280px, 36vw, 560px)',
        transition: 'border-color 0.15s ease',
      }}
      onClick={spotlight.open}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--mantine-color-blue-5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--mantine-color-gray-4)';
      }}
    >
      <IconSearch size={16} color="var(--mantine-color-gray-6)" />
      <Text size="sm" c="dimmed" style={{ flex: 1 }}>
        Search pages...
      </Text>
      <Text size="xs" c="dimmed" style={{ 
        padding: '2px 6px', 
        backgroundColor: 'var(--mantine-color-gray-2)', 
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontWeight: 500
      }}>
        ⌘K
      </Text>
    </Group>
  );
}