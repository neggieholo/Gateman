import { PermissionNode } from "./types";

export const ESTATE_PERMISSIONS: PermissionNode[] = [
  // ==========================================
  // ROOT LEVEL - ALL ACCESS
  // ==========================================
  {
    id: "all-access",
    name: "Full Estate Administrative Access",
    parent_permission: null,
  },

  // ==========================================
  // RESIDENTS MANAGEMENT (Replacing general users_management)
  // ==========================================
  {
    id: "residents_management",
    name: "Residents Management",
    parent_permission: null,
  },
  {
    id: "view_residents",
    name: "View Resident Directory",
    parent_permission: "residents_management",
  },
  {
    id: "add_resident",
    name: "Add/Invite New Residents",
    parent_permission: "residents_management",
  },
  {
    id: "modify_resident_status",
    name: "Suspend & Enable Residents",
    parent_permission: "residents_management",
  },
  {
    id: "delete_resident_account",
    name: "Delete Resident Account",
    parent_permission: "residents_management",
  },

  // ==========================================
  // SECURITY & GUARD MANAGEMENT
  // ==========================================
  {
    id: "security_management",
    name: "Security Guard Management",
    parent_permission: null,
  },
  {
    id: "view_guards",
    name: "View Security Guards List",
    parent_permission: "security_management",
  },
  {
    id: "add_guard",
    name: "Register New Security Guard",
    parent_permission: "security_management",
  },
  {
    id: "modify_guard_status",
    name: "Suspend & Enable Security Guards",
    parent_permission: "security_management",
  },
  {
    id: "delete_guard_account",
    name: "Delete Guard Account",
    parent_permission: "security_management",
  },

  // ==========================================
  // VISITOR & ENTRY OPERATIONS (Gate Operations)
  // ==========================================
  {
    id: "visitor_operations",
    name: "Visitor & Check-In Control",
    parent_permission: null,
  },
  {
    id: "view_checkins",
    name: "View Live Visitor Logs",
    parent_permission: "visitor_operations",
  },
  {
    id: "generate_invite_code",
    name: "Generate Visitor Invite Codes",
    parent_permission: "visitor_operations",
  },
  {
    id: "override_entry_code",
    name: "Manually Check-In / Check-Out Visitors",
    parent_permission: "visitor_operations",
  },

  // ==========================================
  // ESTATE SETTINGS, CONFIGURATIONS & PAYMENTS
  // ==========================================
  {
    id: "estate_settings",
    name: "Estate Settings & Configurations",
    parent_permission: null,
  },
  {
    id: "view_estate_profile",
    name: "View Estate Details & Financials",
    parent_permission: "estate_settings",
  },
  {
    id: "edit_estate_details",
    name: "Edit Estate Info (Name, Address, Rules)",
    parent_permission: "estate_settings",
  },
  {
    id: "configure_kyc_rules",
    name: "Configure Tenant KYC Requirements",
    parent_permission: "estate_settings",
  },
  {
    id: "manage_bank_details",
    name: "Configure Bank Payout Details",
    parent_permission: "estate_settings",
  },

  // ==========================================
  // AUDIT LOGS & REPORTS
  // ==========================================
  {
    id: "logs_management",
    name: "Logs & Reports",
    parent_permission: null,
  },
  {
    id: "view_audit_logs",
    name: "View Admin Activity & Security Audits",
    parent_permission: "logs_management",
  },
  {
    id: "export_visitor_reports",
    name: "Export & Download Visitor Reports",
    parent_permission: "logs_management",
  },
];
