"use client";
import React, { useEffect, useState } from "react";
import { BellRing, RefreshCw, Trash2, Inbox } from "lucide-react";
import NotificationCard from "@/app/HomeComponents/NotficationsCard";
import {
  deleteNotificationApi,
  markAllAsReadApi,
  deleteAllNotificationsApi,
} from "@/app/services/apis";
import { useUser } from "@/app/UserContext";

export default function NotificationsPage() {
  const {
    notifications,
    setNotifications,
    triggerRefresh,
    setBadgeCount,
    loadingNotifications,
  } = useUser();
  const [clearing, setClearing] = useState(false);

  // Mark as read immediately on page open
  useEffect(() => {
    const handleRead = async () => {
      if (notifications.length > 0) {
        await markAllAsReadApi();
        setBadgeCount(0);
      }
    };
    handleRead();
  }, [notifications.length]);

  const clearAll = async () => {
    if (confirm("Delete all notifications?")) {
      setClearing(true);
      await deleteAllNotificationsApi();
      setNotifications([]);
      setClearing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    await deleteNotificationApi(id);
  };

  return (
    <div className="p-8 h-[calc(100vh-64px)] overflow-hidden bg-slate-50/50">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <BellRing className="text-indigo-600" size={32} /> Notifications
        </h1>
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
          {notifications.length > 0 && (
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
                onDelete={() => {
                  handleDelete(item.id);
                }}
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
