"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OrderCreationProvider } from "@/client/contexts/OrderCreationContext";
import { OrderCreationStepsView } from "@/client/views/orders/OrderCreationStepsView";
import { OrderDetailView } from "@/client/views/orders/OrderDetailView";

function CreateOrderContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  // If orderId is provided, show the order detail view
  if (orderId) {
    return <OrderDetailView orderId={orderId} />;
  }

  // Otherwise, show the order creation flow
  return (
    <OrderCreationProvider>
      <OrderCreationStepsView />
    </OrderCreationProvider>
  );
}

export default function CreateOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateOrderContent />
    </Suspense>
  );
}
