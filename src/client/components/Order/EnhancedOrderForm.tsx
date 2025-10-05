"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Repository {
  id: string;
  name: string;
  currencyTickers: string[];
}

interface Currency {
  ticker: string;
  name: string;
  typeOf: string;
}

interface QuoteResult {
  fxRate: number;
  finalRate: number;
  finalRateWithoutFees: number;
  margin: number;
  fee: number;
  networkFee: number;
  outboundSum: number;
}

interface OrderFormData {
  sessionId: string;
  userId: string;
  inboundTicker: string;
  inboundSum: number;
  outboundTicker: string;
  outboundSum: number;
  inboundRepositoryId?: string;
  outboundRepositoryId?: string;
  status: string;
}

export default function EnhancedOrderForm() {
  const router = useRouter();
  const [form, setForm] = useState<OrderFormData>({
    sessionId: "",
    userId: "",
    inboundTicker: "CAD",
    inboundSum: 0,
    outboundTicker: "BTC",
    outboundSum: 0,
    status: "QUOTE",
  });

  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Load repositories and currencies on mount
  useEffect(() => {
    loadRepositories();
    loadCurrencies();
  }, []);

  // Auto-calculate quote when amounts change
  useEffect(() => {
    if (form.inboundSum > 0 && form.inboundTicker && form.outboundTicker) {
      calculateQuote();
    }
  }, [form.inboundSum, form.inboundTicker, form.outboundTicker]);

  const loadRepositories = async () => {
    try {
      const response = await fetch("/api/repositories");
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load repositories:", error);
    }
  };

  const loadCurrencies = async () => {
    try {
      const response = await fetch("/api/currencies");
      if (response.ok) {
        const data = await response.json();
        setCurrencies(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load currencies:", error);
    }
  };

  const calculateQuote = async () => {
    if (!form.sessionId || !form.userId) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/orders/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status: "QUOTE",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setQuote(data.data.quote);
        if (data.data.quote) {
          setForm((prev) => ({
            ...prev,
            outboundSum: data.data.quote.outboundSum,
          }));
        }
      } else {
        setError(data.error || "Failed to calculate quote");
      }
    } catch (error) {
      setError("Failed to calculate quote");
      console.error("Quote calculation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name.toLowerCase().includes("sum") ? Number(value) : value,
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quote) {
      setError("Please generate a quote first");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Create order with ACCEPTED status
      const orderData = {
        ...form,
        status: "ACCEPTED",
        fxRate: quote.fxRate,
        finalRate: quote.finalRate,
        finalRateWithoutFees: quote.finalRateWithoutFees,
        margin: quote.margin,
        fee: quote.fee,
        networkFee: quote.networkFee,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (response.ok) {
        const orderId = data.data?.id;
        if (orderId) {
          // Auto-breakdown and commit (like the original)
          await createBreakdowns(orderId);
          await commitBreakdowns(orderId);
          router.push(`/portal/orders/${orderId}`);
        }
      } else {
        setError(data.error || "Failed to create order");
      }
    } catch (error) {
      setError("Failed to create order");
      console.error("Order creation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const createBreakdowns = async (orderId: string) => {
    try {
      await fetch(`/api/orders/${orderId}/breakdowns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intention: "CREATE" }),
      });
    } catch (error) {
      console.error("Failed to create breakdowns:", error);
    }
  };

  const commitBreakdowns = async (orderId: string) => {
    try {
      await fetch(`/api/orders/${orderId}/breakdowns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intention: "COMMIT" }),
      });
    } catch (error) {
      console.error("Failed to commit breakdowns:", error);
    }
  };

  const getAvailableRepositories = (currencyTicker: string) => {
    return repositories.filter((repo) =>
      repo.currencyTickers?.includes(currencyTicker)
    );
  };

  const getCurrencyType = (ticker: string) => {
    const currency = currencies.find((c) => c.ticker === ticker);
    return currency?.typeOf || "Unknown";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Create Order</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Session and User Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Session ID *
            </label>
            <input
              name="sessionId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.sessionId}
              onChange={onChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">User ID *</label>
            <input
              name="userId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.userId}
              onChange={onChange}
              required
            />
          </div>
        </div>

        {/* Inbound Currency */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">
            Inbound (What customer gives us)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Currency *
              </label>
              <select
                name="inboundTicker"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.inboundTicker}
                onChange={onChange}
                required
              >
                {currencies.map((currency) => (
                  <option key={currency.ticker} value={currency.ticker}>
                    {currency.ticker} - {currency.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Type: {getCurrencyType(form.inboundTicker)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Amount *</label>
              <input
                name="inboundSum"
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.inboundSum}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Repository
              </label>
              <select
                name="inboundRepositoryId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.inboundRepositoryId || ""}
                onChange={onChange}
              >
                <option value="">Select Repository</option>
                {getAvailableRepositories(form.inboundTicker).map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Outbound Currency */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">
            Outbound (What we give customer)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Currency *
              </label>
              <select
                name="outboundTicker"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.outboundTicker}
                onChange={onChange}
                required
              >
                {currencies.map((currency) => (
                  <option key={currency.ticker} value={currency.ticker}>
                    {currency.ticker} - {currency.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Type: {getCurrencyType(form.outboundTicker)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                name="outboundSum"
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                value={form.outboundSum}
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Calculated from quote
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Repository
              </label>
              <select
                name="outboundRepositoryId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.outboundRepositoryId || ""}
                onChange={onChange}
              >
                <option value="">Select Repository</option>
                {getAvailableRepositories(form.outboundTicker).map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quote Display */}
        {quote && (
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="text-lg font-medium mb-4">Quote Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Exchange Rate:</span>{" "}
                {quote.fxRate.toFixed(6)}
              </div>
              <div>
                <span className="font-medium">Final Rate:</span>{" "}
                {quote.finalRate.toFixed(6)}
              </div>
              <div>
                <span className="font-medium">Service Fee:</span>{" "}
                {quote.fee.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Network Fee:</span>{" "}
                {quote.networkFee.toFixed(6)}
              </div>
              <div>
                <span className="font-medium">Margin:</span>{" "}
                {quote.margin.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Rate w/o Fees:</span>{" "}
                {quote.finalRateWithoutFees.toFixed(6)}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={calculateQuote}
            disabled={
              loading || !form.sessionId || !form.userId || !form.inboundSum
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Calculating..." : "Generate Quote"}
          </button>

          <button
            type="submit"
            disabled={loading || !quote}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
