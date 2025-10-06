"use client";

import React from "react";
import { Paper, Grid, Group, Text, NumberInput, Box } from "@mantine/core";
import { QuoteResult } from "@/client/contexts/OrderCreationContext";

interface QuoteDetailsSectionProps {
  quote: QuoteResult;
}

export function QuoteDetailsSection({ quote }: QuoteDetailsSectionProps) {
  return (
    <Paper
      p="lg"
      radius="md"
      withBorder
      className="bg-gray-50 dark:bg-gray-900"
    >
      <Grid gutter="lg">
        {/* Final Selling Rate */}
        <Grid.Col span={3}>
          <Box>
            <Group gap="xs" align="center" className="mb-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <Text size="sm" className="text-gray-400">
                Final Selling Rate
              </Text>
            </Group>
            <NumberInput
              value={quote.finalRate}
              readOnly
              size="lg"
              decimalScale={6}
              hideControls
              styles={{
                input: {
                  backgroundColor: "#1f2937",
                  borderColor: "#374151",
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "bold",
                  textAlign: "center" as const,
                  borderRadius: "6px",
                },
              }}
            />
          </Box>
        </Grid.Col>

        {/* Margin (%) */}
        <Grid.Col span={3}>
          <Box>
            <Group gap="xs" align="center" className="mb-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <Text size="sm" className="text-gray-400">
                Margin (%)
              </Text>
            </Group>
            <NumberInput
              value={quote.margin}
              readOnly
              size="lg"
              decimalScale={2}
              hideControls
              styles={{
                input: {
                  backgroundColor: "#1f2937",
                  borderColor: "#374151",
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "bold",
                  textAlign: "center" as const,
                  borderRadius: "6px",
                },
              }}
            />
          </Box>
        </Grid.Col>

        {/* Service Fee ($) */}
        <Grid.Col span={3}>
          <Box>
            <Group gap="xs" align="center" className="mb-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <Text size="sm" className="text-gray-400">
                Service Fee ($)
              </Text>
            </Group>
            <NumberInput
              value={quote.fee}
              readOnly
              size="lg"
              decimalScale={2}
              hideControls
              styles={{
                input: {
                  backgroundColor: "#1f2937",
                  borderColor: "#374151",
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "bold",
                  textAlign: "center" as const,
                  borderRadius: "6px",
                },
              }}
            />
          </Box>
        </Grid.Col>

        {/* Network Fee ($) */}
        <Grid.Col span={3}>
          <Box>
            <Group gap="xs" align="center" className="mb-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <Text size="sm" className="text-gray-400">
                Network Fee ($)
              </Text>
            </Group>
            <NumberInput
              value={quote.networkFee}
              readOnly
              size="lg"
              decimalScale={6}
              hideControls
              styles={{
                input: {
                  backgroundColor: "#1f2937",
                  borderColor: "#374151",
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "bold",
                  textAlign: "center" as const,
                  borderRadius: "6px",
                },
              }}
            />
          </Box>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}
