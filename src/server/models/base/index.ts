import { db } from "@/server/db";
import { eq, and, desc, asc, count } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";

// Base validation error class
export class ValidationError extends Error {
  public errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super("Validation failed");
    this.errors = errors;
    this.name = "ValidationError";
  }
}

// Hook types
export type BeforeHook<T> = (
  data: Partial<T>
) => Promise<Partial<T>> | Partial<T>;
export type AfterHook<T> = (record: T) => Promise<void> | void;

// Base model configuration
export interface BaseModelConfig<T> {
  table: PgTable;
  primaryKey?: string;
  timestamps?: boolean;
  validations?: ValidationRules<T>;
}

// Validation rules
export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule[];
};

export interface ValidationRule {
  type: "required" | "email" | "min" | "max" | "custom";
  value?: any;
  message?: string;
  validator?: (value: any) => boolean;
}

// Query options
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: { field: string; direction: "asc" | "desc" }[];
  where?: any;
}

// Base Active Record-like model class
export abstract class BaseModel<T extends Record<string, any>> {
  protected static table: PgTable;
  protected static primaryKey: string = "id";
  protected static timestamps: boolean = true;
  protected static validations: ValidationRules<any> = {};

  // Instance properties
  public attributes: Partial<T> = {};
  public isNewRecord: boolean = true;
  public errors: Record<string, string[]> = {};
  private changedFields: Set<keyof T> = new Set();

  // Hooks
  protected static beforeCreateHooks: BeforeHook<any>[] = [];
  protected static beforeUpdateHooks: BeforeHook<any>[] = [];
  protected static beforeDeleteHooks: BeforeHook<any>[] = [];
  protected static afterCreateHooks: AfterHook<any>[] = [];
  protected static afterUpdateHooks: AfterHook<any>[] = [];
  protected static afterDeleteHooks: AfterHook<any>[] = [];

  constructor(data?: Partial<T> | string) {
    if (typeof data === "string") {
      // Initialize with ID for loading
      const ModelClass = this.constructor as typeof BaseModel;
      this.attributes = { [ModelClass.primaryKey]: data } as Partial<T>;
      this.isNewRecord = false;
    } else if (data) {
      // Initialize with data - manually copy properties to avoid Object.assign
      this.attributes = {};
      for (const [key, value] of Object.entries(data)) {
        this.attributes[key as keyof T] = value as T[keyof T];
      }
      const ModelClass = this.constructor as typeof BaseModel;
      this.isNewRecord = !data[ModelClass.primaryKey as keyof T];
    }
  }

  // Static methods for class-level operations
  static configure<T>(config: BaseModelConfig<T>) {
    this.table = config.table;
    this.primaryKey = config.primaryKey || "id";
    this.timestamps = config.timestamps !== false;
    this.validations = config.validations || {};
  }

  // Hook registration methods
  static beforeCreate<T>(hook: BeforeHook<T>) {
    this.beforeCreateHooks.push(hook);
  }

  static beforeUpdate<T>(hook: BeforeHook<T>) {
    this.beforeUpdateHooks.push(hook);
  }

  static beforeDelete<T>(hook: BeforeHook<T>) {
    this.beforeDeleteHooks.push(hook);
  }

  static afterCreate<T>(hook: AfterHook<T>) {
    this.afterCreateHooks.push(hook);
  }

  static afterUpdate<T>(hook: AfterHook<T>) {
    this.afterUpdateHooks.push(hook);
  }

  static afterDelete<T>(hook: AfterHook<T>) {
    this.afterDeleteHooks.push(hook);
  }

  // Query methods
  static async find<T extends Record<string, any>>(
    this: new (data?: any) => BaseModel<T>,
    id: string
  ): Promise<BaseModel<T> | null> {
    const ModelClass = this as any;
    const [record] = await db
      .select()
      .from(ModelClass.table)
      .where(eq(ModelClass.table[ModelClass.primaryKey], id));

    if (!record) return null;

    const instance = new this();
    // Manually copy properties to avoid Object.assign
    instance.attributes = {};
    for (const [key, value] of Object.entries(record)) {
      instance.attributes[key as keyof T] = value as T[keyof T];
    }
    instance.isNewRecord = false;
    return instance;
  }

  static async findBy<T extends Record<string, any>>(
    this: new (data?: any) => BaseModel<T>,
    field: string,
    value: any
  ): Promise<BaseModel<T> | null> {
    const ModelClass = this as any;
    const [record] = await db
      .select()
      .from(ModelClass.table)
      .where(eq(ModelClass.table[field], value));

    if (!record) return null;

    const instance = new this();
    // Manually copy properties to avoid Object.assign
    instance.attributes = {};
    for (const [key, value] of Object.entries(record)) {
      instance.attributes[key as keyof T] = value as T[keyof T];
    }
    instance.isNewRecord = false;
    return instance;
  }

  static async where<T extends Record<string, any>>(
    this: new (data?: any) => BaseModel<T>,
    conditions: Record<string, any>,
    options: QueryOptions = {}
  ): Promise<BaseModel<T>[]> {
    const ModelClass = this as any;
    let query = db.select().from(ModelClass.table);

    // Build where conditions
    const whereConditions = Object.entries(conditions).map(([field, value]) =>
      eq(ModelClass.table[field], value)
    );

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Add ordering
    if (options.orderBy) {
      const orderClauses = options.orderBy.map(({ field, direction }) =>
        direction === "desc"
          ? desc(ModelClass.table[field])
          : asc(ModelClass.table[field])
      );
      query = query.orderBy(...orderClauses);
    }

    // Add pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.offset(options.offset);
    }

    const records = await query;

    return records.map((record) => {
      const instance = new this();
      // Manually copy properties to avoid Object.assign
      instance.attributes = {};
      for (const [key, value] of Object.entries(record)) {
        instance.attributes[key as keyof T] = value as T[keyof T];
      }
      instance.isNewRecord = false;
      return instance;
    });
  }

  static async all<T extends Record<string, any>>(
    this: new (data?: any) => BaseModel<T>,
    options: QueryOptions = {}
  ): Promise<BaseModel<T>[]> {
    return this.where({}, options);
  }

  static async count<T extends Record<string, any>>(
    this: new (data?: any) => BaseModel<T>,
    conditions: Record<string, any> = {}
  ): Promise<number> {
    const ModelClass = this as any;
    let query = db.select({ count: count() }).from(ModelClass.table);

    const whereConditions = Object.entries(conditions).map(([field, value]) =>
      eq(ModelClass.table[field], value)
    );

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    const [result] = await query;
    return result.count;
  }

  static async create<T extends Record<string, any>>(
    this: new (data?: any) => BaseModel<T>,
    data: Partial<T>
  ): Promise<BaseModel<T>> {
    const instance = new this(data);
    await instance.save();
    return instance;
  }

  // Instance methods
  async load(): Promise<this> {
    if (this.isNewRecord) {
      throw new Error("Cannot load a new record");
    }

    const ModelClass = this.constructor as typeof BaseModel;
    const id = this.attributes[ModelClass.primaryKey as keyof T];
    const [record] = await db
      .select()
      .from(ModelClass.table)
      .where(eq(ModelClass.table[ModelClass.primaryKey], id));

    if (record) {
      // Manually copy properties to avoid Object.assign
      this.attributes = {};
      for (const [key, value] of Object.entries(record)) {
        this.attributes[key as keyof T] = value as T[keyof T];
      }
    }

    return this;
  }

  async save(): Promise<boolean> {
    try {
      if (!this.validate()) {
        return false;
      }

      const ModelClass = this.constructor as any;

      if (this.isNewRecord) {
        // Manually copy attributes to avoid Object.assign
        const data: any = {};
        for (const [key, value] of Object.entries(this.attributes)) {
          data[key] = value;
        }

        // Run before create hooks
        for (const hook of ModelClass.beforeCreateHooks) {
          const hookResult = await hook(data);
          // Manually merge hook result
          for (const [key, value] of Object.entries(hookResult)) {
            data[key] = value;
          }
        }

        // Add timestamps
        if (ModelClass.timestamps) {
          data.createdAt = new Date();
          data.updatedAt = new Date();
        }

        // Generate ID if not provided
        if (!data[ModelClass.primaryKey]) {
          data[ModelClass.primaryKey] = crypto.randomUUID();
        }

        const [created] = await db
          .insert(ModelClass.table)
          .values(data)
          .returning();

        // Manually copy created record
        this.attributes = {};
        for (const [key, value] of Object.entries(created)) {
          this.attributes[key as keyof T] = value as T[keyof T];
        }
        this.isNewRecord = false;

        // Run after create hooks
        for (const hook of ModelClass.afterCreateHooks) {
          await hook(this.attributes);
        }
      } else {
        // Build update data with only changed fields
        const updateData: any = {};

        // Only include changed fields in the update
        for (const field of this.changedFields) {
          updateData[field as string] = this.attributes[field];
        }

        // Run before update hooks
        for (const hook of ModelClass.beforeUpdateHooks) {
          const hookResult = await hook(updateData);
          // Manually merge hook result
          for (const [key, value] of Object.entries(hookResult)) {
            updateData[key] = value;
          }
        }

        // Add updated timestamp
        if (ModelClass.timestamps) {
          updateData.updatedAt = new Date();
        }

        const id = this.attributes[ModelClass.primaryKey];
        const [updated] = await db
          .update(ModelClass.table)
          .set(updateData)
          .where(eq(ModelClass.table[ModelClass.primaryKey], id))
          .returning();

        // Manually copy updated record
        this.attributes = {};
        for (const [key, value] of Object.entries(updated)) {
          this.attributes[key as keyof T] = value as T[keyof T];
        }
        this.changedFields.clear(); // Clear changed fields after successful update

        // Run after update hooks
        for (const hook of ModelClass.afterUpdateHooks) {
          await hook(this.attributes);
        }
      }

      return true;
    } catch (error) {
      console.error("Save error:", error);
      return false;
    }
  }

  async destroy(): Promise<boolean> {
    try {
      if (this.isNewRecord) {
        throw new Error("Cannot delete a new record");
      }

      const ModelClass = this.constructor as any;

      // Run before delete hooks
      for (const hook of ModelClass.beforeDeleteHooks) {
        await hook(this.attributes);
      }

      const id = this.attributes[ModelClass.primaryKey];
      await db
        .delete(ModelClass.table)
        .where(eq(ModelClass.table[ModelClass.primaryKey], id));

      // Run after delete hooks
      for (const hook of ModelClass.afterDeleteHooks) {
        await hook(this.attributes);
      }

      return true;
    } catch (error) {
      console.error("Delete error:", error);
      return false;
    }
  }

  validate(): boolean {
    this.errors = {};
    const ModelClass = this.constructor as any;
    const validations = ModelClass.validations;

    for (const [field, rules] of Object.entries(validations)) {
      const value = this.attributes[field as keyof T];
      const fieldErrors: string[] = [];

      for (const rule of rules as ValidationRule[]) {
        switch (rule.type) {
          case "required":
            if (!value) {
              fieldErrors.push(rule.message || `${field} is required`);
            }
            break;
          case "email":
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) {
              fieldErrors.push(
                rule.message || `${field} must be a valid email`
              );
            }
            break;
          case "min":
            if (value && (value as string).length < (rule.value as number)) {
              fieldErrors.push(
                rule.message ||
                  `${field} must be at least ${rule.value} characters`
              );
            }
            break;
          case "max":
            if (value && (value as string).length > (rule.value as number)) {
              fieldErrors.push(
                rule.message ||
                  `${field} must be at most ${rule.value} characters`
              );
            }
            break;
          case "custom":
            if (rule.validator && !rule.validator(value)) {
              fieldErrors.push(rule.message || `${field} is invalid`);
            }
            break;
        }
      }

      if (fieldErrors.length > 0) {
        this.errors[field] = fieldErrors;
      }
    }

    return Object.keys(this.errors).length === 0;
  }

  get isValid(): boolean {
    return this.validate();
  }

  get isPersisted(): boolean {
    return !this.isNewRecord;
  }

  // Attribute accessors
  get<K extends keyof T>(key: K): T[K] {
    return this.attributes[key];
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.attributes[key] = value;
    this.changedFields.add(key);
  }

  assign(data: Partial<T>): void {
    // Manually copy properties to avoid Object.assign
    for (const [key, value] of Object.entries(data)) {
      this.attributes[key as keyof T] = value as T[keyof T];
      this.changedFields.add(key as keyof T);
    }
  }

  toJSON(): T {
    // Manually copy properties to avoid spread operator issues
    const result = {} as T;
    for (const [key, value] of Object.entries(this.attributes)) {
      result[key as keyof T] = value as T[keyof T];
    }
    return result;
  }
}
