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
    id: "manage_join_requests",
    name: "Accept, Decline, or Block Join Requests",
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
    name: "View Security Guards and Requests",
    parent_permission: "security_management",
  },
  {
    id: "manage_guard_requests",
    name: "Accept, Decline, or Block Security Guard Requests",
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
    name: "View Guests' Invitations and Check-In Records",
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
    id: "estate_administration",
    name: "Estate Administration & Configurations",
    parent_permission: null,
  },
  {
    id: "view_estate_profile",
    name: "View Estate Profile & Core Information",
    parent_permission: "estate_administration",
  },
  {
    id: "edit_estate_profile",
    name: "Edit Estate Profile & Emergency Contacts",
    parent_permission: "estate_administration",
  },
  {
    id: "view_estate_records",
    name: "View Estate Records (Payments, Services & Reports)",
    parent_permission: "estate_administration",
  },
  {
    id: "view_estate_reports",
    name: "View Estate Reports",
    parent_permission: "estate_administration",
  },
  {
    id: "manage_bank_details",
    name: "Manage Bank Payout & Settlement Details",
    parent_permission: "estate_administration",
  },
  {
    id: "modify_report_status",
    name: "Modify Report & Incident Statuses",
    parent_permission: "estate_administration",
  },
  {
    id: "modify_records_status",
    name: "Modify Record & Payment Statuses",
    parent_permission: "estate_administration",
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
    id: "view_security_logs",
    name: "View Security Guard Activity Logs",
    parent_permission: "logs_management",
  },
  {
    id: "view_resident_logs",
    name: "View Resident Access & Activity Logs",
    parent_permission: "logs_management",
  },
  {
    id: "view_admin_logs",
    name: "View Admin Activity & Audit Logs",
    parent_permission: "logs_management",
  },
  // ==========================================
  // NOTIFICATIONS MANAGEMENT
  // ==========================================
  {
    id: "notifications_management",
    name: "Notifications Management (Root)",
    parent_permission: null,
  },
  {
    id: "read_notifications",
    name: "View & Read System Notifications",
    parent_permission: "notifications_management",
  },
  {
    id: "send_notifications",
    name: "Dispatch & Broadcast Notifications",
    parent_permission: "notifications_management",
  },
  {
    id: "delete_notifications",
    name: "Purge & Delete Notifications",
    parent_permission: "notifications_management",
  },
  {
    id: "export_logs",
    name: "Export & Download System Audit Logs",
    parent_permission: "logs_management",
  },
  // ==========================================
  // COMMUNITY MANAGEMENT
  // ==========================================
  {
    id: "community_management",
    name: "Community Feed & Posts Management",
    parent_permission: null,
  },
  {
    id: "view_community_posts",
    name: "View Community Posts & Feed",
    parent_permission: "community_management",
  },
  {
    id: "create_community_posts",
    name: "Create Posts, Comment & Like Community Feed",
    parent_permission: "community_management",
  },
  {
    id: "moderate_community_posts",
    name: "Moderate Posts (Delete or Archive)",
    parent_permission: "community_management",
  },
  // ==========================================
  // FACILITY MANAGEMENT
  // ==========================================
  {
    id: "facility_management",
    name: "Facility & Amenity Management",
    parent_permission: null,
  },
  {
    id: "view_facility_bookings",
    name: "View Facilities & Booking Calendar",
    parent_permission: "facility_management",
  },
  // {
  //   id: "create_facility_booking",
  //   name: "Book Facilities & Reserve Amenities",
  //   parent_permission: "facility_management",
  // },
  {
    id: "manage_facility_bookings",
    name: "Approve, Decline & Cancel Bookings",
    parent_permission: "facility_management",
  },
  {
    id: "configure_facilities",
    name: "Manage Facility Settings, Slots & Pricing",
    parent_permission: "facility_management",
  },
];
