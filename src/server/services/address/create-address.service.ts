import { AddressModel, type AddressData } from "@/server/models/AddressModel";

export interface CreateAddressParams {
  organizationId: string;
  parentType: string;
  parentId: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode?: string;
  primary?: boolean;
  active?: boolean;
  addressFull?: string;
}

export interface CreateAddressResult {
  address: AddressData | null;
  error: string | null;
}

export class CreateAddressService {
  private params: CreateAddressParams;
  private address: AddressData | null = null;
  private error: string | null = null;

  constructor(params: CreateAddressParams) {
    this.params = params;
  }

  async call(): Promise<CreateAddressResult> {
    try {
      const model = new AddressModel({
        organizationId: this.params.organizationId,
        parentType: this.params.parentType,
        parentId: this.params.parentId,
        line1: this.params.line1,
        line2: this.params.line2,
        city: this.params.city,
        state: this.params.state,
        postalCode: this.params.postalCode,
        countryCode: this.params.countryCode,
        primary: this.params.primary,
        active: this.params.active,
        addressFull: this.params.addressFull,
      });

      const saved = await model.save();
      if (!saved) {
        this.error = "Failed to create address";
        return { address: null, error: this.error };
      }

      this.address = model.attributes as AddressData;
      return { address: this.address, error: null };
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to create address";
      return { address: null, error: this.error };
    }
  }
}

export default CreateAddressService;
