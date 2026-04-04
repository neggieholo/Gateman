import { Invitation, sessionResponse } from "../types";


// const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;


export const checkSession = async (): Promise<sessionResponse> => {
  try {
    const response = await fetch('/api/session-check', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('❌ Session Check Error:', error);
    return { success: false};
  }
};

export const sendOtpApi = async (email: string) => {
  try {
    const res = await fetch('/api/auth/otp/send', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (err) {
    console.log("OTP error:", err);
    return { success: false, message: "Network error" };
  }
};

export const fetchGatePasses = async (): Promise<Invitation[]> => {
  try {
    const res = await fetch('/api/invitations', {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to fetch passes");
    }
    
    const data = await res.json();
    console.log("Fetched Invitations:", data);
    return data;
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
};

export const logActivityApi = async (inviteId: string, action: 'check_in' | 'check_out'): Promise<{ success: boolean; invitation?: Invitation; error?: string }> => {
  try {
    const res = await fetch(`/api/invitations/log-activity/${inviteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
      credentials: 'include',
    });

    const data = await res.json();
    
    if (!res.ok) {
      return { success: false, error: data.error || "Action failed" };
    }

    return { success: true, invitation: data.invitation };
  } catch (error) {
    console.error("❌ Log Activity Error:", error);
    return { success: false, error: "Network error" };
  }
};

export const changePassword = async (currentPassword: string, newPassword: string, role: string) => {
  try {
    const response = await fetch('/api/change-password', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, role }),
    });
    return await response.json();
  } catch (err) {
    return { success: false, message: "Network error" };
  }
};