"use client";

import React from "react";
import { CurrencyCreationSteps } from "@/client/components/Currencies/CurrencyCreationSteps";
import { CurrencyCreationProvider } from "@/client/contexts/CurrencyCreationContext";
import { Text, Title } from "@mantine/core";

interface CreateCurrencyTabProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function CreateCurrencyTab({
  onComplete,
  onCancel,
}: CreateCurrencyTabProps) {
  const handleComplete = () => {
    // Switch back to manage tab after creation
    if (onComplete) {
      onComplete();
    }
  };

  const handleCancel = () => {
    // Switch back to manage tab on cancel
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div>
      {/* Intro header removed per request */}

      <CurrencyCreationProvider>
        <CurrencyCreationSteps
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </CurrencyCreationProvider>
    </div>
  );
}
