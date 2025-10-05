import { BaseModel, ValidationRules } from "./base";
import { repository } from "@/server/db/schema";

// Repository interface matching the database schema
export interface RepositoryData {
  id: string;
  name: string;
  typeOf?: string | null;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  currencyType?: string | null;
  form?: string | null;
  uid?: number | null;
  key: string;
  currencyTickers?: string[];
  displayOrderId?: number | null;
  floatThresholdBottom?: number | null;
  floatThresholdTop?: number | null;
  floatCountRequired?: boolean | null;
  active?: boolean | null;
  authorizedUserIds?: string | null; // JSON array of user IDs
}

// Repository model class extending BaseModel
export class RepositoryModel extends BaseModel<RepositoryData> {
  // Configure the model
  static {
    this.configure<RepositoryData>({
      table: repository,
      primaryKey: "id",
      timestamps: true,
      validations: {
        name: [
          { type: "required", message: "Repository name is required" }
        ],
        key: [
          { type: "required", message: "Repository key is required" }
        ]
      } as ValidationRules<RepositoryData>
    });
  }

  constructor(data?: Partial<RepositoryData> | string) {
    super(data);
  }

  // Custom methods specific to Repository
  
  // Get the current state of the repository
  get state(): string {
    const ral = this.currentRAl;
    if (!ral) return "UNKNOWN";

    const closeConfirmAt = ral.get("closeConfirmAt");
    const closeStartAt = ral.get("closeStartAt");
    const openConfirmAt = ral.get("openConfirmAt");
    const openStartAt = ral.get("openStartAt");

    if (closeConfirmAt) {
      return "DORMANT";
    } else if (closeStartAt && !closeConfirmAt) {
      return "CLOSE_START";
    } else if (openConfirmAt && !closeStartAt) {
      return "OPEN_CONFIRMED";
    } else if (openStartAt && !openConfirmAt) {
      return "OPEN_START";
    } else {
      return "ERROR";
    }
  }

  // Check if repository is in use
  get is_in_use(): boolean {
    // This would need to be implemented with proper logic
    // For now, returning a default value
    return false;
  }

  // Get current repository access log
  get currentRAl(): { get: (key: string) => unknown } | null {
    // This would need to be implemented with proper logic
    // For now, returning null
    return null;
  }

  // Static finder methods specific to Repository
  static async findByName(name: string): Promise<RepositoryModel[]> {
    const records = await this.where({ name });
    return records.map(record => {
      const instance = new this();
      instance.attributes = record.attributes;
      instance.isNewRecord = false;
      return instance;
    });
  }

  static async findByOrganization(organizationId: string): Promise<RepositoryModel[]> {
    const records = await this.where({ organizationId });
    return records.map(record => {
      const instance = new this();
      instance.attributes = record.attributes;
      instance.isNewRecord = false;
      return instance;
    });
  }

  static async findByKey(key: string): Promise<RepositoryModel | null> {
    const records = await this.where({ key });
    if (records.length > 0) {
      const instance = new this();
      instance.attributes = records[0].attributes;
      instance.isNewRecord = false;
      return instance;
    }
    return null;
  }

  static async findActive(): Promise<RepositoryModel[]> {
    // This would need a more complex query in a real implementation
    // For now, we'll return all repositories
    const records = await this.all();
    return records.map(record => {
      const instance = new this();
      instance.attributes = record.attributes;
      instance.isNewRecord = false;
      return instance;
    });
  }

  // Helper methods for managing authorized users
  getAuthorizedUserIds(): string[] {
    const authorizedUserIds = this.get("authorizedUserIds");
    if (!authorizedUserIds) return [];
    try {
      return JSON.parse(authorizedUserIds as string);
    } catch {
      return [];
    }
  }

  setAuthorizedUserIds(userIds: string[]): void {
    this.set("authorizedUserIds", JSON.stringify(userIds));
  }

  addAuthorizedUser(userId: string): void {
    const currentIds = this.getAuthorizedUserIds();
    if (!currentIds.includes(userId)) {
      currentIds.push(userId);
      this.setAuthorizedUserIds(currentIds);
    }
  }

  removeAuthorizedUser(userId: string): void {
    const currentIds = this.getAuthorizedUserIds();
    const filteredIds = currentIds.filter(id => id !== userId);
    this.setAuthorizedUserIds(filteredIds);
  }

  isUserAuthorized(userId: string): boolean {
    const authorizedIds = this.getAuthorizedUserIds();
    return authorizedIds.includes(userId);
  }
}

// Export for convenience
export default RepositoryModel;
