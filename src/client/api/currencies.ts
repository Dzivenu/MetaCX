// Types
export interface Denomination {
  id: string;
  name?: string | null;
  value: number;
  currencyId: string;
  createdAt: Date;
  updatedAt: Date;
  accepted: boolean;
}

export interface Currency {
  id: string;
  name: string;
  ticker: string;
  rate: number;
  buyMarginMax: number;
  sellMarginMax: number;
  sellMarginMin: number;
  tradeable: boolean;
  updateAt: Date;
  sign: string;
  photo: string;
  createdAt: Date;
  updatedAt: Date;
  buyMarginMin: number;
  typeOf: string;
  floatDisplayOrder: number;
  fxReservePool: number;
  fxReserveWeight: number;
  icon: string;
  sellMarginTarget: string;
  buyMarginTarget: string;
  displayWeightWeb: string;
  displayWeightFloat: string;
  source: string;
  floatThresholdBottom: number;
  floatThresholdTop: number;
  fxReserveHardcostPool: number;
  sellMarginAtm: number;
  buyMarginAtm: number;
  hexColor: string;
  spread: number;
  offset: number;
  weBuy: number;
  weSell: number;
  floatTargetPercent: number;
  floatTargetInCad: number;
  floatThresholdElasticity: number;
  organizationId: number;
  rateDecimalPlaces: number;
  amountDecimalPlaces: number;
  offsetPremium: number;
  rateApi: string;
  api: number;
  network: string;
  chainId: string;
  symbol: string;
  contract: string;
  underlying: string;
  rateApiIdentifier: string;
  rateUpdatedAt: Date;
  advertisable: boolean;
  buyAdvertisable: boolean;
  sellAdvertisable: boolean;
  denominations?: Denomination[];
}

export interface CurrencyListResponse {
  data: Currency[];
}

export interface CurrencyResponse {
  data: Currency;
}

export interface CurrencyCreationResponse {
  data: Currency;
  denominations?: Array<{
    id: string;
    value: number;
    currencyId: string;
    accepted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  repositories?: Array<{
    id: string;
    name: string;
    currencyTickers: string[];
    organizationId: string;
  }>;
  floatStacks?: Array<{
    id: string;
    denominatedValue: number;
    denominationId: string;
    repositoryId: number;
    ticker: string;
    cxSessionId: string;
  }>;
}

export interface ApiError {
  error: string;
}

import { apiGet, apiPost, apiPut, apiDelete } from '@/client/utils/api-client';

// API functions
const BASE_URL = "/api/currencies";

export const currenciesApi = {
  // Get all currencies
  async list(): Promise<CurrencyListResponse> {
    const response = await apiGet(BASE_URL);
    return response.json();
  },

  // Get single currency by ID
  async getById(id: string): Promise<CurrencyResponse> {
    const response = await apiGet(`${BASE_URL}/${id}`);
    return response.json();
  },

  // Create new currency (simple)
  async create(data: Partial<Currency>): Promise<CurrencyResponse> {
    const response = await apiPost(BASE_URL, data);
    return response.json();
  },

  // Create new currency with denominations and repositories (comprehensive)
  async createComprehensive(data: {
    currency: Partial<Currency>;
    denominations: Array<{ value: number }>;
    repositories: string[];
  }): Promise<CurrencyCreationResponse> {
    const response = await apiPost(BASE_URL, data);
    return response.json();
  },

  // Update existing currency
  async update(id: string, data: Partial<Currency>): Promise<CurrencyResponse> {
    const response = await apiPut(`${BASE_URL}/${id}`, data);
    return response.json();
  },

  // Delete currency
  async delete(id: string): Promise<{ message: string }> {
    const response = await apiDelete(`${BASE_URL}/${id}`);
    return response.json();
  },

  // Update currency rate
  async updateRate(id: string, rate: number): Promise<CurrencyResponse> {
    const response = await apiPut(`${BASE_URL}/${id}`, { rate });
    return response.json();
  },

  // Get currency by ticker
  async getByTicker(ticker: string): Promise<CurrencyResponse> {
    const response = await apiGet(`${BASE_URL}/ticker/${ticker}`);
    return response.json();
  }
};
