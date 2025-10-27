"use client";

import { useState } from "react";
import { Button, Group, Stack, Title } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useActiveSession } from "@/client/hooks/useActiveSession";
import { useTransfers } from "@/client/hooks/useTransfers";
import TransferList from "@/client/views/transfers/TransferList";

export default function TransfersPage() {
  const router = useRouter();
  const { activeSession } = useActiveSession();
  const { transfers, isLoading } = useTransfers(activeSession?._id);

  const handleCreateTransfer = () => {
    router.push("/portal/transfers/create");
  };

  const canCreateTransfer =
    activeSession?.status === "FLOAT_OPEN_COMPLETE" && !isLoading;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Float Transfers</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleCreateTransfer}
          disabled={!canCreateTransfer}
        >
          Create Transfer
        </Button>
      </Group>

      <TransferList transfers={transfers} loading={isLoading} />
    </Stack>
  );
}
