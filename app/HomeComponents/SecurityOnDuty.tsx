/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { securityDb } from "../services/database";
import { GuardLocation, SecurityUser } from "../services/types";
import {
  Search,
  MapPin,
  Mail,
  Phone,
  Image as ImageIcon,
  Loader2,
  Clock,
  X,
  Radio,
  ExternalLink,
} from "lucide-react";
import {
  fetchReadableAddress,
  formatTime,
  requestGuardLocation,
} from "../services/apis";
import { formatDate } from "../services/apis";
import toast from "react-hot-toast";
import { useUser } from "../UserContext";

export default function OnDutyPersonnel() {
  const { contextEstateId, getGuardLocation, socket } = useUser();
  const [guards, setGuards] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [securityPhoto, setSecurityPhoto] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<
    Record<string, boolean>
  >({});

  // Real-time location tracking modal state
  const [selectedGuardForLocation, setSelectedGuardForLocation] =
    useState<SecurityUser | null>(null);
  const [activeLocation, setActiveLocation] = useState<GuardLocation | null>(
    null,
  );

  const fetchData = useCallback(async () => {
    if (!contextEstateId) return;
    try {
      const personnelData = await securityDb.getAllSecurity(contextEstateId);
      setGuards(personnelData.filter((g) => g.is_on_duty));
    } catch (err) {
      console.error("Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, [contextEstateId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for socket events when the real-time location modal is active
  useEffect(() => {
    if (!socket || !selectedGuardForLocation) return;

    const handleLocationUpdate = (location: GuardLocation) => {
      if (
        location.userId === selectedGuardForLocation.id &&
        location.estateId === contextEstateId
      ) {
        setActiveLocation(location);
      }
    };

    socket.on("guard_location_update", handleLocationUpdate);

    return () => {
      socket.off("guard_location_update", handleLocationUpdate);
    };
  }, [socket, selectedGuardForLocation, contextEstateId]);

  const handleOpenLocationModal = (guard: SecurityUser) => {
    // Get initial real-time position from ref store if available
    const initialLocation = getGuardLocation(guard.id);

    if (initialLocation) {
      setActiveLocation(initialLocation);
    } else {
      setActiveLocation(null);
    }

    setSelectedGuardForLocation(guard);
  };

  const handleCloseLocationModal = () => {
    setSelectedGuardForLocation(null);
    setActiveLocation(null);
  };

  // const AddressDisplay = ({ location }: { location: string | null }) => {
  //   const [address, setAddress] = useState<string>("Loading address...");

  //   useEffect(() => {
  //     if (!location || location === "Unknown") {
  //       setAddress("No location data");
  //       return;
  //     }

  //     fetchReadableAddress(location).then(setAddress);
  //   }, [location]);

  //   return (
  //     <span
  //       className="text-sm font-semibold text-blue-600 truncate block w-full"
  //       title={address}
  //     >
  //       {address}
  //     </span>
  //   );
  // };

  const filteredGuards = guards.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const setPhoto = (photo: string | undefined) => {
    if (!photo) {
      toast.error("No Photo found");
      return;
    }
    setSecurityPhoto(photo);
  };

  const handleRequestLocation = async (guardId: string, guardName: string) => {
    if (pendingRequests[guardId]) return;

    setPendingRequests((prev) => ({ ...prev, [guardId]: true }));

    try {
      await requestGuardLocation(guardId, contextEstateId!);
      toast.success(
        `Location request sent to ${guardName}. You will be notified when it updates.`,
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to send request");
    } finally {
      setPendingRequests((prev) => ({ ...prev, [guardId]: false }));
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto h-[calc(100vh-200px)] flex flex-col font-sans">
      {/* Search Bar */}
      <div className="relative mb-6 group">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
          size={18}
        />
        <input
          type="text"
          placeholder="Search on-duty personnel..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-2xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium text-sm text-slate-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <h3 className="text-slate-400 font-oswald font-bold uppercase tracking-widest text-xs mb-4 px-1">
        Active Personnel
      </h3>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col gap-4 pb-4">
          {loading ? (
            <div className="flex justify-center p-20">
              <Loader2 className="animate-spin text-blue-600" size={28} />
            </div>
          ) : filteredGuards.length > 0 ? (
            filteredGuards.map((guard) => (
              <div
                key={guard.id}
                className="bg-white border border-slate-100 rounded-3xl shadow-2xs overflow-hidden flex flex-col md:flex-row hover:border-blue-200 transition-all group"
              >
                {/* Image Frame */}
                <div className="w-full md:w-40 h-44 md:h-auto bg-slate-50 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 relative overflow-hidden">
                  {guard.avatar ? (
                    <img
                      src={guard.avatar}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      alt={guard.name}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50/50 text-blue-400 font-montserrat font-black text-3xl uppercase">
                      {guard.name[0]}
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-50 min-w-0">
                  <div className="flex items-center gap-2 mb-2 min-w-0">
                    <h4 className="font-montserrat font-black text-slate-800 text-lg truncate flex-1 tracking-tight">
                      {guard.name}
                    </h4>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 text-slate-400 text-xs min-w-0">
                      <Mail size={14} className="shrink-0 text-slate-300" />
                      <span className="truncate font-medium">
                        {guard.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs min-w-0">
                      <Phone size={14} className="shrink-0 text-slate-300" />
                      <span className="truncate font-semibold text-slate-600">
                        {guard.phone || "No mobile number"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Check-in Section */}
                <div className="w-full md:w-80 lg:w-96 p-5 sm:p-6 bg-slate-50/40 flex flex-col justify-center space-y-4 shrink-0">
                  <div className="flex flex-col gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wider">
                        Check-in Location
                      </h2>
                      <div className="mt-0.5 truncate">
                        <span className="text-xs text-slate-400 font-medium">
                          {guard.checkin_address || "No initial check-in data"}
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wider">
                        Check-In Time
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5 min-w-0">
                        {guard.last_checkin && (
                          <div className="flex gap-3">
                            <span className="flex items-center gap-1 text-[10px] font-oswald font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shrink-0 uppercase tracking-wide">
                              {formatTime(
                                guard.last_checkin
                                  ?.split("T")[1]
                                  ?.split(".")[0],
                              )}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-oswald font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shrink-0 uppercase tracking-wide">
                              <Clock size={10} />
                              {formatDate(guard.last_checkin.split("T")[0])}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-98 transition-all shadow-2xs cursor-pointer"
                    onClick={() => setPhoto(guard.last_liveness_photo_url)}
                  >
                    <ImageIcon size={13} />
                    View Check-In Photo
                  </button>

                  <button
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-98 transition-all shadow-2xs cursor-pointer"
                    onClick={() => setPhoto(guard.last_known_location_selfie)}
                  >
                    <ImageIcon size={13} />
                    View Live-Location Photo
                  </button>
                </div>

                {/* Live Location Section */}
                <div className="w-full md:w-80 lg:w-96 p-5 sm:p-6 bg-slate-50/40 flex flex-col justify-center space-y-4 shrink-0">
                  <div className="flex flex-col gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wider">
                        Last Known Location
                      </h2>
                      <div className="mt-0.5 truncate">
                        <span className="text-xs text-slate-400 font-medium">
                          {guard.last_known_address || "No tracked live data"}
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wider">
                        Last Location Time
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5 min-w-0">
                        {guard.last_location_time && (
                          <div className="flex gap-3">
                            <span className="flex items-center gap-1 text-[10px] font-oswald font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shrink-0 uppercase tracking-wide">
                              {formatTime(
                                guard.last_location_time
                                  ?.split(" ")[1]
                                  ?.split(".")[0],
                              )}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-oswald font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shrink-0 uppercase tracking-wide">
                              <Clock size={10} />
                              {formatDate(
                                guard.last_location_time.split("T")[0],
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-98 transition-all shadow-2xs cursor-pointer"
                    onClick={() => handleOpenLocationModal(guard)}
                  >
                    <MapPin size={13} />
                    Reveal Live Location Stream
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-98 transition-all shadow-2xs cursor-pointer"
                    onClick={() => handleRequestLocation(guard.id, guard.name)}
                  >
                    {pendingRequests[guard.id] ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Sending Ping...
                      </>
                    ) : (
                      <>
                        <MapPin size={13} />
                        Request Live Location Photo
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 text-sm font-medium">
              No active personnel are currently recorded on duty.
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Live Location Telemetry Modal */}
      {selectedGuardForLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Radio className="text-emerald-500 animate-pulse" size={18} />
                <h3 className="font-montserrat font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Live Location Stream
                </h3>
              </div>
              <button
                onClick={handleCloseLocationModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-montserrat font-black text-xl flex items-center justify-center uppercase shrink-0 border border-blue-100">
                  {selectedGuardForLocation.avatar ? (
                    <img
                      src={selectedGuardForLocation.avatar}
                      alt={selectedGuardForLocation.name}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    selectedGuardForLocation.name[0]
                  )}
                </div>
                <div>
                  <h4 className="font-montserrat font-bold text-slate-800 text-base">
                    {selectedGuardForLocation.name}
                  </h4>
                </div>
              </div>

              {activeLocation ? (
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wider block">
                        Latitude
                      </span>
                      <span className="font-mono text-sm font-semibold text-slate-700">
                        {activeLocation.latitude.toFixed(6)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wider block">
                        Longitude
                      </span>
                      <span className="font-mono text-sm font-semibold text-slate-700">
                        {activeLocation.longitude.toFixed(6)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Address
                    </span>
                    <span>{activeLocation.address}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Receiving stream telemetry
                    </span>
                    <span>
                      {new Date(activeLocation.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Loader2
                    className="animate-spin text-blue-500 mx-auto mb-2"
                    size={22}
                  />
                  <p className="text-xs font-semibold text-slate-500">
                    Awaiting next position ping...
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Updates emit every 5 seconds when personnel is active.
                  </p>
                </div>
              )}

              {activeLocation && (
                <a
                  href={`https://maps.google.com/?q=${activeLocation.latitude},${activeLocation.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider transition-all shadow-md active:scale-98"
                >
                  <ExternalLink size={14} />
                  Open in Google Maps
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Check-In Photo Modal */}
      {securityPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100">
              <h3 className="font-montserrat font-bold text-slate-800 text-sm uppercase tracking-wide">
                Check-In Verification Photo
              </h3>
              <button
                onClick={() => setSecurityPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex items-center justify-center bg-slate-950 max-h-[70vh]">
              <img
                src={securityPhoto}
                alt="Check-in verification selfie"
                className="max-h-[60vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
