import React, { useState, useEffect } from "react";
import type { Currency } from "@/client/hooks/useCurrenciesConvex";

interface CurrencyFormProps {
  currency?: Currency;
  onSubmit: (data: Partial<Currency>) => void;
  onCancel: () => void;
  currencyType?: "crypto" | "fiat" | "metal";
}

export const CurrencyForm: React.FC<CurrencyFormProps> = ({
  currency,
  onSubmit,
  onCancel,
  currencyType = "fiat",
}) => {
  const [formData, setFormData] = useState<Partial<Currency>>({
    name: "",
    ticker: "",
    rate: 1.0,
    buyMarginMax: 1.0,
    sellMarginMax: 1.0,
    sellMarginMin: 0,
    tradeable: true,
    sign: "$",
    typeOf: currencyType,
    floatDisplayOrder: 0,
    fxReservePool: 0.0,
    fxReserveWeight: 0.0,
    sellMarginTarget: "0.0",
    buyMarginTarget: "0.0",
    displayWeightWeb: "0.0",
    displayWeightFloat: "0.0",
    source: "",
    floatThresholdBottom: 0.0,
    floatThresholdTop: 0.0,
    fxReserveHardcostPool: 0.0,
    hexColor: "#D3D3D3",
    spread: 1.0,
    offset: 1.0,
    weBuy: 1.0,
    weSell: 1.0,
    floatTargetPercent: 0.0,
    floatTargetInCad: 0.0,
    floatThresholdElasticity: 0.01,
    rateDecimalPlaces: 2,
    amountDecimalPlaces: 2,
    offsetPremium: 0.0,
    rateApi: "",
    api: 0,
    network: "",
    chainId: "",
    symbol: "",
    contract: "",
    underlying: "",
    rateApiIdentifier: "",
    rateUpdatedAt: new Date(),
    advertisable: true,
    buyAdvertisable: true,
    sellAdvertisable: true,
    ...(currency || {}),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currency) {
      setFormData({
        ...currency,
        rateUpdatedAt: currency.rateUpdatedAt
          ? new Date(currency.rateUpdatedAt)
          : new Date(),
        createdAt: currency.createdAt
          ? new Date(currency.createdAt)
          : new Date(),
        updatedAt: currency.updatedAt
          ? new Date(currency.updatedAt)
          : new Date(),
      });
    } else {
      // Set currency type when creating new currency
      setFormData((prev) => ({ ...prev, typeOf: currencyType }));
    }
  }, [currency, currencyType]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.ticker?.trim()) {
      newErrors.ticker = "Ticker is required";
    }

    if (formData.rate === undefined || formData.rate <= 0) {
      newErrors.rate = "Rate must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    // Handle different input types
    let newValue: string | number | boolean = value;

    if (type === "number") {
      newValue = value === "" ? 0 : parseFloat(value);
    } else if (type === "checkbox") {
      newValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  interface FormField {
    name: string;
    label: string;
    type: string;
    required?: boolean;
    step?: string;
  }

  const getFormFields = (): FormField[] => {
    const baseFields: FormField[] = [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "ticker", label: "Ticker", type: "text", required: true },
      { name: "sign", label: "Symbol", type: "text" },
      {
        name: "rate",
        label: "Rate",
        type: "number",
        required: true,
        step: "0.0001",
      },
    ];

    const cryptoFields: FormField[] = [
      { name: "network", label: "Network", type: "text" },
      { name: "chainId", label: "Chain ID", type: "text" },
      { name: "contract", label: "Contract Address", type: "text" },
      { name: "symbol", label: "Symbol", type: "text" },
    ];

    const fiatFields: FormField[] = [
      { name: "source", label: "Source", type: "text" },
    ];

    const commonFields: FormField[] = [
      { name: "tradeable", label: "Tradeable", type: "checkbox" },
      { name: "advertisable", label: "Advertisable", type: "checkbox" },
      { name: "buyAdvertisable", label: "Buy Advertisable", type: "checkbox" },
      {
        name: "sellAdvertisable",
        label: "Sell Advertisable",
        type: "checkbox",
      },
      { name: "hexColor", label: "Color", type: "color" },
      {
        name: "rateDecimalPlaces",
        label: "Rate Decimal Places",
        type: "number",
      },
      {
        name: "amountDecimalPlaces",
        label: "Amount Decimal Places",
        type: "number",
      },
    ];

    let fields: FormField[] = [...baseFields];

    if (currencyType === "crypto") {
      fields = [...fields, ...cryptoFields];
    } else if (currencyType === "fiat") {
      fields = [...fields, ...fiatFields];
    }

    return [...fields, ...commonFields];
  };

  const formFields = getFormFields();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formFields.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === "checkbox" ? (
              <input
                type="checkbox"
                id={field.name}
                name={field.name}
                checked={Boolean(formData[field.name as keyof typeof formData])}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            ) : (
              <input
                type={field.type}
                id={field.name}
                name={field.name}
                value={
                  (formData[field.name as keyof typeof formData] as string) ||
                  ""
                }
                onChange={handleChange}
                step={field.step}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            )}

            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {currency ? "Update" : "Create"} Currency
        </button>
      </div>
    </form>
  );
};
