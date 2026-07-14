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

  // Multi-Event & Pagination tracking states
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

  // Maps individual date strings ("YYYY-MM-DD") to an ARRAY of event contexts
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

  // Fetch multiple scheduled event profiles and manage pagination reset routines
  useEffect(() => {
    if (!selectedLoc || !selectedDateStr) return;

    const fetchActiveSlotContent = async () => {
      setLoadingEvent(true);
      setCurrentEventIndex(0);
      try {
        const data = await getEventAtLocationDate(
          selectedLoc.id,
          selectedDateStr,
        );
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
      <div className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6 shadow-2xs animate-in slide-in-from-right duration-300 flex flex-col h-full overflow-hidden min-w-0 font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-5 gap-4 min-w-0 shrink-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-montserrat font-black text-slate-800 tracking-tight truncate block w-full">
              {selectedLoc.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-slate-400 font-bold text-[11px] mt-1 uppercase tracking-wide font-oswald">
              <span className="flex items-center gap-1.5 text-slate-500 font-sans normal-case tracking-normal font-semibold">
                <MapPin size={13} className="text-blue-600" />
                {selectedLoc.location_in_estate || "Main Area Asset Zone"}
              </span>
              <span className="flex items-center gap-1">
                <Users size={13} className="text-blue-600" />
                Capacity Limit:{" "}
                <span className="text-slate-600 ml-0.5">
                  {selectedLoc.capacity
                    ? `${selectedLoc.capacity} Max`
                    : "Unspecified"}
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={handleBackToList}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200/60 text-slate-500 hover:text-blue-600 rounded-xl transition-all font-montserrat font-bold text-xs uppercase tracking-wider self-start md:self-center shrink-0 shadow-3xs"
          >
            <ArrowLeft size={14} /> Back to Directory
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden min-w-0">
          {/* LEFT PANEL: Calendar Layout */}
          <div className="flex-1 bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 flex flex-col overflow-hidden min-w-0">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-xs font-montserrat font-black text-slate-700 uppercase tracking-wide">
                {currentCalendarDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors disabled:opacity-30 shrink-0 shadow-3xs"
                  disabled={
                    currentCalendarDate.getMonth() === todayStart.getMonth() &&
                    currentCalendarDate.getFullYear() ===
                      todayStart.getFullYear()
                  }
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors disabled:opacity-30 shrink-0 shadow-3xs"
                  disabled={
                    currentCalendarDate.getMonth() ===
                      oneYearHenceEnd.getMonth() &&
                    currentCalendarDate.getFullYear() ===
                      oneYearHenceEnd.getFullYear()
                  }
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wider mb-2 shrink-0">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Monthly Day Render Grid Matrix block */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1.5 overflow-y-auto pr-0.5 custom-scrollbar min-w-0">
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
                const firstBanner = dayEvents.find((e) => e.banner)?.banner;

                return (
                  <button
                    key={cell.dateStr}
                    disabled={isDisabled}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`rounded-xl border flex flex-col items-center justify-between transition-all relative font-sans font-bold text-xs h-12 overflow-hidden ${
                      isDisabled
                        ? "bg-slate-100/50 border-slate-200 text-slate-300 cursor-not-allowed"
                        : isSelected
                          ? "bg-blue-600 border-blue-600 text-white shadow-xs z-10"
                          : "bg-white border-slate-200/70 text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {hasEvents && firstBanner && !isDisabled && (
                      <div className="absolute inset-0 w-full h-full z-0">
                        <img
                          src={firstBanner}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div
                          className={`absolute inset-0 ${isSelected ? "bg-blue-600/40" : "bg-slate-900/40"}`}
                        />
                      </div>
                    )}

                    <span
                      className={`relative z-10 mt-1 pl-1.5 self-start font-oswald font-bold text-xs ${
                        hasEvents && firstBanner && !isSelected
                          ? "text-white font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                          : ""
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {hasEvents && (
                      <div className="relative z-10 mb-1 flex items-center justify-center w-full px-1">
                        <span
                          className={`text-[9px] font-oswald font-bold px-1.5 py-0.5 rounded shadow-3xs border ${
                            isSelected
                              ? "bg-white text-blue-600 border-white"
                              : "bg-amber-500 text-white border-amber-600/50"
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
          <div className="w-full lg:w-80 border border-slate-200/70 rounded-xl bg-white p-4 flex flex-col overflow-hidden shadow-2xs shrink-0 min-w-0">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between shrink-0 min-w-0">
              <div className="text-left min-w-0 flex-1">
                <span className="text-[9px] font-oswald font-bold text-slate-400 uppercase tracking-wider block">
                  Schedule Display Context
                </span>
                <span className="text-xs font-montserrat font-bold text-blue-600 mt-0.5 block truncate">
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

              {activeDateEvents.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/60 p-0.5 rounded-lg shrink-0">
                  <button
                    disabled={currentEventIndex === 0}
                    onClick={() => setCurrentEventIndex((prev) => prev - 1)}
                    className="p-1 rounded text-slate-500 hover:bg-white border border-transparent hover:border-slate-200/60 transition disabled:opacity-20 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <span className="text-[10px] font-oswald font-bold text-slate-700 px-1">
                    {currentEventIndex + 1}/{activeDateEvents.length}
                  </span>
                  <button
                    disabled={currentEventIndex === activeDateEvents.length - 1}
                    onClick={() => setCurrentEventIndex((prev) => prev + 1)}
                    className="p-1 rounded text-slate-500 hover:bg-white border border-transparent hover:border-slate-200/60 transition disabled:opacity-20 disabled:hover:bg-transparent"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto pr-0.5 custom-scrollbar min-w-0">
              {loadingEvent ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4">
                  <Loader2
                    size={24}
                    className="animate-spin text-blue-600 mb-2"
                  />
                  <p className="text-[10px] font-montserrat font-bold uppercase tracking-wider">
                    Syncing Log Matrix...
                  </p>
                </div>
              ) : currentActiveEvent ? (
                <div className="space-y-4 animate-in fade-in duration-200 text-left flex flex-col justify-between h-full min-w-0">
                  <div className="space-y-3 min-w-0 w-full">
                    {currentActiveEvent.banner_url && (
                      <img
                        src={currentActiveEvent.banner_url}
                        alt="Flyer Asset Context"
                        className="w-full h-32 object-cover rounded-xl border border-slate-100 shadow-3xs shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="text-[9px] font-oswald font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/50 rounded uppercase tracking-wide">
                        Reserved Slot{" "}
                        {activeDateEvents.length > 1 &&
                          `#${currentEventIndex + 1}`}
                      </span>
                      <h3 className="font-montserrat font-bold text-base text-slate-800 mt-2 leading-snug break-words">
                        {currentActiveEvent.title}
                      </h3>
                      <p className="text-[10px] font-oswald font-semibold text-slate-400 mt-1 uppercase tracking-wide">
                        REF ID: {currentActiveEvent.ref_code}
                      </p>
                    </div>

                    <div className="space-y-2 text-xs font-semibold text-slate-600 min-w-0">
                      <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/40 min-w-0">
                        <Clock size={14} className="text-blue-600 shrink-0" />
                        <span className="truncate font-sans">
                          {currentActiveEvent.start_time} -{" "}
                          {currentActiveEvent.end_time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/40 min-w-0">
                        <Users size={14} className="text-blue-600 shrink-0" />
                        <span className="font-oswald tracking-wide font-medium text-slate-700">
                          Expected: {currentActiveEvent.expected_guests} Guests
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      (window.location.href = `/home/events?id=${currentActiveEvent.id}`)
                    }
                    className="w-full mt-4 bg-slate-800 hover:bg-slate-900 text-white font-montserrat font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-3xs text-center block shrink-0 active:scale-98"
                  >
                    See Event Details
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 min-w-0">
                  <AlertCircle
                    size={24}
                    className="text-slate-300 mb-1.5 shrink-0"
                  />
                  <p className="text-[10px] font-montserrat font-bold uppercase text-slate-400 tracking-wider">
                    No scheduled events
                  </p>
                  <p className="text-[11px] font-medium font-sans text-slate-400 mt-1 text-center">
                    This venue slot is completely open for system reservation
                    layers.
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
    <div className="space-y-4 flex flex-col h-full animate-in fade-in duration-300 p-1 min-w-0 font-sans">
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs min-w-0 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white shrink-0">
            <MapPin size={20} />
          </div>
          <div className="min-w-0 text-left">
            <h2 className="text-base sm:text-lg font-montserrat font-black text-slate-800 uppercase tracking-tight truncate">
              Estate Venues
            </h2>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-montserrat font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all shadow-3xs shrink-0 active:scale-98"
        >
          <Plus size={14} /> Add Venue Location
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-w-0">
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
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200/60 rounded-xl shadow-2xs hover:border-blue-400/50 hover:shadow-xs transition-all duration-200 cursor-pointer group text-left min-w-0 gap-3"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="p-3 rounded-xl bg-slate-50 text-blue-600 group-hover:bg-blue-50 border border-slate-100 transition-colors shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-montserrat font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors truncate block w-full mb-0.5">
                      {loc.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium truncate block w-full">
                      {loc.location_in_estate ||
                        "No detailed layout descriptions given."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                  <div className="bg-slate-50 border border-slate-200/40 p-2 px-3 rounded-xl text-center sm:text-right min-w-[5rem]">
                    <p className="text-[9px] font-oswald font-bold uppercase text-slate-400 tracking-wider">
                      Reservations
                    </p>
                    <p className="text-sm font-oswald font-bold text-slate-700 mt-0.5">
                      {totalDays} {totalDays === 1 ? "Day" : "Days"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => openEditModal(e, loc)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                      title="Edit Venue Details"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteLocation(e, loc.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      title="Purge Venue"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 bg-white rounded-xl border-2 border-dashed border-slate-200 text-center">
            <p className="text-slate-400 text-xs font-medium">
              No active location records discovered.
            </p>
          </div>
        )}
      </div>

      {/* OPERATIONAL OVERLAY DIALOGS */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 font-sans">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
              <h3 className="text-sm font-montserrat font-black text-slate-800 uppercase tracking-wide">
                {showModal === "create"
                  ? "Add New Location"
                  : "Edit Venue Layout Context"}
              </h3>
              <button
                onClick={() => setShowModal(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-oswald font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                  Location Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Complex Tennis Court"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-slate-50 outline-none focus:border-blue-500 transition-colors text-slate-700"
                />
              </div>
              <div>
                <label className="block text-[9px] font-oswald font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                  Placement Context Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Phase 2 layout behind arena"
                  value={formInEstate}
                  onChange={(e) => setFormInEstate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-slate-50 outline-none focus:border-blue-500 transition-colors text-slate-700"
                />
              </div>
              <div>
                <label className="block text-[9px] font-oswald font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                  Capacity / Estimated Limit
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={formCapacity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormCapacity(val === "" ? "" : parseInt(val, 10));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-slate-50 outline-none focus:border-blue-500 transition-colors text-slate-700 font-sans"
                />
              </div>

              <button
                disabled={isSubmitting}
                onClick={handleSaveLocation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-montserrat font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-3xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all mt-2 active:scale-98"
              >
                {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                <span>
                  {showModal === "create" ? "Save Asset" : "Commit Changes"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
