'use client';

import { Spotlight, SpotlightActionData, spotlight } from '@mantine/spotlight';
import { IconSearch } from '@tabler/icons-react';
import { useRouter } from '@/client/providers/router-provider';
import navigationConfig from '@/shared/config/navigation-config.json';
import type { NavigationConfig } from '@/shared/types/navigation';
import {
  IconDashboard,
  IconCurrencyDollar,
  IconUsers,
  IconFileText,
  IconClock,
  IconChartBar,
  IconDatabase,
  IconCoins,
  IconTrendingUp,
  IconBuilding,
  IconFileAnalytics,
  IconActivity,
  IconTool,
  IconShield,
  IconReportMoney,
  IconBuildingBank,
  IconUserX,
  IconSettings,
  IconShoppingCart,
  IconTransfer,
  IconReceipt,
  IconArrowsExchange,
  IconEye,
} from '@tabler/icons-react';

// Icon mapping for dynamic icon resolution
const iconMap = {
  IconDashboard,
  IconCurrencyDollar,
  IconUsers,
  IconFileText,
  IconClock,
  IconChartBar,
  IconDatabase,
  IconCoins,
  IconTrendingUp,
  IconBuilding,
  IconFileAnalytics,
  IconActivity,
  IconTool,
  IconShield,
  IconReportMoney,
  IconBuildingBank,
  IconUserX,
  IconSettings,
  IconShoppingCart,
  IconTransfer,
  IconReceipt,
  IconArrowsExchange,
  IconEye,
} as const;

const config = navigationConfig as NavigationConfig;

export function SearchSpotlight() {
  const router = useRouter();

  // Create grouped actions from navigation config
  const actions = [
    {
      group: 'Admin Pages',
      actions: config.admin.map((item) => {
        const IconComponent = iconMap[item.icon as keyof typeof iconMap];
        return {
          id: `admin-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
          label: item.name,
          description: item.description,
          onClick: () => router.push(item.link),
          leftSection: <IconComponent size={24} stroke={1.5} />,
          keywords: [item.name, item.description, 'admin'],
        };
      }),
    },
    {
      group: 'Portal Pages',
      actions: config.portal.map((item) => {
        const IconComponent = iconMap[item.icon as keyof typeof iconMap];
        return {
          id: `portal-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
          label: item.name,
          description: item.description,
          onClick: () => router.push(item.link),
          leftSection: <IconComponent size={24} stroke={1.5} />,
          keywords: [item.name, item.description, 'portal'],
        };
      }),
    },
  ];

  return (
    <Spotlight
      actions={actions}
      nothingFound="Nothing found..."
      highlightQuery
      limit={10}
      searchProps={{
        leftSection: <IconSearch size={20} stroke={1.5} />,
        placeholder: 'Search pages...',
      }}
      shortcut={['mod + K', 'mod + P']}
    />
  );
}