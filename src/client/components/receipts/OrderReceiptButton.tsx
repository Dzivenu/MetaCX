"use client";

import React, { useRef, useCallback } from "react";
import { Button } from "@mantine/core";
import { IconPrinter } from "@tabler/icons-react";
import { useReactToPrint } from "react-to-print";
import OrderReceiptTemplate from "./OrderReceiptTemplate";
import "./receipt.css";
import { notifications } from "@mantine/notifications";
import { useOrgSettings } from "@/client/hooks/useOrgSettings";

interface OrderBreakdown {
  direction: string;
  count: number;
  denomination: {
    value: number;
  };
}

interface Customer {
  firstName?: string;
  lastName?: string;
}

interface Order {
  _id: string;
  displayId?: string;
  createdAt: number;
  inboundTicker: string;
  inboundSum: number;
  outboundTicker: string;
  outboundSum: number;
  inboundType?: string;
  outboundType?: string;
  finalRate?: number;
  fee?: number;
  networkFee?: number;
  outboundCryptoAddress?: string;
  batchedStatus?: string;
  customer?: Customer;
  breakdowns?: OrderBreakdown[];
}

interface OrderReceiptButtonProps {
  order: Order;
  disabled?: boolean;
  inboundDisclaimer?: string;
  outboundDisclaimer?: string;
  scheduleDisclaimer?: string;
}

export default function OrderReceiptButton({
  order,
  disabled = false,
  inboundDisclaimer = "",
  outboundDisclaimer = "",
  scheduleDisclaimer = "",
}: OrderReceiptButtonProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { settings } = useOrgSettings();

  const validateReceiptData = useCallback((order: Order) => {
    if (!order) {
      return false;
    }

    if (!order._id) {
      return false;
    }

    if (!order.inboundTicker || !order.outboundTicker) {
      return false;
    }

    if (order.inboundSum === undefined || order.outboundSum === undefined) {
      return false;
    }

    return true;
  }, []);

  const handlePrintWithValidation = useCallback(async () => {
    try {
      if (!validateReceiptData(order)) {
        notifications.show({
          title: "Cannot Print Receipt",
          message: "Missing required order data",
          color: "red",
        });
        return false;
      }

      if (!contentRef.current) {
        notifications.show({
          title: "Receipt Not Ready",
          message: "Please try again",
          color: "yellow",
        });
        return false;
      }

      const contentElement = contentRef.current;
      const hasTextContent = contentElement?.textContent?.trim()?.length ?? 0 > 0;
      const hasHtmlContent = contentElement?.innerHTML?.trim()?.length ?? 0 > 0;

      if (!hasTextContent || !hasHtmlContent) {
        notifications.show({
          title: "Receipt Empty",
          message: "Cannot print empty receipt",
          color: "red",
        });
        return false;
      }

      handleUSBPrint();
      return true;
    } catch (error) {
      notifications.show({
        title: "Print Error",
        message: "Failed to print receipt",
        color: "red",
      });
      return false;
    }
  }, [order, validateReceiptData]);

  const handleUSBPrint = useReactToPrint({
    contentRef,
    onAfterPrint: () => {
      notifications.show({
        title: "Receipt Printed",
        message: "Receipt sent to printer",
        color: "green",
      });
    },
    onPrintError: () => {
      notifications.show({
        title: "Print Failed",
        message: "Failed to print receipt",
        color: "red",
      });
    },
  });

  return (
    <>
      <Button
        leftSection={<IconPrinter size={16} />}
        variant="outline"
        color="green"
        disabled={disabled}
        onClick={handlePrintWithValidation}
      >
        Print Receipt
      </Button>

      <div className="show-only-print">
        <OrderReceiptTemplate
          ref={contentRef}
          order={order}
          inboundDisclaimer={settings?.thermalReceiptInboundCryptoOrderDisclaimerHtml || inboundDisclaimer}
          outboundDisclaimer={settings?.thermalReceiptOutboundCryptoOrderDisclaimerHtml || outboundDisclaimer}
          scheduleDisclaimer={settings?.thermalReceiptScheduledOrderDisclaimerHtml || scheduleDisclaimer}
          fontSize={settings?.thermalReceiptFontSizePixels}
          fontFamily={settings?.thermalReceiptFontFace}
          paddingLeft={settings?.thermalReceiptLeftPaddingPixels}
          paddingRight={settings?.thermalReceiptRightPaddingPixels}
        />
      </div>
    </>
  );
}
