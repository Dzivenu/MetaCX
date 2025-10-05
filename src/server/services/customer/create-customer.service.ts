import { CustomerModel, type CustomerData } from "@/server/models/CustomerModel";

export interface CreateCustomerParams {
  organizationId: string;
  firstName: string;
  lastName: string;
  title?: string;
  middleName?: string;
  dob?: string; // YYYY-MM-DD
  occupation?: string;
  employer?: string;
  // optional legacy
  telephone?: string;
  email?: string;
}

export interface CreateCustomerResult {
  customer: CustomerData | null;
  error: string | null;
}

export class CreateCustomerService {
  private params: CreateCustomerParams;
  private customer: CustomerData | null = null;
  private error: string | null = null;

  constructor(params: CreateCustomerParams) {
    this.params = params;
  }

  async call(): Promise<CreateCustomerResult> {
    try {
      const model = new CustomerModel({
        organizationId: this.params.organizationId,
        firstName: this.params.firstName,
        lastName: this.params.lastName,
        title: this.params.title,
        middleName: this.params.middleName,
        dob: this.params.dob,
        occupation: this.params.occupation,
        employer: this.params.employer,
        telephone: this.params.telephone,
        email: this.params.email,
      });

      const saved = await model.save();
      if (!saved) {
        this.error = "Failed to create customer";
        return { customer: null, error: this.error };
        }

      this.customer = model.attributes as CustomerData;
      return { customer: this.customer, error: null };
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to create customer";
      return { customer: null, error: this.error };
    }
  }
}

export default CreateCustomerService;
