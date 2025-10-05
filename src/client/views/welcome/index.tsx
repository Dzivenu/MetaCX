"use client";

import React from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Center,
  Card,
  SimpleGrid,
  Box,
} from "@mantine/core";
import {
  IconLogin,
  IconUserPlus,
  IconCurrencyBitcoin,
  IconCurrencyDollar,
  IconExchange,
} from "@tabler/icons-react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

export default function WelcomePage() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <Container size="lg" py="xl">
        <Center style={{ minHeight: "calc(100vh - 200px)" }}>
          <Stack align="center" gap="xl" maw={800}>
            <Stack align="center" gap="md">
              <Title order={1} size="4rem" ta="center" fw={700}>
                YAP Exchange
              </Title>
              <Text size="xl" c="dimmed" ta="center" maw={600}>
                Advanced Currency Exchange Platform supporting multiple
                exchanges, cryptocurrencies, and fiat currencies
              </Text>
              <Text size="md" c="dimmed" ta="center">
                Trade seamlessly across different exchanges with real-time rates
                and secure transactions. Sign in to access your trading
                dashboard.
              </Text>
            </Stack>

            <Group gap="md">
              <SignInButton mode="modal">
                <Button
                  size="lg"
                  variant="filled"
                  leftSection={<IconLogin size={20} />}
                >
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button
                  size="lg"
                  variant="outline"
                  leftSection={<IconUserPlus size={20} />}
                >
                  Sign Up
                </Button>
              </SignUpButton>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mt="xl">
              <Card withBorder shadow="sm" radius="md" p="lg">
                <Stack align="center" gap="md">
                  <IconExchange size={40} color="var(--mantine-color-blue-6)" />
                  <Text fw={500} ta="center">
                    Multiple Exchanges
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Connect to multiple cryptocurrency and fiat exchanges for
                    optimal trading opportunities
                  </Text>
                </Stack>
              </Card>

              <Card withBorder shadow="sm" radius="md" p="lg">
                <Stack align="center" gap="md">
                  <IconCurrencyBitcoin
                    size={40}
                    color="var(--mantine-color-orange-6)"
                  />
                  <Text fw={500} ta="center">
                    Crypto & Fiat Support
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Trade Bitcoin, Ethereum, and other cryptocurrencies
                    alongside traditional fiat currencies
                  </Text>
                </Stack>
              </Card>

              <Card withBorder shadow="sm" radius="md" p="lg">
                <Stack align="center" gap="md">
                  <IconCurrencyDollar
                    size={40}
                    color="var(--mantine-color-green-6)"
                  />
                  <Text fw={500} ta="center">
                    Real-time Rates
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Access live exchange rates and market data across all
                    supported currencies and trading pairs
                  </Text>
                </Stack>
              </Card>
            </SimpleGrid>
          </Stack>
        </Center>
      </Container>
    </div>
  );
}
