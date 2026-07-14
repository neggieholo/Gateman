/* eslint-disable @typescript-eslint/no-explicit-any */

export type Role = "resident" | "admin" | "superadmin";

export interface EmergencyContact {
  id: number; // or string, depending on Date.now() or UUID
  name: string;
  phone: string;
}

export interface KYCSelection {
  ids: boolean;
  selfie: boolean;
  utility_bill: boolean;
  rent_contract: boolean;
}

export interface User {
  id: string;
  estate_id: string;
  estate_name?: string;
  estate_code?: string;
  name: string;
  email: string;
  phone_number: string;
  state?: string | null;
  lga?: string | null;
  role: "admin";
  wallet_balance: number;
  avatar?: string | Blob;
  subscription_expiry?: string;
  created_at?: string;
  emergency_contacts: EmergencyContact[];
  payment_type: string;
  external_api_url: string;

  verification_step: number;
  nin_number?: string;
  bvn_number?: string;
  admin_selfie_url?: string;
  kyc_notes?: string;
  verified_at?: string;

  signature_url?: string;
  profile_image_url?: string;
  liveness_snaps?: string[];

  bank_account_number?: string;
  bank_code?: string;
  bank_account_name?: string;
  bank_name?: string;

  admin_role?: string;
  residential_address?: string;
  admin_utility_url?: string;
  identity_type: string;
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  is_verified: boolean;
  kyc_submitted_at: string;
  has_seen_kyc_success: boolean;
  consent_given: boolean;
  consent_timestamp?: string;
  kyc_selection: KYCSelection;
}

export interface Estate {
  id: string;
  name: string;
  estate_code: string;
  created_at: string;

  // --- Business Registration (CAC/TIN) ---
  cac_number?: string;
  tin_number?: string;
  business_type?: string; // e.g., 'INCORPORATED_TRUSTEE'
  registration_date?: string; // Date from CAC
  registered_address?: string; // Address found on CAC record

  // --- Document URLs ---
  cac_cert_url?: string;
  tin_cert_url?: string;
  estate_utility_url?: string; // Proof of Estate/Gatehouse location
  authorization_letter_url?: string; // The Board Resolution/Letter
  authorizing_body_name?: string; // e.g., "Silver Valley Residents Association"

  // --- Verification & Fintech ---
  cac_verification_status: "pending" | "active" | "invalid" | "flagged";
  paystack_subaccount_code?: string;
}

export interface Bill {
  id: string;
  type: "Electricity" | "Gas" | "Estate Dues";
  amount: number;
  dueDate: string;
  status: "Paid" | "Pending" | "Overdue";
  usage?: string; // e.g., "340 kWh"
  residentName?: string; // For admin view
  unit?: string; // For admin view
}

export interface Visitor {
  id: string;
  name: string;
  type: "Guest" | "Delivery" | "Service";
  accessCode: string;
  date: string;
  status: "Active" | "Expired" | "Used";
  unit?: string; // For admin view
}


export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  attendees: number;
  image: string;
}

export enum ViewState {
  DASHBOARD = "dashboard",
  UTILITIES = "utilities",
  SERVICES = "services",
  PAYMENT_APPROVALS = "payments",
  ACCESS = "access",
  FORUM = "forum",
  EVENTS = "events",
  USERS = "users",
  REQUESTS = "requests",
}

// Types
export type BillItem = {
  id: string;
  name: string;
  description?: string;
  amount: number;
  billing_cycle: "monthly" | "one_time";
  due_day?: number;
  invoice_type: "automatic" | "manual";
  generation_day?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  created_at: string | null;
  estate_ids: string[];
  locations: {
    [estateId: string]: LocationPair[];
  };
  sub_users: string[];
  parent_account_id: string;
  id_type?: string;
  id_front_url?: string;
  id_back_url?: string;
  utility_bill_url?: string;
  estate_name?: string;
  contract_urls:any;
  push_token?: string;
}

export interface LocationPair {
  block: string;
  unit: string[]; // Dynamic string array for multi-unit selection
}

export interface JoinRequest {
  id: string;
  temp_tenant_id: string;
  estate_id: string;
  locations:LocationPair;
  status: "PENDING" | "APPROVED" | "DECLINED" | "BLOCKED"; 
  requested_at: string;

  // Fields added via SQL JOIN
  temp_tenant_name: string;
  temp_tenant_email: string;
  temp_tenant_phone: string;

  // KYC Asset URLs (Cloudinary)
  selfie_url?: string;
  id_front_url?: string;
  id_back_url?: string;
  utility_bill_url?: string;

  // Identity Metadata
  id_type: "nin" | "voters" | "drivers";
}

export interface Invoice {
  id: string;
  tenant_id: string;
  estate_id: string;
  bill_id: string | null; // special invoices may not reference a bill
  invoice_month: string; // ISO date string (e.g. "2025-12-01")
  status: "pending" | "partially_paid" | "paid" | "overdue";
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_name: string;
  amount: number;
  quantity: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

export interface InvoiceWithTenant extends Invoice {
  items: InvoiceItem[];
  tenant: {
    id: string;
    name: string;
    block: string;
    unit: string;
  };
}

export interface EstateInvoice {
  id: string;
  bill_id: string | null; // Can be null for one-off invoices
  bill_name: string | null; // From billable_items.name
  total_amount: number; // From billable_items.amount
  supplier_name: string; // From estate_invoices
  calculation_method:
    | "EQUAL"
    | "BY_UNIT_TYPE"
    | "BY_CONSUMPTION"
    | "BY_SQUARE_METER"
    | "CUSTOM_FORMULA";
  period_start: string | null; // YYYY-MM-DD
  period_end: string | null; // YYYY-MM-DD
  attachment_image_path?: string | null;
  attachment_pdf_path?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null; // estate_admin_users.id
  created_by_name?: string | null; // estate_admin_users.name
}

export interface sessionResponse {
  success: boolean;
  user: User | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;
}

export interface BlockedUser {
  id: string;
  name: string;
  email: string;
}

export interface Invitation {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_image_url?: string;
  access_code: string;
  status: "pending" | "checked_in" | "checked_out" | "overstayed";
  invite_type: "one_time" | "multi_entry" | "staff_entry";
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  actual_checkin_date?: string;
  actual_checkout_date?: string;
  is_cancelled: boolean;
  excluded_dates?: string[];
  // Joined Fields
  resident_name?: string;
  locations: {
    [estateId: string]: LocationPair[];
  };
  estate_name?: string;
  estate_address?: string;
  lga?: string;
  town?: string;
  staff_position?: string;
  permitted_days: number[];
  is_activated?: boolean;
}

// -------------------- Core Security Types --------------------

export interface SecurityUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  estate_id: string;
  push_token?: string;
  is_on_duty: boolean;
  last_checkin?: string;
  last_checkout?: string;
  checkin_location?: string;
  checkout_location?: string;
  last_known_location?: string;
  last_location_time?: string;
  role: "SECURITY";
  id_type?: string;
  id_front_url?: string;
  id_back_url?: string;
}

export interface SecurityJoinRequest {
  id: string;
  temp_security_id: string;
  estate_id: string;
  id_type: string;
  selfie_url: string;
  id_front_url: string;
  id_back_url: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "BLOCKED";
  requested_at: string;
  name: string;
  email: string;
  phone: string;
}

export interface SecurityLog {
  id: string;
  security_id: string;
  guard_name: string; // Joined from security_users
  checkin_time: string;
  checkout_time?: string;
  checkin_location?: string;
  checkout_location?: string;
}

export interface BlockedSecurityUser {
  id: string;
  name: string;
  email: string;
}

// -------------------- API Response Wrappers --------------------

export interface SecurityRequestsResponse {
  success: boolean;
  requests: SecurityJoinRequest[];
}

export interface AllSecurityResponse {
  success: boolean;
  securityGuards: SecurityUser[];
}

export interface SecurityLogsResponse {
  success: boolean;
  logs: SecurityLog[];
}

export interface BlockedSecurityResponse {
  success: boolean;
  blockedUsers: BlockedSecurityUser[];
}

export interface StandardApiResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface EstateDocsPayload {
  cacNumber: string;
  tinNumber: string;
  cacCert: File;
  tinCert: File;
  estateUtility: File | null;
  accountNumber: string;
  bankCode: string;
  accountName: string;
  bankName: string;
}

export interface AdminIdentityPayload {
  adminFullName: string;
  ninNumber: string;
  bvnNumber: string;
  adminRole: string;
  residentialAddress: string;

  authorizingBodyName: string;
  authLetter: File;
  adminUtility: File | null;
  signature: File;
  selfie: File;
}

export interface Post {
  id: string;
  estate_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  title: string;
  content: string;
  category: string;
  image_url?: string;
  thumbnail_url?: string;
  likes_count: number;
  comments_count: number;
  has_liked: boolean;
  created_at: string;
  admin_seen: boolean;
  is_archived: boolean;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  user_type: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface Like {
  user_id: string;
  author_name: string;
  created_at: string;
}

export type PaymentType =
  | "Security Levy"
  | "Power/Electricity"
  | "Water Bill"
  | "Waste Management"
  | "Other";

export interface Payment {
  id: string;
  resident: string;
  unit: string;
  amount: string;
  type: PaymentType;
  transId: string;
  receiptUrl: string;
  date: string;
}

export type ReportType = "GENERAL" | "SECURITY" | "PAYMENT" | "SERVICES";
export type ReportCategory = "COMPLAINT" | "INFORMATION" | "EMERGENCY";
export type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED";

export interface EstateReport {
  id: string;
  estate_id: string;
  reporter_id: string;
  reporter_name?: string; // From the JOIN
  type: ReportType;
  category: ReportCategory;
  target_security_ids: string[];
  subject: string;
  description: string;
  status: ReportStatus;
  created_at: string;
}

export interface ResidentPayment {
  id: string;
  resident_id: string;
  amount: number;
  created_at: string;
  verified_at?: string;
  payment_date: string;
  category: string;
  notes?: string;
  resident_name: string;
  transaction_reference: string;
  receipt_url: string;
  status: "pending" | "verified" | "rejected";
  payment_type: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  guest_name: string;
  guest_email: string | null;
  guest_code: string; // The "GUEST-XXXX" code for the gate guard
  status: "registered" | "checked_in";
  checked_in_at: string | null;
  created_at: string;
}

export interface EstateEvent {
  id: string;
  estate_id: string;
  organizer_id: string | null;
  title: string;
  description: string | null;

  // Date and Time (Postgres formats)
  start_date: string; // ISO Date string (YYYY-MM-DD)
  end_date: string;
  start_time: string; // HH:mm:ss
  end_time: string;

  venue_detail: string | null;
  registered_number: number;
  expected_guests: number;
  banner_url: string | null;
  booked_dates: string[];

  // Financial & Security
  is_paid: boolean;
  ticket_price: string; // Decimal comes as string from Postgres
  subaccount_id: string | null;
  ref_code: string;
  is_approved: boolean;
  is_rejected: boolean;

  created_at: string;
}

export interface EstateLocation {
  id: number;
  estate_id: string;
  name: string;
  location_in_estate: string | null;
  permitted_days: number[];
  event_booked_on: Record<
    string,
    {
      event_banner_url: string;
      dates: string[];
    }
  >;
  capacity?: number;
  created_at: string;
}

/**
 * Data required to create a new event (Frontend Form State)
 */
export interface CreateEventRequest {
  title: string;
  banner_url: string;
  description?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  venue_detail?: string;
  expected_guests: number;
  registered_guests?: number;
  is_paid: boolean;
  ticket_price?: number;
  bank_code: string;
  bank_name?: string; // Temporary fields used for subaccount creation
  account_number?: string;
}

/**
 * Data required for a guest to RSVP
 */
export interface RSVPRequest {
  event_id: string;
  guest_name: string;
  guest_email: string;
}

export interface ApproveRequest {
  success: boolean;
  message: string;
  event: EstateEvent;
  updatedLocation: EstateLocation;
  error?: string;
}

/**
 * Response from the RSVP API
 */
export interface RSVPResponse {
  message: string;
  guest_code?: string; // Returned immediately if FREE
  paymentLink?: string; // Returned if PAID (Paystack checkout)
}

export interface notification {
  id: string;
  estate_id: number;
  user_id: number | null;
  recipient_role: "tenant" | "security" | "admin";
  title: string;
  message: string;
  type: "general" | "emergency" | "entry" | "invite" | "announcement";
  created_at: string;
  is_deleted: boolean;
}

export interface DashboardStats {
  security: {
    total: number;
    onDuty: number;
    complaints: number;
    pendingRequests: number;
  };
  community: {
    totalAlerts: number;
    unreadAlerts: number;
  };
  payments: {
    monthlyCount: number;
    pendingPayments: number;
    paymentReports: number;
  };
  events: {
    total: number;
    pending: number;
    upcoming: {
      title: string;
      date: string | null;
    };
  };
  residents: {
    totalRequests: number;
    total: number;
    complaints: number;
    pendingRequests: number;
  };
}

export interface notification {
  id: string;
  estate_id: number;
  user_id: number | null;
  recipient_role: "tenant" | "security" | "admin";
  title: string;
  message: string;
  type: "general" | "emergency" | "entry" | "invite" | "announcement";
  created_at: string;
  is_deleted: boolean;
}

export interface FetchNotificationsResponse {
  success: boolean;
  list: notification[];
  lastReadAt: string;
}

// 1. Blueprint for individual vendor objects within the JSONB array
export interface Vendor {
  name: string;
  phone: string;
  email: string;
}

// 2. Interface for the Estate Services Catalog row
export interface EstateService {
  id: string;
  estate_id: string;
  service_name: string;
  vendors: Vendor[]; // Strictly typed JSONB array mapping
  is_available: boolean;
  created_at: string;
}

// 3. Interface for Resident Work Order Bookings
export interface ServiceRequest {
  id: string;
  estate_id: string;
  service_id: string | null;
  service_name?: string;  // Left Joined from estate_services
  vendor_name?: string;   // Left Joined from estate_services
  resident_id: string;
  resident_name: string;
  resident_unit: string;  // e.g., "Block G, Unit 4"
  time_preferred: string; // e.g., "Morning (9AM - 12PM)"
  description: string;
  is_dispatched: boolean;
  is_completed: boolean;
  requested_at: string;
}