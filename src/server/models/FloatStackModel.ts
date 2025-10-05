import { BaseModel, ValidationRules } from "./base";
import { floatStack } from "@/server/db/schema";
import { db } from "@/server/db";
import { isNotNull } from "drizzle-orm";

// FloatStack interface matching the database schema
export interface FloatStackData {
  id: string;
  openConfirmedDt?: Date | null;
  openCount?: number | null;
  sessionId?: string | null;
  repositoryId?: string | null;
  denominationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  spentDuringSession?: number | null;
  closeConfirmedDt?: Date | null;
  closeCount?: number | null;
  lastSessionCount?: number | null;
  previousSessionFloatStackId?: string | null;
  denominatedValue?: number | null;
  ticker?: string | null;
  averageSpot?: number | null;
  openSpot?: number | null;
  closeSpot?: number | null;
  transferredDuringSession?: number | null;
}

// FloatStack model class extending BaseModel
export class FloatStackModel extends BaseModel<FloatStackData> {
  // Configure the model
  static {
    this.configure<FloatStackData>({
      table: floatStack,
      primaryKey: "id",
      timestamps: true,
      validations: {
        // Add validations as needed
      } as ValidationRules<FloatStackData>
    });
  }

  constructor(data?: Partial<FloatStackData> | string) {
    super(data);
  }

  // Custom methods specific to FloatStack
  
  // Get self open count
  get selfOpenCount(): number {
    return this.get("openCount") || 0;
  }

  // Get count current
  get countCurrent(): number {
    const openCount = this.get("openCount") || 0;
    const spentDuringSession = Number(this.get("spentDuringSession") || 0);
    const transferredDuringSession = Number(this.get("transferredDuringSession") || 0);
    return openCount - spentDuringSession - transferredDuringSession;
  }

  // Get ending count
  get endingCount(): number {
    const closeCount = this.get("closeCount");
    if (closeCount === null || closeCount === undefined) {
      return this.countCurrent;
    }
    return closeCount;
  }

  // Check if closeable
  get closeable(): boolean {
    const closeCount = this.get("closeCount");
    const openCount = this.get("openCount") || 0;
    const spentDuringSession = Number(this.get("spentDuringSession") || 0);
    return closeCount === openCount - spentDuringSession;
  }

  // Calculate expected close value
  expectedClose(args: { inBaseCurrency?: boolean } = {}): number {
    const inBaseCurrency = args.inBaseCurrency !== false; // default to true
    const openCount = this.selfOpenCount;
    const averageSpot = this.averageSpot;
    const denominatedValue = this.get("denominatedValue") || 0;
    const spentDuringSession = Number(this.get("spentDuringSession") || 0);
    const transferredDuringSession = Number(this.get("transferredDuringSession") || 0);
    
    if (inBaseCurrency) {
      return (openCount * averageSpot * denominatedValue) - 
             (denominatedValue * averageSpot * spentDuringSession) - 
             (denominatedValue * averageSpot * transferredDuringSession);
    } else {
      return (openCount * denominatedValue) - 
             (denominatedValue * spentDuringSession) - 
              (denominatedValue * transferredDuringSession);
    }
  }

  // Get close or expected count
  closeOrExpectedCount(args: { inBaseCurrency?: boolean } = {}): number {
    const closeCount = this.get("closeCount");
    if (closeCount === null || closeCount === undefined) {
      return this.expectedClose(args);
    } else {
      const averageSpot = this.averageSpot;
      const denominatedValue = this.get("denominatedValue") || 0;
      if (args.inBaseCurrency !== false) { // default to true
        return (closeCount * averageSpot * denominatedValue);
      } else {
        return (closeCount * denominatedValue);
      }
    }
  }

  // Get average spot rate
  get averageSpot(): number {
    const avg = this.get("averageSpot");
    if (avg && avg > 0) return avg;
    const openSpot = this.get("openSpot") || 0;
    let closeSpot = this.get("closeSpot") || 0;
    if (closeSpot === 0) {
      closeSpot = openSpot;
    }
    return (openSpot + closeSpot) / 2;
  }

  // Static finder methods specific to FloatStack
  static async findByRepository(repositoryId: string): Promise<FloatStackModel[]> {
    const records = await this.where({ repositoryId });
    return records.map(record => {
      const instance = new this();
      instance.attributes = record.attributes;
      instance.isNewRecord = false;
      return instance;
    });
  }

  static async findBySession(cxSessionId: string): Promise<FloatStackModel[]> {
    const records = await this.where({ sessionId: cxSessionId });
    return records.map(record => {
      const instance = new this();
      instance.attributes = record.attributes;
      instance.isNewRecord = false;
      return instance;
    });
  }

  static async findByDenomination(denominationId: string): Promise<FloatStackModel[]> {
    const records = await this.where({ denominationId });
    return records.map(record => {
      const instance = new this();
      instance.attributes = record.attributes;
      instance.isNewRecord = false;
      return instance;
    });
  }

  static async findOpenConfirmed(): Promise<FloatStackModel[]> {
    const records = await db
      .select()
      .from(floatStack)
      .where(isNotNull(floatStack.openConfirmedDt));
    return records.map((record) => {
      const instance = new this();
      instance.attributes = {} as Partial<FloatStackData>;
      for (const [key, value] of Object.entries(record as Partial<FloatStackData>)) {
        (instance.attributes as Partial<FloatStackData>)[key as keyof FloatStackData] =
          value as FloatStackData[keyof FloatStackData];
      }
      instance.isNewRecord = false;
      return instance;
    });
  }

  static async findCloseConfirmed(): Promise<FloatStackModel[]> {
    const records = await db
      .select()
      .from(floatStack)
      .where(isNotNull(floatStack.closeConfirmedDt));
    return records.map((record) => {
      const instance = new this();
      instance.attributes = {} as Partial<FloatStackData>;
      for (const [key, value] of Object.entries(record as Partial<FloatStackData>)) {
        (instance.attributes as Partial<FloatStackData>)[key as keyof FloatStackData] =
          value as FloatStackData[keyof FloatStackData];
      }
      instance.isNewRecord = false;
      return instance;
    });
  }
}

// Export for convenience
export default FloatStackModel;
