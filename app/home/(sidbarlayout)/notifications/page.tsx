"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  BellRing,
  RefreshCw,
  Trash2,
  Inbox,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import NotificationCard from "@/app/HomeComponents/NotficationsCard";
import {
  deleteNotificationApi,
  markAllAsReadApi,
  deleteAllNotificationsApi,
} from "@/app/services/apis";
import { useUser } from "@/app/UserContext";
import { showAccessDeniedToast } from "@/app/HomeComponents/Users";

export default function NotificationsPage() {
  const router = useRouter();
  const {
    user,
    notifications,
    setNotifications,
    triggerRefresh,
    setBadgeCount,
    loadingNotifications,
  } = useUser();

  const [clearing, setClearing] = useState(false);
  const hasMarkedRead = useRef(false);

  // Helper permission checkers using safe optional chaining
  const canView =
    user?.permissions?.includes("notifications_management") ||
    user?.permissions?.includes("read_notifications") ||
    user?.permissions?.includes("all-access");

  const canDelete =
    user?.permissions?.includes("notifications_management") ||
    user?.permissions?.includes("delete_notifications") ||
    user?.permissions?.includes("all-access");

  useEffect(() => {
    if (!user) return;

    if (!canView) {
      showAccessDeniedToast();
      return;
    }

    const handleRead = async () => {
      if (notifications.length > 0) {
        await markAllAsReadApi();
        setBadgeCount(0);
      }
    };

    if (notifications.length > 0) {
      handleRead();
    }
  }, [user, notifications.length, canView]);

  const clearAll = async () => {
    if (!canDelete) {
      showAccessDeniedToast();
      return;
    }

    if (confirm("Delete all notifications?")) {
      setClearing(true);
      await deleteAllNotificationsApi();
      setNotifications([]);
      setClearing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      showAccessDeniedToast();
      return;
    }
    setNotifications(notifications.filter((n) => n.id !== id));
    await deleteNotificationApi(id);
  };

  // Render Access Denied state if missing read permissions
  if (user && !canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-slate-50/50">
        <div className="bg-white p-8 rounded-3xl border shadow-sm flex flex-col items-center max-w-md text-center">
          <ShieldAlert className="text-rose-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-slate-500 text-sm mt-2">
            You do not have permission to view or manage notifications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-[calc(100vh-64px)] overflow-hidden bg-slate-50/50">
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white rounded-2xl border hover:bg-slate-50 transition-colors"
            title="Go back"
          >
            <ArrowLeft size={20} className="text-slate-700" />
          </button>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <BellRing className="text-indigo-600" size={32} /> Notifications
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={triggerRefresh}
            className="p-3 bg-white rounded-2xl border"
          >
            <RefreshCw
              size={20}
              className={loadingNotifications ? "animate-spin" : ""}
            />
          </button>
          {notifications.length > 0 && canDelete && (
            <button
              onClick={clearAll}
              disabled={clearing}
              className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl text-rose-600 font-bold shadow-sm"
            >
              <Trash2 size={16} /> {clearing ? "Clearing..." : "Clear All"}
            </button>
          )}
        </div>
      </div>

      <div className="h-[calc(100vh-240px)] mx-auto overflow-y-auto pb-2">
        <div className="max-w-4xl mx-auto pb-2">
          {loadingNotifications ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-4xl" />
              ))}
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                onDelete={() => handleDelete(item.id)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center py-32 bg-white rounded-[40px] border-dashed border-2">
              <Inbox size={48} className="text-slate-200" />
              <h3 className="text-slate-900 font-bold text-2xl mt-4">
                {loadingNotifications ? "" : "All caught up!"}
              </h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
