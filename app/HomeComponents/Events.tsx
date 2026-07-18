/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

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
  Plus,
} from "lucide-react";
import { EstateFacility, LocationBooking, Tenant } from "../services/types";
import { useSearchParams } from "next/navigation";
import {
  approveEvent,
  getAllBookings,
  getAllLocations,
} from "../services/apis";
import LocationsView from "./LocationsView";
import toast from "react-hot-toast";
import AddBookingFormModal from "./AddBookingForm";
import { useUser } from "../UserContext";
import { db } from "../services/database";

const formatToLocalDateString = (dateInput: string) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput.split("T")[0];

  const offset = d.getTimezoneOffset();
  const adjusted = new Date(d.getTime() - offset * 60 * 1000);
  return adjusted.toISOString().split("T")[0];
};

export default function BookingsReviewPage() {
  const [allbookings, setAllbookings] = useState<LocationBooking[]>([]);
  const [selectedBooking, setSelectedBooking] =
    useState<LocationBooking | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("PENDING");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [facilities, setfacilities] = useState<EstateFacility[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeViewTab, setActiveViewTab] = useState<"bookings" | "facility">(
    "bookings",
  );
  const [isDetailedLocation, setIsDetailedLocation] = useState<boolean>(false);
  const [openAddForm, setOpenAddForm] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const targetIdParam = searchParams.get("id");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookings, facilityData, tenants] = await Promise.all([
        getAllBookings(),
        getAllLocations(),
        db.getAllTenants(),
      ]);

      if (bookings) setAllbookings(bookings);
      if (facilityData) setfacilities(facilityData);
      if (tenants) setTenants(tenants);
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
    if (!targetIdParam || allbookings.length === 0) return;

    const matchedBooking = allbookings.find(
      (e) => e.id.toString() === targetIdParam,
    );
    if (matchedBooking) {
      setActiveViewTab("bookings");
      setSelectedBooking(matchedBooking);
      const newUrl = window.location.pathname;
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
  }, [targetIdParam, allbookings]);

  const filteredbookings = useMemo(() => {
    return allbookings.filter((e) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "APPROVED" && e.is_approved) ||
        (statusFilter === "REJECTED" && e.is_rejected) ||
        (statusFilter === "PENDING" && !e.is_approved && !e.is_rejected);

      const matchesSearch =
        e.resident_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venue_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const eventDate = formatToLocalDateString(e.start_date);
      const matchesDate = !startDateFilter || eventDate === startDateFilter;

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [allbookings, statusFilter, searchQuery, startDateFilter]);

  const handleUpdateStatus = async (
    id: string,
    verdict: "approve" | "reject",
  ) => {
    setLoadingAction(verdict === "approve" ? "approving" : "rejecting");
    try {
      const data = await approveEvent(id, verdict);

      if (data.success) {
        setAllbookings((prev) =>
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
          setfacilities((prevLocs) =>
            prevLocs.map((loc) =>
              loc.id === data.updatedLocation.id ? data.updatedLocation : loc,
            ),
          );
        }
        setSelectedBooking(null);
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch (error) {
      toast.error("Connection error.");
    } finally {
      setLoadingAction(null);
    }
  };

  // --- SUB-COMPONENT: EVENT LIST ---
  const BookingsList = () => (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-300 p-1 min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs min-w-0">
        <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white shrink-0">
            <LayoutGrid size={20} />
          </div>
          <h2 className="text-lg font-montserrat font-black text-slate-800 uppercase tracking-tight truncate">
            Venue Booking Approvals
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

        <div className="flex items-center bg-blue-600 rounded-2xl p-1">
          <button
            className="flex flex-1 p-1 rounded-lg text-[12px] font-montserrat text-white tracking-wider uppercase transition-all"
            onClick={() => setOpenAddForm(true)}
          >
            <span className="text-white">
              <Plus size={16} />
            </span>
            Add Booking
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-w-0">
        {filteredbookings.length > 0 ? (
          filteredbookings.map((booking) => {
            // Resolve visual name matching coordinates from active facilities list
            const venueMatch = facilities.find(
              (loc) => loc.id.toString() === booking.venue_id?.toString(),
            );
            const venueName = venueMatch
              ? venueMatch.name
              : "Unknown Venue Asset";

            return (
              <button
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className="w-full flex items-center justify-between p-4 bg-white border border-slate-200/60 rounded-2xl hover:border-blue-400/50 shadow-2xs hover:shadow-xs transition-all duration-200 group text-left min-w-0"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                      booking.is_approved
                        ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                        : booking.is_rejected
                          ? "bg-rose-50 border-rose-100 text-rose-600"
                          : "bg-amber-50 border-amber-100 text-amber-600"
                    }`}
                  >
                    <Calendar size={18} />
                  </div>

                  <div className="flex justify-between items-center flex-1 min-w-0 pr-2">
                    <div className="min-w-0 flex-1">
                      {/* Render Resident Identity Parameter as the Principal Line Item Accent */}
                      <h3 className="font-montserrat font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors truncate block w-full mb-0.5">
                        {tenants.find(
                          (tenant) => tenant.id === booking.resident_id,
                        )?.name || "Unassigned Resident Account"}
                      </h3>
                      {/* Secondary Line explicitly tracks localized Venue context */}
                      <p className="text-[10px] font-oswald font-semibold text-slate-400 uppercase tracking-wide truncate block w-full">
                        Venue:{" "}
                        <span className="text-slate-600">{venueName}</span>
                      </p>
                    </div>

                    <div className="text-right hidden sm:block shrink-0 pl-4">
                      <p className="text-[10px] font-oswald font-semibold text-slate-500 uppercase tracking-wide">
                        DATE: {formatToLocalDateString(booking.start_date)}
                      </p>
                      <div className="flex items-center justify-end mt-1">
                        <span
                          className={`text-[9px] font-oswald font-bold uppercase px-1.5 py-0.5 rounded ${
                            booking.is_approved
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                              : booking.is_rejected
                                ? "bg-rose-50 text-rose-700 border border-rose-200/50"
                                : "bg-amber-50 text-amber-700 border border-amber-200/50"
                          }`}
                        >
                          {booking.is_approved
                            ? "Approved"
                            : booking.is_rejected
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
            );
          })
        ) : (
          <div className="p-8 bg-white rounded-2xl border-2 border-dashed border-slate-200/70 text-center">
            <p className="text-slate-400 text-xs font-medium">
              {loading ? "Loading..." : "No active bookings registered"}
            </p>
          </div>
        )}
      </div>
      <AddBookingFormModal
        isOpen={openAddForm}
        onClose={() => setOpenAddForm(false)}
        venues={facilities}
        onBookingSuccess={() => {
          toast.success("Booking Successful");
          setOpenAddForm(false);
        }}
      />
    </div>
  );

  const DetailView = ({ booking }: { booking: LocationBooking }) => {
    const {user} = useUser()
    const estateId = user?.estate_id
    const isMultiDay =
      booking.end_date &&
      formatToLocalDateString(booking.end_date) !==
        formatToLocalDateString(booking.start_date);

    const start = new Date(formatToLocalDateString(booking.start_date));
    const end = new Date(formatToLocalDateString(booking.end_date));

    // 1. Find the tenant record safely
    const tenantMatch = useMemo(() => {
      if (!booking.resident_id || !tenants) return null;
      return (
        tenants.find(
          (t) => t.id.toString() === booking.resident_id.toString(),
        ) || null
      );
    }, [booking.resident_id, tenants]);

    // 2. Format location structures
    const formattedLocations = useMemo(() => {
      if (!tenantMatch?.locations) return [];
      return Object.values(tenantMatch.locations)
        .flat()
        .map((loc) => {
          const unitsStr = Array.isArray(loc.unit) ? loc.unit.join(", ") : "";
          return `${loc.block}: ${unitsStr}`;
        });
    }, [tenantMatch]);

    const resolvedVenueName = useMemo(() => {
      const match = facilities.find(
        (loc) => loc.id.toString() === booking.venue_id?.toString(),
      );
      return match ? match.name : "Not Specified";
    }, [booking.venue_id]);

    const excludedDatesList = useMemo(() => {
      if (
        !booking.booked_dates ||
        !Array.isArray(booking.booked_dates) ||
        booking.booked_dates.length === 0
      ) {
        return [];
      }
      const excluded: string[] = [];
      const bookedSet = new Set(
        booking.booked_dates.map((d) => formatToLocalDateString(d)),
      );

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const currentStr = d.toISOString().split("T")[0];
        if (!bookedSet.has(currentStr)) {
          excluded.push(currentStr);
        }
      }
      return excluded;
    }, [booking.start_date, booking.end_date, booking.booked_dates]);

    return (
      <div className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6 shadow-2xs animate-in slide-in-from-right duration-300 flex flex-col h-full overflow-hidden min-w-0">
        {/* Navigation Back Header */}
        <button
          onClick={() => setSelectedBooking(null)}
          className="w-fit flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors mb-6 font-montserrat font-bold text-xs uppercase tracking-wider shrink-0"
        >
          <ArrowLeft size={16} /> Back to Approvals
        </button>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 overflow-y-auto pr-1 pb-4 min-w-0 custom-scrollbar">
          <div className="flex-1 min-w-0 space-y-6">
            {/* Top Operational Row: Action Panel */}
            <div className="flex flex-wrap items-center justify-end gap-2 border-b border-slate-100 pb-4 shrink-0 w-full ml-auto">
              {(!booking.is_approved || booking.is_rejected) && (
                <button
                  disabled={!!loadingAction}
                  onClick={() => handleUpdateStatus(booking.id, "approve")}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-3 bg-blue-600 text-white rounded-xl font-montserrat font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-40 shadow-3xs active:scale-98"
                >
                  {loadingAction === "approving" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle size={14} />
                  )}
                  <span>Approve Booking</span>
                </button>
              )}

              {(!booking.is_rejected || booking.is_approved) && (
                <button
                  disabled={!!loadingAction}
                  onClick={() => handleUpdateStatus(booking.id, "reject")}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-3 bg-rose-50 text-rose-600 border border-rose-100/60 rounded-xl font-montserrat font-bold text-xs uppercase tracking-wider hover:bg-rose-100 transition-all disabled:opacity-40 shadow-3xs active:scale-98"
                >
                  {loadingAction === "rejecting" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <XCircle size={14} />
                  )}
                  <span>Reject Booking</span>
                </button>
              )}
            </div>

            {/* Highlighted Resident Profile Information Block */}
            <div className="bg-slate-50/50 rounded-2xl border border-slate-200/50 p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 min-w-0 shadow-3xs">
              {/* Enhanced Sized Profile Avatar Component */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden text-slate-600 font-montserrat font-black text-xl sm:text-2xl">
                {estateId && tenantMatch?.avatar?.[estateId] ? (
                  <img
                    src={tenantMatch.avatar[estateId]}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (tenantMatch?.name || booking.resident_name || "U")
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>

              {/* Profile Text Content Area */}
              <div className="min-w-0 flex-1 text-center sm:text-left space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-oswald font-bold uppercase tracking-wider border bg-blue-50 text-blue-600 border-blue-200/50">
                  Resident Profile
                </span>

                <h3 className="text-xl sm:text-2xl font-montserrat font-black text-slate-800 leading-tight tracking-tight break-words">
                  {tenantMatch?.name ||
                    booking.resident_name ||
                    "Unassigned Resident Account"}
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 font-medium font-montserrat">
                  {tenantMatch?.email || "No email provided"}
                </p>

                {/* Structured Assigned Housing Location Info */}
                <div className="pt-1">
                  {formattedLocations.length > 0 ? (
                    <p className="text-xs sm:text-sm text-blue-700 font-bold font-montserrat bg-blue-50/50 border border-blue-100/50 rounded-lg px-2.5 py-1 w-fit mx-auto sm:ml-0">
                      Allocated to: {formattedLocations.join(" | ")}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic font-medium">
                      No assigned address details
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Operational Flow Status Indicators */}
            {(booking.is_approved || booking.is_rejected) && (
              <div
                className={`p-3.5 rounded-xl flex items-center gap-2.5 border text-xs font-semibold shadow-3xs ${
                  booking.is_approved
                    ? "bg-emerald-50/60 border-emerald-100 text-emerald-700"
                    : "bg-rose-50/60 border-rose-100 text-rose-700"
                }`}
              >
                {booking.is_approved ? (
                  <CheckCircle size={15} />
                ) : (
                  <AlertCircle size={15} />
                )}
                <p className="font-montserrat font-bold text-[10px] uppercase tracking-wider">
                  Current Status:{" "}
                  {booking.is_approved ? "Approved" : "Rejected"}
                </p>
              </div>
            )}

            {/* Details Grid Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <DetailBox
                icon={<Calendar size={18} />}
                label="Requested Booking Date"
                value={
                  isMultiDay
                    ? `${formatToLocalDateString(booking.start_date)} to ${formatToLocalDateString(booking.end_date)}`
                    : formatToLocalDateString(booking.start_date)
                }
              />
              <DetailBox
                icon={<Clock size={18} />}
                label="Reservation Timeframe Window"
                value={`${booking.start_time} - ${booking.end_time}`}
              />
              <DetailBox
                icon={<MapPin size={18} />}
                label="Target Venue Resource Location"
                value={resolvedVenueName}
              />
            </div>

            {/* Blackout Exception Schedule Panels */}
            {excludedDatesList.length > 0 && (
              <div className="p-4 bg-rose-50/30 border border-rose-100/60 rounded-xl min-w-0">
                <span className="text-[10px] font-oswald font-bold text-rose-600 uppercase tracking-wider block mb-2">
                  Blackout/Excluded Dates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {excludedDatesList.map((d) => (
                    <span
                      key={d}
                      className="text-xs font-oswald font-bold bg-white border border-rose-200/50 text-rose-600 px-2.5 py-1 rounded-md shadow-3xs"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- MAIN MODULE HOIST INTEGRATION ROUTER ---
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col overflow-hidden p-4 bg-slate-50/50 relative font-sans">
      {!selectedBooking && !isDetailedLocation && (
        <div className="flex justify-start mb-4 shrink-0 min-w-0">
          <div className="flex bg-slate-200/60 p-1 rounded-xl border border-slate-200/20 shadow-inner">
            <button
              onClick={() => {
                setActiveViewTab("bookings");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all ${
                activeViewTab === "bookings"
                  ? "bg-white shadow-3xs text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutGrid size={13} /> Bookings Registry
            </button>
            <button
              onClick={() => {
                setActiveViewTab("facility");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all ${
                activeViewTab === "facility"
                  ? "bg-white shadow-3xs text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <MapPin size={13} /> Facilities
            </button>
          </div>
        </div>
      )}

      {!selectedBooking && !isDetailedLocation && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 shrink-0 min-w-0">
          <div className="relative flex items-center flex-1 w-full min-w-0">
            <Search
              className="absolute left-3.5 text-slate-400 pointer-events-none"
              size={16}
            />
            <input
              type="text"
              placeholder={
                activeViewTab === "bookings"
                  ? "Search by resident identity tracking attributes..."
                  : "Search by venue registration label or quadrant area..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500 outline-none transition-all shadow-3xs text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {activeViewTab === "bookings" && (
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

      <div className="flex-1 overflow-hidden min-w-0">
        {activeViewTab === "bookings" ? (
          selectedBooking ? (
            <DetailView booking={selectedBooking} />
          ) : (
            <BookingsList />
          )
        ) : (
          <LocationsView
            locations={facilities}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            tenants={tenants}
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
