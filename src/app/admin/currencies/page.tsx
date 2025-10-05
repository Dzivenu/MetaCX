"use client";

import React, { useState } from "react";
import { Container, Title, Text, Tabs, rem } from "@mantine/core";
import { IconPlus, IconList, IconCurrencyDollar } from "@tabler/icons-react";
import CreateCurrencyTab from "@/client/components/Admin/Currencies/CreateCurrencyTab";
import ManageCurrenciesTab from "@/client/components/Admin/Currencies/ManageCurrenciesTab";
import AppCurrenciesTab from "@/client/components/Admin/Currencies/AppCurrenciesTab";
import dynamic from "next/dynamic";

const OrderingTab = dynamic(
  () => import("@/client/components/Admin/Currencies/OrderingTab"),
  { ssr: false }
);

export default function AdminCurrenciesPage() {
  const [activeTab, setActiveTab] = useState<string | null>("manage");
  const [refreshTick, setRefreshTick] = useState(0);

  const iconStyle = { width: rem(12), height: rem(12) };

  const handleCurrencyCreated = () => {
    // Switch back to manage tab after currency creation and refresh list
    setActiveTab("manage");
    setRefreshTick((t) => t + 1);
  };

  const handleCancelCreation = () => {
    // Switch back to manage tab on cancel
    setActiveTab("manage");
  };

  return (
    <Container size="xl" py="xl">
      <div style={{ marginBottom: "2rem" }}>
        <Title order={1} mb="xs">
          Currency Management
        </Title>
        <Text c="dimmed" size="sm">
          Manage your organization&apos;s currencies and their settings
        </Text>
      </div>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="manage" leftSection={<IconList style={iconStyle} />}>
            Manage
          </Tabs.Tab>
          <Tabs.Tab
            value="app-currencies"
            leftSection={<IconCurrencyDollar style={iconStyle} />}
          >
            App Currencies
          </Tabs.Tab>
          <Tabs.Tab
            value="ordering"
            leftSection={<IconList style={iconStyle} />}
          >
            Ordering
          </Tabs.Tab>
          <Tabs.Tab value="create" leftSection={<IconPlus style={iconStyle} />}>
            Create
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="manage" pt="md">
          <ManageCurrenciesTab
            active={activeTab === "manage"}
            refreshSignal={refreshTick}
          />
        </Tabs.Panel>

        <Tabs.Panel value="app-currencies" pt="md">
          <AppCurrenciesTab
            active={activeTab === "app-currencies"}
            refreshSignal={refreshTick}
          />
        </Tabs.Panel>

        <Tabs.Panel value="ordering" pt="md">
          <OrderingTab />
        </Tabs.Panel>

        <Tabs.Panel value="create" pt="md">
          <CreateCurrencyTab
            onComplete={handleCurrencyCreated}
            onCancel={handleCancelCreation}
          />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
