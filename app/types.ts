/* eslint-disable @typescript-eslint/no-explicit-any */

export type Role = 'resident' | 'admin' | 'superadmin';

export interface User {
  id: string;
  estate_id: string;
  name: string;
  email: string;        
  city?: string | null;
  town?: string | null;
  role: 'admin';
  wallet_balance: string;       // keep as string to match DB numeric -> '0.00'
  avatar?: string |Blob;
  subscription_expiry?: string; // or Date if you convert it on fetch
  created_at?: string; // optional role field
}


export interface Bill {
  id: string;
  type: 'Electricity' | 'Gas' | 'Estate Dues';
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  usage?: string; // e.g., "340 kWh"
  residentName?: string; // For admin view
  unit?: string; // For admin view
}

export interface Visitor {
  id: string;
  name: string;
  type: 'Guest' | 'Delivery' | 'Service';
  accessCode: string;
  date: string;
  status: 'Active' | 'Expired' | 'Used';
  unit?: string; // For admin view
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  authorRole?: Role;
}

export interface Post {
  id: string;
  author: string;
  title: string;
  content: string;
  category: 'General' | 'Complaints' | 'Marketplace' | 'Alerts';
  likes: number;
  comments: Comment[];
  timestamp: string;
  authorRole?: Role;
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
  DASHBOARD = 'dashboard',
  UTILITIES = 'utilities',
  INVOICES = 'invoices',
  ACCESS = 'access',
  FORUM = 'forum',
  EVENTS = 'events',
  USERS = 'users',
  REQUESTS = 'requests'
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
  estate_id: string;
  name: string;
  email: string;
  unit: string;
  block?: string | null;
  wallet_balance: string;   // from DB as string, you can parseFloat if needed
  avatar?: string | null;
  created_at: string;       // timestamp string
}

export interface JoinRequest {
  id: string;
  temp_tenant_id: string;
  estate_id: string;
  block?: string;
  unit?: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "BLOCKED"; // Added BLOCKED for the new action
  requested_at: string;
  
  // Fields added via SQL JOIN
  temp_tenant_name: string;
  temp_tenant_email: string;

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
  bill_id: string | null;  // special invoices may not reference a bill
  invoice_month: string;   // ISO date string (e.g. "2025-12-01")
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
  bill_id: string | null;               // Can be null for one-off invoices
  bill_name: string | null;             // From billable_items.name
  total_amount: number;                  // From billable_items.amount
  supplier_name: string;                 // From estate_invoices
  calculation_method: 'EQUAL' | 'BY_UNIT_TYPE' | 'BY_CONSUMPTION' | 'BY_SQUARE_METER' | 'CUSTOM_FORMULA';
  period_start: string | null;          // YYYY-MM-DD
  period_end: string | null;            // YYYY-MM-DD
  attachment_image_path?: string | null;
  attachment_pdf_path?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;            // estate_admin_users.id
  created_by_name?: string | null;      // estate_admin_users.name
}

export interface sessionResponse {
  success: boolean;
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
  guest_image_url: string | null;
  access_code: string;
  invite_type: 'one_time' | 'multi_entry';
  start_date: any;
  end_date: any;
  start_time: any;
  end_time: any;
  excluded_dates: string[]; 
  status: string;
  actual_checkin: any;
  actual_checkout: any;
  actual_checkin_date: any;
  actual_checkout_date: any;
  created_at: string;
  is_cancelled: boolean;
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
  role: 'SECURITY';
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