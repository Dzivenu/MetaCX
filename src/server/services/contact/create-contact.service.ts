import { ContactModel, type ContactData } from "@/server/models/ContactModel";

export interface CreateContactParams {
  organizationId: string;
  parentType: string;
  parentId: string;
  typeOf: string; // email | telephone | ...
  endpoint: string;
  extension?: string;
  primary?: boolean;
  marketable?: boolean;
}

export interface CreateContactResult {
  contact: ContactData | null;
  error: string | null;
}

export class CreateContactService {
  private params: CreateContactParams;
  private contact: ContactData | null = null;
  private error: string | null = null;

  constructor(params: CreateContactParams) {
    this.params = params;
  }

  async call(): Promise<CreateContactResult> {
    try {
      const model = new ContactModel({
        organizationId: this.params.organizationId,
        parentType: this.params.parentType,
        parentId: this.params.parentId,
        typeOf: this.params.typeOf,
        endpoint: this.params.endpoint,
        extension: this.params.extension,
        primary: this.params.primary,
        marketable: this.params.marketable,
      });

      const saved = await model.save();
      if (!saved) {
        this.error = "Failed to create contact";
        return { contact: null, error: this.error };
      }

      this.contact = model.attributes as ContactData;
      return { contact: this.contact, error: null };
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to create contact";
      return { contact: null, error: this.error };
    }
  }
}

export default CreateContactService;
