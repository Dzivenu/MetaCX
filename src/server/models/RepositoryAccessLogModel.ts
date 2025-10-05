import { BaseModel, ValidationRules } from "./base";
import { repositoryAccessLog } from "@/server/db/schema";

// RepositoryAccessLog interface matching the database schema
export interface RepositoryAccessLogData {
  id: string;
  repositoryId?: number | null;
  sessionId?: string | null;
  possessionAt?: Date | null;
  releaseAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  openStartAt?: Date | null;
  openConfirmAt?: Date | null;
  closeStartAt?: Date | null;
  closeConfirmAt?: Date | null;
  openStartUserId?: number | null;
  openConfirmUserId?: number | null;
  closeStartUserId?: number | null;
  closeConfirmUserId?: number | null;
}

// RepositoryAccessLog model class extending BaseModel
export class RepositoryAccessLogModel extends BaseModel<RepositoryAccessLogData> {
  // Configure the model
  static {
    this.configure<RepositoryAccessLogData>({
      table: repositoryAccessLog,
      primaryKey: "id",
      timestamps: true,
      validations: {
        // Add validations as needed
      } as ValidationRules<RepositoryAccessLogData>
    });
  }

  constructor(data?: Partial<RepositoryAccessLogData> | string) {
    super(data);
  }

  // Custom methods specific to RepositoryAccessLog
  
  // Set close start
  async setCloseStart(): Promise<boolean> {
    this.set("closeStartAt", new Date());
    return await this.save();
  }

  // Set close confirm
  async setCloseConfirm(): Promise<boolean> {
    this.set("closeConfirmAt", new Date());
    this.set("releaseAt", new Date());
    return await this.save();
  }

  // Auto close
  async autoClose(): Promise<boolean> {
    this.set("closeStartAt", new Date());
    this.set("closeConfirmAt", new Date());
    this.set("releaseAt", new Date());
    return await this.save();
  }

  // Cancel close
  async cancelClose(): Promise<boolean> {
    this.set("closeStartAt", null);
    this.set("closeConfirmAt", null);
    this.set("releaseAt", null);
    return await this.save();
  }

  // Static finder methods specific to RepositoryAccessLog
  static async findByRepository(repositoryId: number): Promise<RepositoryAccessLogModel[]> {
    const records = await this.where({ repositoryId });
    return records.map(record => {
      const instance = new this();
      instance.attributes = record.attributes;
      instance.isNewRecord = false;
      return instance;
    });
  }

  static async findBySession(sessionId: string): Promise<RepositoryAccessLogModel[]> {
    const records = await this.where({ sessionId });
    return records.map(record => {
      const instance = new this();
      instance.attributes = record.attributes;
      instance.isNewRecord = false;
      return instance;
    });
  }

  static async findOpen(): Promise<RepositoryAccessLogModel[]> {
    const records = await this.where({ openConfirmAt: { not: null } });
    return records.map(record => {
      const instance = new this();
      instance.attributes = record.attributes;
      instance.isNewRecord = false;
      return instance;
    });
  }

  static async findClosed(): Promise<RepositoryAccessLogModel[]> {
    const records = await this.where({ closeConfirmAt: { not: null } });
    return records.map(record => {
      const instance = new this();
      instance.attributes = record.attributes;
      instance.isNewRecord = false;
      return instance;
    });
  }

  static async findActive(): Promise<RepositoryAccessLogModel[]> {
    // Find logs that are open but not yet closed
    const records = await this.where({ 
      openConfirmAt: { not: null }, 
      closeConfirmAt: null 
    });
    return records.map(record => {
      const instance = new this();
      instance.attributes = record.attributes;
      instance.isNewRecord = false;
      return instance;
    });
  }
}

// Export for convenience
export default RepositoryAccessLogModel;
