import { BaseModel, ValidationRules } from "./base";
import { contact } from "@/server/db/schema";

export interface ContactData {
  id: string;
  organizationId: string;
  parentType: string;
  parentId: string;
  typeOf: string;
  endpoint: string;
  extension?: string | null;
  primary?: boolean | null;
  verified?: boolean | null;
  verifiedAt?: Date | null;
  marketable?: boolean | null;
  marketableAcceptDt?: Date | null;
  active?: boolean | null;
  reviewerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ContactModel extends BaseModel<ContactData> {
  static {
    this.configure<ContactData>({
      table: contact,
      primaryKey: "id",
      timestamps: true,
      validations: {
        organizationId: [{ type: "required", message: "organizationId is required" }],
        parentType: [{ type: "required", message: "parentType is required" }],
        parentId: [{ type: "required", message: "parentId is required" }],
        typeOf: [{ type: "required", message: "typeOf is required" }],
        endpoint: [{ type: "required", message: "endpoint is required" }],
      } as ValidationRules<ContactData>,
    });
  }

  constructor(data?: Partial<ContactData> | string) {
    super(data);
  }
}

export default ContactModel;
