"use client";

import React, { useMemo, useEffect, useRef } from "react";
import { Grid, NumberInput, Select } from "@mantine/core";
import { useOrderCreation } from "@/client/contexts/OrderCreationContext";
import { useComponentLogger } from "@/client/utils/logger";

export function OutboundFields() {
  const { form, setFormField, currencies, getAvailableRepositories } =
    useOrderCreation();

  const logger = useComponentLogger("OutboundFields");
  const renderCount = useRef(0);
  const prevProps = useRef({ form, currencies });

  // Track renders and detect infinite loops
  renderCount.current += 1;

  useEffect(() => {
    logger.logRender({
      renderCount: renderCount.current,
      formData: {
        outboundTicker: form.outboundTicker,
        outboundSum: form.outboundSum,
        outboundRepositoryId: form.outboundRepositoryId,
      },
      currenciesCount: currencies.length,
    });

    // Check for prop changes
    if (prevProps.current.form.outboundTicker !== form.outboundTicker) {
      logger.logPropChange(
        "form.outboundTicker",
        prevProps.current.form.outboundTicker,
        form.outboundTicker
      );
    }
    if (prevProps.current.form.outboundSum !== form.outboundSum) {
      logger.logPropChange(
        "form.outboundSum",
        prevProps.current.form.outboundSum,
        form.outboundSum
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

  const outboundRepos = getAvailableRepositories(form.outboundTicker);

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
      ...outboundRepos.map((r) => ({ value: r.id, label: r.name })),
    ],
    [outboundRepos]
  );

  return (
    <div className="space-y-4">
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Select
            label="Outbound Currency"
            data={currencyOptions}
            value={form.outboundTicker}
            onChange={(v) => setFormField("outboundTicker", v || "")}
            required
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <NumberInput
            label="Outbound Amount (from quote)"
            value={form.outboundSum}
            readOnly
            precision={6}
            step={0.000001}
            min={0}
          />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Select
            label="Outbound Repository"
            data={repositoryOptions}
            value={form.outboundRepositoryId || ""}
            onChange={(v) =>
              setFormField("outboundRepositoryId", v || undefined)
            }
          />
        </Grid.Col>
      </Grid>
    </div>
  );
}
