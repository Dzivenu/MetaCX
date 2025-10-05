"use client";

import React, { useState } from "react";
import { Container, Title, Text, Tabs, rem } from "@mantine/core";
import { IconPlus, IconList } from "@tabler/icons-react";
import CreateRepositoryTab from "@/client/components/Admin/Repositories/CreateRepositoryTab";
import ManageRepositoriesTab from "@/client/components/Admin/Repositories/ManageRepositoriesTab";
import dynamic from "next/dynamic";

const OrderingRepositoriesTab = dynamic(
  () => import("@/client/components/Admin/Repositories/OrderingRepositoriesTab"),
  { ssr: false }
);

export default function AdminRepositoriesPage() {
  const [activeTab, setActiveTab] = useState<string | null>("manage");
  const [refreshTick, setRefreshTick] = useState(0);

  const iconStyle = { width: rem(12), height: rem(12) };

  return (
    <Container size="xl" py="xl">
      <div style={{ marginBottom: "2rem" }}>
        <Title order={1} mb="xs">
          Repository Management
        </Title>
        <Text c="dimmed" size="sm">
          Manage your organization&apos;s repositories and their settings
        </Text>
      </div>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="manage" leftSection={<IconList style={iconStyle} />}> 
            Manage
          </Tabs.Tab>
          <Tabs.Tab value="ordering" leftSection={<IconList style={iconStyle} />}>
            Ordering
          </Tabs.Tab>
          <Tabs.Tab value="create" leftSection={<IconPlus style={iconStyle} />}>
            Create
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="manage" pt="md">
          <ManageRepositoriesTab
            active={activeTab === "manage"}
            refreshSignal={refreshTick}
          />
        </Tabs.Panel>

        <Tabs.Panel value="create" pt="md">
          <CreateRepositoryTab
            onCreated={() => {
              setActiveTab("manage");
              setRefreshTick((t) => t + 1);
            }}
          />
        </Tabs.Panel>

        <Tabs.Panel value="ordering" pt="md">
          <OrderingRepositoriesTab />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
