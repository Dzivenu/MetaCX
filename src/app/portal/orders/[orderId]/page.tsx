import { OrderDetailView } from "@/client/views/orders/OrderDetailView";

export default async function OrderViewPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <OrderDetailView orderId={orderId} />;
}
