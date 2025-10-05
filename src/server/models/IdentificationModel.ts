import { BaseModel, ValidationRules } from "./base";
import { identification } from "@/server/db/schema";

export interface IdentificationData {
  id: string;
  organizationId: string;
  customerId: string;
  addressId?: string | null;
  typeOf: string;
  referenceNumber: string;
  issuingCountryCode?: string | null;
  issueDate?: string | null; // date string (YYYY-MM-DD)
  expiryDate?: string | null; // date string
  photo?: string | null;

  dateOfBirth?: string | null; // snapshot

  originOfFunds?: string | null;
  purposeOfFunds?: string | null;
  description?: string | null;

  verified?: boolean | null;
  verifiedAt?: Date | null;
  reviewerId?: string | null;

  primary?: boolean | null;
  typeCode?: string | null;
  countryCode?: string | null;
  provinceCode?: string | null;
  provinceOther?: string | null;
  active?: boolean | null;
  orderId?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export class IdentificationModel extends BaseModel<IdentificationData> {
  static {
    this.configure<IdentificationData>({
      table: identification,
      primaryKey: "id",
      timestamps: true,
      validations: {
        organizationId: [{ type: "required", message: "organizationId is required" }],
        customerId: [{ type: "required", message: "customerId is required" }],
        typeOf: [{ type: "required", message: "typeOf is required" }],
        referenceNumber: [{ type: "required", message: "referenceNumber is required" }],
      } as ValidationRules<IdentificationData>,
    });
  }

  constructor(data?: Partial<IdentificationData> | string) {
    super(data);
  }
}

export default IdentificationModel;
