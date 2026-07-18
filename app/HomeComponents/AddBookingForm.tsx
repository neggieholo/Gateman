/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useUser } from "../UserContext";
import { EstateFacility, Tenant } from "../services/types";
import { db } from "../services/database";

interface AddBookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  venues: EstateFacility[];
  onBookingSuccess?: (booking: any) => void;
}

interface FormDataState {
  tenantId: string; // <-- Tracked selected tenant identifier
  venueIndex: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  dateInput: string;
}

export default function AddBookingFormModal({
  isOpen,
  onClose,
  venues,
  onBookingSuccess,
}: AddBookingFormModalProps) {
  const [formData, setFormData] = useState<FormDataState>({
    tenantId: "",
    venueIndex: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    dateInput: "",
  });
  const { user } = useUser();
  const estateId = user?.estate_id;

  const [bookedDatesList, setBookedDatesList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const tenantData = await db.getAllTenants();
        setTenants(tenantData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Could not download tenant catalog lists.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addDateToList = (): void => {
    if (!formData.dateInput) return;
    if (bookedDatesList.includes(formData.dateInput)) {
      setError("This specific date is already added to the list.");
      return;
    }
    setBookedDatesList((prev) => [...prev, formData.dateInput].sort());
    setFormData((prev) => ({ ...prev, dateInput: "" }));
    setError("");
  };

  const removeDateFromList = (dateToRemove: string): void => {
    setBookedDatesList((prev) => prev.filter((d) => d !== dateToRemove));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.tenantId) {
      setError("Please select a valid resident to host this booking.");
      setLoading(false);
      return;
    }

    if (!formData.venueIndex) {
      setError("Please select a target facility venue.");
      setLoading(false);
      return;
    }

    // --- Strict Date & Time Validations ---
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (formData.startDate < todayStr) {
      setError("The reservation start date cannot be in the past.");
      setLoading(false);
      return;
    }

    if (formData.endDate < formData.startDate) {
      setError(
        "The end window date cannot be earlier than the start window date.",
      );
      setLoading(false);
      return;
    }

    if (formData.startDate === todayStr) {
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMinutes = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      if (formData.startTime < currentTimeStr) {
        setError("The selected start time has already passed for today.");
        setLoading(false);
        return;
      }
    }

    if (formData.startDate === formData.endDate) {
      if (formData.endTime <= formData.startTime) {
        setError("The ending time must be later than the starting time.");
        setLoading(false);
        return;
      }
    }

    const allDatesInRange: string[] = [];
    if (formData.startDate && formData.endDate) {
      const current = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      while (current <= end) {
        allDatesInRange.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }
    }

    const finalizedActiveDates = allDatesInRange.filter(
      (date) => !bookedDatesList.includes(date),
    );

    if (finalizedActiveDates.length === 0) {
      setError(
        "The reservation window contains no active dates after applying your exclusions.",
      );
      setLoading(false);
      return;
    }

    const indexNumber = parseInt(formData.venueIndex, 10);
    const selectedVenue = venues[indexNumber];

    if (!selectedVenue) {
      setError("Selected facility reference could not be resolved.");
      setLoading(false);
      return;
    }

    const payload = {
      estate_id: estateId,
      resident_id: formData.tenantId, // <-- Payload matches your backend model key
      venue_id: selectedVenue.id,
      venue_name: selectedVenue.name,
      start_date: formData.startDate,
      end_date: formData.endDate,
      start_time: formData.startTime,
      end_time: formData.endTime,
      booked_dates_list: finalizedActiveDates,
    };

    try {
      const response = await fetch(
        `${baseUrl}/api/event/create-auto-approved`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to finalize facility booking registration.",
        );
      }

      setSuccess("Facility reservation confirmed and secured instantly!");
      setBookedDatesList([]);
      setFormData({
        tenantId: "",
        venueIndex: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        dateInput: "",
      });

      if (onBookingSuccess) onBookingSuccess(data.booking);

      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unhandled error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200 text-left overflow-y-auto max-h-[90vh] custom-scrollbar">
        <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
          <h3 className="text-sm font-montserrat font-black text-slate-800 uppercase tracking-wide">
            Reserve Estate Facility
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors cursor-pointer"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>

        {error && (
          <div className="text-red-600 mb-3 text-xs font-medium bg-red-50 p-2 rounded-lg border border-red-100">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-600 mb-3 text-xs font-medium bg-green-50 p-2 rounded-lg border border-green-100">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tenant Selector Dropdown */}
          <div>
            <label className="block text-[9px] font-oswald font-bold uppercase text-slate-400 tracking-wider mb-1.5">
              Select Resident / Tenant *
            </label>
            <select
              name="tenantId"
              value={formData.tenantId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-slate-50 outline-none focus:border-blue-500 transition-colors text-slate-700 h-[36px]"
              required
            >
              <option value="">-- Choose Resident User --</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-oswald font-bold uppercase text-slate-400 tracking-wider mb-1.5">
              Select Venue Location *
            </label>
            <select
              name="venueIndex"
              value={formData.venueIndex}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-slate-50 outline-none focus:border-blue-500 transition-colors text-slate-700 h-[36px]"
              required
            >
              <option value="">-- Choose Facility --</option>
              {venues.map((v, index) => (
                <option key={v.id} value={index}>
                  {v.name} (Cap: {v.capacity})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[9px] font-oswald font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                Start Time *
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-slate-50 outline-none focus:border-blue-500 transition-colors text-slate-700 font-sans"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-[9px] font-oswald font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                End Time *
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-slate-50 outline-none focus:border-blue-500 transition-colors text-slate-700 font-sans"
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[9px] font-oswald font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                Start Window *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-slate-50 outline-none focus:border-blue-500 transition-colors text-slate-700 font-sans"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-[9px] font-oswald font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                End Window *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-slate-50 outline-none focus:border-blue-500 transition-colors text-slate-700 font-sans"
                required
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-2">
            <label className="block text-[9px] font-oswald font-bold uppercase text-slate-400 tracking-wider mb-1.5">
              Add Blocked Calendar Dates
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                name="dateInput"
                value={formData.dateInput}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-slate-50 outline-none focus:border-blue-500 transition-colors text-slate-700 font-sans"
              />
              <button
                type="button"
                onClick={addDateToList}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-montserrat font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors uppercase tracking-wide cursor-pointer"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2.5 max-h-20 overflow-y-auto custom-scrollbar">
              {bookedDatesList.map((date) => (
                <span
                  key={date}
                  className="bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md text-[10px] text-slate-600 inline-flex items-center font-medium font-sans"
                >
                  {date}
                  <button
                    type="button"
                    onClick={() => removeDateFromList(date)}
                    className="bg-transparent border-none ml-1.5 text-slate-400 hover:text-red-500 cursor-pointer font-bold transition-colors text-xs"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5 justify-end border-t border-slate-100 pt-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 rounded-lg text-xs font-montserrat font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors uppercase tracking-wider cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-montserrat font-bold text-xs uppercase tracking-wider rounded-lg shadow-3xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all active:scale-98 cursor-pointer"
            >
              {loading ? "Securing..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
