import { defineSchema } from "convex/server";

// Import all schema definitions
import { users } from "./schema/users";
import { app_currencies } from "./schema/appCurrencies";
import { userPreferences } from "./schema/userPreferences";
import { cxsessions } from "./schema/cxsessions";
import { organizations } from "./schema/organizations";

// Import new schema definitions
import { org_currencies } from "./schema/orgCurrencies";
import { org_denominations } from "./schema/orgDenominations";
import { org_breakdowns } from "./schema/orgBreakdowns";
import { org_orders } from "./schema/orgOrders";
import { org_identifications } from "./schema/orgIdentifications";
import { org_customers } from "./schema/orgCustomers";
import { org_contacts } from "./schema/orgContacts";
import { org_addresses } from "./schema/orgAddresses";
import { org_repositories } from "./schema/orgRepositories";
import { org_float_transfers } from "./schema/orgFloatTransfers";
import { org_float_stacks } from "./schema/orgFloatStacks";
import { org_float_snapshots } from "./schema/orgFloatSnapshots";
import { org_repository_access_logs } from "./schema/orgRepositoryAccessLogs";
import { org_activities } from "./schema/orgActivities";
import {
  org_cx_sessions,
  org_cx_session_access_logs,
} from "./schema/orgCxSessions";
import { org_memberships, orgInvitations } from "./schema/orgMemberships";

export default defineSchema({
  // Existing tables
  users,
  userPreferences,
  app_currencies,
  cxsessions,
  organizations,

  // New tables
  org_currencies,
  org_denominations,
  org_breakdowns,
  org_orders,
  org_identifications,
  org_customers,
  org_contacts,
  org_addresses,
  org_repositories,
  org_float_transfers,
  org_float_stacks,
  org_float_snapshots,
  org_repository_access_logs,
  org_activities,
  org_cx_sessions,
  org_cx_session_access_logs,
  org_memberships,
  orgInvitations,
});
