import { CustomerModel, type CustomerData } from "@/server/models/CustomerModel";

export interface GetCustomerByIdParams {
  id: string;
  organizationId: string;
}

export interface GetCustomerByIdResult {
  customer: CustomerData | null;
  error: string | null;
}

export class GetCustomerByIdService {
  private params: GetCustomerByIdParams;

  constructor(params: GetCustomerByIdParams) {
    this.params = params;
  }

  async call(): Promise<GetCustomerByIdResult> {
    try {
      const record = (await CustomerModel.find(this.params.id)) as CustomerModel | null;
      if (!record) return { customer: null, error: "Customer not found" };

      const data = record.attributes as CustomerData;
      if (data.organizationId !== this.params.organizationId) {
        return { customer: null, error: "Customer does not belong to organization" };
      }

      return { customer: data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch customer";
      return { customer: null, error: message };
    }
  }
}

export default GetCustomerByIdService;
