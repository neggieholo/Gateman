/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AdminIdentityPayload,
  ApproveRequest,
  DashboardStats,
  EstateDocsPayload,
  EstateFacility,
  FetchAdminsResponse,
  FetchNotificationsResponse,
  Invitation,
  LocationBooking,
  SecurityDashboardStats,
  sessionResponse,
} from "./types";
import { parseISO, formatDistanceToNow } from "date-fns";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const checkSession = async (): Promise<sessionResponse> => {
  try {
    const response = await fetch(`${baseUrl}/api/session-check`, {
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
    const res = await fetch(`${baseUrl}/api/auth/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: "Network error" };
  }
};

export const sendRegOtpApi = async (email: string) => {
  try {
    const res = await fetch(`${baseUrl}/api/payment/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: "Network error" };
  }
};

export const sendPofileChangeOtpApi = async (target: string, type: string) => {
  try {
    const res = await fetch(`${baseUrl}/api/admin/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, type }),
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: "Network error" };
  }
};

export const fetchGatePasses = async (
  estate_id: string,
): Promise<Invitation[]> => {
  try {
    const res = await fetch(`${baseUrl}/api/invitations/${estate_id}`, {
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
  estate_id: string,
): Promise<{ success: boolean; invitation?: Invitation; error?: string }> => {
  try {
    const res = await fetch(
      `${baseUrl}/api/invitations/admin/log-activity/${inviteId}?estate_id=${estate_id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
        credentials: "include",
      },
    );

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
    const response = await fetch(`${baseUrl}/api/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, role }),
      credentials: "include",
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
    const url = `https://geocode.employeetracker.app/reverse.php?lat=${lat}&lon=${lng}&format=json`;
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

    const res = await fetch(`${baseUrl}/api/kyc/save-estate-docs`, {
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

    const res = await fetch(`${baseUrl}/api/kyc/save-admin-identity`, {
      method: "POST",
      body,
    });
    return await res.json();
  },

  finalizeKYC: async (data: { selfiePhotos: string[] }) => {
    const res = await fetch(`${baseUrl}/api/kyc/finalize-kyc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  },
};

export const communityApi = {
  getPosts: async (estateId: string) => {
    // console.log("Fetching post:", estateId)
    try {
      const response = await fetch(
        `${baseUrl}/api/community/admin-posts?estate_id=${estateId}`,
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
      const response = await fetch(`${baseUrl}/api/community/posts`, {
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

  archivePost: async (postId: string) => {
    try {
      const response = await fetch(
        `${baseUrl}/api/community/posts/${postId}/archive`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("archivePost Service Error:", error);
      throw error;
    }
  },

  deletePost: async (postId: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/community/posts/${postId}`, {
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
      const response = await fetch(`${baseUrl}/api/community/like`, {
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
      const response = await fetch(`${baseUrl}/api/community/likes/${postId}`, {
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
      const response = await fetch(`${baseUrl}/api/community/comments`, {
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
      const response = await fetch(
        `${baseUrl}/api/community/comments/${postId}`,
        {
          credentials: "include",
        },
      );

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
      const response = await fetch(
        `${baseUrl}/api/community/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

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
    estate_id: string;
  }) => {
    try {
      const response = await fetch(
        `${baseUrl}/api/community/send-direct-notification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        },
      );
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

// Get all report for the estate (Admin only)
export const getEstateReports = async (estate_id: string) => {
  try {
    const res = await fetch(`${baseUrl}/api/security/report/${estate_id}`, {
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
  estate_id: string,
  status: "REVIEWED" | "RESOLVED",
  adminFeedback: string,
) => {
  const res = await fetch(`${baseUrl}/api/security/report/status/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, admin_response: adminFeedback, estate_id }),
    credentials: "include",
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
    throw (
      data.error ||
      data?.message ||
      response.statusText ||
      "Something went wrong"
    );
  }
  return data;
};

export const getAllBookings = async (
  estate_id: string,
): Promise<LocationBooking[]> => {
  const response = await fetch(`${baseUrl}/api/event/all/${estate_id}`, {
    credentials: "include",
  });
  return await handleResponse(response);
};

export const getEventById = async (id: string): Promise<LocationBooking> => {
  const response = await fetch(`${baseUrl}/api/event/public/${id}`, {
    credentials: "include",
  });
  return await handleResponse(response);
};

// export const registerForEvent = async (
//   rsvpData: RSVPRequest,
// ): Promise<RSVPResponse> => {
//   const response = await fetch(`${baseUrl}/api/event/rsvp`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(rsvpData),
//   });

//   if (!response.ok) {
//     const errorData = await response.json();
//     throw new Error(errorData.error || "Registration failed");
//   }

//   return await response.json();
// };

export const approveBooking = async (
  booking_id: string,
  verdict: string,
  estate_id: string,
): Promise<ApproveRequest> => {
  const response = await fetch(`${baseUrl}/api/event/approve/${booking_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ verdict, estate_id }),
    credentials: "include",
  });

  const data = await response.json();
  if (!response.ok) throw data.error || "Approval failed";
  return data;
};

export const getAllLocations = async (
  estate_id: string,
): Promise<EstateFacility[]> => {
  const response = await fetch(
    `${baseUrl}/api/event/locations/all/${estate_id}`,
    {
      credentials: "include",
    },
  );
  return await handleResponse(response);
};

export const getLocationById = async (
  id: number,
  estate_id: string,
): Promise<EstateFacility> => {
  const response = await fetch(
    `${baseUrl}/api/event/locations/${id}?estate_id=${estate_id}`,
    {
      credentials: "include",
    },
  );
  return await handleResponse(response);
};

export const createLocation = async (
  locData: Partial<EstateFacility>,
): Promise<EstateFacility> => {
  const response = await fetch(`${baseUrl}/api/event/locations/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(locData),
    credentials: "include",
  });
  return await handleResponse(response);
};

export const editLocation = async (
  id: number,
  locData: Partial<EstateFacility>,
): Promise<{ message: string; location: EstateFacility }> => {
  const response = await fetch(`${baseUrl}/api/event/locations/edit/${id}}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(locData),
    credentials: "include",
  });
  return await handleResponse(response);
};

export const deleteLocation = async (
  id: number,
  estate_id: string,
): Promise<{ message: string }> => {
  const response = await fetch(
    `${baseUrl}/api/event/locations/delete/${id}?estate_id=${estate_id}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );
  return await handleResponse(response);
};

export const getEventAtLocationDate = async (
  locationId: number,
  dateStr: string,
  estate_id: string,
): Promise<{ booking: LocationBooking | null }> => {
  const response = await fetch(
    `${baseUrl}/api/event/locations/${locationId}/event-at-date?date=${dateStr}&estate_id=${estate_id}`,
    {
      credentials: "include",
    },
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || "Failed loading date slot content data.",
    );
  }
  return await response.json();
};

export const fetchDashboardStats = async (
  id: string,
): Promise<DashboardStats> => {
  try {
    const response = await fetch(`${baseUrl}/api/dashboard/admin-stats/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to fetch dashboard statistics",
      );
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "API returned an unsuccessful status");
    }
    // console.log("Dashboard stats:", result)

    return result.data;
  } catch (error) {
    console.error("fetchDashboardStats Error:", error);
    throw error;
  }
};

export const markAlertsAsRead = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${baseUrl}/api/admin/mark-alerts-read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("markAlertsAsRead Error:", error);
    return false;
  }
};

export const fetchNotifications =
  async (): Promise<FetchNotificationsResponse> => {
    try {
      const res = await fetch(`${baseUrl}/api/notifications`, {
        method: "GET",
        credentials: "include",
      });
      return await res.json();
    } catch (err) {
      return { success: false, list: [], lastReadAt: "1970-01-01" };
    }
  };

export const markAllAsReadApi = async () => {
  try {
    const res = await fetch(`${baseUrl}/api/notifications/read-all`, {
      method: "PUT",
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
};

export const deleteNotificationApi = async (id: string) => {
  try {
    const res = await fetch(`${baseUrl}/api/notifications/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error("Delete API Error:", err);
    return { success: false };
  }
};

export const deleteAllNotificationsApi = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/notifications/delete-all`, {
      method: "DELETE",
      // Fix: Ensure this is exactly the string "include"
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch error in deleteAllNotificationsApi:", error);
    throw error;
  }
};

export const postLogout = async () => {
  const res = await fetch(`${baseUrl}/api/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const data = await res.json();

  return data;
};

export const requestGuardLocation = async (guardId: string) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/security/request-guard-location`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ guard_id: guardId }),
        credentials: "include",
      },
    );

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Failed to request location");
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Helper to format 24h to AM/PM
export const formatTime = (timeStr: string) => {
  if (!timeStr) return "N/A";
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const formattedHours = h % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${day}-${month}-${year}`;
};

export const formatCheckInTime = (timeStrOrIso: string) => {
  if (!timeStrOrIso) return "N/A";

  // Handle full ISO/Postgres strings or plain time strings (18:06:59)
  const date =
    timeStrOrIso.includes("-") || timeStrOrIso.includes("T")
      ? new Date(timeStrOrIso)
      : new Date(`1970-01-01T${timeStrOrIso}`);

  if (isNaN(date.getTime())) return "N/A";

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${ampm}`;
};

export const fetchSystemPermissionsApi = async () => {
  console.log("Fetching system permissions matrix...");
  try {
    const res = await fetch(`${baseUrl}/api/estate-users/system-permissions`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const data = await res.json();
    console.log("Fetched system permissions matrix:", data);
    return data;
  } catch (err) {
    console.error("API Error fetching system permissions matrix:", err);
    return { success: false, permissions: [] };
  }
};

export const fetchCustomRolesApi = async (estate_id: string) => {
  try {
    const res = await fetch(
      `${baseUrl}/api/estate-users/custom-roles/${estate_id}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return await res.json();
  } catch (err) {
    console.error("API Error fetching custom roles lists:", err);
    return { success: false, roles: [] };
  }
};

export const createCustomRoleApi = async (
  roleName: string,
  description: string,
  permissionIds: string[],
  estate_id: string,
) => {
  try {
    const res = await fetch(`${baseUrl}/api/estate-users/custom-roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role_name: roleName,
        description,
        permission_ids: permissionIds,
        estate_id,
      }),
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error("API Error creating custom role:", err);
    return {
      success: false,
      message: "Network connection fault storing role template.",
    };
  }
};

export const createAdminUserWorkspaceApi = async (payload: {
  name: string;
  email: string;
  phone_number: string | null;
  require_password_change: boolean;
  permissions: string[];
}) => {
  try {
    const res = await fetch(`${baseUrl}/api/estate-users/admins/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error("API Error creating administrative account:", err);
    return {
      success: false,
      message: "Network connection fault creating user workspace profile.",
    };
  }
};

export const fetchUserLogsApi = async (estate_id: string, role: string) => {
  try {
    const url = `${baseUrl}/api/estate-users/user-logs`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, estate_id }),
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error("API Error fetching system activity audit table:", err);
    return { success: false, logs: [] };
  }
};

export const fetchAllAdminsApi = async (
  estate_id: string,
): Promise<FetchAdminsResponse> => {
  try {
    const response = await fetch(
      `${baseUrl}/api/estate-users/admins/${estate_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    const data = await response.json();
    console.log("Fetched Admins Data:", data);
    return data;
  } catch (error) {
    console.error("❌ Fetch All Admins Endpoint Exception:", error);
    return {
      success: false,
      message:
        "Network layer connection failure synchronizing admin registry data.",
    };
  }
};

export async function updateAdminMfaPolicyApi(
  userId: string,
  enforceMfa: boolean,
  estate_id: string,
) {
  try {
    const response = await fetch(
      `${baseUrl}/api/estate-users/${userId}/mfa-policy`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mfa_enabled: enforceMfa, estate_id }),
        credentials: "include",
      },
    );
    return await response.json();
  } catch (err) {
    return {
      success: false,
      message:
        "Network synchronization failure updating security MFA policy configuration.",
    };
  }
}

export async function toggleAdminStatusApi(
  userId: string,
  targetActiveState: boolean,
  estate_id: string,
) {
  try {
    const response = await fetch(
      `${baseUrl}/api/estate-users/${userId}/toggle-status`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: targetActiveState, estate_id }),
        credentials: "include",
      },
    );
    return await response.json();
  } catch (err) {
    return {
      success: false,
      message: "Network synchronization failure changing account status.",
    };
  }
}

export async function deleteAdminProfileApi(userId: string, estate_id: string) {
  try {
    const response = await fetch(
      `${baseUrl}/api/estate-users/${userId}?estate_id=${estate_id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return await response.json();
  } catch (err) {
    return {
      success: false,
      message: "Network failure executing hard deletion pipeline.",
    };
  }
}

export async function updateAdminPermissionsApi(
  userId: string,
  permissions: string[],
  estate_id: string,
) {
  try {
    const response = await fetch(
      `${baseUrl}/api/estate-users/${userId}/permissions`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permissions, estate_id }),
        credentials: "include",
      },
    );
    return await response.json();
  } catch (err) {
    return {
      success: false,
      message:
        "Network synchronization failure updating authorization layout map.",
    };
  }
}

export async function forceOverrideSubAccountPasswordApi(
  subAccountId: string,
  newPassword: string,
  estate_id: string,
) {
  try {
    const response = await fetch(
      `${baseUrl}/api/estate-users/${subAccountId}/override-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword, estate_id }),
        credentials: "include",
      },
    );
    return await response.json();
  } catch (err) {
    return {
      success: false,
      message:
        "Network exception attempting administrative override pipeline transmission.",
    };
  }
}

export const deleteStaleCloudinaryAsset = async (
  url: string,
): Promise<boolean> => {
  try {
    const response = await fetch(`${baseUrl}/api/admin/assets/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Failed executing storage bucket cleanup sequence:", error);
    return false;
  }
};

export type BookingStatus =
  | "PENDING_APPROVAL"
  | "PAYMENT_PENDING"
  | "PAYMENT_SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export const getBookingStatusBadge = (status: BookingStatus) => {
  switch (status) {
    case "APPROVED":
      return {
        label: "Approved",
        color: "text-emerald-500",
        bg: "bg-emerald-100 dark:bg-emerald-950/40",
        border: "border-emerald-200 dark:border-emerald-800/50",
      };
    case "PAYMENT_PENDING":
      return {
        label: "Payment Pending",
        color: "text-blue-500",
        bg: "bg-blue-100 dark:bg-blue-950/40",
        border: "border-blue-200 dark:border-blue-800/50",
      };
    case "PAYMENT_SUBMITTED":
      return {
        label: "Payment Under Review",
        color: "text-purple-500",
        bg: "bg-purple-100 dark:bg-purple-950/40",
        border: "border-purple-200 dark:border-purple-800/50",
      };
    case "REJECTED":
      return {
        label: "Rejected",
        color: "text-red-500",
        bg: "bg-red-100 dark:bg-red-950/40",
        border: "border-red-200 dark:border-red-800/50",
      };
    case "PENDING_APPROVAL":
    default:
      return {
        label: "Pending",
        color: "text-amber-500",
        bg: "bg-amber-100 dark:bg-amber-950/40",
        border: "border-amber-200 dark:border-amber-800/50",
      };
  }
};

export const fetchSecurityStats = async (
  id: string,
): Promise<SecurityDashboardStats> => {
  try {
    const res = await fetch(`${baseUrl}/api/dashboard/security-stats/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    const json = await res.json();
    return json.data;
  } catch (error: any) {
    console.error("Failed to fetch security stats:", error);
    throw new Error(
      error.message ||
        "An unexpected error occurred while fetching security stats.",
    );
  }
};

export const formatDisplayTime = (
  dateInput: string | Date | null | undefined,
) => {
  if (!dateInput) return "N/A";

  // Replace space with 'T' if coming as raw SQL string to force strict ISO 8601 parsing
  const isoString =
    typeof dateInput === "string" ? dateInput.replace(" ", "T") : dateInput;

  const date = new Date(isoString);

  if (isNaN(date.getTime())) return "Invalid Time";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export async function getS3UploadedUrl(
  file: File,
  folder: string = "uploads",
): Promise<string> {
  // 1. Extract file extension and MIME type directly from the browser File object
  const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
  const mimeType = file.type || getFallbackMimeType(fileExtension);
  const fileName = `upload_${Date.now()}.${fileExtension || "bin"}`;

  // 2. FETCH #1: Request presigned URL from backend
  const urlResponse = await fetch(`${baseUrl}/api/get-upload-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      fileType: mimeType,
      folder,
    }),
  });

  if (!urlResponse.ok) {
    throw new Error(
      `Failed to get presigned URL from backend: ${urlResponse.status}`,
    );
  }

  const { uploadUrl, fileUrl } = await urlResponse.json();

  // 3. FETCH #2: Upload binary directly to AWS S3 (file is already a Blob)
  const s3Response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
    },
    body: file,
  });

  if (!s3Response.ok) {
    throw new Error(
      `Direct S3 binary upload failed with status ${s3Response.status}`,
    );
  }

  // 4. Return public S3 URL for backend/database storage
  return fileUrl;
}

/**
 * Fallback MIME type mapper in case file.type is empty string
 */
function getFallbackMimeType(ext: string): string {
  const mimeMap: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    heic: "image/heic",

    // Videos
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    webm: "video/webm",

    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
  };

  return mimeMap[ext] || "application/octet-stream";
}

export const sendResidentNotification = async (
  estate_id: string,
  resident_id: string,
  title: string,
  message: string,
) => {
  try {
    const url = `${baseUrl}/api/admin/notify-resident`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estate_id, resident_id, title, message }),
      credentials: "include",
    });

    return await res.json();
  } catch (err) {
    console.error("API Error sending resident notification:", err);
    return { success: false, error: "Network error sending notification" };
  }
};

export const updatePaymentItems = async (
  estate_id: string,
  payment_items: string[],
) => {
  try {
    const url = `${baseUrl}/api/admin/update-payment-items`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estate_id, payment_items }),
      credentials: "include",
    });

    return await res.json();
  } catch (err) {
    console.error("API Error updating payment items:", err);
    return { success: false, error: "Network error updating payment items" };
  }
};
