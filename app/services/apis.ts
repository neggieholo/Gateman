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

export const fetchReadableAddress = async (locationData: string) => {
  let lat: number | null = null;
  let lng: number | null = null;

  try {
    // 1. Check if the string actually looks like JSON
    if (locationData.trim().startsWith('{')) {
      const parsed = JSON.parse(locationData);
      lat = parsed.latitude;
      lng = parsed.longitude;
    } else {
      // 2. Otherwise, treat it as a "lat, lng" string
      const parts = locationData.split(",");
      if (parts.length >= 2) {
        lat = parseFloat(parts[0].trim());
        lng = parseFloat(parts[1].trim());
      }
    }

    // 3. If we couldn't find valid numbers, exit early
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      console.warn("Could not extract numbers from:", locationData);
      return locationData; 
    }

    // 4. Call your PHP service
    const url = `https://geo.employeetracker.app/reverse.php?lat=${lat}&lon=${lng}&format=json`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    return data.display_name || data.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error("❌ Error fetching address:", error);
    return locationData; // Return the raw coordinates if anything fails
  }
};

export const formatLastSeen = (timestamp: string | null) => {
    if (!timestamp) return "Never";
    
    const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return then.toLocaleDateString(); // Fallback for older dates
  };