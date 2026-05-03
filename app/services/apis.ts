/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AdminIdentityPayload,
  ApproveRequest,
  EstateDocsPayload,
  EstateEvent,
  Invitation,
  RSVPRequest,
  RSVPResponse,
  sessionResponse,
} from "./types";
import { parseISO, formatDistanceToNow } from "date-fns";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const checkSession = async (): Promise<sessionResponse> => {
  try {
    const response = await fetch("/api/session-check", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Session Check Error:", error);
    return { success: false, user: null };
  }
};

export const sendOtpApi = async (email: string) => {
  try {
    const res = await fetch("/api/auth/otp/send", {
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

export const sendPofileChangeOtpApi = async (target: string, type: string) => {
  try {
    const res = await fetch("/api/admin/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, type }),
    });
    return await res.json();
  } catch (err) {
    console.log("OTP error:", err);
    return { success: false, message: "Network error" };
  }
};

export const fetchGatePasses = async (): Promise<Invitation[]> => {
  try {
    const res = await fetch("/api/invitations", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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

export const logActivityApi = async (
  inviteId: string,
  action: "check_in" | "check_out",
): Promise<{ success: boolean; invitation?: Invitation; error?: string }> => {
  try {
    const res = await fetch(`/api/invitations/log-activity/${inviteId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
      credentials: "include",
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

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  role: string,
) => {
  try {
    const response = await fetch("/api/change-password", {
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
    if (locationData.trim().startsWith("{")) {
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

    return (
      data.display_name ||
      data.address ||
      `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    );
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

export const kycService = {
  saveEstateDocs: async (data: EstateDocsPayload) => {
    const body = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value) body.append(key, value);
    });

    const res = await fetch("/api/kyc/save-estate-docs", {
      method: "POST",
      body,
    });
    return await res.json();
  },

  saveAdminIdentity: async (data: AdminIdentityPayload) => {
    const body = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value) body.append(key, value);
    });

    const res = await fetch("/api/kyc/save-admin-identity", {
      method: "POST",
      body,
    });
    return await res.json();
  },

  finalizeKYC: async (data: { selfiePhotos: string[] }) => {
    const res = await fetch("/api/kyc/finalize-kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  },
};

export const communityApi = {
  getPosts: async (estateId: string) => {
    try {
      const response = await fetch(
        `/api/community/posts?estate_id=${estateId}`,
        { credentials: "include" },
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log("Posts data:", data);
      return data;
    } catch (error) {
      console.error("getPosts Error:", error);
      return []; // Return empty array so the app doesn't crash
    }
  },

  createPost: async (data: any) => {
    try {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Server Error");
      }

      return result;
    } catch (error) {
      throw error;
    }
  },

  deletePost: async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("deletePost Error:", error);
      throw error; // Throw so the UI can catch it and show an alert
    }
  },

  toggleLike: async (postId: string) => {
    try {
      const response = await fetch("/api/community/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
        credentials: "include",
      });
      return await response.json();
    } catch (error) {
      console.error("toggleLike Error:", error);
    }
  },

  getLikes: async (postId: string) => {
    try {
      const response = await fetch(`/api/community/likes/${postId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("getLikes Error:", error);
      return []; // Return empty array to keep UI stable
    }
  },

  addComment: async (data: any) => {
    try {
      const response = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      return await response.json();
    } catch (error) {
      console.error("addComment Error:", error);
    }
  },

  getComments: async (postId: string) => {
    try {
      const response = await fetch(`/api/community/comments/${postId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("getComments Error:", error);
      return []; // Return empty array to prevent .map() crashes in the modal
    }
  },

  deleteComment: async (commentId: string) => {
    try {
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete comment");
      }

      return await response.json();
    } catch (error) {
      console.error("deleteComment Error:", error);
      throw error;
    }
  },

  sendDirectNotification: async (payload: {
    title: string;
    message: string;
    targets: { residents: boolean; security: boolean };
    type: string;
  }) => {
    try {
      const response = await fetch("/api/community/send-direct-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Broadcast failed");
      return data;
    } catch (error) {
      throw error;
    }
  },
};

export const getRelativeTime = (timestamp: string) => {
  if (!timestamp) return "";
  try {
    const date = parseISO(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return timestamp; // Fallback to raw string if it fails
  }
};

export const getCloudinaryUrl = async (
  file: File, // Expecting the actual File object from <input type="file">
  selectionType: "image" | "audio" | "video" | "document",
) => {
  try {
    // 1. SIZE CHECK: 50MB Limit
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert("File too large. Max limit is 50MB.");
      return null;
    }

    const formData = new FormData();

    // 2. Resource Type Logic
    let cloudinaryType = "image";
    if (selectionType === "audio" || selectionType === "video") {
      cloudinaryType = "video"; // Cloudinary handles audio under the 'video' endpoint
    } else if (selectionType === "document") {
      cloudinaryType = "raw";
    }

    // Web-standard FormData append
    formData.append("file", file);
    formData.append("upload_preset", "gateman uploads");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/diubaoqcr/${cloudinaryType}/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await res.json();

    if (data.error) {
      console.error("Cloudinary Error:", data.error.message);
      alert(`Cloudinary Error: ${data.error.message}`);
      return null;
    }

    return data.secure_url;
  } catch (err) {
    console.error("Upload Logic Error:", err);
    return null;
  }
};

// Get all report for the estate (Admin only)
export const getEstateReports = async () => {
  try {
    const res = await fetch("/api/security/report", {
      method: "GET",
      credentials: "include",
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: "Failed to fetch reports" };
  }
};

export const updateReportStatus = async (
  id: string,
  status: "REVIEWED" | "RESOLVED",
  adminFeedback: string,
) => {
  const res = await fetch(`/api/security/report/status/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, admin_response: adminFeedback }),
  });
  return await res.json();
};

// export const deleteReport = async (id: string) => {
//   const res = await fetch(`/api/report/${id}`, {
//     method: "DELETE",
//   });
//   return await res.json();
// };

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw data.error || "Something went wrong";
  }
  return data;
};

export const getAllEvents = async (): Promise<EstateEvent[]> => {
  const response = await fetch("/api/event/all", { credentials: "include" });
  return await handleResponse(response);
};

export const getEventById = async (id: string): Promise<EstateEvent> => {
  const response = await fetch(`/api/event/public/${id}`, {
    credentials: "include",
  });
  return await handleResponse(response);
};

export const registerForEvent = async (
  rsvpData: RSVPRequest,
): Promise<RSVPResponse> => {
  const response = await fetch("/api/event/rsvp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rsvpData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Registration failed");
  }

  return await response.json();
};

export const approveEvent = async (
  eventId: string,
  verdict: string,
): Promise<ApproveRequest> => {
  const response = await fetch(`/api/event/approve/${eventId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ verdict }),
    credentials: "include",
  });

  const data = await response.json();
  if (!response.ok) throw data.error || "Approval failed";
  return data;
};
