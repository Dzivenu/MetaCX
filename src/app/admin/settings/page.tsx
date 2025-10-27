"use client";

import React, { useState, useEffect } from "react";
import { Container, Title, Tabs, Loader, Center } from "@mantine/core";
import { ReceiptSettings } from "@/client/views/settings/ReceiptSettings";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string | null>("receipt");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Container size="xl" py="xl">
        <Center>
          <Loader />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">
        Settings
      </Title>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="receipt">Receipt</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="receipt" pt="xl">
          <ReceiptSettings />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
