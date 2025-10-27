import React, { forwardRef } from "react";
import {
  Text,
  Title,
  Breakdown,
  Container,
  Section,
  HTMLContent,
} from "./ReceiptComponents";
import "./receipt.css";

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

interface OrderReceiptTemplateProps {
  order: Order;
  inboundDisclaimer?: string;
  outboundDisclaimer?: string;
  scheduleDisclaimer?: string;
  fontSize?: number;
  fontFamily?: string;
  paddingLeft?: number;
  paddingRight?: number;
}

const OrderReceiptTemplate = forwardRef<HTMLDivElement, OrderReceiptTemplateProps>(
  (props, ref) => {
    const { 
      order, 
      inboundDisclaimer, 
      outboundDisclaimer, 
      scheduleDisclaimer,
      fontSize,
      fontFamily,
      paddingLeft,
      paddingRight
    } = props;

    if (!order || !order._id) {
      return null;
    }

    if (!order.inboundTicker || !order.outboundTicker) {
      return null;
    }

    if (order.inboundSum === undefined || order.outboundSum === undefined) {
      return null;
    }

    try {
      const data = generateReceipt({
        order,
        inboundDisclaimer,
        outboundDisclaimer,
        scheduleDisclaimer,
        fontSize,
        fontFamily,
        paddingLeft,
        paddingRight,
      });

      if (!data) {
        return null;
      }

      return (
        <div className="thermal-receipt-wrapper" ref={ref}>
          {data}
        </div>
      );
    } catch (error) {
      return null;
    }
  }
);

OrderReceiptTemplate.displayName = "OrderReceiptTemplate";

export default OrderReceiptTemplate;

const formatCurrencyAmount = (amount: number, ticker: string): string => {
  const decimals = ticker === "CAD" ? 2 : 8;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

const formatCurrencyRate = (rate: number, ticker: string): string => {
  const decimals = ticker === "CAD" ? 2 : 8;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rate);
};

const formatOrderBreakdown = (breakdowns: OrderBreakdown[]) => {
  return breakdowns.map((breakdown) => ({
    count: breakdown.count,
    denomination: breakdown.denomination.value,
  }));
};

const censorCryptoAddress = (address?: string): string => {
  if (!address) return "";
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const generateReceipt = ({
  order,
  inboundDisclaimer,
  outboundDisclaimer,
  scheduleDisclaimer,
  fontSize,
  fontFamily,
  paddingLeft,
  paddingRight,
}: OrderReceiptTemplateProps) => {
  if (!order?._id) {
    return null;
  }

  if (!order?.inboundTicker || !order?.outboundTicker) {
    return null;
  }

  if (order?.inboundSum === undefined || order?.outboundSum === undefined) {
    return null;
  }

  const orderId = order.displayId || String(order._id).slice(-8);
  const orderDate = new Date(order.createdAt).toLocaleString();

  const title = `Order #${orderId}`;

  const orderCustomer = order?.customer;
  const orderCustomerName = `${orderCustomer?.firstName || ""} ${
    orderCustomer?.lastName || ""
  }`.trim();

  const inboundTicker = order.inboundTicker;
  const inboundSum = order.inboundSum;

  const outboundTicker = order.outboundTicker;
  const outboundSum = order.outboundSum;

  let customerProvidedTotal: string;
  try {
    customerProvidedTotal = `${formatCurrencyAmount(
      inboundSum,
      inboundTicker
    )} ${inboundTicker} Total`;
  } catch (error) {
    return null;
  }

  const inboundBreakdown = (order.breakdowns || []).filter(
    (breakdown) => breakdown.direction === "INBOUND"
  );
  const customerProvidedBreakdown = formatOrderBreakdown(inboundBreakdown);

  let customerReceivesTotal: string;
  try {
    customerReceivesTotal = `${formatCurrencyAmount(
      outboundSum,
      outboundTicker
    )} ${outboundTicker} Total`;
  } catch (error) {
    return null;
  }

  const outboundBreakdown = (order.breakdowns || []).filter(
    (breakdown) => breakdown.direction === "OUTBOUND"
  );
  const customerReceivesBreakdown = formatOrderBreakdown(outboundBreakdown);

  const ratesAndFeesBreakdown = formatReceiptFeesContent(order).map(
    (content, index) => {
      return <Text key={index}> {content} </Text>;
    }
  );

  const orderIsCrypto =
    order.inboundType === "Cryptocurrency" ||
    order.outboundType === "Cryptocurrency";
  const footerBreakdown = formatReceiptFooterContent({
    order,
    inboundDisclaimer,
    outboundDisclaimer,
    scheduleDisclaimer,
    orderIsCrypto,
  });

  const receipt = (
    <Container
      fontSize={fontSize}
      fontFamily={fontFamily}
      paddingLeft={paddingLeft}
      paddingRight={paddingRight}
    >
      <Text bold padded>
        {title}
      </Text>

      <Section padded>
        <Text>{orderDate}</Text>
        <Text>Customer: {orderCustomerName}</Text>
      </Section>

      <Title bold padded>
        Vous avez donné: (You provided):
      </Title>

      <Section padded>
        <Breakdown ticker={inboundTicker} breakdowns={customerProvidedBreakdown} />
        <Text bold> {customerProvidedTotal} </Text>
      </Section>

      <Title bold padded>
        Vous recevez: (You received):
      </Title>

      <Section padded>
        <Breakdown ticker={outboundTicker} breakdowns={customerReceivesBreakdown} />
        <Text bold> {customerReceivesTotal} </Text>
      </Section>

      <Title bold padded>
        Taux de change: (Exchange rate):
      </Title>

      <Section padded>{ratesAndFeesBreakdown}</Section>

      {orderIsCrypto && (
        <Title bold padded>
          Avertissement / (Disclaimer):
        </Title>
      )}

      <Section padded>
        <HTMLContent content={footerBreakdown} />
      </Section>
    </Container>
  );

  return receipt;
};

const formatReceiptFeesContent = (order: Order): string[] => {
  const printMiniSectionDivider = "---------";
  const output: string[] = [];

  const inboundTicker = order?.inboundTicker;
  const inboundSum = order?.inboundSum;
  const outboundTicker = order?.outboundTicker;
  const outboundSum = order?.outboundSum;

  const finalRate = order?.finalRate;

  if (!finalRate) {
    output.push("Rate information not available for this order");
    return output;
  }

  const BASE_CURRENCY_TICKER = "CAD";

  if (inboundTicker === BASE_CURRENCY_TICKER) {
    const reciprocalRate = 1 / finalRate;

    const finalRateFormatted = formatCurrencyRate(finalRate, "CAD");
    const reciprocalRateFormatted = formatCurrencyRate(
      reciprocalRate,
      outboundTicker
    );

    const inboundSumFormatted = formatCurrencyAmount(inboundSum, inboundTicker);
    const outboundSumFormatted = formatCurrencyAmount(outboundSum, outboundTicker);

    output.push(`1 ${outboundTicker} = ${finalRateFormatted} CAD`);
    output.push(`1 CAD = ${reciprocalRateFormatted} ${outboundTicker}`);
    output.push(
      `${inboundSumFormatted} CAD = ${outboundSumFormatted} ${outboundTicker}`
    );
    output.push(printMiniSectionDivider);

    if (order.fee) {
      const serviceFee = formatCurrencyAmount(order.fee, "CAD");
      output.push(`Service fee / Frais de service: ${serviceFee} CAD`);
    }

    if (order.networkFee && parseFloat(String(order.networkFee)) > 0) {
      const networkFee = formatCurrencyAmount(order.networkFee, "CAD");
      output.push(`Network fee / Frais de réseau: ${networkFee} CAD`);
    }
  } else {
    const reciprocalRate = 1 / finalRate;

    const finalRateFormatted = formatCurrencyRate(finalRate, "CAD");
    const reciprocalRateFormatted = formatCurrencyRate(
      reciprocalRate,
      inboundTicker
    );

    const inboundSumFormatted = formatCurrencyAmount(inboundSum, inboundTicker);
    const outboundSumFormatted = formatCurrencyAmount(outboundSum, outboundTicker);

    output.push(`1 ${inboundTicker} = ${finalRateFormatted} CAD`);
    output.push(`1 CAD = ${reciprocalRateFormatted} ${inboundTicker}`);
    output.push(
      `${inboundSumFormatted} ${inboundTicker} = ${outboundSumFormatted} CAD`
    );
    output.push(printMiniSectionDivider);

    if (order.fee) {
      const serviceFee = formatCurrencyAmount(order.fee, "CAD");
      output.push(`Service fee / Frais de service: ${serviceFee} CAD`);
    }

    if (order.networkFee && parseFloat(String(order.networkFee)) > 0) {
      const networkFee = formatCurrencyAmount(order.networkFee, "CAD");
      output.push(`Network fee / Frais de réseau: ${networkFee} CAD`);
    }
  }

  const trimmedOutput = output
    .map((line) => line.trim())
    .filter((line) => line !== "");

  return trimmedOutput;
};

const formatReceiptFooterContent = ({
  order,
  inboundDisclaimer,
  outboundDisclaimer,
  scheduleDisclaimer,
  orderIsCrypto,
}: {
  order: Order;
  inboundDisclaimer?: string;
  outboundDisclaimer?: string;
  scheduleDisclaimer?: string;
  orderIsCrypto: boolean;
}): string => {
  let output = "";

  if (orderIsCrypto) {
    const disclaimer =
      order.inboundType === "Cryptocurrency"
        ? inboundDisclaimer
        : outboundDisclaimer;

    let wallet = order.outboundCryptoAddress;
    wallet = censorCryptoAddress(wallet);

    output = (disclaimer || "").replaceAll("__WALLET__", wallet);

    if (order.batchedStatus === "scheduled") {
      output = output + "<br />" + (scheduleDisclaimer || "");
    }
  }

  const orderCustomer = order?.customer;
  const customerName = orderCustomer?.firstName
    ? `${orderCustomer.firstName} ${orderCustomer.lastName || ""}`
    : "";

  output = output.replaceAll("__CUSTOMER_NAME__", customerName);
  output = output.replaceAll("Signature:", "<br /><br />Signature:");

  return output;
};
