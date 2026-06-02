import React from "react";
import {
  Bell,
  Info,
  ShieldAlert,
  CheckCircle,
  Megaphone,
  Clock,
  Trash2,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
}

interface Props {
  item: NotificationItem;
  onDelete: (id: string) => void;
}

export default function NotificationCard({ item, onDelete }: Props) {
  const getTheme = () => {
    const type = item.type?.toLowerCase();
    switch (type) {
      case "emergency":
        return {
          color: "text-rose-600",
          bg: "bg-rose-50",
          border: "border-rose-500",
          icon: ShieldAlert,
          label: "Emergency",
        };
      case "invite":
        return {
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-500",
          icon: Bell,
          label: "Guest Invite",
        };
      case "announcement":
        return {
          color: "text-indigo-600",
          bg: "bg-indigo-50",
          border: "border-indigo-500",
          icon: Megaphone,
          label: "Announcement",
        };
      default:
        return {
          color: "text-slate-600",
          bg: "bg-slate-50",
          border: "border-slate-400",
          icon: Bell,
          label: "Update",
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={`group relative bg-white p-4 sm:p-5 rounded-[2rem] sm:rounded-3xl border border-slate-100 border-l-4 ${theme.border} shadow-sm hover:shadow-md transition-all duration-200 mb-4 font-sans`}
    >
      <div className="flex justify-between items-start">
        {/* Switched to flex-col on mobile viewports to prevent component layout crunching */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
          <div
            className={`p-3 rounded-2xl ${theme.bg} ${theme.color} h-fit w-fit`}
          >
            <Icon size={20} />
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
              <span
                className={`text-[10px] font-oswald font-bold uppercase tracking-widest ${theme.color}`}
              >
                {theme.label}
              </span>
              <span className="flex items-center text-slate-400 text-[10px] font-sans font-medium">
                <Clock size={10} className="mr-1" />
                {formatDate(item.created_at)}
              </span>
            </div>

            <h4 className="text-slate-900 font-montserrat font-black text-base sm:text-lg mb-1 leading-snug">
              {item.title}
            </h4>

            <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 mt-2 sm:mt-1">
              <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <p className="text-slate-600 font-sans text-sm leading-relaxed break-words w-full">
                {item.message}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex justify-end text-red-500 mt-2 sm:mt-0">
        <button
          className="p-1 hover:bg-red-50 rounded-lg transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
