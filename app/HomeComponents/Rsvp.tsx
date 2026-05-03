/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { EstateEvent, RSVPRequest, RSVPResponse } from "../services/types";
import { getEventById, registerForEvent } from "../services/apis";

export default function EventDisplayClient({ eventRef }: { eventRef: string }) {
  // 1. Initialize form with the event ID from props
  const [event, setEvent] = useState<EstateEvent | null>(null);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState<RSVPRequest>({
    event_id: "",
    guest_name: "",
    guest_email: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setFetching(true);
        const data = await getEventById(eventRef);
        setEvent(data);

        // IMPORTANT: Update the form with the real DB ID once fetched
        setForm((prev) => ({ ...prev, event_id: data.id }));
      } catch (err) {
        console.error("Failed to load event:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchEventData();
  }, [eventRef]);

  const handleRegister = async () => {
    // Basic validation
    if (!form.guest_name || !form.guest_email) {
      alert("Please enter your name and email to register.");
      return;
    }

    setLoading(true);
    try {
      const res: RSVPResponse = await registerForEvent({
        event_id: form.event_id,
        guest_name: form.guest_name,
        guest_email: form.guest_email,
      });

      // Handle Paid Flow: Redirect to Paystack
      if (res.paymentLink) {
        window.location.href = res.paymentLink;
        return;
      }

      // Handle Free Flow: Show success
      if (res.guest_code) {
        const encodedEmail = encodeURIComponent(form.guest_email);
        // alert(`Registration Successful! Your Guest Code: ${res.guest_code}`);
        window.location.href = `/registration_success?code=${res.guest_code}&email=${encodedEmail}`;
      }
    } catch (error: any) {
      console.error("RSVP Error:", error.message);
      alert(error.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return <div className="p-10 text-center font-black">LOADING EVENT...</div>;
  if (!event)
    return (
      <div className="p-10 text-center font-black text-rose-500">
        EVENT NOT FOUND
      </div>
    );

  return (
    <div className="min-h-screen bg-white relative">
      <div className="fixed inset-0 w-full h-screen z-0">
        <img
          src={
            event.banner_url ||
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop"
          }
          className="w-full h-full object-cover"
          alt={event.title}
        />
        {/* Dark overlay to ensure the card stands out */}
        <div className="absolute inset-0 " />
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="relative z-10 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/30 backdrop-blur-md rounded-[3rem] shadow-2xl p-8 md:p-12 border border-white/20">
            {/* Header Section */}
            <div className="flex flex-col mb-8">
              <span className="w-fit px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                {event.is_paid ? "Paid Entry" : "Free Event"}
              </span>
              <h1 className="text-4xl font-black text-slate-900 leading-tight">
                {event.title}
              </h1>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <InfoTile
                icon={<Calendar size={20} />}
                label="Date"
                value={new Date(event.start_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
              <InfoTile
                icon={<Clock size={20} />}
                label="Time"
                value={event.start_time}
              />
              {event.venue_detail && (
                <InfoTile
                  icon={<MapPin size={20} />}
                  label="Venue"
                  value={event.venue_detail}
                />
              )}
              <InfoTile
                icon={<Users size={20} />}
                label="Capacity"
                value={`${event.expected_guests} Guests Max`}
              />
            </div>

            {/* Description */}
            <div className="mb-12">
              <h4 className="text-slate-400 text-[11px] uppercase font-black tracking-widest mb-4">
                About the Event
              </h4>
              <p className="text-slate-600 font-medium leading-relaxed text-lg">
                {event.description || "No description provided for this event."}
              </p>
            </div>

            {/* Registration Form */}
            <div className="bg-slate-50/80 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 mb-10 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={18} className="text-indigo-600" />
                <h4 className="text-slate-900 text-xs uppercase font-black tracking-widest">
                  Secure RSVP
                </h4>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Your Full Name"
                  value={form.guest_name}
                  onChange={(e) =>
                    setForm({ ...form, guest_name: e.target.value })
                  }
                  className="w-full px-6 py-5 bg-white border-2 border-transparent focus:border-indigo-600 rounded-2xl text-base font-bold outline-none transition-all shadow-sm placeholder:text-slate-300"
                />
                <input
                  type="email"
                  placeholder="Your Email Address"
                  value={form.guest_email}
                  onChange={(e) =>
                    setForm({ ...form, guest_email: e.target.value })
                  }
                  className="w-full px-6 py-5 bg-white border-2 border-transparent focus:border-indigo-600 rounded-2xl text-base font-bold outline-none transition-all shadow-sm placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-2 bg-indigo-600 text-white rounded-4xl font-black text-base uppercase tracking-[0.25em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <CheckCircle size={24} />
              )}
              {loading
                ? "Securing Spot..."
                : event.is_paid
                  ? `Pay & Register • ₦${Number(event.ticket_price).toLocaleString()}`
                  : "Get Free Access"}
            </button>

            <div className="mt-8 flex flex-col items-center gap-2 opacity-40">
              <p className="text-[14px] bg-white p-2 font-black uppercase tracking-widest text-black">
                GateMan Secure Verification
              </p>
              <div className="px-3 py-1 border bg-white border-slate-300 rounded text-[12px] font-mono font-bold">
                REF: {event.ref_code}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoTile = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
    <div className="text-indigo-600">{icon}</div>
    <div className="overflow-hidden">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </p>
      <p className="text-xs font-bold text-slate-800 truncate">{value}</p>
    </div>
  </div>
);
