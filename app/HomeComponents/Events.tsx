/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  ExternalLink,
  Loader2,
  Ticket,
  MapPin,
  Clock,
  LayoutGrid,
  AlertCircle,
  Search,
} from "lucide-react";
import { EstateEvent, EstateLocation } from "../services/types";
import { useSearchParams } from "next/navigation";
import { approveEvent, getAllEvents, getAllLocations } from "../services/apis";
import LocationsView from "./LocationsView";
// Import your freshly decoupled external view here:

const formatToLocalDateString = (dateInput: string) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput.split("T")[0];

  // Shift out the UTC offset so extraction reflects local calendar metrics
  const offset = d.getTimezoneOffset();
  const adjusted = new Date(d.getTime() - offset * 60 * 1000);
  return adjusted.toISOString().split("T")[0];
};

export default function EventReviewPage() {
  const [allEvents, setAllEvents] = useState<EstateEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EstateEvent | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("PENDING");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [locations, setLocations] = useState<EstateLocation[]>([]);
  const [activeViewTab, setActiveViewTab] = useState<"events" | "locations">(
    "events",
  );
  const [isDetailedLocation, setIsDetailedLocation] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const targetIdParam = searchParams.get("id");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [events, locationsData] = await Promise.all([
        getAllEvents(),
        getAllLocations(),
      ]);

      if (events) {
        setAllEvents(events);
      }

      if (locationsData) {
        setLocations(locationsData);
      }
    } catch (error) {
      console.error("Error Fetching Data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!targetIdParam || allEvents.length === 0) return;

    const matchedEvent = allEvents.find(
      (e) => e.id.toString() === targetIdParam,
    );
    if (matchedEvent) {
      setActiveViewTab("events");
      setSelectedEvent(matchedEvent);
      const newUrl = window.location.pathname;
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
  }, [targetIdParam, allEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "APPROVED" && e.is_approved) ||
        (statusFilter === "REJECTED" && e.is_rejected) ||
        (statusFilter === "PENDING" && !e.is_approved && !e.is_rejected);

      const matchesSearch =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.ref_code.toLowerCase().includes(searchQuery.toLowerCase());

      const eventDate = formatToLocalDateString(e.start_date);
      const matchesDate = !startDateFilter || eventDate === startDateFilter;

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [allEvents, statusFilter, searchQuery, startDateFilter]);

  const handleUpdateStatus = async (
    id: string,
    verdict: "approve" | "reject",
  ) => {
    setLoadingAction(verdict === "approve" ? "approving" : "rejecting");
    try {
      const data = await approveEvent(id, verdict);

      if (data.success) {
        setAllEvents((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  is_approved: verdict === "approve",
                  is_rejected: verdict === "reject",
                }
              : e,
          ),
        );

        if (data.updatedLocation) {
          setLocations((prevLocs) =>
            prevLocs.map((loc) =>
              loc.id === data.updatedLocation.id ? data.updatedLocation : loc,
            ),
          );
        }
        setSelectedEvent(null);
      } else {
        alert(data.error || "Update failed");
      }
    } catch (error) {
      alert("Connection error.");
    } finally {
      setLoadingAction(null);
    }
  };

  // --- SUB-COMPONENT: EVENT LIST ---
  const EventList = () => (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500 p-2">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-3 rounded-[2.5rem] border border-slate-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white">
            <LayoutGrid size={24} />
          </div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            Event Approvals
          </h1>
        </div>

        <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                statusFilter === s
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="w-full flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[2.5rem] hover:border-indigo-200 hover:shadow-xl transition-all group"
            >
              <div className="flex items-center gap-6 flex-1">
                <div
                  className={`p-4 rounded-2xl ${
                    event.is_approved
                      ? "bg-emerald-50 text-emerald-600"
                      : event.is_rejected
                        ? "bg-rose-50 text-rose-600"
                        : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {event.banner_url ? (
                    <img
                      src={event.banner_url}
                      className="w-12 h-12 rounded-xl object-cover"
                      alt="flyer"
                    />
                  ) : (
                    <Calendar size={24} />
                  )}
                </div>
                <div className="flex justify-between flex-1 mr-6">
                  <div className="flex flex-col items-start">
                    <h3 className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                      REF: {event.ref_code} • {event.expected_guests} Guests
                    </p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-tighter">
                      Starts : {formatToLocalDateString(event.start_date)}
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          event.is_approved
                            ? "bg-emerald-100 text-emerald-700"
                            : event.is_rejected
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {event.is_approved
                          ? "Approved"
                          : event.is_rejected
                            ? "Rejected"
                            : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                <ChevronRight size={20} />
              </div>
            </button>
          ))
        ) : (
          <p className="text-gray-500 p-5 bg-white rounded-lg border border-dashed text-center">
            {loading ? "Loading..." : "No events"}
          </p>
        )}
      </div>
    </div>
  );

  // --- SUB-COMPONENT: DETAIL VIEW ---
  const DetailView = ({ event }: { event: EstateEvent }) => {
    // Line ~230 (Multi-day flag check)
    const isMultiDay =
      event.end_date &&
      formatToLocalDateString(event.end_date) !==
        formatToLocalDateString(event.start_date);

    // Line ~245 & ~246 (Excluded range setup metrics)
    const start = new Date(formatToLocalDateString(event.start_date));
    const end = new Date(formatToLocalDateString(event.end_date));

    // Line ~248 (Booked dates item mapper loop)
    const bookedSet = new Set(
      event.booked_dates.map((d) => formatToLocalDateString(d)),
    );
    const resolvedVenueName = useMemo(() => {
      // Cast location_id safely depending on whether your schema handles it as a string or number
      const match = locations.find(
        (loc) => loc.id.toString() === (event as any).venue_detail?.toString(),
      );
      return match ? match.name : event.venue_detail || "Not Specified";
    }, [event]);
    const excludedDatesList = useMemo(() => {
      if (
        !event.booked_dates ||
        !Array.isArray(event.booked_dates) ||
        event.booked_dates.length === 0
      ) {
        return [];
      }

      // const start = new Date(event.start_date.split("T")[0]);
      // const end = new Date(event.end_date.split("T")[0]);
      const excluded: string[] = [];
      const bookedSet = new Set(event.booked_dates.map((d) => d.split("T")[0]));

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const currentStr = d.toISOString().split("T")[0];
        if (!bookedSet.has(currentStr)) {
          excluded.push(currentStr);
        }
      }
      return excluded;
    }, [event.start_date, event.end_date, event.booked_dates]);

    return (
      <div className="bg-white rounded-[3rem] border border-slate-100 p-8 animate-in slide-in-from-right duration-300 flex flex-col h-full overflow-hidden">
        <button
          onClick={() => setSelectedEvent(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-8 font-black text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={18} /> Back to Approvals
        </button>

        <div className="flex flex-col lg:flex-row gap-12 flex-1 overflow-y-auto pr-2 pb-10">
          <div className="w-full lg:w-1/2">
            <h4 className="text-slate-400 text-[12px] uppercase tracking-[0.2em] font-black mb-4">
              Event Flyer
            </h4>
            <div className="relative group rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-2xl">
              {event.banner_url ? (
                <img
                  src={event.banner_url}
                  className="w-full object-contain bg-slate-100 max-h-[60vh]"
                  alt="Event"
                />
              ) : (
                <div className="w-full h-80 bg-slate-100 flex items-center justify-center text-slate-300 font-bold uppercase">
                  No Flyer Uploaded
                </div>
              )}
              {event.banner_url && (
                <a
                  href={event.banner_url}
                  target="_blank"
                  className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-2xl text-indigo-600 shadow-sm"
                >
                  <ExternalLink size={20} />
                </a>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${event.is_paid ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}
                >
                  {event.is_paid ? "Paid Event" : "Free Event"}
                </span>
                <h2 className="text-4xl font-black text-slate-900 mt-4 leading-tight">
                  {event.title}
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {event.is_rejected && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 animate-pulse">
                      Rejected
                    </span>
                  )}
                  {(!event.is_approved || event.is_rejected) && (
                    <button
                      disabled={!!loadingAction}
                      onClick={() => handleUpdateStatus(event.id, "approve")}
                      className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:shadow-indigo-200 transition-all disabled:opacity-50"
                    >
                      {loadingAction === "approving" ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <CheckCircle size={20} />
                      )}
                      Approve
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {(!event.is_rejected || event.is_approved) && (
                    <button
                      disabled={!!loadingAction}
                      onClick={() => handleUpdateStatus(event.id, "reject")}
                      className="flex items-center gap-3 px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:shadow-rose-100 transition-all disabled:opacity-50"
                    >
                      {loadingAction === "rejecting" ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <XCircle size={20} />
                      )}
                      Reject
                    </button>
                  )}
                  {event.is_approved && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 animate-pulse">
                      Approved
                    </span>
                  )}
                </div>
              </div>
            </div>

            {(event.is_approved || event.is_rejected) && (
              <div
                className={`p-4 rounded-2xl flex items-center gap-3 border ${event.is_approved ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"}`}
              >
                {event.is_approved ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <p className="font-black text-xs uppercase tracking-widest">
                  Current Status: {event.is_approved ? "Approved" : "Rejected"}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <DetailBox
                icon={<Calendar size={18} />}
                label="Date"
                value={
                  isMultiDay
                    ? `${formatToLocalDateString(event.start_date)} - ${formatToLocalDateString(event.end_date)}`
                    : formatToLocalDateString(event.start_date)
                }
              />
              <DetailBox
                icon={<Clock size={18} />}
                label="Time"
                value={`${event.start_time} - ${event.end_time}`}
              />
            </div>
            {excludedDatesList.length > 0 && (
              <div className="pt-2 border-t border-dashed border-rose-100 ml-2">
                <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider block mb-0.5">
                  Excluded Dates:
                </span>
                <div className="flex flex-wrap gap-1">
                  {excludedDatesList.map((d) => (
                    <span
                      key={d}
                      className="text-[12px] font-bold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <DetailBox
                icon={<MapPin size={18} />}
                label="Venue"
                value={resolvedVenueName}
              />
              <DetailBox
                icon={<Ticket size={18} />}
                label="Ref Code"
                value={event.ref_code}
              />
              <DetailBox
                icon={<Users size={18} />}
                label="Expected Guests"
                value={event.expected_guests.toString()}
              />
              <DetailBox
                icon={<LayoutGrid size={18} />}
                label="Ticket Price"
                value={event.is_paid ? `₦${event.ticket_price}` : "Free"}
              />
            </div>

            <div className="p-8 bg-slate-50 rounded-4xl border border-slate-100">
              <h4 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black mb-3">
                Event Description
              </h4>
              <p className="text-slate-700 font-bold leading-relaxed">
                {event.description || "No description provided."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col overflow-hidden p-4 bg-slate-50/50 relative">
      {/* ABOVE SEARCH BAR TAB SELECTION PANEL */}
      {!selectedEvent && !isDetailedLocation && (
        <div className="flex justify-start mb-4 px-2">
          <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner">
            <button
              onClick={() => {
                setActiveViewTab("events");
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                activeViewTab === "events"
                  ? "bg-white shadow text-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid size={14} /> Events
            </button>
            <button
              onClick={() => {
                setActiveViewTab("locations");
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                activeViewTab === "locations"
                  ? "bg-white shadow text-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <MapPin size={14} /> Venues
            </button>
          </div>
        </div>
      )}

      {/* FILTER SEARCH AREA */}
      <div className="flex items-center justify-between mb-8 px-2 gap-4">
        {!selectedEvent && !isDetailedLocation && (
          <>
            <div className="relative group flex-1 w-full">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder={
                  activeViewTab === "events"
                    ? "Search by event title or ref..."
                    : "Search by venue name or area..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm"
              />
            </div>

            {activeViewTab === "events" && (
              <div className="relative group w-full md:w-64">
                <Calendar
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={18}
                />
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm uppercase"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* RENDER BODY SWITCHER */}
      <div className="flex-1 overflow-hidden">
        {activeViewTab === "events" ? (
          selectedEvent ? (
            <DetailView event={selectedEvent} />
          ) : (
            <EventList />
          )
        ) : (
          <LocationsView
            locations={locations}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setIsDetailedLocation={setIsDetailedLocation}
            refreshData={fetchData}
          />
        )}
      </div>
    </div>
  );
}

const DetailBox = ({
  icon,
  label,
  value,
  extraElement,
}: {
  icon: any;
  label: string;
  value: string;
  extraElement?: React.ReactNode;
}) => (
  <div className="p-5 bg-white border border-slate-100 rounded-3xl flex items-center gap-4 hover:border-indigo-100 transition-colors">
    <div className="p-3 bg-slate-50 rounded-xl text-indigo-600">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-800 line-clamp-1">{value}</p>
    </div>
    {extraElement && extraElement}
  </div>
);
