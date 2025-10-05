import { BaseModel, ValidationRules } from "./base";
import { customer } from "@/server/db/schema";

export interface CustomerData {
  id: string;
  organizationId: string;
  title?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dob?: string | null; // date string (YYYY-MM-DD)
  occupation?: string | null;
  employer?: string | null;
  // Legacy
  info?: string | null;
  scanSuccess?: boolean | null;
  scanRawData?: string | null;
  telephone?: string | null;
  email?: string | null;
  duplicate?: boolean | null;
  mergedId?: string | null;
  ordersBetween1kTo9k?: number | null;
  ordersBetween9kTo10k?: number | null;
  lastOrderId?: string | null;
  suspiciousOrder?: boolean | null;
  previousIds?: string[] | null;
  marketableContactIds?: string[] | null;
  primaryPhoneId?: string | null;
  primaryEmailId?: string | null;
  primaryAddressId?: string | null;
  primaryIdentificationId?: string | null;
  riskScore?: string | null; // stored as decimal in DB
  lastOrderDt?: Date | null;
  ordersOver10k?: number | null;
  blacklistReason?: string | null;
  // Flags
  active?: boolean | null;
  blacklisted?: boolean | null;
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerModel extends BaseModel<CustomerData> {
  static {
    this.configure<CustomerData>({
      table: customer,
      primaryKey: "id",
      timestamps: true,
      validations: {
        organizationId: [{ type: "required", message: "organizationId is required" }],
        firstName: [{ type: "required", message: "firstName is required" }],
        lastName: [{ type: "required", message: "lastName is required" }],
      } as ValidationRules<CustomerData>,
    });
  }

  constructor(data?: Partial<CustomerData> | string) {
    super(data);
  }
}

export default CustomerModel;
