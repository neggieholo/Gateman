/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  MapPin,
  ArrowLeft,
  Users,
  AlertCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  XCircle,
} from "lucide-react";
import { EstateLocation, EstateEvent } from "../services/types";
import {
  getEventAtLocationDate,
  createLocation,
  editLocation,
  deleteLocation,
} from "../services/apis";

interface LocationsViewProps {
  locations: EstateLocation[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setIsDetailedLocation: (isDetailed: boolean) => void;
  refreshData: () => Promise<void>;
}

export default function LocationsView({
  locations,
  searchQuery,
  setIsDetailedLocation,
  refreshData,
}: LocationsViewProps) {
  const [selectedLoc, setSelectedLoc] = useState<EstateLocation | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");

  // FIXED: Multi-Event & Pagination tracking states
  const [activeDateEvents, setActiveDateEvents] = useState<EstateEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(0);
  const [loadingEvent, setLoadingEvent] = useState<boolean>(false);

  // Calendar Navigation State
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(
    new Date(),
  );

  // Modal & Form States
  const [showModal, setShowModal] = useState<"create" | "edit" | null>(null);
  const [targetLoc, setTargetLoc] = useState<EstateLocation | null>(null);
  const [formName, setFormName] = useState("");
  const [formInEstate, setFormInEstate] = useState("");
  const [formCapacity, setFormCapacity] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const oneYearHenceEnd = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  // FIXED: Maps individual date strings ("YYYY-MM-DD") to an ARRAY of event contexts
  const performanceReservationMap = useMemo(() => {
    if (!selectedLoc)
      return new Map<string, Array<{ title: string; banner: string | null }>>();
    const activeDatesMap = new Map<
      string,
      Array<{ title: string; banner: string | null }>
    >();

    let bookedData = selectedLoc.event_booked_on;
    if (typeof bookedData === "string") {
      try {
        bookedData = JSON.parse(bookedData);
      } catch (e) {
        console.error("Failed to parse event_booked_on string:", e);
        return activeDatesMap;
      }
    }

    if (bookedData && typeof bookedData === "object") {
      Object.values(bookedData).forEach((bookingContext: any) => {
        if (bookingContext && typeof bookingContext === "object") {
          const { event_title, event_banner_url, dates } = bookingContext;

          if (Array.isArray(dates)) {
            dates.forEach((d: string) => {
              const cleanDate = d.split("T")[0];
              const existing = activeDatesMap.get(cleanDate) || [];
              existing.push({
                title: event_title,
                banner: event_banner_url || null,
              });
              activeDatesMap.set(cleanDate, existing);
            });
          }
        }
      });
    }
    return activeDatesMap;
  }, [selectedLoc]);

  // Generate full calendar grid layout cells array for the current view month
  const calendarGridDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeekOffset = firstDayOfMonth.getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: {
      date: Date | null;
      dateStr: string;
      isOutsideAllowedRange: boolean;
    }[] = [];

    for (let i = 0; i < startDayOfWeekOffset; i++) {
      cells.push({ date: null, dateStr: "", isOutsideAllowedRange: true });
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      dayDate.setHours(0, 0, 0, 0);

      const yyyy = dayDate.getFullYear();
      const mm = String(dayDate.getMonth() + 1).padStart(2, "0");
      const dd = String(dayDate.getDate()).padStart(2, "0");
      const computedString = `${yyyy}-${mm}-${dd}`;

      const isOutsideAllowedRange =
        dayDate < todayStart || dayDate > oneYearHenceEnd;

      cells.push({
        date: dayDate,
        dateStr: computedString,
        isOutsideAllowedRange,
      });
    }

    return cells;
  }, [currentCalendarDate, todayStart, oneYearHenceEnd]);

  // Filters based on top parent search queries
  const filteredLocations = useMemo(() => {
    return locations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.location_in_estate || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );
  }, [locations, searchQuery]);

  // FIXED: Fetch multiple scheduled event profiles and manage pagination reset routines
  useEffect(() => {
    if (!selectedLoc || !selectedDateStr) return;

    const fetchActiveSlotContent = async () => {
      setLoadingEvent(true);
      setCurrentEventIndex(0); // Reset index frame on date view changes
      try {
        const data = await getEventAtLocationDate(
          selectedLoc.id,
          selectedDateStr,
        );
        // Clean structural assignment normalization check layers
        const eventsList = Array.isArray(data.event)
          ? data.event
          : data.event
            ? [data.event]
            : [];
        setActiveDateEvents(eventsList);
      } catch (err) {
        console.error("Failed fetching slot context:", err);
        setActiveDateEvents([]);
      } finally {
        setLoadingEvent(false);
      }
    };

    fetchActiveSlotContent();
  }, [selectedDateStr, selectedLoc]);

  // Derive isolated index item instance safely from array payload matrix references
  const currentActiveEvent = useMemo(() => {
    return activeDateEvents[currentEventIndex] || null;
  }, [activeDateEvents, currentEventIndex]);

  const handleSelectLocation = (loc: EstateLocation) => {
    setSelectedLoc(loc);
    setIsDetailedLocation(true);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    setCurrentCalendarDate(new Date());
    setSelectedDateStr(`${yyyy}-${mm}-${dd}`);
  };

  const handleBackToList = () => {
    setSelectedLoc(null);
    setSelectedDateStr("");
    setActiveDateEvents([]);
    setIsDetailedLocation(false);
  };

  const handlePrevMonth = () => {
    setCurrentCalendarDate((prev) => {
      const target = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      if (
        target.getMonth() < todayStart.getMonth() &&
        target.getFullYear() <= todayStart.getFullYear()
      ) {
        return prev;
      }
      return target;
    });
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate((prev) => {
      const target = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      if (target > oneYearHenceEnd) return prev;
      return target;
    });
  };

  const openCreateModal = () => {
    setFormName("");
    setFormInEstate("");
    setFormCapacity("");
    setShowModal("create");
  };

  const openEditModal = (e: React.MouseEvent, loc: EstateLocation) => {
    e.stopPropagation();
    setTargetLoc(loc);
    setFormName(loc.name);
    setFormInEstate(loc.location_in_estate || "");
    setFormCapacity(loc.capacity || "");
    setShowModal("edit");
  };

  const handleSaveLocation = async () => {
    if (!formName.trim()) return alert("Location name is required.");
    setIsSubmitting(true);

    const numericalCapacity =
      formCapacity === "" ? undefined : Number(formCapacity);

    try {
      if (showModal === "create") {
        await createLocation({
          name: formName,
          location_in_estate: formInEstate || undefined,
          capacity: numericalCapacity,
        });
      } else if (showModal === "edit" && targetLoc) {
        await editLocation(targetLoc.id, {
          name: formName,
          location_in_estate: formInEstate || undefined,
          capacity: numericalCapacity,
        });
      }
      await refreshData();
      setShowModal(null);
    } catch (err: any) {
      alert(err.message || "Failed to save location.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocation = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (
      !confirm(
        "Are you sure you want to permanently delete this location resource? This cascades across bookings.",
      )
    )
      return;
    try {
      await deleteLocation(id);
      await refreshData();
    } catch (err: any) {
      alert(err.message || "Failed to purge location asset.");
    }
  };

  // --- VIEW 1: DETAILED GRID CALENDAR PERSPECTIVE MATRIX ---
  if (selectedLoc) {
    return (
      <div className="bg-white rounded-[3rem] border border-slate-100 p-8 animate-in slide-in-from-right duration-300 flex flex-col h-full overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-6 mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {selectedLoc.name}
            </h1>
            <div className="flex items-center gap-4 text-slate-400 font-bold text-xs mt-1">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {selectedLoc.location_in_estate || "Main Area Asset Zone"}
              </span>
              <span className="flex items-center gap-1">
                <Users size={14} />
                Capacity Limit:{" "}
                {selectedLoc.capacity
                  ? `${selectedLoc.capacity} Max`
                  : "Unspecified Layout Capacity"}
              </span>
            </div>
          </div>
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-100 text-slate-500 hover:text-slate-900 rounded-2xl transition-all font-black text-xs uppercase tracking-widest self-start md:self-center"
          >
            <ArrowLeft size={16} /> Back to Directory
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
          {/* LEFT PANEL: Calendar */}
          <div className="flex-1 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-6 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                {currentCalendarDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <div className="flex gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 bg-white border border-slate-100 rounded-xl text-slate-600 hover:bg-slate-100 transition disabled:opacity-30"
                  disabled={
                    currentCalendarDate.getMonth() === todayStart.getMonth() &&
                    currentCalendarDate.getFullYear() ===
                      todayStart.getFullYear()
                  }
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 bg-white border border-slate-100 rounded-xl text-slate-600 hover:bg-slate-100 transition disabled:opacity-30"
                  disabled={
                    currentCalendarDate.getMonth() ===
                      oneYearHenceEnd.getMonth() &&
                    currentCalendarDate.getFullYear() ===
                      oneYearHenceEnd.getFullYear()
                  }
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Monthly Day Render Grid Matrix block */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1.5 overflow-y-auto">
              {calendarGridDays.map((cell, idx) => {
                if (!cell.date) {
                  return (
                    <div key={`empty-${idx}`} className="bg-transparent" />
                  );
                }

                const isSelected = selectedDateStr === cell.dateStr;
                const dayEvents =
                  performanceReservationMap.get(cell.dateStr) || [];
                const hasEvents = dayEvents.length > 0;
                const isDisabled = cell.isOutsideAllowedRange;

                // FIXED: Grab the first available event flyer background safely
                const firstBanner = dayEvents.find((e) => e.banner)?.banner;

                return (
                  <button
                    key={cell.dateStr}
                    disabled={isDisabled}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`rounded-xl border flex flex-col items-center justify-between transition-all relative font-bold text-sm h-12 overflow-hidden ${
                      isDisabled
                        ? "bg-slate-100/50 border-gray-200 text-slate-400 cursor-not-allowed"
                        : isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 z-10"
                          : "bg-white border-slate-100 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {/* FIXED: Single Background Asset Render */}
                    {hasEvents && firstBanner && !isDisabled && (
                      <div className="absolute inset-0 w-full h-full z-0">
                        <img
                          src={firstBanner}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div
                          className={`absolute inset-0 ${isSelected ? "bg-indigo-600/40" : "bg-slate-900/40"}`}
                        />
                      </div>
                    )}

                    {/* Day Text Number */}
                    <span
                      className={`relative z-10 mt-1 pl-1.5 self-start ${
                        hasEvents && firstBanner && !isSelected
                          ? "text-white font-black drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.9)]"
                          : ""
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {/* FIXED: Dynamic Counter Badges */}
                    {hasEvents && (
                      <div className="relative z-10 mb-1 flex items-center justify-center w-full px-1">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm border ${
                            isSelected
                              ? "bg-white text-indigo-600 border-white"
                              : "bg-amber-500 text-white border-amber-600"
                          }`}
                        >
                          {dayEvents.length}{" "}
                          {dayEvents.length === 1 ? "Evt" : "Evts"}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL: Sidebar Agenda Display */}
          <div className="w-full lg:w-96 border border-slate-100 rounded-[2.5rem] bg-white p-6 flex flex-col overflow-hidden shadow-sm">
            <div className="border-b border-slate-50 pb-3 mb-4 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Schedule Display Context
                </span>
                <span className="text-xs font-black text-indigo-600 mt-1 block">
                  {new Date(selectedDateStr + "T00:00:00").toLocaleDateString(
                    "en-US",
                    {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </span>
              </div>

              {/* FIXED: Multi-Event pagination control triggers if dates share asset records */}
              {activeDateEvents.length > 1 && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 p-1 rounded-xl">
                  <button
                    disabled={currentEventIndex === 0}
                    onClick={() => setCurrentEventIndex((prev) => prev - 1)}
                    className="p-1 rounded-lg text-slate-500 hover:bg-white border border-transparent hover:border-slate-100 transition disabled:opacity-20 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[10px] font-black text-slate-700 px-1">
                    {currentEventIndex + 1}/{activeDateEvents.length}
                  </span>
                  <button
                    disabled={currentEventIndex === activeDateEvents.length - 1}
                    onClick={() => setCurrentEventIndex((prev) => prev + 1)}
                    className="p-1 rounded-lg text-slate-500 hover:bg-white border border-transparent hover:border-slate-100 transition disabled:opacity-20 disabled:hover:bg-transparent"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
              {loadingEvent ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Loader2
                    size={32}
                    className="animate-spin text-indigo-600 mb-2"
                  />
                  <p className="text-xs font-black uppercase tracking-wider">
                    Syncing Event Info...
                  </p>
                </div>
              ) : currentActiveEvent ? (
                <div className="space-y-4 animate-in fade-in duration-300 text-left flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    {currentActiveEvent.banner_url && (
                      <img
                        src={currentActiveEvent.banner_url}
                        alt="Flyer"
                        className="w-full h-40 object-cover rounded-2xl border border-slate-100"
                      />
                    )}
                    <div>
                      <span className="text-[9px] font-black px-2 py-0.5 bg-amber-100 text-amber-800 rounded uppercase tracking-wider">
                        Reserved Slot{" "}
                        {activeDateEvents.length > 1 &&
                          `#${currentEventIndex + 1}`}
                      </span>
                      <h3 className="font-black text-xl text-slate-900 mt-2 leading-tight">
                        {currentActiveEvent.title}
                      </h3>
                      <p className="text-xs font-black text-slate-400 mt-1">
                        REF ID: {currentActiveEvent.ref_code}
                      </p>
                    </div>
                    <div className="space-y-2 text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                        <Clock size={16} className="text-indigo-600" />
                        <span>
                          {currentActiveEvent.start_time} -{" "}
                          {currentActiveEvent.end_time}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                        <Users size={16} className="text-indigo-600" />
                        <span>
                          Expected: {currentActiveEvent.expected_guests} Guests
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* FIXED: Native link path route parsing with isolated active instance targets */}
                  <button
                    onClick={() =>
                      (window.location.href = `/home/events?id=${currentActiveEvent.id}`)
                    }
                    className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl border border-slate-900 transition text-center block"
                  >
                    See Event Details
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 border border-dashed rounded-2xl p-6 bg-slate-50/50">
                  <AlertCircle size={28} className="text-slate-300 mb-2" />
                  <p className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    No scheduled events
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 mt-1 text-center">
                    This location asset slot is completely open for system
                    reservation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: MASTER LOCATION DIRECTORY ---
  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500 p-2">
      <div className="flex justify-between items-center bg-white p-4 rounded-[2.5rem] border border-slate-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white">
            <MapPin size={24} />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Estate Venues
            </h1>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-md shadow-indigo-100"
        >
          <Plus size={16} /> Add Venue Location
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {filteredLocations.length > 0 ? (
          filteredLocations.map((loc) => {
            let bookedData = loc.event_booked_on;
            if (typeof bookedData === "string") {
              try {
                bookedData = JSON.parse(bookedData);
              } catch {
                bookedData = {};
              }
            }

            const totalDays = Object.values(bookedData || {}).reduce(
              (acc: number, bookingContext: any) => {
                if (bookingContext && Array.isArray(bookingContext.dates)) {
                  return acc + bookingContext.dates.length;
                }
                return acc;
              },
              0,
            );

            return (
              <div
                key={loc.id}
                onClick={() => handleSelectLocation(loc)}
                className="w-full flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:border-indigo-200 hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-5">
                  <div className="p-4 rounded-2xl bg-slate-50 text-indigo-600 group-hover:bg-indigo-50 transition-colors shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                      {loc.name}
                    </h3>
                    <p className="text-sm font-bold text-slate-500 mt-0.5">
                      {loc.location_in_estate ||
                        "No detailed layout descriptions given."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 md:mt-0 justify-end">
                  <div className="bg-slate-50 p-3 rounded-2xl border text-right min-w-28">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Reservations
                    </p>
                    <p className="text-md font-black text-slate-800 mt-0.5">
                      {totalDays} Days
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => openEditModal(e, loc)}
                      className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                      title="Edit Venue Details"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteLocation(e, loc.id)}
                      className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Purge Venue"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 p-8 bg-white rounded-3xl border border-dashed text-center font-bold">
            No active location records discovered.
          </p>
        )}
      </div>

      {/* OPERATIONAL OVERLAY DIALOGS */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {showModal === "create"
                  ? "Add New Location"
                  : "Edit Venue Layout Context"}
              </h3>
              <button
                onClick={() => setShowModal(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  Location Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Complex Tennis Court"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-3.5 border border-slate-200 rounded-2xl text-sm font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  Placement Context Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Phase 2 layout right behind multi-sports arena"
                  value={formInEstate}
                  onChange={(e) => setFormInEstate(e.target.value)}
                  className="w-full p-3.5 border border-slate-200 rounded-2xl text-sm font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  Capacity / Estimated Capacity
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={formCapacity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormCapacity(val === "" ? "" : parseInt(val, 10));
                  }}
                  className="w-full p-3.5 border border-slate-200 rounded-2xl text-sm font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                disabled={isSubmitting}
                onClick={handleSaveLocation}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {showModal === "create" ? "Save Asset" : "Commit Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
