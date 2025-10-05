"use client";

import React from "react";
import { Button, Container, Group, Title } from "@mantine/core";
import { useRouter } from "next/navigation";
import { IconHistory } from "@tabler/icons-react";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";
import { useShortOrderId } from "@/client/hooks/useShortId";
import { QuoteStep } from "@/client/views/orders/steps/QuoteStep";
import { CustomerStep } from "@/client/views/orders/steps/CustomerStep";
import { BreakdownsStep } from "@/client/views/orders/steps/BreakdownsStep";
import { OrderDetailView } from "@/client/views/orders/OrderDetailView";

export function OrderCreationStepsView() {
  const router = useRouter();
  const {
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    canProceedFromStep,
    createOrder,
    creating,
    generateQuote,
    submitQuote,
    updateQuote,
    quoteState,
  } = useOrderCreation();

  // Generate short order ID for display
  const shortOrderId = useShortOrderId(quoteState.orderId);

  // Render current step content
  const renderCurrentStep = () => {
    // Always allow step 0 (quote step)
    if (currentStep === 0) {
      return <QuoteStep />;
    }

    // For steps beyond quote, require order ID to exist
    if (!quoteState.orderId) {
      console.warn(
        "Cannot show step",
        currentStep,
        "without order ID - returning to quote step"
      );
      return <QuoteStep />;
    }

    switch (currentStep) {
      case 1:
        return <CustomerStep />;
      case 2:
        return <BreakdownsStep />;
      case 3:
        return <OrderDetailView orderId={quoteState.orderId!} />;
      default:
        return <QuoteStep />;
    }
  };

  const onNext = async () => {
    if (currentStep < 3) {
      if (canProceedFromStep()) {
        // Save quote to database when moving from step 0 (quote step)
        if (currentStep === 0) {
          try {
            // Generate the quote first and get the result
            console.log("Generating quote...");
            const generatedQuote = await generateQuote();

            if (!generatedQuote) {
              console.error("Failed to generate quote");
              return;
            }

            console.log("Quote generated successfully:", generatedQuote);

            // Check if order already exists - create new or update existing
            let success = false;
            if (quoteState.orderId) {
              // Update existing order
              console.log("Updating existing order:", quoteState.orderId);
              success = await updateQuote();
            } else {
              // Create new order with the generated quote
              console.log("Creating new order with quote");
              success = await submitQuote(generatedQuote);
            }

            // Handle success based on operation type
            if (quoteState.orderId) {
              // For updates, check success and order ID
              if (success) {
                console.log(
                  "Order updated successfully with ID:",
                  quoteState.orderId
                );
                nextStep();
              } else {
                console.error(
                  "Quote update failed - cannot proceed to next step"
                );
              }
            } else {
              // For new orders, success from submitQuote means order was created
              if (success) {
                console.log(
                  "Order created successfully, proceeding to next step"
                );
                nextStep();
              } else {
                console.error(
                  "Quote submission failed - cannot proceed to next step"
                );
              }
            }
          } catch (error) {
            console.error("Failed to save/update quote:", error);
            // Do not proceed to next step if save fails
          }
        } else {
          // For other steps, if we have an existing order, update it with any changes
          if (quoteState.orderId) {
            try {
              const success = await updateQuote();
              if (success) {
                nextStep();
              } else {
                console.error(
                  "Failed to update order - cannot proceed to next step"
                );
              }
            } catch (error) {
              console.error(
                "Failed to update order on step transition:",
                error
              );
              // Do not proceed if update fails
            }
          } else {
            // No existing order, just proceed
            nextStep();
          }
        }
      }
      return;
    }
    // Final step: Complete the order and redirect to order details
    if (quoteState.orderId) {
      // Order already exists, just redirect to view it
      router.push(`/portal/orders/${quoteState.orderId}`);
    } else {
      // Fallback: create order if somehow we don't have one
      const id = await createOrder();
      if (id) router.push(`/portal/orders/${id}`);
    }
  };

  const onBack = () => {
    if (currentStep > 0) {
      // If we're on a step > 0 but don't have an order ID, reset to step 0
      if (currentStep > 0 && !quoteState.orderId) {
        console.warn("No order ID found - resetting to quote step");
        setCurrentStep(0);
      } else {
        prevStep();
      }
    }
  };

  return (
    <Container size="lg" py="xl">
      {/* Top header with title on left and all action buttons on right */}
      <Group justify="space-between" align="center" mb="xl">
        <Title order={1}>
          {shortOrderId ? `New Order ${shortOrderId}` : "New Order"}
        </Title>

        <Group>
          <Button
            variant="outline"
            leftSection={<IconHistory size={16} />}
            onClick={() => router.push("/portal/orders")}
          >
            Order History
          </Button>
          <Button
            variant="default"
            onClick={onBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          <Button
            onClick={onNext}
            loading={creating}
            disabled={!canProceedFromStep()}
          >
            {currentStep < 3
              ? "Next"
              : creating
                ? "Completing..."
                : "Complete Order"}
          </Button>
        </Group>
      </Group>

      {/* Render the current step content without stepper UI */}
      <div>{renderCurrentStep()}</div>
    </Container>
  );
}
