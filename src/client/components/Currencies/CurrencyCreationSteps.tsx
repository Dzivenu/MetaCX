import React from "react";
import { Stepper, Button, Group, Container, Grid } from "@mantine/core";
import { AppCurrencySelection } from "./AppCurrencySelection";
import { CurrencyDetails } from "./CurrencyDetails";
import { useCurrencyCreation } from "@/client/contexts/CurrencyCreationContext";

interface CurrencyCreationStepsProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export const CurrencyCreationSteps: React.FC<CurrencyCreationStepsProps> = ({
  onComplete,
  onCancel,
}) => {
  const { currentStep, setCurrentStep } = useCurrencyCreation();
  const { reset } = useCurrencyCreation();

  return (
    <Container size="lg" py="xl">
      <Grid gutter="xl" align="start">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stepper
            active={currentStep}
            onStepClick={setCurrentStep}
            orientation="vertical"
          >
            <Stepper.Step
              label="Select Currency"
              description="Choose from app currencies"
            />
            <Stepper.Step
              label="Enter Details"
              description="Add currency details"
            />
          </Stepper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          {currentStep === 0 && <AppCurrencySelection />}
          {currentStep === 1 && (
            <CurrencyDetails
              onComplete={() => {
                // Reset the creation state after successful creation
                reset();
                onComplete?.();
              }}
            />
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
};
