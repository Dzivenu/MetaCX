import { BaseModel } from "./base";
import { currency } from "@/server/db/schema";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { DenominationModel, DenominationData } from "./DenominationModel";

// Currency interface matching the database schema
export interface CurrencyData {
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
  organizationId: string;
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
  isBaseCurrency: boolean;
}

// Extended currency interface with denominations
export interface CurrencyWithDenominations extends CurrencyData {
  denominations: DenominationData[];
}

// Currency model class extending BaseModel
export class CurrencyModel extends BaseModel<CurrencyData> {
  // Configure the model
  static {
    this.configure<CurrencyData>({
      table: currency,
      primaryKey: "id",
    });
  }

  // Get all currencies for an organization
  static async getAllForOrganization(
    organizationId: string
  ): Promise<CurrencyData[]> {
    const instances = await this.where(
      { organizationId },
      { orderBy: [{ field: "floatDisplayOrder", direction: "asc" }] }
    );
    return instances.map((instance) => instance.toJSON());
  }

  // Get all currencies with denominations for an organization
  static async getAllWithDenominationsForOrganization(
    organizationId: string
  ): Promise<CurrencyWithDenominations[]> {
    const currencies = await this.getAllForOrganization(organizationId);

    // Fetch denominations for all currencies
    const currenciesWithDenominations: CurrencyWithDenominations[] = [];

    for (const currency of currencies) {
      const denominationInstances = await DenominationModel.findByCurrency(
        currency.id
      );
      const denominations = denominationInstances.map((instance) =>
        instance.toJSON()
      );

      currenciesWithDenominations.push({
        ...currency,
        denominations,
      });
    }

    return currenciesWithDenominations;
  }

  // Get currency by ticker
  static async getByTicker(
    ticker: string,
    organizationId: string
  ): Promise<CurrencyData | null> {
    const instance = await this.where({ ticker, organizationId });
    return instance.length > 0 ? instance[0].toJSON() : null;
  }

  // Get currency by ID
  static async getById(id: string): Promise<CurrencyData | null> {
    const instance = await this.find(id);
    return instance ? instance.toJSON() : null;
  }

  // Update currency rate
  static async updateRate(
    id: string,
    rate: number
  ): Promise<CurrencyData | null> {
    return this.update(id, {
      rate,
      rateUpdatedAt: new Date(),
    } as Partial<CurrencyData>);
  }

  // Update currency
  static async update(
    id: string,
    data: Partial<CurrencyData>
  ): Promise<CurrencyData | null> {
    const instance = await this.find(id);
    if (!instance) return null;

    instance.assign(data);
    const success = await instance.save();
    return success ? instance.toJSON() : null;
  }

  // Delete currency
  static async delete(id: string): Promise<boolean> {
    const instance = await this.find(id);
    if (!instance) return false;

    return await instance.destroy();
  }

  // Unset base flag for all currencies in an organization
  static async unsetBaseForOrganization(organizationId: string): Promise<void> {
    await db
      .update(currency)
      .set({ isBaseCurrency: false, updatedAt: new Date() })
      .where(eq(currency.organizationId, organizationId));
  }
}
