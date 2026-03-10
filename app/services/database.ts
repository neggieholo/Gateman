
import { Tenant } from '../types';
import { JoinRequest } from '../types';


// const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const db = {
  // Authenticate user
  authenticate: async (email: string, password: string) => {
  const res = await fetch("/api/auth/login/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include" // send cookies for session
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Login failed");
  }
  
  const data = await res.json(); // <-- now logs the actual object
  return data;                   // returns { success: true, user }
 },
  // Register user
  register: async (
  name: string,
  email: string,
  password: string,
  city: string,
  town: string
) => {
  const body = { name, email, password, city, town };

  const res = await fetch('api/payment', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Admin registration failed");
  }

  const { paymentLink } = await res.json();

  // Redirect browser to Flutterwave checkout
  window.open(paymentLink, '_blank');
},


  registerTenant: async (
  name: string,
  email: string,
  password: string,
  unit: string,
) => {
  const body = { name, email, password, unit };

  const res = await fetch('/api/register/tenant', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include"
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Tenant registration failed");
  }

  return await res.json(); // { success: true, user }
},


  // Top-up wallet
  topUpWallet: async (userId: string, amount: number, type: "tenant" | "admin" = "tenant") => {
    const res = await fetch('/api/wallet/topup', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount, type }),
      credentials: "include"
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Top-up failed");
    }

    return await res.json(); // updated user
  },

  // Deduct wallet
  deductWallet: async (userId: string, amount: number, type: "tenant" | "admin" = "tenant") => {
    const res = await fetch('/api/wallet/deduct', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount, type }),
      credentials: "include"
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Deduction failed");
    }

    return await res.json(); // updated user
  },

   getAllTenants: async (): Promise<Tenant[]> => {
    const res = await fetch('/api/admin/tenants', {
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
    const res = await fetch('/api/admin/join-requests', {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Could not fetch join requests");
    }
    const data = await res.json();
    console.log("Request:", data)
    return data.joinRequests as JoinRequest[];
  },

  deleteTenant: async (id: string) => {
  const res = await fetch('/api/admin/tenant/${id}', {
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
    const res = await fetch('/api/admin/blocked-users', { 
      credentials: "include" 
    });
    if (!res.ok) throw new Error("Failed to fetch blocked users");
    const data = await res.json();
    return data.blockedUsers;
  },

handleUnblock: async (tempTenantId: string) => {
    const res = await fetch('/api/admin/join-request/unblock', {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tempTenantId })
    });
    if (!res.ok) throw new Error("Failed to unblock user");
    return await res.json();
  },
};

