"use client";

import React, { useMemo, useEffect, useRef } from "react";
import { Grid, NumberInput, Select } from "@mantine/core";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";
import { useComponentLogger } from "@/client/utils/logger";

export function InboundFields() {
  const { form, setFormField, currencies, getAvailableRepositories } =
    useOrderCreation();

  const logger = useComponentLogger("InboundFields");
  const renderCount = useRef(0);
  const prevProps = useRef({ form, currencies });

  // Track renders and detect infinite loops
  renderCount.current += 1;

  useEffect(() => {
    logger.logRender({
      renderCount: renderCount.current,
      formData: {
        inboundTicker: form.inboundTicker,
        inboundSum: form.inboundSum,
        inboundRepositoryId: form.inboundRepositoryId,
      },
      currenciesCount: currencies.length,
    });

    // Check for prop changes
    if (prevProps.current.form.inboundTicker !== form.inboundTicker) {
      logger.logPropChange(
        "form.inboundTicker",
        prevProps.current.form.inboundTicker,
        form.inboundTicker
      );
    }
    if (prevProps.current.form.inboundSum !== form.inboundSum) {
      logger.logPropChange(
        "form.inboundSum",
        prevProps.current.form.inboundSum,
        form.inboundSum
      );
    }
    if (prevProps.current.currencies.length !== currencies.length) {
      logger.logPropChange(
        "currencies.length",
        prevProps.current.currencies.length,
        currencies.length
      );
    }

    prevProps.current = { form, currencies };

    if (renderCount.current > 20) {
      logger.logError("Possible infinite loop detected - too many renders", {
        renderCount: renderCount.current,
        formData: form,
        currenciesCount: currencies.length,
      });
    }
  });

  const inboundRepos = getAvailableRepositories(form.inboundTicker);

  const currencyOptions = useMemo(
    () =>
      currencies.map((c) => ({
        value: c.ticker,
        label: `${c.ticker} - ${c.name}`,
      })),
    [currencies]
  );

  const repositoryOptions = useMemo(
    () => [
      { value: "", label: "Select repository" },
      ...inboundRepos.map((r) => ({ value: r.id, label: r.name })),
    ],
    [inboundRepos]
  );

  return (
    <div className="space-y-4">
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Select
            label="Inbound Currency"
            data={currencyOptions}
            value={form.inboundTicker}
            onChange={(v) => setFormField("inboundTicker", v || "")}
            required
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <NumberInput
            label="Inbound Amount"
            value={form.inboundSum}
            onChange={(v) => setFormField("inboundSum", Number(v) || 0)}
            decimalScale={2}
            step={0.01}
            min={0}
            required
          />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Select
            label="Inbound Repository"
            data={repositoryOptions}
            value={form.inboundRepositoryId || ""}
            onChange={(v) =>
              setFormField("inboundRepositoryId", v || undefined)
            }
          />
        </Grid.Col>
      </Grid>
    </div>
  );
}
