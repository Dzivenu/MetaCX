import { IdentificationModel, type IdentificationData } from "@/server/models/IdentificationModel";

export interface CreateIdentificationParams {
  organizationId: string;
  customerId: string;
  addressId?: string;
  typeOf: string;
  referenceNumber: string;
  issuingCountryCode?: string;
  issueDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  photo?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  originOfFunds?: string;
  purposeOfFunds?: string;
  description?: string;
  primary?: boolean;
}

export interface CreateIdentificationResult {
  identification: IdentificationData | null;
  error: string | null;
}

export class CreateIdentificationService {
  private params: CreateIdentificationParams;
  private identification: IdentificationData | null = null;
  private error: string | null = null;

  constructor(params: CreateIdentificationParams) {
    this.params = params;
  }

  async call(): Promise<CreateIdentificationResult> {
    try {
      const model = new IdentificationModel({
        organizationId: this.params.organizationId,
        customerId: this.params.customerId,
        addressId: this.params.addressId,
        typeOf: this.params.typeOf,
        referenceNumber: this.params.referenceNumber,
        issuingCountryCode: this.params.issuingCountryCode,
        issueDate: this.params.issueDate,
        expiryDate: this.params.expiryDate,
        photo: this.params.photo,
        dateOfBirth: this.params.dateOfBirth,
        originOfFunds: this.params.originOfFunds,
        purposeOfFunds: this.params.purposeOfFunds,
        description: this.params.description,
        primary: this.params.primary,
      });

      const saved = await model.save();
      if (!saved) {
        this.error = "Failed to create identification";
        return { identification: null, error: this.error };
      }

      this.identification = model.attributes as IdentificationData;
      return { identification: this.identification, error: null };
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to create identification";
      return { identification: null, error: this.error };
    }
  }
}

export default CreateIdentificationService;
