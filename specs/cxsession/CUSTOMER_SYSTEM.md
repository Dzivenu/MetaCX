# Customer System Specification

## Overview
This document details the comprehensive customer management system in the MetaCX application, covering customer creation, identification management, contact information, address handling, compliance features, and integration with orders and sessions.

## Business Rules

### Customer Types
1. **Individual Customers**: Personal customers with identification
2. **Business Customers**: Corporate entities with business documentation
3. **Beneficiaries**: Third-party recipients for transactions

### Customer Status
- **Active**: Customer can conduct transactions
- **Inactive**: Customer account is suspended
- **Blacklisted**: Customer is blocked from all transactions
- **Duplicate**: Customer record marked as duplicate of another

### Identification Requirements
- **Primary ID**: Main identification document (passport, driver's license)
- **Secondary ID**: Additional verification documents
- **Address Verification**: Proof of address documents
- **Photo Records**: Digital copies of identification documents

### Compliance Features
- **Risk Assessment**: Automated risk scoring based on transaction patterns
- **Blacklist Checking**: Against regulatory watchlists
- **Suspicious Activity**: Flagging and reporting of unusual patterns
- **Audit Trail**: Complete history of customer interactions

## Legacy System Analysis (Rails Backend)

### Backend Customer Models and Services

#### 1. Customer Model (`/app/models/customer.rb`)
```ruby
class Customer < ApplicationRecord
  include CustomerHelper
  include ApplicationHelper
  include PaginationAndFilteringHelper

  has_many :notes, dependent: :destroy
  has_many :merges, class_name: 'Customer', foreign_key: 'merged_id'
  belongs_to :merged, class_name: 'Customer', optional: true
  has_many :beneficiaries
  has_many :contacts, as: :contactable, dependent: :destroy
  has_many :addresses, as: :locatable, dependent: :destroy
  has_many :identifications, dependent: :destroy
  has_many :marketings, dependent: :destroy
  has_many :orders, dependent: :destroy
  has_many :infos, as: :infoable, dependent: :destroy

  scope :blacklisted, -> { Customer.where(blacklisted: true).pluck(:id) }
  scope :telephone, ->(customer_ids) do
    Contact.where(contactable_id: customer_ids, typeof: 'telephone')
  end

  def email
    emails = contacts.where(typeof: 'email')
    return false if emails.empty?
    emails.order(created_at: :desc).first.endpoint
  end

  def telephone
    telephones = contacts.where(typeof: 'telephone')
    return false if telephones.length == 0
    telephones.sort_by(&:created_at)[0].endpoint
  end

  def use_or_update_email(email)
    unless emails.find { |existing_email| existing_email == email }
      Contact.create!(
        typeof: 'email',
        endpoint: email,
        contactable_id: id,
        contactable_type: 'Customer'
      )
    end
    email
  end

  def emails
    contacts.select { |contact| contact.typeof == 'email' }
  end

  def create_risk_assessment
    build_risk_assessment
    new_risk_score = calculate_customer_risk_assessment(
      get_orders_between_1k_to_9k,
      get_orders_between_9k_to_10k
    )
    update(risk_score: new_risk_score)
  end

  def generate_risk_assessment
    build_risk_assessment if last_order_id.blank? || last_order_id.zero?
    new_risk_score = calculate_customer_risk_assessment(
      get_orders_between_1k_to_9k,
      get_orders_between_9k_to_10k
    )
    update(risk_score: new_risk_score)
  end

  def fetch_orders_between_base_amount_count(min, max)
    orders
      .where(outbound_ticker: 'CAD')
      .where(status: 'COMPLETED')
      .where('outbound_sum >= ? AND outbound_sum <= ?', min, max)
      .or(
        orders
          .where(inbound_ticker: 'CAD')
          .where(status: 'COMPLETED')
          .where('inbound_sum >= ? AND inbound_sum <= ?', min, max)
      )
      .count
  end

  def get_orders_between_1k_to_9k
    fetch_orders_between_base_amount_count(1000, 9000)
  end

  def get_orders_between_9k_to_10k
    fetch_orders_between_base_amount_count(9000, 10000)
  end

  def build_risk_assessment
    # Risk assessment logic based on transaction patterns
    # Implementation varies based on business rules
  end

  def calculate_customer_risk_assessment(order_count_1k_to_9k, order_count_9k_to_10k)
    # Calculate risk score based on order patterns
    # Higher risk for transactions near reporting thresholds
    base_score = 0
    threshold_risk = order_count_9k_to_10k * 10
    volume_risk = order_count_1k_to_9k * 2
    base_score + threshold_risk + volume_risk
  end

  def self.phone_number_search(telephone)
    customers = []
    contacts = Contact.where(endpoint: telephone, typeof: 'telephone')
    contacts.each do |contact|
      customers << Customer.find(contact.contactable_id)
    end
    customers
  end

  def self.phone_number_search_trading_tool(telephone)
    # Enhanced search for trading tool interface
    customers = []
    contacts = Contact.where("endpoint ILIKE ?", "%#{telephone}%")
                      .where(typeof: 'telephone')
    contacts.each do |contact|
      customers << Customer.find(contact.contactable_id)
    end
    customers.uniq
  end
end
```

#### 2. Contact Model (`/app/models/contact.rb`)
```ruby
class Contact < ApplicationRecord
  belongs_to :contactable, polymorphic: true
  validates :endpoint, presence: true
  validates :typeof, presence: true
  validates :endpoint, uniqueness: { 
    scope: [:contactable_type, :contactable_id, :typeof] 
  }
end
```

#### 3. Address Model (`/app/models/address.rb`)
```ruby
class Address < ApplicationRecord
  belongs_to :locatable, polymorphic: true
  validates :street, presence: true
  validates :city, presence: true
  validates :country, presence: true
  validates :postal_code, presence: true
end
```

#### 4. Identification Model (`/app/models/identification.rb`)
```ruby
class Identification < ApplicationRecord
  belongs_to :customer
  validates :document_type, presence: true
  validates :document_number, presence: true
  validates :document_number, uniqueness: { scope: :customer_id }
  
  has_one_attached :photo
  has_one_attached :scan_data
end
```

#### 5. Customer Controller (`/app/controllers/api/v1/customers_controller.rb`)
```ruby
class Api::V1::CustomersController < Api::V1::BaseController
  before_action :set_customer, only: %i[show update direct_update flag blacklist update_bio_data]

  def index
    @customers = policy_scope(Customer.where(active: true))
    @customers = @customers.order(created_at: :desc)

    unless params[:first].empty? && params[:last].empty?
      if params[:blacklist].nil? || params[:blacklist] == false
        @customers = Customer.where(active: true).local_search(
          params[:first],
          params[:last],
          params[:telephone]
        )
      end
    end

    if !params[:phone_number].nil? && params[:phone_number].length > 0
      @customers = Customer.phone_number_search_trading_tool(params[:phone_number])
    end

    return unless !params[:telephone].nil? && params[:telephone].length > 0
    @customers = Customer.phone_number_search(params[:telephone])
  end

  def fetch
    authorize Customer

    query_params = {
      filters: { active: true },
      search: {
        first_name: params[:first_name],
        last_name: params[:last_name]
      },
      join: {
        contacts: { endpoint: params[:telephone] }
      },
      total: params[:total],
      per_page: params[:per_page],
      page: params[:page]
    }

    associations = [
      { model: Contact, model_key: 'contactable_id', record_key: 'id' },
      { model: Address, model_key: 'locatable_id', record_key: 'id' }
    ]

    result = Customer.fetch_records(query_params, associations, true)
    records = ControllerHelper.records_as_json(result)

    render json: records, status: 200
  rescue StandardError => e
    puts e
    render json: { error: e.message }, status: 500
  end

  def create
    authorize Customer

    @customer = Customer.new(customer_params)
    
    if @customer.save
      # Create associated records
      create_contacts if params[:contacts].present?
      create_addresses if params[:addresses].present?
      create_identifications if params[:identifications].present?
      
      render json: @customer, status: :created
    else
      render json: { errors: @customer.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @customer
    
    if @customer.update(customer_params)
      # Update associated records
      update_contacts if params[:contacts].present?
      update_addresses if params[:addresses].present?
      update_identifications if params[:identifications].present?
      
      render json: @customer
    else
      render json: { errors: @customer.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def flag
    authorize @customer
    
    flag_params = params.require(:flag).permit(:reason, :description)
    @customer.flags.create!(flag_params.merge(user_id: current_user.id))
    
    render json: { message: 'Customer flagged successfully' }
  end

  def blacklist
    authorize @customer
    
    @customer.update!(blacklisted: true, blacklist_reason: params[:reason])
    
    # Log activity
    Activity.create_from_params(
      event: 'CUSTOMER_BLACKLISTED',
      user_id: current_user.id,
      session_id: '',
      reference_id: @customer.id,
      comment: params[:reason],
      meta: ''
    )
    
    render json: { message: 'Customer blacklisted successfully' }
  end

  private

  def set_customer
    @customer = Customer.find(params[:id])
  end

  def customer_params
    params.require(:customer).permit(
      :first_name, :last_name, :middle_name, :date_of_birth,
      :employer, :occupation, :country_code, :active,
      :blacklisted, :blacklist_reason, :risk_score,
      :suspicious_order, :duplicate, :merged_id
    )
  end

  def create_contacts
    params[:contacts].each do |contact_data|
      @customer.contacts.create!(contact_data.permit(:typeof, :endpoint))
    end
  end

  def create_addresses
    params[:addresses].each do |address_data|
      @customer.addresses.create!(address_data.permit(
        :street, :city, :province, :country, :postal_code,
        :type_code, :primary
      ))
    end
  end

  def create_identifications
    params[:identifications].each do |id_data|
      identification = @customer.identifications.create!(id_data.permit(
        :document_type, :document_number, :issuing_country,
        :issue_date, :expiry_date, :primary
      ))
      
      # Attach photos if provided
      if id_data[:photo]
        identification.photo.attach(id_data[:photo])
      end
      
      if id_data[:scan_data]
        identification.scan_data.attach(id_data[:scan_data])
      end
    end
  end
end
```

#### 6. Customer Merge Service (`/app/services/customer_engine/merge_service.rb`)
```ruby
module CustomerEngine
  class MergeService
    attr_reader :primary_customer, :secondary_customer, :success, :error

    def self.call(primary_customer_id:, secondary_customer_id:)
      new(
        primary_customer_id: primary_customer_id,
        secondary_customer_id: secondary_customer_id
      ).call
    end

    def initialize(primary_customer_id:, secondary_customer_id:)
      @primary_customer = Customer.find(primary_customer_id)
      @secondary_customer = Customer.find(secondary_customer_id)
      @success = true
      @error = nil
    end

    def call
      validate_customers
      transfer_orders
      transfer_contacts
      transfer_addresses
      transfer_identifications
      mark_secondary_as_duplicate
      update_primary_customer_history
      
      self
    rescue StandardError => e
      @success = false
      @error = e
      self
    end

    private

    def validate_customers
      raise "Primary customer not found" if @primary_customer.nil?
      raise "Secondary customer not found" if @secondary_customer.nil?
      raise "Cannot merge customer with itself" if @primary_customer.id == @secondary_customer.id
    end

    def transfer_orders
      @secondary_customer.orders.update_all(customer_id: @primary_customer.id)
    end

    def transfer_contacts
      @secondary_customer.contacts.update_all(contactable_id: @primary_customer.id)
    end

    def transfer_addresses
      @secondary_customer.addresses.update_all(locatable_id: @primary_customer.id)
    end

    def transfer_identifications
      @secondary_customer.identifications.update_all(customer_id: @primary_customer.id)
    end

    def mark_secondary_as_duplicate
      @secondary_customer.update!(
        duplicate: true,
        merged_id: @primary_customer.id,
        active: false
      )
    end

    def update_primary_customer_history
      previous_ids = @primary_customer.previous_ids || []
      previous_ids << @secondary_customer.id
      @primary_customer.update!(previous_ids: previous_ids)
    end
  end
end
```

### Frontend Customer Management

#### 1. Customer Logic Helper (`/src/containers/Customer/CustomerLogic.js`)
```javascript
export const formatCustomerForDisplay = (customer) => {
  return {
    id: customer.id,
    firstName: customer.first_name,
    lastName: customer.last_name,
    middleName: customer.middle_name,
    fullName: `${customer.first_name} ${customer.last_name}`,
    dateOfBirth: customer.date_of_birth,
    employer: customer.employer,
    occupation: customer.occupation,
    active: customer.active,
    blacklisted: customer.blacklisted,
    riskScore: customer.risk_score,
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
    
    // Associated data
    contacts: customer.contacts || [],
    addresses: customer.addresses || [],
    identifications: customer.identifications || [],
    orders: customer.orders || [],
    
    // Statistics
    orderCount: customer.orders?.length || 0,
    totalOrderValue: calculateTotalOrderValue(customer.orders),
    lastOrderDate: getLastOrderDate(customer.orders)
  };
};

export const parseCustomerDataIn = (customerData) => {
  if (!customerData) return {};
  
  return {
    first_name: customerData.firstName || customerData.first_name,
    last_name: customerData.lastName || customerData.last_name,
    middle_name: customerData.middleName || customerData.middle_name,
    date_of_birth: customerData.dateOfBirth || customerData.date_of_birth,
    employer: customerData.employer,
    occupation: customerData.occupation,
    country_code: customerData.countryCode || customerData.country_code,
    active: customerData.active !== false,
    
    // Contacts
    contacts: customerData.contacts?.map(contact => ({
      typeof: contact.type,
      endpoint: contact.value || contact.endpoint
    })) || [],
    
    // Addresses
    addresses: customerData.addresses?.map(address => ({
      street: address.street,
      city: address.city,
      province: address.province,
      country: address.country,
      postal_code: address.postalCode || address.postal_code,
      type_code: address.typeCode || 'RESIDENTIAL',
      primary: address.primary || false
    })) || [],
    
    // Identifications
    identifications: customerData.identifications?.map(id => ({
      document_type: id.documentType || id.document_type,
      document_number: id.documentNumber || id.document_number,
      issuing_country: id.issuingCountry || id.issuing_country,
      issue_date: id.issueDate || id.issue_date,
      expiry_date: id.expiryDate || id.expiry_date,
      primary: id.primary || false
    })) || []
  };
};

export const calculateTotalOrderValue = (orders) => {
  if (!orders || orders.length === 0) return 0;
  
  return orders.reduce((total, order) => {
    if (order.status === 'COMPLETED') {
      return total + (order.outbound_sum || 0);
    }
    return total;
  }, 0);
};

export const getLastOrderDate = (orders) => {
  if (!orders || orders.length === 0) return null;
  
  const completedOrders = orders.filter(order => order.status === 'COMPLETED');
  if (completedOrders.length === 0) return null;
  
  return new Date(Math.max(...completedOrders.map(order => new Date(order.created_at))));
};

export const searchCustomers = async (sessionData, searchParams) => {
  const { baseUrl, userEmail, userToken } = sessionData;
  
  const queryParams = new URLSearchParams();
  if (searchParams.firstName) queryParams.append('first_name', searchParams.firstName);
  if (searchParams.lastName) queryParams.append('last_name', searchParams.lastName);
  if (searchParams.telephone) queryParams.append('telephone', searchParams.telephone);
  if (searchParams.page) queryParams.append('page', searchParams.page);
  if (searchParams.perPage) queryParams.append('per_page', searchParams.perPage);
  
  try {
    const response = await fetch(`${baseUrl}/api/v1/customers/fetch?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': userEmail,
        'X-User-Token': userToken
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to search customers');
    }
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
};
```

## Technical Implementation (MetaCX/Convex)

### Customer Schema and Models
```typescript
// Customers table schema
export const customers = pgTable("org_customers", {
  id: serial("id").primaryKey(),
  clerkOrganizationId: varchar("clerk_organization_id", { length: 255 }).notNull(),
  
  // Basic customer information
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  middleName: varchar("middle_name", { length: 255 }),
  dateOfBirth: date("date_of_birth"),
  employer: varchar("employer", { length: 255 }),
  occupation: varchar("occupation", { length: 255 }),
  countryCode: varchar("country_code", { length: 10 }),
  
  // Status and flags
  active: boolean("active").default(true),
  blacklisted: boolean("blacklisted").default(false),
  blacklistReason: text("blacklist_reason"),
  suspiciousOrder: boolean("suspicious_order").default(false),
  duplicate: boolean("duplicate").default(false),
  mergedId: integer("merged_id").references(() => customers.id),
  
  // Risk assessment
  riskScore: integer("risk_score").default(0),
  
  // Order tracking
  orderCount: integer("order_count").default(0),
  lastOrderId: integer("last_order_id"),
  lastOrderDt: timestamp("last_order_dt"),
  
  // Legacy fields for migration compatibility
  previousIds: integer("previous_ids").array(),
  marketableContactIds: integer("marketable_contact_ids").array(),
  primaryAddressId: integer("primary_address_id"),
  primaryContactId: integer("primary_contact_id"),
  primaryIdentificationId: integer("primary_identification_id"),
  
  // Metadata
  info: json("info"), // Additional customer information
  scanFlags: json("scan_flags"), // Scanning-related flags
  scanData: json("scan_data"), // Scanned data from ID documents
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contacts table schema
export const contacts = pgTable("org_contacts", {
  id: serial("id").primaryKey(),
  clerkOrganizationId: varchar("clerk_organization_id", { length: 255 }).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  
  // Contact details
  typeof: varchar("typeof", { length: 50 }).notNull(), // "email" | "telephone" | "fax"
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  
  // Status and metadata
  primary: boolean("primary").default(false),
  verified: boolean("verified").default(false),
  verificationMethod: varchar("verification_method", { length: 100 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Addresses table schema
export const addresses = pgTable("org_addresses", {
  id: serial("id").primaryKey(),
  clerkOrganizationId: varchar("clerk_organization_id", { length: 255 }).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  
  // Address details
  street: varchar("street", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  province: varchar("province", { length: 255 }),
  country: varchar("country", { length: 255 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  
  // Address classification
  typeCode: varchar("type_code", { length: 50 }).default("RESIDENTIAL"), // "RESIDENTIAL" | "BUSINESS" | "MAILING"
  primary: boolean("primary").default(false),
  
  // Legacy fields for migration compatibility
  description: text("description"),
  country_code: varchar("country_code", { length: 10 }),
  province_code: varchar("province_code", { length: 10 }),
  province_other: varchar("province_other", { length: 255 }),
  active: boolean("active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Identifications table schema
export const identifications = pgTable("org_identifications", {
  id: serial("id").primaryKey(),
  clerkOrganizationId: varchar("clerk_organization_id", { length: 255 }).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  addressId: integer("address_id").references(() => addresses.id),
  
  // Document details
  documentType: varchar("document_type", { length: 100 }).notNull(), // "PASSPORT" | "DRIVERS_LICENSE" | "ID_CARD"
  documentNumber: varchar("document_number", { length: 255 }).notNull(),
  issuingCountry: varchar("issuing_country", { length: 255 }).notNull(),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  
  // Status and metadata
  primary: boolean("primary").default(false),
  verified: boolean("verified").default(false),
  verificationStatus: varchar("verification_status", { length: 50 }).default("PENDING"),
  
  // Document files
  photoUrl: varchar("photo_url", { length: 500 }), // Front of document
  scanDataUrl: varchar("scan_data_url", { length: 500 }), // Scanned data
  additionalDocuments: json("additional_documents"), // Array of supporting document URLs
  
  // Legacy fields for migration compatibility
  description: text("description"),
  typeCode: varchar("type_code", { length: 50 }),
  country_code: varchar("country_code", { length: 10 }),
  province_code: varchar("province_code", { length: 10 }),
  province_other: varchar("province_other", { length: 255 }),
  active: boolean("active").default(true),
  orderId: integer("order_id"), // Reference to order if ID was provided for transaction
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer flags for compliance
export const customerFlags = pgTable("org_customer_flags", {
  id: serial("id").primaryKey(),
  clerkOrganizationId: varchar("clerk_organization_id", { length: 255 }).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  
  // Flag details
  flagType: varchar("flag_type", { length: 100 }).notNull(), // "SUSPICIOUS" | "COMPLIANCE" | "MANUAL_REVIEW"
  reason: varchar("reason", { length: 255 }).notNull(),
  description: text("description"),
  
  // Status and resolution
  status: varchar("status", { length: 50 }).default("ACTIVE"), // "ACTIVE" | "RESOLVED" | "DISMISSED"
  resolvedBy: integer("resolved_by"), // User ID who resolved the flag
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  
  // Metadata
  userId: integer("user_id").notNull(), // User who created the flag
  metadata: json("metadata"), // Additional flag data
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Customer Creation Service
```typescript
export const createCustomer = mutation({
  args: {
    clerkOrganizationId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    employer: v.optional(v.string()),
    occupation: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    
    // Contacts array
    contacts: v.optional(v.array(v.object({
      typeof: v.string(), // "email" | "telephone"
      endpoint: v.string(),
      primary: v.optional(v.boolean()),
    }))),
    
    // Addresses array
    addresses: v.optional(v.array(v.object({
      street: v.string(),
      city: v.string(),
      province: v.optional(v.string()),
      country: v.string(),
      postalCode: v.string(),
      typeCode: v.optional(v.string()),
      primary: v.optional(v.boolean()),
    }))),
    
    // Identifications array
    identifications: v.optional(v.array(v.object({
      documentType: v.string(),
      documentNumber: v.string(),
      issuingCountry: v.string(),
      issueDate: v.optional(v.string()),
      expiryDate: v.optional(v.string()),
      primary: v.optional(v.boolean()),
      photoUrl: v.optional(v.string()),
      scanDataUrl: v.optional(v.string()),
    }))),
    
    // Additional data
    info: v.optional(v.any()),
    scanData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 1. Create customer
    const customerId = await ctx.db.insert("org_customers", {
      clerkOrganizationId: args.clerkOrganizationId,
      firstName: args.firstName,
      lastName: args.lastName,
      middleName: args.middleName,
      dateOfBirth: args.dateOfBirth,
      employer: args.employer,
      occupation: args.occupation,
      countryCode: args.countryCode,
      active: true,
      blacklisted: false,
      riskScore: 0,
      orderCount: 0,
      info: args.info,
      scanData: args.scanData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // 2. Create contacts
    if (args.contacts && args.contacts.length > 0) {
      for (const contact of args.contacts) {
        const contactId = await ctx.db.insert("org_contacts", {
          clerkOrganizationId: args.clerkOrganizationId,
          customerId: customerId,
          typeof: contact.typeof,
          endpoint: contact.endpoint,
          primary: contact.primary || false,
          verified: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        
        // Update primary contact ID if this is primary
        if (contact.primary) {
          await ctx.db.patch(customerId, {
            primaryContactId: contactId,
            updatedAt: Date.now(),
          });
        }
      }
    }
    
    // 3. Create addresses
    if (args.addresses && args.addresses.length > 0) {
      for (const address of args.addresses) {
        const addressId = await ctx.db.insert("org_addresses", {
          clerkOrganizationId: args.clerkOrganizationId,
          customerId: customerId,
          street: address.street,
          city: address.city,
          province: address.province,
          country: address.country,
          postalCode: address.postalCode,
          typeCode: address.typeCode || "RESIDENTIAL",
          primary: address.primary || false,
          active: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        
        // Update primary address ID if this is primary
        if (address.primary) {
          await ctx.db.patch(customerId, {
            primaryAddressId: addressId,
            updatedAt: Date.now(),
          });
        }
      }
    }
    
    // 4. Create identifications
    if (args.identifications && args.identifications.length > 0) {
      for (const identification of args.identifications) {
        const identificationId = await ctx.db.insert("org_identifications", {
          clerkOrganizationId: args.clerkOrganizationId,
          customerId: customerId,
          documentType: identification.documentType,
          documentNumber: identification.documentNumber,
          issuingCountry: identification.issuingCountry,
          issueDate: identification.issueDate,
          expiryDate: identification.expiryDate,
          primary: identification.primary || false,
          verified: false,
          verificationStatus: "PENDING",
          photoUrl: identification.photoUrl,
          scanDataUrl: identification.scanDataUrl,
          active: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        
        // Update primary identification ID if this is primary
        if (identification.primary) {
          await ctx.db.patch(customerId, {
            primaryIdentificationId: identificationId,
            updatedAt: Date.now(),
          });
        }
      }
    }
    
    // 5. Log activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: args.clerkOrganizationId,
      userId: identity.subject,
      sessionId: null,
      event: "CUSTOMER_CREATED",
      referenceId: customerId,
      comment: "",
      meta: {
        firstName: args.firstName,
        lastName: args.lastName,
        contactCount: args.contacts?.length || 0,
        addressCount: args.addresses?.length || 0,
        identificationCount: args.identifications?.length || 0,
      },
      createdAt: Date.now(),
    });
    
    return { success: true, customerId };
  },
});
```

### Customer Search and Management
```typescript
export const searchCustomers = query({
  args: {
    clerkOrganizationId: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    telephone: v.optional(v.string()),
    email: v.optional(v.string()),
    active: v.optional(v.boolean()),
    blacklisted: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("org_customers")
      .withIndex("by_clerk_org_id", (q) => 
        q.eq("clerkOrganizationId", args.clerkOrganizationId)
      );
    
    // Apply filters
    if (args.active !== undefined) {
      query = query.filter((q) => q.eq(q.field("active"), args.active));
    }
    
    if (args.blacklisted !== undefined) {
      query = query.filter((q) => q.eq(q.field("blacklisted"), args.blacklisted));
    }
    
    let customers = await query.collect();
    
    // Apply text-based filters
    if (args.firstName) {
      customers = customers.filter(c => 
        c.firstName.toLowerCase().includes(args.firstName.toLowerCase())
      );
    }
    
    if (args.lastName) {
      customers = customers.filter(c => 
        c.lastName.toLowerCase().includes(args.lastName.toLowerCase())
      );
    }
    
    // Search by telephone/email in contacts
    if (args.telephone || args.email) {
      const customerIds = await searchCustomersByContact(ctx, args);
      customers = customers.filter(c => customerIds.includes(c._id));
    }
    
    // Apply pagination
    if (args.offset) {
      customers = customers.slice(args.offset);
    }
    
    if (args.limit) {
      customers = customers.slice(0, args.limit);
    }
    
    // Enrich with related data
    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const contacts = await ctx.db
          .query("org_contacts")
          .withIndex("by_customer_id", (q) => q.eq("customerId", customer._id))
          .collect();
        
        const addresses = await ctx.db
          .query("org_addresses")
          .withIndex("by_customer_id", (q) => q.eq("customerId", customer._id))
          .collect();
        
        const identifications = await ctx.db
          .query("org_identifications")
          .withIndex("by_customer_id", (q) => q.eq("customerId", customer._id))
          .collect();
        
        const recentOrders = await ctx.db
          .query("org_orders")
          .withIndex("by_customer_id", (q) => q.eq("customerId", customer._id))
          .order("desc")
          .limit(5)
          .collect();
        
        return {
          ...customer,
          contacts: contacts.map(c => ({
            id: c._id,
            type: c.typeof,
            endpoint: c.endpoint,
            primary: c.primary,
            verified: c.verified,
          })),
          addresses: addresses.map(a => ({
            id: a._id,
            street: a.street,
            city: a.city,
            province: a.province,
            country: a.country,
            postalCode: a.postalCode,
            typeCode: a.typeCode,
            primary: a.primary,
          })),
          identifications: identifications.map(i => ({
            id: i._id,
            documentType: i.documentType,
            documentNumber: i.documentNumber,
            issuingCountry: i.issuingCountry,
            issueDate: i.issueDate,
            expiryDate: i.expiryDate,
            primary: i.primary,
            verified: i.verified,
            verificationStatus: i.verificationStatus,
            photoUrl: i.photoUrl,
          })),
          recentOrders: recentOrders.map(o => ({
            id: o._id,
            status: o.status,
            createdAt: o.createdAt,
            inboundSum: o.inboundSum,
            outboundSum: o.outboundSum,
          })),
          orderCount: recentOrders.length,
        };
      })
    );
    
    return enrichedCustomers;
  },
});

// Helper function for contact-based search
async function searchCustomersByContact(ctx: any, args: any) {
  const contactQuery = ctx.db
    .query("org_contacts")
    .withIndex("by_clerk_org_id", (q) => 
      q.eq("clerkOrganizationId", args.clerkOrganizationId)
    );
  
  let contacts = await contactQuery.collect();
  
  if (args.telephone) {
    contacts = contacts.filter(c => 
      c.endpoint.includes(args.telephone) && c.typeof === "telephone"
    );
  }
  
  if (args.email) {
    contacts = contacts.filter(c => 
      c.endpoint.toLowerCase().includes(args.email.toLowerCase()) && c.typeof === "email"
    );
  }
  
  return contacts.map(c => c.customerId);
}
```

### Customer Risk Assessment
```typescript
export const updateCustomerRiskAssessment = mutation({
  args: {
    customerId: v.id("org_customers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 1. Get customer and their orders
    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found");
    
    const orders = await ctx.db
      .query("org_orders")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.customerId))
      .collect();
    
    // 2. Calculate risk based on order patterns
    const completedOrders = orders.filter(o => o.status === "COMPLETED");
    const cadOrders = completedOrders.filter(o => 
      o.outboundTicker === "CAD" || o.inboundTicker === "CAD"
    );
    
    // Count orders in different ranges
    const orders1kTo9k = cadOrders.filter(o => {
      const cadAmount = o.outboundTicker === "CAD" ? o.outboundSum : o.inboundSum;
      return cadAmount >= 1000 && cadAmount < 9000;
    }).length;
    
    const orders9kTo10k = cadOrders.filter(o => {
      const cadAmount = o.outboundTicker === "CAD" ? o.outboundSum : o.inboundSum;
      return cadAmount >= 9000 && cadAmount < 10000;
    }).length;
    
    // 3. Calculate risk score (matching legacy logic)
    const baseScore = 0;
    const thresholdRisk = orders9kTo10k * 10;
    const volumeRisk = orders1kTo9k * 2;
    const newRiskScore = baseScore + thresholdRisk + volumeRisk;
    
    // 4. Update customer risk score
    await ctx.db.patch(args.customerId, {
      riskScore: newRiskScore,
      updatedAt: Date.now(),
    });
    
    // 5. Log assessment
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: customer.clerkOrganizationId,
      userId: identity.subject,
      sessionId: null,
      event: "CUSTOMER_RISK_ASSESSMENT",
      referenceId: args.customerId,
      comment: `Risk score updated to ${newRiskScore}`,
      meta: {
        previousRiskScore: customer.riskScore,
        newRiskScore: newRiskScore,
        orderCount: completedOrders.length,
        orders1kTo9k: orders1kTo9k,
        orders9kTo10k: orders9kTo10k,
      },
      createdAt: Date.now(),
    });
    
    return { 
      success: true, 
      riskScore: newRiskScore,
      assessmentFactors: {
        orderCount: completedOrders.length,
        orders1kTo9k: orders1kTo9k,
        orders9kTo10k: orders9kTo10k,
      }
    };
  },
});
```

### Customer Merge Service
```typescript
export const mergeCustomers = mutation({
  args: {
    primaryCustomerId: v.id("org_customers"),
    secondaryCustomerId: v.id("org_customers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 1. Validate customers
    const primaryCustomer = await ctx.db.get(args.primaryCustomerId);
    const secondaryCustomer = await ctx.db.get(args.secondaryCustomerId);
    
    if (!primaryCustomer) throw new Error("Primary customer not found");
    if (!secondaryCustomer) throw new Error("Secondary customer not found");
    if (args.primaryCustomerId === args.secondaryCustomerId) {
      throw new Error("Cannot merge customer with itself");
    }
    
    // 2. Transfer orders to primary customer
    const orders = await ctx.db
      .query("org_orders")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.secondaryCustomerId))
      .collect();
    
    for (const order of orders) {
      await ctx.db.patch(order._id, {
        customerId: args.primaryCustomerId,
        updatedAt: Date.now(),
      });
    }
    
    // 3. Transfer contacts to primary customer
    const contacts = await ctx.db
      .query("org_contacts")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.secondaryCustomerId))
      .collect();
    
    for (const contact of contacts) {
      await ctx.db.patch(contact._id, {
        customerId: args.primaryCustomerId,
        updatedAt: Date.now(),
      });
    }
    
    // 4. Transfer addresses to primary customer
    const addresses = await ctx.db
      .query("org_addresses")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.secondaryCustomerId))
      .collect();
    
    for (const address of addresses) {
      await ctx.db.patch(address._id, {
        customerId: args.primaryCustomerId,
        updatedAt: Date.now(),
      });
    }
    
    // 5. Transfer identifications to primary customer
    const identifications = await ctx.db
      .query("org_identifications")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.secondaryCustomerId))
      .collect();
    
    for (const identification of identifications) {
      await ctx.db.patch(identification._id, {
        customerId: args.primaryCustomerId,
        updatedAt: Date.now(),
      });
    }
    
    // 6. Mark secondary as duplicate
    const previousIds = primaryCustomer.previousIds || [];
    previousIds.push(args.secondaryCustomerId);
    
    await ctx.db.patch(args.secondaryCustomerId, {
      duplicate: true,
      mergedId: args.primaryCustomerId,
      active: false,
      updatedAt: Date.now(),
    });
    
    await ctx.db.patch(args.primaryCustomerId, {
      previousIds: previousIds,
      updatedAt: Date.now(),
    });
    
    // 7. Log merge activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: primaryCustomer.clerkOrganizationId,
      userId: identity.subject,
      sessionId: null,
      event: "CUSTOMERS_MERGED",
      referenceId: args.primaryCustomerId,
      comment: `Merged customer ${args.secondaryCustomerId} into ${args.primaryCustomerId}`,
      meta: {
        primaryCustomerId: args.primaryCustomerId,
        secondaryCustomerId: args.secondaryCustomerId,
        ordersTransferred: orders.length,
        contactsTransferred: contacts.length,
        addressesTransferred: addresses.length,
        identificationsTransferred: identifications.length,
      },
      createdAt: Date.now(),
    });
    
    return { 
      success: true, 
      message: "Customers merged successfully",
      transferredItems: {
        orders: orders.length,
        contacts: contacts.length,
        addresses: addresses.length,
        identifications: identifications.length,
      }
    };
  },
});
```

## Error Handling

### Validation Errors
- **Customer Exists**: "Customer with this identification already exists"
- **Invalid Contact**: "Invalid contact information format"
- **Invalid Address**: "Invalid address format"
- **Invalid Identification**: "Invalid identification document"
- **Unauthorized**: "User is not authorized to manage customers"

### System Errors
- **Database Error**: "An error occurred while creating customer"
- **Merge Conflict**: "Cannot merge customers due to conflicting data"
- **Risk Assessment Error**: "Failed to calculate customer risk score"
- **File Upload Error**: "Failed to upload identification documents"

## User Interface Requirements

### Customer Management
1. **Customer Search**: Advanced search by name, contact, and identification
2. **Customer Creation**: Multi-step form with contact, address, and ID collection
3. **Customer Dashboard**: Overview with orders, risk score, and flags
4. **Customer Editing**: Update customer information and associations
5. **Merge Interface**: Tool for merging duplicate customer records

### Identification Management
1. **Document Upload**: Photo and scan data upload for ID verification
2. **Document Validation**: Automated validation of identification documents
3. **Expiration Tracking**: Monitor and alert for expiring documents
4. **Verification Status**: Track verification progress and status

### Compliance Features
1. **Risk Dashboard**: Customer risk scoring and monitoring
2. **Flag Management**: Create, track, and resolve customer flags
3. **Blacklist Management**: Blacklist/unblacklist customers with reasoning
4. **Audit Trail**: Complete history of customer modifications

## Integration Points

### Components Using Customer System
1. **Order Creation**: Customer selection and attachment
2. **Compliance Monitoring**: Risk assessment and flagging
3. **Reporting**: Customer analytics and transaction history
4. **Marketing**: Customer communication and outreach
5. **Receipt Generation**: Customer information on receipts

### Shared Functions
- `searchCustomers()` for customer lookup
- `createCustomer()` for customer creation
- `updateCustomerRiskAssessment()` for compliance
- `mergeCustomers()` for duplicate management

## Testing Requirements

### Unit Tests
- Test customer creation with all associated data
- Test customer search and filtering
- Test contact, address, and identification management
- Test risk assessment calculations
- Test customer merge functionality
- Test blacklist and flag management

### Integration Tests
- Test complete customer onboarding workflow
- Test customer-order relationships
- Test compliance workflows
- Test customer data migration
- Test duplicate detection and merging

### Edge Cases
- Duplicate customer detection
- Invalid identification documents
- High-risk customer scenarios
- Customer data conflicts during merge
- Missing contact information

## Security Considerations

### Authorization
- Verify user has customer management permissions
- Validate user belongs to organization
- Protect sensitive customer information
- Audit trail for all customer data access

### Data Privacy
- Encrypt sensitive customer data
- Proper handling of identification documents
- GDPR compliance for data handling
- Secure file storage for ID documents

## Performance Considerations

### Database Queries
- Efficient indexing on customer names and contacts
- Optimized search with proper filtering
- Customer data caching for frequent access
- Pagination for large customer datasets

### User Experience
- Fast customer search and lookup
- Real-time validation during customer creation
- Optimized customer dashboard loading
- Responsive customer management interface

## Migration Notes

### Legacy to MetaCX Differences
1. **Authentication**: Rails uses token auth vs MetaCX uses Clerk JWT
2. **Database**: Rails PostgreSQL vs MetaCX Convex
3. **File Storage**: Legacy uses Active Storage vs MetaCX cloud storage
4. **Search**: Legacy uses Algolia vs MetaCX database search

### Preserved Legacy Logic
- Customer data structure and relationships
- Risk assessment calculations
- Customer merge procedures
- Contact and address management
- Identification verification workflow
- Compliance and flagging system

## Future Enhancements

### Potential Improvements
1. **Advanced Customer Analytics**: Enhanced customer behavior analysis
2. **AI-powered Duplicate Detection**: Machine learning for duplicate detection
3. **Digital Identity Verification**: Integration with digital ID services
4. **Customer Portal**: Self-service customer portal
5. **Mobile Customer Management**: Optimized mobile customer interface
6. **Automated Compliance**: AI-powered compliance monitoring

### Analytics
- Track customer acquisition patterns
- Monitor customer lifetime value
- Report on compliance flag patterns
- User behavior analysis for customer interactions
- Revenue analysis by customer segments
