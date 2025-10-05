import { BaseModel, ValidationRules } from "./base";
import { address } from "@/server/db/schema";

export interface AddressData {
  id: string;
  organizationId: string;
  parentType: string;
  parentId: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode?: string | null;
  primary?: boolean | null;
  active?: boolean | null;
  addressFull?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AddressModel extends BaseModel<AddressData> {
  static {
    this.configure<AddressData>({
      table: address,
      primaryKey: "id",
      timestamps: true,
      validations: {
        organizationId: [{ type: "required", message: "organizationId is required" }],
        parentType: [{ type: "required", message: "parentType is required" }],
        parentId: [{ type: "required", message: "parentId is required" }],
        line1: [{ type: "required", message: "line1 is required" }],
        city: [{ type: "required", message: "city is required" }],
        state: [{ type: "required", message: "state is required" }],
        postalCode: [{ type: "required", message: "postalCode is required" }],
      } as ValidationRules<AddressData>,
    });
  }

  constructor(data?: Partial<AddressData> | string) {
    super(data);
  }
}

export default AddressModel;
