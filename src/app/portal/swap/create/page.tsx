"use client";

import { Stack, Title } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useActiveSession } from "@/client/hooks/useActiveSession";
import { useSwap } from "@/client/hooks/useSwap";
import { useCurrencies } from "@/client/hooks/useCurrenciesConvex";
import { useRepositories } from "@/client/hooks/useRepositories";
import CreateSwapForm from "@/client/views/swaps/CreateSwapForm";

export default function CreateSwapPage() {
  const router = useRouter();
  const { activeSession } = useActiveSession();
  const { createSwap } = useSwap(activeSession?._id as any);
  const { currencies } = useCurrencies();
  const { repositories } = useRepositories();

  const handleSubmit = async (data: any) => {
    await createSwap(data);
    router.push("/portal/swap");
  };

  const handleCancel = () => {
    router.push("/portal/swap");
  };

  if (!activeSession) {
    return <div>Loading...</div>;
  }

  return (
    <Stack gap="md">
      <Title order={2}>Create Currency Swap</Title>
      <CreateSwapForm
        sessionId={activeSession._id as any}
        currencies={currencies}
        repositories={repositories}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </Stack>
  );
}
