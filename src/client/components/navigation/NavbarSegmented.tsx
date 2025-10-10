"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { SegmentedControl, ActionIcon, Tooltip } from "@mantine/core";
import { useRouter, usePathname } from "@/client/providers/router-provider";
import classes from "./NavbarSegmented.module.css";
import navigationConfig from "@/shared/config/navigation-config.json";
import type { NavigationConfig } from "@/shared/types/navigation";

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

interface NavbarSegmentedProps {
  disabled?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function NavbarSegmented({
  disabled = false,
  collapsed = false,
  onToggleCollapse,
}: NavbarSegmentedProps) {
  const [section, setSection] = useState<"admin" | "portal">("admin");
  const [active, setActive] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);

  // Helper function to find active menu item and section based on pathname
  const getActiveMenuFromPath = useCallback((currentPath: string) => {
    // Check all sections for matching menu items
    for (const sectionKey of ["admin", "portal"] as const) {
      const sectionItems = config[sectionKey];
      for (const item of sectionItems) {
        // Exact match or path starts with menu item link
        if (
          currentPath === item.link ||
          currentPath.startsWith(item.link + "/")
        ) {
          return {
            section: sectionKey,
            activeItem: item.name,
          };
        }
      }
    }

    // If no exact match, check if we're in admin or portal section
    if (currentPath.startsWith("/admin")) {
      return { section: "admin" as const, activeItem: "" };
    }
    if (currentPath.startsWith("/portal")) {
      return { section: "portal" as const, activeItem: "" };
    }

    // Default to admin if no match
    return { section: "admin" as const, activeItem: "" };
  }, []);

  // Update active menu item based on current pathname, and auto-switch section only if there's a match
  useEffect(() => {
    if (pathname) {
      const { section: pathSection, activeItem } =
        getActiveMenuFromPath(pathname);

      // Always update the active item
      setActive(activeItem);

      // Only auto-switch section if we found a matching menu item
      if (activeItem !== "") {
        setSection(pathSection);
      }
    }
  }, [pathname, getActiveMenuFromPath]);

  // Avoid SSR hydration issues and potential ref churn loops
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Section change handler - allow manual section changes but don't navigate
  const handleSectionChange = useCallback(
    (value: string) => {
      if (!disabled) {
        const newSection = value as "admin" | "portal";
        setSection(newSection);
        // Don't navigate - just change which menu items are shown
        // Clear active item since we're switching sections manually
        setActive("");
      }
    },
    [disabled]
  );

  const links = useMemo(() => {
    return config[section].map((item) => {
      const IconComponent = iconMap[item.icon as keyof typeof iconMap];

      const linkContent = (
        <div
          className={`${classes.link} ${collapsed ? classes.linkCollapsed : ""}`}
          data-active={(item.name === active && active !== "") || undefined}
          key={item.name}
          onClick={() => {
            if (!disabled) {
              router.push(item.link);
            }
          }}
          style={{
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            pointerEvents: disabled ? "none" : "auto",
          }}
          title={collapsed ? item.name : item.description}
        >
          <IconComponent className={classes.linkIcon} stroke={1.5} />
          {!collapsed && <span>{item.name}</span>}
        </div>
      );

      // Wrap with Tooltip when collapsed
      if (collapsed) {
        return (
          <Tooltip key={item.name} label={item.name} position="right" withArrow>
            {linkContent}
          </Tooltip>
        );
      }

      return linkContent;
    });
  }, [section, active, disabled, collapsed, router]);

  const segmentedData = useMemo(
    () => [
      { label: "Admin", value: "admin" },
      { label: "Portal", value: "portal" },
    ],
    []
  );

  return (
    <nav
      className={`${classes.navbar} ${collapsed ? classes.navbarCollapsed : ""}`}
    >
      <div className={classes.navbarTop}>
        {!collapsed && hasMounted && (
          <SegmentedControl
            value={section}
            onChange={handleSectionChange}
            transitionTimingFunction="ease"
            fullWidth
            disabled={disabled}
            data={segmentedData}
          />
        )}
        {collapsed && hasMounted && (
          <div className={classes.collapsedSectionIndicator}>
            <Tooltip
              label={section === "admin" ? "Admin Mode" : "Portal Mode"}
              position="right"
              withArrow
            >
              <div className={classes.sectionBadge}>
                {section === "admin" ? "A" : "P"}
              </div>
            </Tooltip>
          </div>
        )}
      </div>

      <div className={classes.navbarMain}>{links}</div>

      <div className={classes.footer}>
        <Tooltip
          label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          position="right"
          withArrow
        >
          <ActionIcon
            onClick={onToggleCollapse}
            variant="subtle"
            size="lg"
            className={classes.toggleButton}
            disabled={disabled}
          >
            {collapsed ? (
              <IconChevronRight size={20} />
            ) : (
              <IconChevronLeft size={20} />
            )}
          </ActionIcon>
        </Tooltip>
      </div>
    </nav>
  );
}
