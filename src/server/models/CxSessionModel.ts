import { BaseModel, ValidationRules } from "./base";
import { cxSession } from "@/server/db/schema";

// CxSession interface matching the database schema
export interface CxSessionData {
  id: string;
  openStartDt?: Date | null;
  openConfirmDt?: Date | null;
  closeStartDt?: Date | null;
  closeConfirmDt?: Date | null;
  userId?: number | null;
  organizationId?: number | null;
  createdAt: Date;
  updatedAt: Date;
  status?: string | null;
  verifiedByUserId?: number | null;
  verifiedDt?: Date | null;
  openStartUserId?: number | null;
  openConfirmUserId?: number | null;
  closeStartUserId?: number | null;
  closeConfirmUserId?: number | null;
}

// CxSession model class extending BaseModel
export class CxSessionModel extends BaseModel<CxSessionData> {
  // Configure the model
  static {
    this.configure<CxSessionData>({
      table: cxSession,
      primaryKey: "id",
      timestamps: true,
      validations: {
        status: [
          {
            type: "custom",
            validator: (value) => !value || ["pending", "open", "closed", "verified"].includes(value),
            message: "Status must be one of: pending, open, closed, verified"
          }
        ]
      } as ValidationRules<CxSessionData>
    });
  }

  constructor(data?: Partial<CxSessionData> | string) {
    super(data);
  }

  // Custom methods specific to CxSession
  async open(userId?: number): Promise<boolean> {
    if (this.get("openStartDt")) {
      throw new Error("Session is already opened");
    }

    this.set("openStartDt", new Date());
    this.set("openStartUserId", userId || null);
    this.set("status", "open");

    return await this.save();
  }

  async confirmOpen(userId?: number): Promise<boolean> {
    if (!this.get("openStartDt")) {
      throw new Error("Session must be opened first");
    }

    if (this.get("openConfirmDt")) {
      throw new Error("Session opening is already confirmed");
    }

    this.set("openConfirmDt", new Date());
    this.set("openConfirmUserId", userId || null);

    return await this.save();
  }

  async close(userId?: number): Promise<boolean> {
    if (!this.get("openStartDt")) {
      throw new Error("Session must be opened first");
    }

    if (this.get("closeStartDt")) {
      throw new Error("Session is already closed");
    }

    this.set("closeStartDt", new Date());
    this.set("closeStartUserId", userId || null);
    this.set("status", "closed");

    return await this.save();
  }

  async confirmClose(userId?: number): Promise<boolean> {
    if (!this.get("closeStartDt")) {
      throw new Error("Session must be closed first");
    }

    if (this.get("closeConfirmDt")) {
      throw new Error("Session closing is already confirmed");
    }

    this.set("closeConfirmDt", new Date());
    this.set("closeConfirmUserId", userId || null);

    return await this.save();
  }

  async verify(userId: number): Promise<boolean> {
    if (!this.get("closeConfirmDt")) {
      throw new Error("Session must be closed and confirmed first");
    }

    this.set("verifiedDt", new Date());
    this.set("verifiedByUserId", userId);
    this.set("status", "verified");

    return await this.save();
  }

  // Status check methods
  get isOpen(): boolean {
    return !!this.get("openStartDt") && !this.get("closeStartDt");
  }

  get isClosed(): boolean {
    return !!this.get("closeStartDt");
  }

  get isVerified(): boolean {
    return !!this.get("verifiedDt") && !!this.get("verifiedByUserId");
  }

  get isOpenConfirmed(): boolean {
    return !!this.get("openConfirmDt");
  }

  get isCloseConfirmed(): boolean {
    return !!this.get("closeConfirmDt");
  }

  // Duration calculation
  get duration(): number | null {
    const openTime = this.get("openStartDt");
    const closeTime = this.get("closeStartDt");

    if (!openTime || !closeTime) {
      return null;
    }

    return Math.round((closeTime.getTime() - openTime.getTime()) / (1000 * 60)); // Duration in minutes
  }

  // Static finder methods specific to CxSession
  static async findByOrganization(organizationId: number): Promise<CxSessionModel[]> {
    return this.where({ organizationId });
  }

  static async findByUser(userId: number): Promise<CxSessionModel[]> {
    return this.where({ userId });
  }

  static async findByStatus(status: string): Promise<CxSessionModel[]> {
    return this.where({ status });
  }

  static async findOpenSessions(): Promise<CxSessionModel[]> {
    // This would need a more complex query in a real implementation
    // For now, we'll use a simple status filter
    return this.where({ status: "open" });
  }

  static async findVerifiedSessions(): Promise<CxSessionModel[]> {
    return this.where({ status: "verified" });
  }

  // Hooks setup
  static {
    // Before create hook - set default status
    this.beforeCreate<CxSessionData>((data) => {
      if (!data.status) {
        data.status = "pending";
      }
      return data;
    });

    // After create hook - log creation
    this.afterCreate<CxSessionData>((record) => {
      console.log(`CxSession created: ${record.id}`);
    });

    // Before update hook - update timestamp
    this.beforeUpdate<CxSessionData>((data) => {
      data.updatedAt = new Date();
      return data;
    });

    // After update hook - log status changes
    this.afterUpdate<CxSessionData>((record) => {
      console.log(`CxSession updated: ${record.id}, status: ${record.status}`);
    });

    // Before delete hook - check if session can be deleted
    this.beforeDelete<CxSessionData>((record) => {
      if (record.status === "open") {
        throw new Error("Cannot delete an open session");
      }
    });

    // After delete hook - log deletion
    this.afterDelete<CxSessionData>((record) => {
      console.log(`CxSession deleted: ${record.id}`);
    });
  }
}

// Export for convenience
export default CxSessionModel;