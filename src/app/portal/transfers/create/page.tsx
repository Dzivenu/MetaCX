"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stack, Title, Stepper, Button, Group } from "@mantine/core";
import { useActiveSession } from "@/client/hooks/useActiveSession";
import { useTransfers } from "@/client/hooks/useTransfers";
import { useOrgFloat } from "@/client/hooks/useOrgFloatConvex";
import TransferStepOne from "@/client/views/transfers/create/StepOne";
import TransferStepTwo from "@/client/views/transfers/create/StepTwo";
import TransferStepThree from "@/client/views/transfers/create/StepThree";
import type { Id } from "@/../../convex/_generated/dataModel";

export default function CreateTransferPage() {
  const router = useRouter();
  const { activeSession } = useActiveSession();
  const { createTransfer } = useTransfers(activeSession?._id as any);
  const { orgFloat } = useOrgFloat(activeSession?._id);
  const repositories = orgFloat?.repositories || [];

  const [active, setActive] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [transferData, setTransferData] = useState({
    currencyType: "",
    sourceRepoId: "",
    targetRepoId: "",
    ticker: "",
    sum: "",
    breakdowns: [] as any[],
  });

  const nextStep = () =>
    setActive((current) => (current < 2 ? current + 1 : current));
  const prevStep = () =>
    setActive((current) => (current > 0 ? current - 1 : current));

  const handleCancel = () => {
    router.push("/portal/transfers");
  };

  const handleSubmit = async () => {
    if (!activeSession) return;

    setSubmitting(true);
    try {
      console.log("Creating transfer with data:", transferData);
      console.log("Breakdowns being sent:", transferData.breakdowns);

      await createTransfer({
        sessionId: activeSession._id as any,
        outboundRepositoryId:
          transferData.sourceRepoId as Id<"org_repositories">,
        inboundRepositoryId:
          transferData.targetRepoId as Id<"org_repositories">,
        outboundTicker: transferData.ticker,
        inboundTicker: transferData.ticker,
        outboundSum: transferData.sum,
        inboundSum: transferData.sum,
        breakdowns: transferData.breakdowns,
      });

      router.push("/portal/transfers");
    } catch (error) {
      console.error("Failed to create transfer:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const step0Valid =
    transferData.currencyType !== "" &&
    transferData.sourceRepoId !== "" &&
    transferData.targetRepoId !== "" &&
    transferData.ticker !== "" &&
    transferData.sum !== "" &&
    parseFloat(transferData.sum) > 0 &&
    transferData.sourceRepoId !== transferData.targetRepoId;

  const step1Valid =
    true; // Step 1 (breakdown) is now optional

  const canProceed =
    active === 0 ? step0Valid : active === 1 ? step1Valid : true;

  return (
    <Stack gap="md">
      <Title order={2}>Create Transfer</Title>

      <Stepper active={active} onStepClick={setActive}>
        <Stepper.Step label="Basic Information" description="Enter amount and details">
          <TransferStepOne
            transferData={transferData}
            setTransferData={setTransferData}
            repositories={repositories || []}
          />
        </Stepper.Step>

        <Stepper.Step label="Breakdown (Optional)" description="Specify denominations">
          <TransferStepTwo
            transferData={transferData}
            setTransferData={setTransferData}
            repositories={repositories || []}
          />
        </Stepper.Step>

        <Stepper.Step label="Confirmation" description="Confirm details">
          <TransferStepThree
            transferData={transferData}
            repositories={repositories || []}
          />
        </Stepper.Step>
      </Stepper>

      <Group justify="space-between" mt="xl">
        <Button variant="default" onClick={handleCancel}>
          Cancel
        </Button>
        <Group>
          {active > 0 && (
            <Button variant="default" onClick={prevStep}>
              Back
            </Button>
          )}
          {active < 2 ? (
            <Button onClick={nextStep} disabled={!canProceed}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={submitting}>
              Submit Transfer
            </Button>
          )}
        </Group>
      </Group>
    </Stack>
  );
}
