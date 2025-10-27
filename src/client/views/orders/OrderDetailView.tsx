"use client";

import React, { useState } from "react";
import { Container, Group, Title, Button, Stack, Paper, Modal, Card, Text, Badge, ActionIcon } from "@mantine/core";
import { IconArrowLeft, IconNotes, IconNote, IconEdit, IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { OrderProvider } from "@/client/providers/order-provider";
import { QuoteBlock } from "@/client/views/orders/blocks/QuoteBlock";
import { CustomerBlock } from "@/client/views/orders/blocks/CustomerBlock";
import { BreakdownBlock } from "@/client/views/orders/blocks/BreakdownBlock";
import { OrderNotesBlock } from "@/client/views/orders/blocks/NotesBlock";
import { useShortId } from "@/client/hooks/useShortId";
import { useOrgOrderById } from "@/client/hooks/useOrgOrderByIdConvex";
import { CustomerNotesBlock } from "@/client/components/blocks";
import { NoteForm, type NoteFormData } from "@/client/components/blocks/NoteForm";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";
import { OrderReceiptButton } from "@/client/components/receipts";

interface OrderDetailViewProps {
  orderId: string;
}

export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const router = useRouter();
  const shortOrderId = useShortId(orderId, 8, "#");
  const { order } = useOrgOrderById(orderId);
  const [customerNotesModalOpen, setCustomerNotesModalOpen] = useState(false);
  const [editingLatestNote, setEditingLatestNote] = useState(false);
  const [deleteConfirmLatestNote, setDeleteConfirmLatestNote] = useState(false);
  const { orgId } = useAuth();

  const customerNotes = useQuery(
    (api.functions as any).orgNotes?.getOrgNotesByEntitySimple,
    orgId && order?.orgCustomerId
      ? {
          noteType: "CUSTOMER",
          entityId: order.orgCustomerId,
          clerkOrganizationId: orgId,
        }
      : "skip"
  );

  const latestNote = customerNotes && customerNotes.length > 0
    ? customerNotes.reduce((latest: any, note: any) => 
        note.updatedAt > latest.updatedAt ? note : latest
      )
    : null;

  const updateNoteMutation = useMutation(
    (api.functions as any).orgNotes?.updateOrgNote
  );
  const deleteNoteMutation = useMutation(
    (api.functions as any).orgNotes?.deleteOrgNote
  );

  const handleUpdateLatestNote = async (data: NoteFormData) => {
    if (!latestNote) return;
    try {
      await updateNoteMutation({
        noteId: latestNote._id as Id<"org_notes">,
        title: data.title,
        message: data.message,
      });
      setEditingLatestNote(false);
    } catch (error) {

    }
  };

  const handleDeleteLatestNote = async () => {
    if (!latestNote) return;
    try {
      await deleteNoteMutation({ noteId: latestNote._id as Id<"org_notes"> });
      setDeleteConfirmLatestNote(false);
    } catch (error) {

    }
  };

  const handleBack = () => {
    router.push("/portal/orders");
  };

  return (
    <OrderProvider initialOrderId={orderId}>
      <Container size="xl" py="xl">
        {/* Header */}
        <Group justify="space-between" align="center" mb="xl">
          <Title order={1}>Order {shortOrderId || orderId}</Title>
          <Button
            variant="outline"
            leftSection={<IconArrowLeft size={16} />}
            onClick={handleBack}
          >
            Back to Orders
          </Button>
        </Group>

        {/* Order Details - Full width sections stacked vertically */}
        <Stack gap="lg">
          {/* Customer Notes Section */}
          <Paper withBorder p="md">
            <Group justify="space-between" align="center">
              <Title order={3}>Order actions</Title>
              <Group gap="sm">
                {order && (
                  <OrderReceiptButton
                    order={{
                      _id: order._id,
                      displayId: order.displayId,
                      createdAt: new Date(order.createdAt).getTime(),
                      inboundTicker: order.inboundTicker || "",
                      inboundSum: parseFloat(order.inboundSum || "0"),
                      outboundTicker: order.outboundTicker || "",
                      outboundSum: parseFloat(order.outboundSum || "0"),
                      inboundType: order.inboundType,
                      outboundType: order.outboundType,
                      finalRate: order.finalRate,
                      fee: order.fee,
                      networkFee: order.networkFee,
                      outboundCryptoAddress: order.outboundCryptoAddress,
                      batchedStatus: order.batchedStatus,
                      customer: order.customer ? {
                        firstName: order.customer.firstName,
                        lastName: order.customer.lastName,
                      } : undefined,
                      breakdowns: order.breakdowns,
                    }}
                    disabled={!order}
                  />
                )}
                <Button
                  leftSection={<IconNotes size={16} />}
                  variant="outline"
                  disabled={!order?.orgCustomerId}
                  onClick={() => setCustomerNotesModalOpen(true)}
                >
                  Customer Notes
                </Button>
              </Group>
            </Group>
          </Paper>

          {/* Customer Notes Modal */}
          <Modal
            opened={customerNotesModalOpen}
            onClose={() => setCustomerNotesModalOpen(false)}
            title="Customer Notes"
            size="lg"
          >
            {order?.orgCustomerId && (
              <CustomerNotesBlock customerId={order.orgCustomerId} />
            )}
          </Modal>

          {latestNote && order?.orgCustomerId && (
            <Card withBorder p="md">
              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    <IconNote size={16} />
                    <Text fw={600} size="sm">
                      Latest Customer Note
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">
                      {new Date(latestNote.updatedAt).toLocaleString()}
                    </Text>
                    {latestNote.resolvable && (
                      <Badge
                        size="sm"
                        color={latestNote.resolved ? "green" : "orange"}
                        variant="light"
                      >
                        {latestNote.resolved ? "Resolved" : "Needs Resolution"}
                      </Badge>
                    )}
                    <ActionIcon
                      size="sm"
                      variant="light"
                      color="blue"
                      onClick={() => setEditingLatestNote(true)}
                      title="Edit note"
                    >
                      <IconEdit size={14} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="light"
                      color="red"
                      onClick={() => setDeleteConfirmLatestNote(true)}
                      title="Delete note"
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Group>
                {latestNote.title && (
                  <Text fw={500} size="sm">
                    {latestNote.title}
                  </Text>
                )}
                <Text size="sm" c="dimmed">
                  {latestNote.message}
                </Text>
              </Stack>
            </Card>
          )}

          <Modal
            opened={editingLatestNote}
            onClose={() => setEditingLatestNote(false)}
            title="Edit Customer Note"
            size="md"
          >
            {latestNote && (
              <NoteForm
                initialData={{
                  title: latestNote.title,
                  message: latestNote.message,
                  resolvable: latestNote.resolvable,
                }}
                onSubmit={handleUpdateLatestNote}
                onCancel={() => setEditingLatestNote(false)}
                submitLabel="Update Note"
                showResolveOption={false}
              />
            )}
          </Modal>

          <Modal
            opened={deleteConfirmLatestNote}
            onClose={() => setDeleteConfirmLatestNote(false)}
            title="Delete Customer Note"
            size="sm"
          >
            <Stack gap="md">
              <Text size="sm">
                Are you sure you want to delete this note? This action cannot be undone.
              </Text>
              <Group justify="flex-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmLatestNote(false)}
                >
                  Cancel
                </Button>
                <Button
                  color="red"
                  onClick={handleDeleteLatestNote}
                >
                  Delete
                </Button>
              </Group>
            </Stack>
          </Modal>

          <QuoteBlock orderId={orderId} mode="preview" />

          {/* Customer - Full width */}
          <CustomerBlock orderId={orderId} mode="preview" />

          {/* Breakdown - Full width */}
          <BreakdownBlock orderId={orderId} mode="preview" />

          {/* Notes - Full width */}
          <OrderNotesBlock orderId={orderId} />
        </Stack>
      </Container>
    </OrderProvider>
  );
}
