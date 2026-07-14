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

const formatToLocalDateString = (dateInput: string) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput.split("T")[0];

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

      if (events) setAllEvents(events);
      if (locationsData) setLocations(locationsData);
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
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-300 p-1 min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs min-w-0">
        <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white shrink-0">
            <LayoutGrid size={20} />
          </div>
          <h2 className="text-lg font-montserrat font-black text-slate-800 uppercase tracking-tight truncate">
            Event Approvals
          </h2>
        </div>

        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/30 w-full md:w-auto shrink-0">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-[10px] font-montserrat font-bold tracking-wider uppercase transition-all ${
                statusFilter === s
                  ? "bg-white text-blue-600 shadow-3xs"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-w-0">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="w-full flex items-center justify-between p-4 bg-white border border-slate-200/60 rounded-2xl hover:border-blue-400/50 shadow-2xs hover:shadow-xs transition-all duration-200 group text-left min-w-0"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden ${
                    event.is_approved
                      ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                      : event.is_rejected
                        ? "bg-rose-50 border-rose-100 text-rose-600"
                        : "bg-amber-50 border-amber-100 text-amber-600"
                  }`}
                >
                  {event.banner_url ? (
                    <img
                      src={event.banner_url}
                      className="w-full h-full object-cover"
                      alt="flyer"
                    />
                  ) : (
                    <Calendar size={18} />
                  )}
                </div>

                <div className="flex justify-between items-center flex-1 min-w-0 pr-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-montserrat font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors truncate block w-full mb-0.5">
                      {event.title}
                    </h3>
                    <p className="text-[10px] font-oswald font-semibold text-slate-400 uppercase tracking-wide truncate block w-full">
                      REF: {event.ref_code}{" "}
                      <span className="text-slate-300 mx-1">•</span>{" "}
                      {event.expected_guests} Guests
                    </p>
                  </div>

                  <div className="text-right hidden sm:block shrink-0 pl-4">
                    <p className="text-[10px] font-oswald font-semibold text-slate-500 uppercase tracking-wide">
                      DATE: {formatToLocalDateString(event.start_date)}
                    </p>
                    <div className="flex items-center justify-end mt-1">
                      <span
                        className={`text-[9px] font-oswald font-bold uppercase px-1.5 py-0.5 rounded ${
                          event.is_approved
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                            : event.is_rejected
                              ? "bg-rose-50 text-rose-700 border border-rose-200/50"
                              : "bg-amber-50 text-amber-700 border border-amber-200/50"
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
              <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                <ChevronRight size={16} />
              </div>
            </button>
          ))
        ) : (
          <div className="p-8 bg-white rounded-2xl border-2 border-dashed border-slate-200/70 text-center">
            <p className="text-slate-400 text-xs font-medium">
              {loading ? "Loading..." : "No events"}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // --- SUB-COMPONENT: DETAIL VIEW ---
  const DetailView = ({ event }: { event: EstateEvent }) => {
    const isMultiDay =
      event.end_date &&
      formatToLocalDateString(event.end_date) !==
        formatToLocalDateString(event.start_date);

    const start = new Date(formatToLocalDateString(event.start_date));
    const end = new Date(formatToLocalDateString(event.end_date));

    const resolvedVenueName = useMemo(() => {
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

      const excluded: string[] = [];
      // const bookedSet = new Set(event.booked_dates.map((d) => d.split("T")[0]));
      const bookedSet = new Set(
        event.booked_dates.map((d) => formatToLocalDateString(d)),
      );

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const currentStr = d.toISOString().split("T")[0];
        if (!bookedSet.has(currentStr)) {
          excluded.push(currentStr);
        }
      }
      return excluded;
    }, [event.start_date, event.end_date, event.booked_dates]);

    return (
      <div className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6 shadow-2xs animate-in slide-in-from-right duration-300 flex flex-col h-full overflow-hidden min-w-0">
        <button
          onClick={() => setSelectedEvent(null)}
          className="w-fit flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors mb-6 font-montserrat font-bold text-xs uppercase tracking-wider shrink-0"
        >
          <ArrowLeft size={16} /> Back to Approvals
        </button>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 overflow-y-auto pr-1 pb-4 min-w-0 custom-scrollbar">
          {/* Left Block: Graphic Asset preview display frame */}
          <div className="w-full lg:w-5/12 shrink-0">
            <p className="text-slate-400 text-[10px] uppercase font-oswald font-bold tracking-wider mb-2">
              Event Flyer
            </p>
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-3xs max-w-md mx-auto lg:max-w-none">
              {event.banner_url ? (
                <img
                  src={event.banner_url}
                  className="w-full object-contain bg-slate-50 max-h-[45vh] lg:max-h-[55vh]"
                  alt="Event Banner Asset"
                />
              ) : (
                <div className="w-full h-56 bg-slate-100 flex items-center justify-center text-slate-400 font-oswald font-bold text-xs uppercase tracking-widest">
                  No layout graphic uploaded
                </div>
              )}
              {event.banner_url && (
                <a
                  href={event.banner_url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur hover:bg-white rounded-xl text-blue-600 shadow-sm border border-slate-100 transition-all"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Right Block: Telemetry register description attributes node */}
          <div className="flex-1 min-w-0 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-100 pb-4 min-w-0">
              <div className="min-w-0 flex-1">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-oswald font-bold uppercase tracking-wide border ${event.is_paid ? "bg-blue-50 text-blue-600 border-blue-200/50" : "bg-emerald-50 text-emerald-600 border-emerald-200/50"}`}
                >
                  {event.is_paid ? "Paid Event" : "Free Event"}
                </span>
                <h3 className="text-xl sm:text-2xl font-montserrat font-black text-slate-800 mt-2 leading-tight wrap-break-word">
                  {event.title}
                </h3>
              </div>

              {/* Status workflow mutation actions triggers combo stack */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                {(!event.is_approved || event.is_rejected) && (
                  <button
                    disabled={!!loadingAction}
                    onClick={() => handleUpdateStatus(event.id, "approve")}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-montserrat font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-40 shadow-3xs active:scale-98"
                  >
                    {loadingAction === "approving" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    <span>Approve</span>
                  </button>
                )}

                {(!event.is_rejected || event.is_approved) && (
                  <button
                    disabled={!!loadingAction}
                    onClick={() => handleUpdateStatus(event.id, "reject")}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100/60 rounded-xl font-montserrat font-bold text-xs uppercase tracking-wider hover:bg-rose-100 transition-all disabled:opacity-40 shadow-3xs active:scale-98"
                  >
                    {loadingAction === "rejecting" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <XCircle size={14} />
                    )}
                    <span>Reject</span>
                  </button>
                )}
              </div>
            </div>

            {(event.is_approved || event.is_rejected) && (
              <div
                className={`p-3 rounded-xl flex items-center gap-2.5 border text-xs font-semibold ${event.is_approved ? "bg-emerald-50/60 border-emerald-100 text-emerald-700" : "bg-rose-50/60 border-rose-100 text-rose-700"}`}
              >
                {event.is_approved ? (
                  <CheckCircle size={15} />
                ) : (
                  <AlertCircle size={15} />
                )}
                <p className="font-montserrat font-bold text-[10px] uppercase tracking-wider">
                  Current Status: {event.is_approved ? "Approved" : "Rejected"}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <DetailBox
                icon={<Calendar size={16} />}
                label="Date"
                value={
                  isMultiDay
                    ? `${formatToLocalDateString(event.start_date)} to ${formatToLocalDateString(event.end_date)}`
                    : formatToLocalDateString(event.start_date)
                }
              />
              <DetailBox
                icon={<Clock size={16} />}
                label="Time"
                value={`${event.start_time} - ${event.end_time}`}
              />
            </div>

            {excludedDatesList.length > 0 && (
              <div className="p-3 bg-rose-50/30 border border-rose-100/60 rounded-xl min-w-0">
                <span className="text-[10px] font-oswald font-bold text-rose-600 uppercase tracking-wider block mb-1.5">
                  Excluded Dates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {excludedDatesList.map((d) => (
                    <span
                      key={d}
                      className="text-xs font-oswald font-bold bg-white border border-rose-200/50 text-rose-600 px-2 py-0.5 rounded-md shadow-3xs"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <DetailBox
                icon={<MapPin size={16} />}
                label="Venue"
                value={resolvedVenueName}
              />
              <DetailBox
                icon={<Ticket size={16} />}
                label="Reference Code"
                value={event.ref_code}
                isOswaldValue
              />
              <DetailBox
                icon={<Users size={16} />}
                label="Expected Guest Threshold"
                value={event.expected_guests.toString()}
                isOswaldValue
              />
              <DetailBox
                icon={<LayoutGrid size={16} />}
                label="Ticket Price"
                value={event.is_paid ? `₦${event.ticket_price}` : "Free Pass"}
                isOswaldValue
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl min-w-0">
              <h4 className="text-slate-400 text-[10px] uppercase font-oswald font-bold tracking-wider mb-1.5">
                Event Description
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed font-medium font-sans whitespace-pre-line">
                {event.description ||
                  "No specific brief metadata statement declared by coordinator."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col overflow-hidden p-4 bg-slate-50/50 relative font-sans">
      {/* ABOVE SEARCH BAR TAB SELECTION PANEL */}
      {!selectedEvent && !isDetailedLocation && (
        <div className="flex justify-start mb-4 shrink-0 min-w-0">
          <div className="flex bg-slate-200/60 p-1 rounded-xl border border-slate-200/20 shadow-inner">
            <button
              onClick={() => {
                setActiveViewTab("events");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all ${
                activeViewTab === "events"
                  ? "bg-white shadow-3xs text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutGrid size={13} /> Events
            </button>
            <button
              onClick={() => {
                setActiveViewTab("locations");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all ${
                activeViewTab === "locations"
                  ? "bg-white shadow-3xs text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <MapPin size={13} /> Venues
            </button>
          </div>
        </div>
      )}

      {/* FILTER SEARCH METADATA BLOCK ARTIFACT */}
      {!selectedEvent && !isDetailedLocation && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 shrink-0 min-w-0">
          <div className="relative flex items-center flex-1 w-full min-w-0">
            <Search
              className="absolute left-3.5 text-slate-400 pointer-events-none"
              size={16}
            />
            <input
              type="text"
              placeholder={
                activeViewTab === "events"
                  ? "Search by event title parameters or reference tokens..."
                  : "Search by venue registration label or quadrant area..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500 outline-none transition-all shadow-3xs text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {activeViewTab === "events" && (
            <div className="relative flex items-center w-full sm:w-56 shrink-0 min-w-0">
              <Calendar
                className="absolute left-3.5 text-slate-400 pointer-events-none"
                size={16}
              />
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500 outline-none transition-all shadow-3xs uppercase font-sans text-slate-600"
              />
            </div>
          )}
        </div>
      )}

      {/* DYNAMIC REGISTRY BLOCK VIEWPORT HOIST SWITCHER */}
      <div className="flex-1 overflow-hidden min-w-0">
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
  isOswaldValue = false,
}: {
  icon: any;
  label: string;
  value: string;
  extraElement?: React.ReactNode;
  isOswaldValue?: boolean;
}) => (
  <div className="p-3 bg-white border border-slate-200/60 rounded-xl flex items-center gap-3 hover:border-blue-200/50 transition-colors min-w-0 shadow-3xs">
    <div className="p-2 bg-slate-50 rounded-lg text-blue-600 shrink-0">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-oswald font-bold text-slate-400 uppercase tracking-wide mb-0.5 truncate">
        {label}
      </p>
      <p
        className={`text-xs text-slate-800 truncate block w-full ${isOswaldValue ? "font-oswald tracking-wide font-semibold" : "font-semibold font-sans"}`}
      >
        {value}
      </p>
    </div>
    {extraElement && <div className="shrink-0">{extraElement}</div>}
  </div>
);
