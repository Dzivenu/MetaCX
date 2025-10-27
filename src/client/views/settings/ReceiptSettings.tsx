"use client";

import React from "react";
import { Stack, Divider } from "@mantine/core";
import { FontSizeSettings } from "./receipt/FontSizeSettings";
import { FontFaceSettings } from "./receipt/FontFaceSettings";
import { PaddingSettings } from "./receipt/PaddingSettings";
import { OrderHeaderSettings } from "./receipt/OrderHeaderSettings";
import { OrderFooterSettings } from "./receipt/OrderFooterSettings";
import { InboundDisclaimerSettings } from "./receipt/InboundDisclaimerSettings";
import { OutboundDisclaimerSettings } from "./receipt/OutboundDisclaimerSettings";
import { ScheduleDisclaimerSettings } from "./receipt/ScheduleDisclaimerSettings";
import { AutoPrintSettings } from "./receipt/AutoPrintSettings";

export function ReceiptSettings() {
  return (
    <Stack gap="xl">
      <AutoPrintSettings />
      <Divider />
      <FontSizeSettings />
      <Divider />
      <FontFaceSettings />
      <Divider />
      <PaddingSettings />
      <Divider />
      <OrderHeaderSettings />
      <Divider />
      <OrderFooterSettings />
      <Divider />
      <InboundDisclaimerSettings />
      <Divider />
      <OutboundDisclaimerSettings />
      <Divider />
      <ScheduleDisclaimerSettings />
    </Stack>
  );
}
