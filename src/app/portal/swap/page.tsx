"use client";

import { Button, Group, Stack, Title } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useActiveSession } from "@/client/hooks/useActiveSession";
import { useSwap } from "@/client/hooks/useSwap";
import SwapList from "@/client/views/swaps/SwapList";

export default function SwapPage() {
  const router = useRouter();
  const { activeSession } = useActiveSession();
  const { swaps, isLoading } = useSwap(activeSession?._id as any);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Currency Swaps</Title>
        <Button onClick={() => router.push("/portal/swap/create")}>
          Create Swap
        </Button>
      </Group>
      <SwapList swaps={swaps} loading={isLoading} />
    </Stack>
  );
}
