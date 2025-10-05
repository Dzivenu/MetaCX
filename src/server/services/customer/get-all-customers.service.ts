import { CustomerModel, type CustomerData } from "@/server/models/CustomerModel";

export interface GetAllCustomersParams {
  organizationId: string;
}

export interface GetAllCustomersResult {
  customers: CustomerData[];
  error: string | null;
}

export class GetAllCustomersService {
  private params: GetAllCustomersParams;

  constructor(params: GetAllCustomersParams) {
    this.params = params;
  }

  async call(): Promise<GetAllCustomersResult> {
    try {
      const records = (await CustomerModel.where(
        { organizationId: this.params.organizationId },
        { orderBy: [{ field: "createdAt", direction: "desc" }] }
      )) as CustomerModel[];

      const customers = records.map((r) => r.attributes as CustomerData);
      return { customers, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch customers";
      return { customers: [], error: message };
    }
  }
}

export default GetAllCustomersService;
