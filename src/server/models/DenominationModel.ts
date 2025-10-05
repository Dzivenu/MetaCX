import { BaseModel, ValidationRules } from "./base";
import { denomination } from "@/server/db/schema";

// Denomination interface matching the database schema
export interface DenominationData {
  id: string;
  value?: number | null;
  currencyId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  accepted?: boolean | null;
}

// Denomination model class extending BaseModel
export class DenominationModel extends BaseModel<DenominationData> {
  // Configure the model
  static {
    this.configure<DenominationData>({
      table: denomination,
      primaryKey: "id",
      timestamps: true,
      validations: {
        // Add validations as needed
      } as ValidationRules<DenominationData>
    });
  }

  constructor(data?: Partial<DenominationData> | string) {
    super(data);
  }

  // Custom methods specific to Denomination
  
  // Static finder methods specific to Denomination
  static async findByCurrency(currencyId: string): Promise<DenominationModel[]> {
    const records = await this.where({ currencyId });
    return records.map(record => {
      const instance = new this();
      instance.attributes = record.attributes;
      instance.isNewRecord = false;
      return instance;
    });
  }

  static async findAccepted(): Promise<DenominationModel[]> {
    const records = await this.where({ accepted: true });
    return records.map(record => {
      const instance = new this();
      instance.attributes = record.attributes;
      instance.isNewRecord = false;
      return instance;
    });
  }

  static async findByValue(value: number): Promise<DenominationModel[]> {
    const records = await this.where({ value });
    return records.map(record => {
      const instance = new this();
      instance.attributes = record.attributes;
      instance.isNewRecord = false;
      return instance;
    });
  }
}

// Export for convenience
export default DenominationModel;
