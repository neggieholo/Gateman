import {
  SecurityJoinRequest,
  SecurityLog,
  SecurityUser,
  Tenant,
} from "./types";
import { JoinRequest } from "./types";

// const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const db = {
  authenticate: async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        return {
          success: false,
          error: err.error,
        };
      }

      const data = await res.json(); 
      return data;
    } catch {
      return {
        success: false,
        error: "Server error",
      };
    }
  },
  // Register user
  register: async (
    name: string,
    email: string,
    password: string,
    state: string,
    lga: string,
    newOtp: string,
    metadata: string,
  ) => {
    const body = { name, email, password, state, lga, otp: newOtp, metadata };

    const res = await fetch("api/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Admin registration failed");
    }

    const { paymentLink } = await res.json();

    // Redirect browser to Flutterwave checkout
    window.location.href = paymentLink;
  },

   topUpWallet: async (
    userId: string,
    amount: number,
    type: "tenant" | "admin" = "tenant",
  ) => {
    const res = await fetch("/api/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount, type }),
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Top-up failed");
    }

    return await res.json(); // updated user
  },

  // Deduct wallet
  deductWallet: async (
    userId: string,
    amount: number,
    type: "tenant" | "admin" = "tenant",
  ) => {
    const res = await fetch("/api/wallet/deduct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount, type }),
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Deduction failed");
    }

    return await res.json(); // updated user
  },

  getAllTenants: async (): Promise<Tenant[]> => {
    const res = await fetch("/api/admin/tenants", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Could not fetch tenants");
    }
    const data = await res.json();
    return data.tenants as Tenant[];
  },

  // Fetch all join requests (admin-only)
  getAllRequests: async (): Promise<JoinRequest[]> => {
    const res = await fetch("/api/admin/join-requests", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Could not fetch join requests");
    }
    const data = await res.json();
    console.log("Request:", data);
    return data.joinRequests as JoinRequest[];
  },

  deleteTenant: async (id: string) => {
    const res = await fetch("/api/admin/tenant/${id}", {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Delete failed");
    }
    return await res.json();
  },

  fetchBlocked: async () => {
    const res = await fetch("/api/admin/blocked-users", {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch blocked users");
    const data = await res.json();
    return data.blockedUsers;
  },

  handleUnblock: async (tempTenantId: string) => {
    const res = await fetch("/api/admin/join-request/unblock", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tempTenantId }),
    });
    if (!res.ok) throw new Error("Failed to unblock user");
    return await res.json();
  },

  forgotPassword: async (email: string, role: "admin" | "tenant") => {
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      return await response.json();
    } catch (error) {
      console.error("Forgot Password Service Error:", error);
      return { success: false, message: "Network error" };
    }
  },

  resetPassword: async (
    token: string,
    userId: string,
    role: string,
    password: string,
  ) => {
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userId, role, password }),
      });
      return await response.json();
    } catch (error) {
      console.error("Reset Password Service Error:", error);
      return {
        success: false,
        message: "Network error. Please check your connection.",
      };
    }
  },
};

export const securityDb = {
  // 1. Fetch all pending security join requests
  getSecurityRequests: async (): Promise<SecurityJoinRequest[]> => {
    const res = await fetch("/api/security/join-requests", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Could not fetch security requests");
    }
    const data = await res.json();
    return data.requests as SecurityJoinRequest[];
  },

  // 2. Approve a security guard (Promote from temp to official)
  approveSecurity: async (requestId: string) => {
    const res = await fetch(`/api/security/approve/${requestId}`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Promotion failed");
    }
    return await res.json();
  },

  // 3. Decline a security join request (Soft rejection)
  declineSecurity: async (id: string, message: string) => {
    const res = await fetch("/api/security/join-request/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, message }),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Decline failed");
    }
    return await res.json();
  },

  // 4. Block a security applicant permanently
  blockSecurity: async (id: string, message: string) => {
    const res = await fetch("/api/security/join-request/block", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, message }),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Block failed");
    }
    return await res.json();
  },

  // 5. Fetch all blocked security guards
  fetchBlockedGuards: async () => {
    const res = await fetch("/api/security/blocked-users", {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch blocked guards");
    const data = await res.json();
    return data.blockedUsers;
  },

  // 6. Unblock a security guard
  unblockSecurity: async (tempSecurityId: string) => {
    const res = await fetch("/api/security/join-request/unblock", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tempSecurityId }),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to unblock guard");
    return await res.json();
  },

  // 7. Fetch all official security guards in the estate
  getAllSecurity: async (): Promise<SecurityUser[]> => {
    const res = await fetch("/api/security/all", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Could not fetch security list");
    }
    const data = await res.json();
    return data.securityGuards as SecurityUser[];
  },

  // 8. Delete/Offboard an official security guard
  deleteSecurity: async (id: string) => {
    const res = await fetch(`/api/security/delete/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Delete failed");
    }
    return await res.json();
  },

  generateCheckinCode: async () => {
    const res = await fetch("/api/security/generate-checkin-code", {
      method: "PUT",
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to generate security code");
    }

    const data = await res.json();
    return data.code as string; // Returns the 10-digit string
  },

  getCheckinCode: async (): Promise<string> => {
    const res = await fetch("/api/security/get-checkin-code", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch security code");
    }

    const data = await res.json();
    return data.code; // Returns the 10-digit string
  },

  // 9. Fetch security duty logs (Check-in/Check-out history)
  getSecurityLogs: async (): Promise<SecurityLog[]> => {
    const res = await fetch("/api/security/logs", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Could not fetch duty logs");
    }
    const data = await res.json();
    return data.logs as SecurityLog[];
  },
};
