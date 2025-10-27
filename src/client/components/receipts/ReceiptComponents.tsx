import React, { CSSProperties, ReactNode } from "react";
import "./receipt.css";

interface TextProps {
  fontSize?: number;
  bold?: boolean;
  children: ReactNode;
  margin?: string;
  center?: boolean;
}

export const Text = ({ fontSize, bold, children, margin, center }: TextProps) => {
  const style: CSSProperties = {
    fontWeight: bold ? "bold" : "normal",
    fontSize: fontSize ? `${fontSize}em` : "100%",
    margin: margin,
    textAlign: center ? "center" : "left",
  };

  return <div style={style}>{children}</div>;
};

interface TitleProps {
  center?: boolean;
  bold?: boolean;
  children: ReactNode;
  h1?: boolean;
  h2?: boolean;
  h3?: boolean;
  h4?: boolean;
  padded?: boolean;
}

export const Title = ({ center, bold, children, h1, h2, h3 = true, h4, padded }: TitleProps) => {
  const fontSize = h1 ? 1.4 : h2 ? 1.2 : h3 ? 1 : h4 ? 0.9 : 0.75;
  const margin = padded ? "0.5em 0" : "0";

  return (
    <div
      style={{
        display: "flex",
        alignItems: center ? "center" : "flex-start",
        justifyContent: center ? "center" : "flex-start",
        width: "100%",
        textAlign: center ? "center" : "left",
      }}
    >
      <Text bold={bold} fontSize={fontSize} margin={margin} center={center}>
        {children}
      </Text>
    </div>
  );
};

export const Br = () => <br />;

export const Line = () => (
  <div style={{ width: "100%", margin: "0.5em 0" }}>
    <div style={{ borderTop: "0.1px solid black", width: "100%" }} />
  </div>
);

export const Cut = () => (
  <div style={{ width: "100%", margin: "0.5em 0 2em" }}>
    <div style={{ borderTop: "0.5px dotted black", width: "100%" }} />
  </div>
);

export const Divider = () => (
  <div style={{ width: "100%", margin: "0.5em 0" }}>---------</div>
);

interface RowProps {
  left: ReactNode;
  right: ReactNode;
}

export const Row = ({ left, right }: RowProps) => (
  <div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
      }}
    >
      <Text>{left}</Text>
      <Text>{right}</Text>
    </div>
  </div>
);

interface BreakdownItem {
  count: number;
  denomination: number;
}

interface BreakdownProps {
  ticker: string;
  breakdowns?: BreakdownItem[];
}

export const Breakdown = ({ ticker, breakdowns = [] }: BreakdownProps) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(amount);
  };

  return (
    <>
      {breakdowns.map((breakdown, index) => {
        const count = parseFloat(String(breakdown.count));
        const denominatedValue = breakdown.denomination;

        const formattedCount = formatAmount(count);
        const formattedDenominatedValue = formatAmount(denominatedValue);

        return (
          <Text key={index}>
            {formattedCount} x {formattedDenominatedValue} {ticker}
          </Text>
        );
      })}
    </>
  );
};

interface SectionProps {
  children: ReactNode;
  padded?: boolean;
}

export const Section = ({ children, padded }: SectionProps) => {
  const styles: CSSProperties = {
    padding: padded ? "0 0.5em" : "0",
  };

  return <div style={styles}>{children}</div>;
};

interface ContainerProps {
  children: ReactNode;
  fontSize?: number;
  fontFamily?: string;
  paddingLeft?: number;
  paddingRight?: number;
}

export const Container = ({
  children,
  fontSize = 12,
  fontFamily = "monospace",
  paddingLeft = 5,
  paddingRight = 5,
}: ContainerProps) => {
  const paperEdgesSafetyPadding = 1;
  const finalPaddingLeft = paddingLeft + paperEdgesSafetyPadding;
  const finalPaddingRight = paddingRight + paperEdgesSafetyPadding;

  const dynamicStyles = `
    .thermal-printer-container {
      font-size: ${fontSize}px !important;
      padding-left: ${finalPaddingLeft}px !important;
      padding-right: ${finalPaddingRight}px !important;
      font-family: ${fontFamily} !important;
      line-height: ${fontSize}px !important;
    }
  `;

  return (
    <>
      <style>{dynamicStyles}</style>
      <div className="thermal-printer-container">
        {children}
        <Cut />
      </div>
    </>
  );
};

interface HTMLContentProps {
  content: string;
}

export const HTMLContent = ({ content }: HTMLContentProps) => {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
};
